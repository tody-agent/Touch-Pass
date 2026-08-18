use crate::profile_store::ProfileStore;
use crate::state::{AdminCommand, AppState};
use crate::types::{
    AppPreferences, AppStatusResponse, CommandError, ErrorCode, FingerProfile, Locale,
};
use crate::update_tray_menu;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn get_app_status(state: State<'_, AppState>) -> Result<AppStatusResponse, CommandError> {
    state
        .status
        .lock()
        .map(|status| status.clone())
        .map_err(|_| CommandError::internal("status lock poisoned"))
}

#[tauri::command]
pub async fn get_app_preferences(
    state: State<'_, AppState>,
) -> Result<AppPreferences, CommandError> {
    let preferences = state
        .preferences
        .lock()
        .map_err(|_| CommandError::internal("preference store lock poisoned"))?;
    preferences.load()
}

#[tauri::command]
pub async fn set_app_locale(
    locale: Locale,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<AppPreferences, CommandError> {
    let preferences = state
        .preferences
        .lock()
        .map_err(|_| CommandError::internal("preference store lock poisoned"))?;
    let previous_locale = preferences.load()?.locale.unwrap_or(Locale::Vi);
    update_tray_menu(&app, locale).map_err(CommandError::internal)?;
    match preferences.save_locale(locale) {
        Ok(saved) => Ok(saved),
        Err(error) => {
            let _ = update_tray_menu(&app, previous_locale);
            Err(error)
        }
    }
}

#[tauri::command]
pub async fn list_finger_profiles(
    state: State<'_, AppState>,
) -> Result<Vec<FingerProfile>, CommandError> {
    let profiles = state
        .profiles
        .lock()
        .map_err(|_| CommandError::internal("profile store lock poisoned"))?;
    profiles.list_profiles()
}

#[tauri::command]
pub async fn save_finger_profile(
    profile: FingerProfile,
    secret: Option<String>,
    state: State<'_, AppState>,
) -> Result<FingerProfile, CommandError> {
    let profiles = state
        .profiles
        .lock()
        .map_err(|_| CommandError::internal("profile store lock poisoned"))?;
    profiles.save_profile(profile, secret)
}

#[tauri::command]
pub async fn reset_finger_profile(
    finger_id: usize,
    force_local: Option<bool>,
    state: State<'_, AppState>,
) -> Result<FingerProfile, CommandError> {
    ProfileStore::validate_id(finger_id)?;
    let is_connected = state
        .status
        .lock()
        .map(|status| status.connected)
        .unwrap_or(false);

    if force_local.unwrap_or(false) || !is_connected {
        let profiles = state
            .profiles
            .lock()
            .map_err(|_| CommandError::internal("profile store lock poisoned"))?;
        return profiles.reset_profile(finger_id);
    }

    let (reply_tx, reply_rx) = std::sync::mpsc::channel();
    state
        .admin_tx
        .send(AdminCommand::Delete {
            slot: finger_id,
            reply: reply_tx,
        })
        .map_err(|_| CommandError::new(ErrorCode::HardwareUnavailable))?;

    tauri::async_runtime::spawn_blocking(move || {
        reply_rx
            .recv_timeout(std::time::Duration::from_secs(130))
            .map_err(|_| {
                CommandError::with_detail(ErrorCode::HardwareUnavailable, "delete_timeout")
            })?
    })
    .await
    .map_err(CommandError::internal)?
}

#[tauri::command]
pub async fn start_enrollment(
    finger_id: usize,
    state: State<'_, AppState>,
) -> Result<(), CommandError> {
    ProfileStore::validate_id(finger_id)?;
    state
        .admin_tx
        .send(AdminCommand::Enroll(finger_id))
        .map_err(|_| CommandError::new(ErrorCode::HardwareUnavailable))
}

#[tauri::command]
pub async fn configure_hid_mode(
    repair: bool,
    state: State<'_, AppState>,
) -> Result<(), CommandError> {
    let (reply_tx, reply_rx) = std::sync::mpsc::channel();
    state
        .admin_tx
        .send(AdminCommand::ConfigureHid {
            rotate: repair,
            reply: reply_tx,
        })
        .map_err(|_| CommandError::new(ErrorCode::HardwareUnavailable))?;

    tauri::async_runtime::spawn_blocking(move || {
        reply_rx
            .recv_timeout(std::time::Duration::from_secs(130))
            .map_err(|_| {
                CommandError::with_detail(
                    ErrorCode::DeviceConfigurationFailed,
                    "hid_configuration_timeout",
                )
            })?
    })
    .await
    .map_err(CommandError::internal)?
}
