use crate::error::SafeError;
use serde::Serialize;
use tauri::WebviewWindow;

const MAIN_WINDOW_LABEL: &str = "main";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowState {
    minimized: bool,
    maximized: bool,
    focused: bool,
    visible: bool,
}

pub fn is_main_window_label(label: &str) -> bool {
    label == MAIN_WINDOW_LABEL
}

pub fn is_authorized_window_url(url: &url::Url, debug_build: bool) -> bool {
    if !url.username().is_empty() || url.password().is_some() {
        return false;
    }
    let packaged =
        url.scheme() == "http" && url.host_str() == Some("tauri.localhost") && url.port().is_none();
    let docker_development = debug_build
        && url.scheme() == "http"
        && url.host_str() == Some("localhost")
        && url.port() == Some(5173);
    packaged || docker_development
}

pub fn is_authorized_navigation(label: &str, url: &url::Url, debug_build: bool) -> bool {
    is_main_window_label(label) && is_authorized_window_url(url, debug_build)
}

pub const fn should_allow_unmanaged_download() -> bool {
    false
}

pub(crate) fn ensure_main_window(window: &WebviewWindow) -> Result<(), SafeError> {
    let url = window.url().map_err(|_| SafeError::native_policy())?;
    if is_authorized_navigation(window.label(), &url, cfg!(debug_assertions)) {
        Ok(())
    } else {
        Err(SafeError::native_policy())
    }
}

fn map_window_error<T>(result: tauri::Result<T>) -> Result<T, SafeError> {
    result.map_err(|_| SafeError::native_operation())
}

#[tauri::command]
pub fn get_window_state(window: WebviewWindow) -> Result<WindowState, SafeError> {
    ensure_main_window(&window)?;
    Ok(WindowState {
        minimized: map_window_error(window.is_minimized())?,
        maximized: map_window_error(window.is_maximized())?,
        focused: map_window_error(window.is_focused())?,
        visible: map_window_error(window.is_visible())?,
    })
}

#[tauri::command]
pub fn minimize_window(window: WebviewWindow) -> Result<(), SafeError> {
    ensure_main_window(&window)?;
    map_window_error(window.minimize())
}

#[tauri::command]
pub fn toggle_maximize_window(window: WebviewWindow) -> Result<(), SafeError> {
    ensure_main_window(&window)?;
    if map_window_error(window.is_maximized())? {
        map_window_error(window.unmaximize())
    } else {
        map_window_error(window.maximize())
    }
}

#[tauri::command]
pub fn hide_window(window: WebviewWindow) -> Result<(), SafeError> {
    ensure_main_window(&window)?;
    map_window_error(window.hide())
}

#[tauri::command]
pub fn request_window_close(window: WebviewWindow) -> Result<(), SafeError> {
    ensure_main_window(&window)?;
    map_window_error(window.close())
}

#[cfg(test)]
mod tests {
    use super::{is_authorized_navigation, is_authorized_window_url, is_main_window_label};

    #[test]
    fn only_the_packaged_main_window_is_authorized() {
        assert!(is_main_window_label("main"));
        assert!(!is_main_window_label("settings"));
        assert!(!is_main_window_label("main\0remote"));
        assert!(!is_main_window_label("MAIN"));
    }

    #[test]
    fn remote_content_cannot_reuse_the_main_window_label() {
        assert!(is_authorized_window_url(
            &url::Url::parse("http://tauri.localhost/dashboard").unwrap(),
            false
        ));
        assert!(!is_authorized_window_url(
            &url::Url::parse("https://www.zgm2003.cn/dashboard").unwrap(),
            false
        ));
        assert!(!is_authorized_window_url(
            &url::Url::parse("http://localhost:5173/dashboard").unwrap(),
            false
        ));
        assert!(is_authorized_window_url(
            &url::Url::parse("http://localhost:5173/dashboard").unwrap(),
            true
        ));
        assert!(!is_authorized_window_url(
            &url::Url::parse("http://user:secret@tauri.localhost/dashboard").unwrap(),
            false
        ));

        assert!(is_authorized_navigation(
            "main",
            &url::Url::parse("http://tauri.localhost/dashboard").unwrap(),
            false
        ));
        assert!(!is_authorized_navigation(
            "main",
            &url::Url::parse("https://www.zgm2003.cn/dashboard").unwrap(),
            false
        ));
        assert!(!is_authorized_navigation(
            "settings",
            &url::Url::parse("http://tauri.localhost/dashboard").unwrap(),
            false
        ));
    }
}
