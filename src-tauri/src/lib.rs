use tauri::{
    AppHandle, Emitter, Manager, UserAttentionType, State,
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::{Arc, OnceLock};
use notify_rust::Notification;

mod download;
mod error;

use download::{DownloadManager, DownloadProgress};
use error::AppError;

// ==================== 全局状态（原子操作，无锁） ====================

/// 未读消息数
static UNREAD_COUNT: AtomicU32 = AtomicU32::new(0);
/// 是否正在闪烁
static IS_BLINKING: AtomicBool = AtomicBool::new(false);
/// 通知图标缓存（避免重复 decode）
static NOTIFY_ICON: OnceLock<Option<Image<'static>>> = OnceLock::new();

/// 获取缓存的通知图标
fn get_notify_icon() -> Option<&'static Image<'static>> {
    NOTIFY_ICON.get_or_init(|| {
        let ico_bytes = include_bytes!("../icons/icon_notify.ico");
        image::load_from_memory(ico_bytes).ok().map(|img| {
            let rgba = img.to_rgba8();
            let (w, h) = rgba.dimensions();
            Image::new_owned(rgba.into_raw(), w, h)
        })
    }).as_ref()
}

// ==================== 托盘相关 ====================

/// 恢复默认托盘图标
fn restore_default_icon(app: &AppHandle) {
    if let Some(tray) = app.tray_by_id("main") {
        if let Some(icon) = app.default_window_icon() {
            let _ = tray.set_icon(Some(icon.clone()));
        }
    }
}

/// 启动托盘图标闪烁（tokio 异步，不占系统线程）
fn start_tray_blink(app: AppHandle) {
    if IS_BLINKING.swap(true, Ordering::SeqCst) {
        return; // 已经在闪烁
    }

    tokio::spawn(async move {
        let mut show_normal = true;
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(500));

        while IS_BLINKING.load(Ordering::SeqCst) {
            interval.tick().await;

            if let Some(tray) = app.tray_by_id("main") {
                if show_normal {
                    if let Some(icon) = app.default_window_icon() {
                        let _ = tray.set_icon(Some(icon.clone()));
                    }
                } else if let Some(icon) = get_notify_icon() {
                    let _ = tray.set_icon(Some(icon.clone()));
                }
            }
            show_normal = !show_normal;
        }

        restore_default_icon(&app);
    });
}

/// 唤醒窗口并清除未读状态
fn wake_window(app: &AppHandle) {
    UNREAD_COUNT.store(0, Ordering::SeqCst);
    IS_BLINKING.store(false, Ordering::SeqCst);
    restore_default_icon(app);

    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some("CloudAdmin"));
    }
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.request_user_attention(None::<UserAttentionType>);
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        let _ = app.emit("tray-clicked", ());
    }
}

// ==================== Tauri Commands ====================

/// 发送系统通知
#[tauri::command]
fn send_notification(app: AppHandle, title: String, body: String) {
    let count = UNREAD_COUNT.fetch_add(1, Ordering::SeqCst) + 1;

    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(&format!("CloudAdmin - {} 条新消息", count)));
    }
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.request_user_attention(Some(UserAttentionType::Critical));
    }

    start_tray_blink(app.clone());

    // 系统通知是同步阻塞调用（Windows API），用 spawn_blocking 避免阻塞 tokio 线程池
    tokio::task::spawn_blocking(move || {
        let _ = Notification::new()
            .summary(&title)
            .body(&format!("{}\n\n点击托盘图标查看", body))
            .appname("CloudAdmin")
            .timeout(notify_rust::Timeout::Milliseconds(10000))
            .show();
    });
}

/// 清除未读数
#[tauri::command]
fn clear_unread(app: AppHandle) {
    UNREAD_COUNT.store(0, Ordering::SeqCst);
    IS_BLINKING.store(false, Ordering::SeqCst);
    restore_default_icon(&app);

    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some("CloudAdmin"));
    }
}

/// 开始下载文件
#[tauri::command]
async fn start_download(
    app: AppHandle,
    manager: State<'_, Arc<DownloadManager>>,
    id: String,
    url: String,
    save_path: String,
    filename: String,
) -> Result<(), AppError> {
    let path = std::path::PathBuf::from(save_path);
    manager.create_task(id.clone(), url, path, filename)?;
    manager.start_download(id, app).await?;
    Ok(())
}

/// 取消下载
#[tauri::command]
fn cancel_download(
    manager: State<'_, Arc<DownloadManager>>,
    id: String,
) -> Result<(), AppError> {
    manager.cancel_download(&id)
}

/// 获取下载进度
#[tauri::command]
fn get_download_progress(
    manager: State<'_, Arc<DownloadManager>>,
    id: String,
) -> Option<DownloadProgress> {
    manager.get_progress(&id)
}

/// 获取所有下载任务
#[tauri::command]
fn get_all_downloads(
    manager: State<'_, Arc<DownloadManager>>,
) -> Vec<DownloadProgress> {
    manager.get_all_tasks()
}

/// 删除下载任务
#[tauri::command]
fn remove_download(
    manager: State<'_, Arc<DownloadManager>>,
    id: String,
) -> Result<(), AppError> {
    manager.remove_task(&id)
}

/// 打开文件所在文件夹
#[tauri::command]
fn open_file_folder(path: String) -> Result<(), AppError> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| AppError::Io("打开文件夹失败".into(), e.to_string()))?;
    }

    #[cfg(target_os = "macos")]
    {
        let folder = std::path::Path::new(&path)
            .parent()
            .unwrap_or(std::path::Path::new(&path));
        std::process::Command::new("open")
            .arg(folder)
            .spawn()
            .map_err(|e| AppError::Io("打开文件夹失败".into(), e.to_string()))?;
    }

    #[cfg(target_os = "linux")]
    {
        let folder = std::path::Path::new(&path)
            .parent()
            .unwrap_or(std::path::Path::new(&path));
        std::process::Command::new("xdg-open")
            .arg(folder)
            .spawn()
            .map_err(|e| AppError::Io("打开文件夹失败".into(), e.to_string()))?;
    }

    Ok(())
}

// ==================== App Entry ====================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let download_manager = Arc::new(DownloadManager::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(download_manager)
        .invoke_handler(tauri::generate_handler![
            send_notification,
            clear_unread,
            start_download,
            cancel_download,
            get_download_progress,
            get_all_downloads,
            remove_download,
            open_file_folder,
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
                    "show" => wake_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray: &TrayIcon, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        wake_window(tray.app_handle());
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _tray = tray_builder.build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    let _ = window.app_handle().emit("window-close-requested", ());
                }
                tauri::WindowEvent::Focused(true) => {
                    let app = window.app_handle();
                    UNREAD_COUNT.store(0, Ordering::SeqCst);
                    IS_BLINKING.store(false, Ordering::SeqCst);
                    restore_default_icon(app);
                    if let Some(tray) = app.tray_by_id("main") {
                        let _ = tray.set_tooltip(Some("CloudAdmin"));
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
