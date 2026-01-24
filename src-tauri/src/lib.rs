use tauri::{
    AppHandle, Emitter, Manager,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
};
use std::sync::atomic::{AtomicU32, Ordering};
use notify_rust::Notification;

// 未读消息数
static UNREAD_COUNT: AtomicU32 = AtomicU32::new(0);

/// 发送系统通知
#[tauri::command]
fn send_notification(app: AppHandle, title: String, body: String) {
    // 增加未读数并更新托盘提示
    let count = UNREAD_COUNT.fetch_add(1, Ordering::SeqCst) + 1;
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(&format!("CloudAdmin - {} 条新消息", count)));
    }
    // 异步发送通知
    std::thread::spawn(move || {
        let _ = Notification::new()
            .summary(&title)
            .body(&format!("{}

点击托盘图标查看", body))
            .appname("CloudAdmin")
            .timeout(notify_rust::Timeout::Milliseconds(10000))
            .show();
    });
}

/// 清除未读数
#[tauri::command]
fn clear_unread(app: AppHandle) {
    UNREAD_COUNT.store(0, Ordering::SeqCst);
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some("CloudAdmin"));
    }
}

/// 唤醒窗口并通知前端
fn wake_window(app: &AppHandle) {
    // 清除未读
    UNREAD_COUNT.store(0, Ordering::SeqCst);
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some("CloudAdmin"));
    }
    // 显示窗口
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        let _ = app.emit("tray-clicked", ());
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![send_notification, clear_unread])
        .setup(|app| {
            // 创建托盘菜单
            let show = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            // 创建托盘图标（设置 ID 以便后续获取）
            let _tray = TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)  // 禁用左键菜单
                .tooltip("CloudAdmin")
                .on_menu_event(|app: &AppHandle, event| match event.id.as_ref() {
                    "show" => wake_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray: &TrayIcon, event| {
                    // 左键唤醒窗口
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        wake_window(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // 阻止默认关闭，改为隐藏窗口
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
