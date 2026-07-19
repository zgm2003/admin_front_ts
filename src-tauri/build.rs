fn main() {
    // Tauri skips ACL checks for custom commands when no application manifest exists.
    // Security gates keep this list synchronized with every #[tauri::command].
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "seal_refresh_credential",
            "refresh_access_credential",
            "clear_refresh_credential",
            "send_notification",
            "get_window_state",
            "minimize_window",
            "toggle_maximize_window",
            "hide_window",
            "request_window_close",
            "get_app_version",
            "relaunch_app",
            "exit_app",
            "start_managed_download",
            "cancel_managed_download",
            "get_managed_download_progress",
            "get_all_managed_downloads",
            "remove_managed_download",
            "reveal_managed_download",
        ]),
    ))
    .expect("failed to run Tauri build script");
}
