use super::policy::{
    checked_downloaded, sanitize_filename, validate_completed_file, validate_content_length,
    validate_download_url, validate_resolved_addresses, validate_selected_target, RedirectBudget,
    MAX_DOWNLOAD_BYTES,
};
use super::store::{DownloadStatus, DownloadStore};
use std::net::IpAddr;

#[test]
fn urls_are_https_allowlisted_and_never_contain_credentials_or_fragments() {
    for accepted in [
        "https://www.zgm2003.cn/files/report.xlsx",
        "https://cos.zgm2003.cn/releases/admin.exe?signature=signed-value",
    ] {
        assert!(
            validate_download_url(accepted).is_ok(),
            "rejected {accepted}"
        );
    }

    for rejected in [
        "http://cos.zgm2003.cn/file.zip",
        "https://evil.example/file.zip",
        "https://user:password@cos.zgm2003.cn/file.zip",
        "https://cos.zgm2003.cn:444/file.zip",
        "https://cos.zgm2003.cn/file.zip#fragment",
        "https://127.0.0.1/file.zip",
        "https://10.0.0.1/file.zip",
    ] {
        assert!(
            validate_download_url(rejected).is_err(),
            "accepted {rejected}"
        );
    }
}

#[test]
fn dns_and_every_redirect_hop_remain_inside_the_public_allowlist() {
    assert!(validate_resolved_addresses(&[
        "8.8.8.8".parse::<IpAddr>().unwrap(),
        "2606:4700:4700::1111".parse::<IpAddr>().unwrap(),
    ])
    .is_ok());
    assert!(validate_resolved_addresses(&["127.0.0.1".parse().unwrap()]).is_err());
    assert!(validate_resolved_addresses(&["10.0.0.1".parse().unwrap()]).is_err());

    let current = validate_download_url("https://cos.zgm2003.cn/releases/start").unwrap();
    let mut budget = RedirectBudget::new();
    for index in 0..5 {
        let next = budget
            .follow(&current, &format!("/releases/hop-{index}"))
            .unwrap();
        assert_eq!(next.host_str(), Some("cos.zgm2003.cn"));
    }
    assert!(budget.follow(&current, "/releases/hop-6").is_err());
    assert!(RedirectBudget::new()
        .follow(&current, "https://evil.example/file")
        .is_err());
    assert!(RedirectBudget::new()
        .follow(&current, "http://127.0.0.1/private")
        .is_err());
}

#[test]
fn content_length_and_streamed_bytes_are_strictly_bounded() {
    assert_eq!(validate_content_length(Some(0)).unwrap(), 0);
    assert_eq!(
        validate_content_length(Some(MAX_DOWNLOAD_BYTES)).unwrap(),
        MAX_DOWNLOAD_BYTES
    );
    assert!(validate_content_length(None).is_err());
    assert!(validate_content_length(Some(MAX_DOWNLOAD_BYTES + 1)).is_err());
    assert_eq!(checked_downloaded(10, 5, 20).unwrap(), 15);
    assert!(checked_downloaded(10, 11, 20).is_err());
    assert!(checked_downloaded(MAX_DOWNLOAD_BYTES, 1, MAX_DOWNLOAD_BYTES).is_err());
}

#[test]
fn filenames_reject_traversal_separators_controls_and_windows_reserved_names() {
    for accepted in ["report.xlsx", "后台安装包 1.0.7.exe", "archive.tar.gz"] {
        assert_eq!(sanitize_filename(accepted).unwrap(), accepted);
    }
    for rejected in [
        "",
        ".",
        "..",
        "../escape.txt",
        "folder/file.txt",
        "folder\\file.txt",
        "file.txt.",
        "file.txt ",
        "CON",
        "con.txt",
        "CLOCK$",
        "CONOUT$.txt",
        "LPT9.log",
        "bad:name.txt",
        "bad\0name.txt",
    ] {
        assert!(
            sanitize_filename(rejected).is_err(),
            "accepted {rejected:?}"
        );
    }
}

#[cfg(target_os = "windows")]
#[test]
fn selected_target_rejects_symlink_parents_and_targets() {
    use std::os::windows::fs::{symlink_dir, symlink_file};

    let directory = tempfile::tempdir().unwrap();
    let real_parent = directory.path().join("real");
    std::fs::create_dir(&real_parent).unwrap();
    let linked_parent = directory.path().join("linked");
    symlink_dir(&real_parent, &linked_parent).unwrap();
    assert!(validate_selected_target(&linked_parent.join("report.xlsx")).is_err());

    let source = directory.path().join("source.txt");
    std::fs::write(&source, b"source").unwrap();
    let linked_target = real_parent.join("linked.txt");
    symlink_file(&source, &linked_target).unwrap();
    assert!(validate_selected_target(&linked_target).is_err());
    assert!(validate_completed_file(&linked_target, &real_parent).is_err());
}

#[test]
fn selected_target_stays_in_a_real_directory_and_never_overwrites() {
    let directory = tempfile::tempdir().unwrap();
    let safe = directory.path().join("report.xlsx");
    let validated = validate_selected_target(&safe).unwrap();
    assert_eq!(validated.parent, directory.path().canonicalize().unwrap());
    assert_eq!(validated.filename, "report.xlsx");

    std::fs::write(&safe, b"existing").unwrap();
    assert!(validate_selected_target(&safe).is_err());
    assert!(validate_selected_target(&directory.path().join("..\\escape.txt")).is_err());
}

#[test]
fn reveal_requires_a_recorded_completed_task() {
    let store = DownloadStore::default();
    let task_id = store.create("report.xlsx").unwrap();
    assert!(store.reveal_path(&task_id).is_err());
    assert!(store.reveal_path("unknown-task").is_err());

    let directory = tempfile::tempdir().unwrap();
    let file = directory.path().join("report.xlsx");
    std::fs::write(&file, b"complete").unwrap();
    let canonical = file.canonicalize().unwrap();
    store.begin(&task_id, 8).unwrap();
    store.complete(&task_id, canonical.clone(), 8).unwrap();
    assert_eq!(store.reveal_path(&task_id).unwrap(), canonical);
}

#[test]
fn completion_requires_a_downloading_task() {
    let store = DownloadStore::default();
    let task_id = store.create("report.xlsx").unwrap();
    let directory = tempfile::tempdir().unwrap();
    let file = directory.path().join("report.xlsx");
    std::fs::write(&file, b"complete").unwrap();
    assert!(store.complete(&task_id, file, 8).is_err());
}

#[test]
fn cancellation_is_immediately_terminal_and_keeps_a_static_safe_error() {
    let store = DownloadStore::default();
    let task_id = store.create("report.xlsx").unwrap();
    store.begin(&task_id, 100).unwrap();
    store.cancel(&task_id).unwrap();

    let cancelled = store.progress(&task_id).unwrap().unwrap();
    assert_eq!(cancelled.status, DownloadStatus::Cancelled);
    assert_eq!(cancelled.error.as_deref(), Some("已取消下载"));

    let failed = store
        .fail(&task_id, crate::error::SafeError::download_network())
        .unwrap();
    assert_eq!(failed.status, DownloadStatus::Cancelled);
    assert_eq!(failed.error.as_deref(), Some("已取消下载"));
}
