use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State, WebviewWindow,
};

pub mod credentials;
pub mod download;
pub mod error;
pub mod http_policy;
mod notification;
mod process;
pub mod window;

use credentials::{CredentialStore, RefreshCredentialInput};
use download::{DownloadManager, DownloadProgress};
use error::SafeError;
use http_policy::{rotate_stored_refresh_credential, AccessCredential, AdminHttpClient};
use window::ensure_main_window;

// ==================== Tauri Commands ====================

#[tauri::command]
fn seal_refresh_credential(
    window: WebviewWindow,
    store: State<'_, CredentialStore>,
    input: RefreshCredentialInput,
) -> Result<(), SafeError> {
    ensure_main_window(&window)?;
    store.seal(input)
}

#[tauri::command]
async fn refresh_access_credential(
    window: WebviewWindow,
    store: State<'_, CredentialStore>,
    client: State<'_, AdminHttpClient>,
    device_id: String,
) -> Result<AccessCredential, SafeError> {
    ensure_main_window(&window)?;
    rotate_stored_refresh_credential(store.inner(), client.inner(), &device_id).await
}

#[tauri::command]
fn clear_refresh_credential(
    window: WebviewWindow,
    store: State<'_, CredentialStore>,
) -> Result<(), SafeError> {
    ensure_main_window(&window)?;
    store.clear()
}

/// 由 Rust 验证 URL、选择保存路径并生成任务 ID。
#[tauri::command]
async fn start_managed_download(
    window: WebviewWindow,
    manager: State<'_, Arc<DownloadManager>>,
    url: String,
    suggested_filename: String,
) -> Result<String, SafeError> {
    ensure_main_window(&window)?;
    let app = window.app_handle().clone();
    manager.inner().start(app, url, suggested_filename).await
}

/// 取消下载
#[tauri::command]
fn cancel_managed_download(
    window: WebviewWindow,
    manager: State<'_, Arc<DownloadManager>>,
    task_id: String,
) -> Result<(), SafeError> {
    ensure_main_window(&window)?;
    manager.cancel(&task_id)
}

/// 获取下载进度
#[tauri::command]
fn get_managed_download_progress(
    window: WebviewWindow,
    manager: State<'_, Arc<DownloadManager>>,
    task_id: String,
) -> Result<Option<DownloadProgress>, SafeError> {
    ensure_main_window(&window)?;
    manager.progress(&task_id)
}

/// 获取所有下载任务
#[tauri::command]
fn get_all_managed_downloads(
    window: WebviewWindow,
    manager: State<'_, Arc<DownloadManager>>,
) -> Result<Vec<DownloadProgress>, SafeError> {
    ensure_main_window(&window)?;
    manager.all()
}

/// 删除下载任务
#[tauri::command]
fn remove_managed_download(
    window: WebviewWindow,
    manager: State<'_, Arc<DownloadManager>>,
    task_id: String,
) -> Result<(), SafeError> {
    ensure_main_window(&window)?;
    manager.remove(&task_id)
}

/// 只显示由管理器记录为已完成的下载。
#[tauri::command]
fn reveal_managed_download(
    window: WebviewWindow,
    manager: State<'_, Arc<DownloadManager>>,
    task_id: String,
) -> Result<(), SafeError> {
    ensure_main_window(&window)?;
    manager.reveal(&task_id)
}

// ==================== App Entry ====================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let download_manager = Arc::new(DownloadManager::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(download_manager)
        .manage(CredentialStore::default())
        .manage(AdminHttpClient::default())
        .invoke_handler(tauri::generate_handler![
            seal_refresh_credential,
            refresh_access_credential,
            clear_refresh_credential,
            notification::send_notification,
            window::get_window_state,
            window::minimize_window,
            window::toggle_maximize_window,
            window::hide_window,
            window::request_window_close,
            process::get_app_version,
            process::relaunch_app,
            process::exit_app,
            start_managed_download,
            cancel_managed_download,
            get_managed_download_progress,
            get_all_managed_downloads,
            remove_managed_download,
            reveal_managed_download,
        ])
        .setup(|app| {
            // 创建托盘菜单
            let show = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            // 创建托盘图标
            let mut tray_builder = TrayIconBuilder::with_id("main")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("CloudAdmin")
                .on_menu_event(|app: &AppHandle, event| match event.id.as_ref() {
                    "show" => notification::wake_window(app),
                    "quit" => {
                        notification::wake_window(app);
                        let _ = app.emit("tray-exit-requested", ());
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray: &TrayIcon, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        notification::wake_window(tray.app_handle());
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _tray = tray_builder.build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                let _ = window.app_handle().emit("window-close-requested", ());
            }
            tauri::WindowEvent::Focused(true) => {
                notification::clear_unread_state(window.app_handle());
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
