use crate::error::SafeError;
use crate::window::ensure_main_window;
use notify_rust::Notification;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::OnceLock;
use tauri::{image::Image, AppHandle, Manager, UserAttentionType, WebviewWindow};

const MAX_TITLE_CHARS: usize = 120;
const MAX_BODY_CHARS: usize = 2_000;

static UNREAD_COUNT: AtomicU32 = AtomicU32::new(0);
static IS_BLINKING: AtomicBool = AtomicBool::new(false);
static NOTIFY_ICON: OnceLock<Option<Image<'static>>> = OnceLock::new();

struct ValidatedNotification {
    title: String,
    body: String,
}

fn contains_forbidden_content(value: &str) -> bool {
    if value.chars().any(char::is_control) || value.contains(['<', '>']) {
        return true;
    }
    let lower = value.to_ascii_lowercase();
    [
        "://",
        "www.",
        "javascript:",
        "data:",
        "file:",
        "mailto:",
        "tel:",
    ]
    .iter()
    .any(|marker| lower.contains(marker))
}

fn validate_notification(title: &str, body: &str) -> Result<ValidatedNotification, SafeError> {
    if title.trim().is_empty()
        || body.trim().is_empty()
        || title.chars().count() > MAX_TITLE_CHARS
        || body.chars().count() > MAX_BODY_CHARS
        || contains_forbidden_content(title)
        || contains_forbidden_content(body)
    {
        return Err(SafeError::notification_policy());
    }
    Ok(ValidatedNotification {
        title: title.to_owned(),
        body: body.to_owned(),
    })
}

fn notify_icon() -> Option<&'static Image<'static>> {
    NOTIFY_ICON
        .get_or_init(|| {
            let ico_bytes = include_bytes!("../icons/icon_notify.ico");
            image::load_from_memory(ico_bytes).ok().map(|image| {
                let rgba = image.to_rgba8();
                let (width, height) = rgba.dimensions();
                Image::new_owned(rgba.into_raw(), width, height)
            })
        })
        .as_ref()
}

fn restore_default_icon(app: &AppHandle) {
    if let Some(tray) = app.tray_by_id("main") {
        if let Some(icon) = app.default_window_icon() {
            let _ = tray.set_icon(Some(icon.clone()));
        }
    }
}

fn start_tray_blink(app: AppHandle) {
    if IS_BLINKING.swap(true, Ordering::SeqCst) {
        return;
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
                } else if let Some(icon) = notify_icon() {
                    let _ = tray.set_icon(Some(icon.clone()));
                }
            }
            show_normal = !show_normal;
        }
        restore_default_icon(&app);
    });
}

pub fn clear_unread_state(app: &AppHandle) {
    UNREAD_COUNT.store(0, Ordering::SeqCst);
    IS_BLINKING.store(false, Ordering::SeqCst);
    restore_default_icon(app);
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some("CloudAdmin"));
    }
}

pub fn wake_window(app: &AppHandle) {
    clear_unread_state(app);
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.request_user_attention(None::<UserAttentionType>);
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        let _ = tauri::Emitter::emit(app, "tray-clicked", ());
    }
}

#[tauri::command]
pub async fn send_notification(
    window: WebviewWindow,
    title: String,
    body: String,
) -> Result<(), SafeError> {
    ensure_main_window(&window)?;
    let notification = validate_notification(&title, &body)?;
    let notification_title = notification.title;
    let notification_body = notification.body;
    tokio::task::spawn_blocking(move || {
        Notification::new()
            .summary(&notification_title)
            .body(&format!("{notification_body}\n\n点击托盘图标查看"))
            .appname("CloudAdmin")
            .timeout(notify_rust::Timeout::Milliseconds(10_000))
            .show()
            .map(|_| ())
            .map_err(|_| SafeError::notification_unavailable())
    })
    .await
    .map_err(|_| SafeError::notification_unavailable())??;

    let app = window.app_handle();
    let count = UNREAD_COUNT.fetch_add(1, Ordering::SeqCst) + 1;
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(&format!("CloudAdmin - {count} 条新消息")));
    }
    let _ = window.request_user_attention(Some(UserAttentionType::Critical));
    start_tray_blink(app.clone());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::validate_notification;

    #[test]
    fn accepts_bounded_plain_text() {
        let validated = validate_notification("新消息", "任务已经完成").unwrap();
        assert_eq!(validated.title, "新消息");
        assert_eq!(validated.body, "任务已经完成");
    }

    #[test]
    fn rejects_empty_oversized_html_url_and_control_input() {
        assert!(validate_notification("", "正文").is_err());
        assert!(validate_notification(&"a".repeat(121), "正文").is_err());
        assert!(validate_notification("标题", &"a".repeat(2001)).is_err());
        assert!(validate_notification("<b>标题</b>", "正文").is_err());
        assert!(validate_notification("标题", "https://evil.example/path").is_err());
        assert!(validate_notification("标题", "javascript:alert(1)").is_err());
        assert!(validate_notification("标题", "正文\n下一行").is_err());
        assert!(validate_notification("标题\0", "正文").is_err());
    }
}
