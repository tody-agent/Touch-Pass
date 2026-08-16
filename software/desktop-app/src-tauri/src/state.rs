use crate::preferences::PreferenceStore;
use crate::profile_store::ProfileStore;
use crate::secret_store::SecretStore;
use crate::types::{AppStatusResponse, CommandError, FingerProfile, SensorStatus, WorkerStatus};
use std::path::PathBuf;
use std::sync::{mpsc, Arc, Mutex};

#[derive(Debug)]
pub enum AdminCommand {
    Enroll(usize),
    Delete {
        slot: usize,
        reply: mpsc::Sender<Result<FingerProfile, CommandError>>,
    },
}

#[derive(Clone)]
pub struct AppState {
    pub profiles: Arc<Mutex<ProfileStore>>,
    pub preferences: Arc<Mutex<PreferenceStore>>,
    pub secret_store: SecretStore,
    pub status: Arc<Mutex<AppStatusResponse>>,
    pub admin_tx: mpsc::Sender<AdminCommand>,
}

impl AppState {
    pub fn new(app_handle: tauri::AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let (admin_tx, admin_rx) = mpsc::channel();
        drop(admin_rx);
        let data_dir = app_data_dir(&app_handle)?;
        let secret_store = SecretStore::new("TouchPass");
        let profiles = ProfileStore::new(data_dir.join("profiles.json"), secret_store.clone());
        let preferences = PreferenceStore::new(data_dir.join("preferences.json"));
        Ok(Self {
            profiles: Arc::new(Mutex::new(profiles)),
            preferences: Arc::new(Mutex::new(preferences)),
            secret_store,
            status: Arc::new(Mutex::new(AppStatusResponse {
                connected: false,
                port: None,
                device_id: None,
                sensor_status: SensorStatus::Unavailable,
                firmware_mode: "unknown".to_string(),
                fingerprint_count: 0,
                hid_key_configured: false,
                background_worker: WorkerStatus::Starting,
            })),
            admin_tx,
        })
    }

    pub fn with_admin_channel(&self, tx: mpsc::Sender<AdminCommand>) -> Self {
        Self {
            profiles: self.profiles.clone(),
            preferences: self.preferences.clone(),
            secret_store: self.secret_store.clone(),
            status: self.status.clone(),
            admin_tx: tx,
        }
    }
}

fn app_data_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    use tauri::Manager;
    if let Ok(path) = app_handle.path().app_data_dir() {
        return Ok(path);
    }
    let fallback = std::env::temp_dir().join("TouchPass");
    Ok(fallback)
}
