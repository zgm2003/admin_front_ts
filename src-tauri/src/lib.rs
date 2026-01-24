use tauri::{
    AppHandle, Emitter, Manager, UserAttentionType,
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::thread;
use std::time::Duration;
use notify_rust::Notification;

// 未读消息数
static UNREAD_COUNT: AtomicU32 = AtomicU32::new(0);
// 是否正在闪烁
static IS_BLINKING: AtomicBool = AtomicBool::new(false);

/// 发送系统通知
#[tauri::command]
fn send_notification(app: AppHandle, title: String, body: String) {
    // 增加未读数并更新托盘提示
    let count = UNREAD_COUNT.fetch_add(1, Ordering::SeqCst) + 1;
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(&format!("CloudAdmin - {} 条新消息", count)));
    }
    // 任务栏图标闪烁
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.request_user_attention(Some(UserAttentionType::Critical));
    }
    // 启动托盘图标闪烁
    start_tray_blink(app.clone());
    // 异步发送通知
    thread::spawn(move || {
        let _ = Notification::new()
            .summary(&title)
            .body(&format!("{}\n\n点击托盘图标查看", body))
            .appname("CloudAdmin")
            .timeout(notify_rust::Timeout::Milliseconds(10000))
            .show();
    });
}

/// 启动托盘图标闪烁
fn start_tray_blink(app: AppHandle) {
    // 已经在闪烁则跳过
    if IS_BLINKING.swap(true, Ordering::SeqCst) {
        return;
    }
    // 加载红点通知图标
    let ico_bytes = include_bytes!("../icons/icon_notify.ico");
    let notify_icon = if let Ok(img) = image::load_from_memory(ico_bytes) {
        let rgba = img.to_rgba8();
        let (w, h) = rgba.dimensions();
        Some(Image::new_owned(rgba.into_raw(), w, h))
    } else {
        None
    };
    
    thread::spawn(move || {
        let mut show_normal = true;
        while IS_BLINKING.load(Ordering::SeqCst) {
            if let Some(tray) = app.tray_by_id("main") {
                if show_normal {
                    if let Some(icon) = app.default_window_icon() {
                        let _ = tray.set_icon(Some(icon.clone()));
                    }
                } else if let Some(ref icon) = notify_icon {
                    let _ = tray.set_icon(Some(icon.clone()));
                }
            }
            show_normal = !show_normal;
            thread::sleep(Duration::from_millis(500));
        }
        // 停止闪烁后恢复正常图标
        if let Some(tray) = app.tray_by_id("main") {
            if let Some(icon) = app.default_window_icon() {
                let _ = tray.set_icon(Some(icon.clone()));
            }
        }
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
    // 清除未读并停止闪烁
    UNREAD_COUNT.store(0, Ordering::SeqCst);
    IS_BLINKING.store(false, Ordering::SeqCst);
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some("CloudAdmin"));
    }
    // 显示窗口并停止任务栏闪烁
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.request_user_attention(None::<UserAttentionType>);
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
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // 阻止默认关闭，改为隐藏窗口
                    api.prevent_close();
                    let _ = window.hide();
                }
                tauri::WindowEvent::Focused(focused) => {
                    if !focused {
                        return;
                    }
                    // 窗口获得焦点时停止闪烁
                    if let Some(app) = window.app_handle().get_webview_window("main") {
                        let app_handle = app.app_handle();
                        // 清除未读并停止闪烁
                        UNREAD_COUNT.store(0, Ordering::SeqCst);
                        IS_BLINKING.store(false, Ordering::SeqCst);
                        if let Some(tray) = app_handle.tray_by_id("main") {
                            let _ = tray.set_tooltip(Some("CloudAdmin"));
                        }
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
