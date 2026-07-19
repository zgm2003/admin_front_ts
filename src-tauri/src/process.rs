use crate::error::SafeError;
use crate::window::ensure_main_window;
use serde::Deserialize;
use tauri::{Manager, WebviewWindow};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum RelaunchIntent {
    UpdateInstalled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ExitIntent {
    UserConfirmedClose,
}

#[tauri::command]
pub fn get_app_version(window: WebviewWindow) -> Result<String, SafeError> {
    ensure_main_window(&window)?;
    Ok(window.app_handle().package_info().version.to_string())
}

#[tauri::command]
pub fn relaunch_app(window: WebviewWindow, intent: RelaunchIntent) -> Result<(), SafeError> {
    ensure_main_window(&window)?;
    match intent {
        RelaunchIntent::UpdateInstalled => window.app_handle().request_restart(),
    }
    Ok(())
}

#[tauri::command]
pub fn exit_app(window: WebviewWindow, intent: ExitIntent) -> Result<(), SafeError> {
    ensure_main_window(&window)?;
    match intent {
        ExitIntent::UserConfirmedClose => window.app_handle().exit(0),
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{ExitIntent, RelaunchIntent};

    #[test]
    fn process_intents_are_closed_enums() {
        assert!(matches!(
            serde_json::from_str::<RelaunchIntent>(r#""update-installed""#),
            Ok(RelaunchIntent::UpdateInstalled)
        ));
        assert!(matches!(
            serde_json::from_str::<ExitIntent>(r#""user-confirmed-close""#),
            Ok(ExitIntent::UserConfirmedClose)
        ));
        assert!(serde_json::from_str::<RelaunchIntent>(r#""manual""#).is_err());
        assert!(serde_json::from_str::<ExitIntent>(r#""crash""#).is_err());
        assert!(serde_json::from_str::<ExitIntent>("0").is_err());
    }
}
