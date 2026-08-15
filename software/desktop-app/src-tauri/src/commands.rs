use crate::profile_store::ProfileStore;
use crate::protocol::encode_action;
use crate::state::{AdminCommand, AppState};
use crate::types::{AppStatusResponse, FingerProfile, FingerTouchEvent, TouchStatus};
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub async fn get_app_status(state: State<'_, AppState>) -> Result<AppStatusResponse, String> {
    state
        .status
        .lock()
        .map(|status| status.clone())
        .map_err(|_| "status lock poisoned".to_string())
}

#[tauri::command]
pub async fn list_finger_profiles(
    state: State<'_, AppState>,
) -> Result<Vec<FingerProfile>, String> {
    let profiles = state
        .profiles
        .lock()
        .map_err(|_| "profile store lock poisoned".to_string())?;
    Ok(profiles.list_profiles())
}

#[tauri::command]
pub async fn save_finger_profile(
    profile: FingerProfile,
    secret: Option<String>,
    state: State<'_, AppState>,
) -> Result<FingerProfile, String> {
    let profiles = state
        .profiles
        .lock()
        .map_err(|_| "profile store lock poisoned".to_string())?;
    let saved = profiles.save_profile(profile, secret)?;
    encode_action(&saved, |reference| state.secret_store.get(reference))?;
    Ok(saved)
}

#[tauri::command]
pub async fn reset_finger_profile(
    finger_id: usize,
    state: State<'_, AppState>,
) -> Result<FingerProfile, String> {
    ProfileStore::validate_id(finger_id)?;
    let _ = state.admin_tx.send(AdminCommand::Delete(finger_id));
    let profiles = state
        .profiles
        .lock()
        .map_err(|_| "profile store lock poisoned".to_string())?;
    profiles.reset_profile(finger_id)
}

#[tauri::command]
pub async fn start_enrollment(finger_id: usize, state: State<'_, AppState>) -> Result<(), String> {
    ProfileStore::validate_id(finger_id)?;
    state
        .admin_tx
        .send(AdminCommand::Enroll(finger_id))
        .map_err(|_| "hardware worker is unavailable".to_string())
}

#[tauri::command]
pub async fn test_dispatch_action(
    finger_id: usize,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    ProfileStore::validate_id(finger_id)?;
    let profile = {
        let profiles = state
            .profiles
            .lock()
            .map_err(|_| "profile store lock poisoned".to_string())?;
        profiles.get_profile(finger_id)?
    };
    encode_action(&profile, |reference| state.secret_store.get(reference))?;
    app.emit(
        "finger_touch_event",
        FingerTouchEvent {
            finger_id: finger_id as u8,
            action: profile.label,
            status: TouchStatus::Executed,
        },
    )
    .map_err(|e| e.to_string())
}
