use cloudadmin_lib::download::{
    file::ManagedTemporaryFile, policy::validate_selected_target, store::DownloadStore,
};
use tokio::io::AsyncWriteExt;

#[tokio::test]
async fn cancellation_or_failure_drops_the_same_directory_partial_file() {
    let directory = tempfile::tempdir().unwrap();
    let target = validate_selected_target(&directory.path().join("report.xlsx")).unwrap();
    let mut managed = ManagedTemporaryFile::create(target).unwrap();
    managed.file_mut().write_all(b"partial").await.unwrap();
    assert_eq!(std::fs::read_dir(directory.path()).unwrap().count(), 1);

    drop(managed);

    assert_eq!(std::fs::read_dir(directory.path()).unwrap().count(), 0);
    assert!(!directory.path().join("report.xlsx").exists());
}

#[tokio::test]
async fn successful_commit_is_synced_validated_and_never_overwrites() {
    let directory = tempfile::tempdir().unwrap();
    let target_path = directory.path().join("report.xlsx");
    let target = validate_selected_target(&target_path).unwrap();
    let mut managed = ManagedTemporaryFile::create(target).unwrap();
    managed.file_mut().write_all(b"complete").await.unwrap();

    let canonical = managed.commit().await.unwrap();

    assert_eq!(canonical, target_path.canonicalize().unwrap());
    assert_eq!(std::fs::read(&canonical).unwrap(), b"complete");
    assert!(validate_selected_target(&target_path).is_err());
}

#[test]
fn reveal_registry_accepts_only_a_live_completed_task_id() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("report.xlsx");
    std::fs::write(&path, b"complete").unwrap();
    let canonical = path.canonicalize().unwrap();
    let store = DownloadStore::default();
    let task_id = store.create("report.xlsx").unwrap();

    assert!(store.reveal_path(&task_id).is_err());
    assert!(store
        .reveal_path("00000000-0000-4000-8000-000000000000")
        .is_err());
    store.begin(&task_id, 8).unwrap();
    store.complete(&task_id, canonical.clone(), 8).unwrap();
    assert_eq!(store.reveal_path(&task_id).unwrap(), canonical);

    std::fs::remove_file(&canonical).unwrap();
    assert!(store.reveal_path(&task_id).is_err());
}
