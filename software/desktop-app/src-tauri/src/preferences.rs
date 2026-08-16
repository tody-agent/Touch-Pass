use crate::types::{AppPreferences, CommandError, Locale};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

const PREFERENCE_VERSION: u8 = 1;

#[derive(Debug, Serialize, Deserialize)]
struct PreferenceDocument {
    version: u8,
    #[serde(flatten)]
    preferences: AppPreferences,
}

#[derive(Debug)]
pub struct PreferenceStore {
    path: PathBuf,
}

impl PreferenceStore {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    pub fn load(&self) -> Result<AppPreferences, CommandError> {
        if !self.path.exists() {
            return Ok(AppPreferences::default());
        }
        let content = std::fs::read_to_string(&self.path).map_err(CommandError::persistence)?;
        let document: PreferenceDocument =
            serde_json::from_str(&content).map_err(CommandError::persistence)?;
        if document.version != PREFERENCE_VERSION {
            return Err(CommandError::persistence(format!(
                "unsupported preference version {}",
                document.version
            )));
        }
        Ok(document.preferences)
    }

    pub fn save_locale(&self, locale: Locale) -> Result<AppPreferences, CommandError> {
        let preferences = AppPreferences {
            locale: Some(locale),
        };
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent).map_err(CommandError::persistence)?;
        }
        let document = PreferenceDocument {
            version: PREFERENCE_VERSION,
            preferences: preferences.clone(),
        };
        let content = serde_json::to_string_pretty(&document).map_err(CommandError::persistence)?;
        std::fs::write(&self.path, content).map_err(CommandError::persistence)?;
        Ok(preferences)
    }
}

pub fn tray_labels(locale: Locale) -> (&'static str, &'static str) {
    match locale {
        Locale::Vi => ("Mở TouchPass", "Thoát"),
        Locale::En => ("Show TouchPass", "Quit"),
        Locale::ZhCn => ("打开 TouchPass", "退出"),
    }
}
