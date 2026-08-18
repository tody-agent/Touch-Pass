use crate::secret_store::SecretStore;
use crate::types::{
    default_profile, ActionType, CommandError, ErrorCode, FingerProfile, MAX_FINGERS,
};
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::PathBuf;

const PROFILE_VERSION: u8 = 2;

#[derive(Debug, Serialize, Deserialize)]
struct ProfileDocument {
    version: u8,
    profiles: Vec<FingerProfile>,
}

pub struct ProfileStore {
    path: PathBuf,
    secret_store: SecretStore,
}

impl ProfileStore {
    pub fn new(path: PathBuf, secret_store: SecretStore) -> Self {
        Self { path, secret_store }
    }

    pub fn list_profiles(&self) -> Result<Vec<FingerProfile>, CommandError> {
        let document = self.read_document()?;
        let (stored, needs_migration) = match document {
            Some(document) if document.version <= PROFILE_VERSION => {
                let needs_migration = document.version < PROFILE_VERSION;
                (document.profiles, needs_migration)
            }
            Some(document) => {
                return Err(CommandError::persistence(format!(
                    "unsupported profile version {}",
                    document.version
                )))
            }
            None => (default_profiles(), false),
        };

        let profiles = self.normalize_profiles(&stored);
        if needs_migration {
            self.backup_v1()?;
            self.save(&profiles)?;
        }
        Ok(profiles)
    }

    pub fn get_profile(&self, id: usize) -> Result<FingerProfile, CommandError> {
        Self::validate_id(id)?;
        Ok(self.list_profiles()?[id - 1].clone())
    }

    pub fn save_profile(
        &self,
        mut profile: FingerProfile,
        secret: Option<String>,
    ) -> Result<FingerProfile, CommandError> {
        Self::validate_profile(&profile, secret.as_deref())?;
        let mut profiles = self.list_profiles()?;
        let reference = format!("slot-{}", profile.id);
        let previous_secret = self
            .secret_store
            .get_optional(&reference)
            .map_err(CommandError::persistence)?;
        let secret_changed;
        if profile.action_type == ActionType::Password {
            if secret.is_none() && previous_secret.is_none() {
                return Err(CommandError::new(ErrorCode::SecretRequired));
            }
            secret_changed = secret.is_some();
            if let Some(secret) = secret.as_ref() {
                self.secret_store
                    .set(&reference, secret.as_bytes())
                    .map_err(CommandError::persistence)?;
            }
            profile.secret_ref = Some(reference.clone());
            profile.secret_configured = profile
                .secret_ref
                .as_deref()
                .map(|reference| self.secret_store.exists(reference))
                .unwrap_or(false);
        } else if profile.action_type == ActionType::Disabled {
            secret_changed = false;
            if previous_secret.is_some() {
                profile.secret_ref = Some(reference.clone());
                profile.secret_configured = true;
            } else {
                profile.secret_ref = None;
                profile.secret_configured = false;
            }
        } else {
            secret_changed = previous_secret.is_some();
            self.secret_store
                .delete(&reference)
                .map_err(CommandError::persistence)?;
            profile.secret_ref = None;
            profile.secret_configured = false;
        }

        profiles[profile.id - 1] = profile.clone();
        if let Err(error) = self.save(&profiles) {
            if secret_changed {
                self.restore_secret(&reference, previous_secret.as_deref());
            }
            return Err(error);
        }
        Ok(profile)
    }

    pub fn reset_profile(&self, id: usize) -> Result<FingerProfile, CommandError> {
        Self::validate_id(id)?;
        let mut profiles = self.list_profiles()?;
        let reference = format!("slot-{}", id);
        let previous_secret = self
            .secret_store
            .get_optional(&reference)
            .map_err(CommandError::persistence)?;
        self.secret_store
            .delete(&reference)
            .map_err(CommandError::persistence)?;
        profiles[id - 1] = default_profile(id);
        if let Err(error) = self.save(&profiles) {
            self.restore_secret(&reference, previous_secret.as_deref());
            return Err(error);
        }
        Ok(profiles[id - 1].clone())
    }

    pub fn mark_enrolled(&self, id: usize) -> Result<FingerProfile, CommandError> {
        Self::validate_id(id)?;
        let mut profiles = self.list_profiles()?;
        profiles[id - 1].configured = true;
        self.save(&profiles)?;
        Ok(profiles[id - 1].clone())
    }

    pub fn validate_id(id: usize) -> Result<(), CommandError> {
        if (1..=MAX_FINGERS).contains(&id) {
            Ok(())
        } else {
            Err(CommandError::new(ErrorCode::InvalidFinger))
        }
    }

    fn validate_profile(profile: &FingerProfile, secret: Option<&str>) -> Result<(), CommandError> {
        Self::validate_id(profile.id)?;
        if let Some(secret) = secret {
            if secret.is_empty() || secret.len() > 128 || !secret.is_ascii() {
                return Err(CommandError::new(ErrorCode::InvalidPassword));
            }
        }
        if profile.action_type == ActionType::Custom {
            let payload = profile.custom_payload.as_deref().unwrap_or("").trim();
            if payload.is_empty() || payload.len() > 128 || !payload.is_ascii() {
                return Err(CommandError::new(ErrorCode::InvalidCustomPayload));
            }
        }
        Ok(())
    }

    fn read_document(&self) -> Result<Option<ProfileDocument>, CommandError> {
        if !self.path.exists() {
            return Ok(None);
        }
        let content = std::fs::read_to_string(&self.path).map_err(CommandError::persistence)?;
        serde_json::from_str::<ProfileDocument>(&content)
            .map(Some)
            .map_err(CommandError::persistence)
    }

    fn normalize_profiles(&self, stored: &[FingerProfile]) -> Vec<FingerProfile> {
        (1..=MAX_FINGERS)
            .map(|id| {
                let mut profile = stored
                    .iter()
                    .find(|profile| profile.id == id)
                    .cloned()
                    .unwrap_or_else(|| default_profile(id));
                profile.hand = if id <= 5 {
                    crate::types::Hand::Left
                } else {
                    crate::types::Hand::Right
                };
                profile.secret_configured = profile
                    .secret_ref
                    .as_deref()
                    .map(|reference| self.secret_store.exists(reference))
                    .unwrap_or(false);
                profile
            })
            .collect()
    }

    fn backup_v1(&self) -> Result<(), CommandError> {
        let backup = self.path.with_file_name("profiles.v1.backup.json");
        if !backup.exists() {
            std::fs::copy(&self.path, backup).map_err(CommandError::persistence)?;
        }
        Ok(())
    }

    fn restore_secret(&self, reference: &str, previous: Option<&[u8]>) {
        match previous {
            Some(secret) => {
                let _ = self.secret_store.set(reference, secret);
            }
            None => {
                let _ = self.secret_store.delete(reference);
            }
        }
    }

    fn save(&self, profiles: &[FingerProfile]) -> Result<(), CommandError> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent).map_err(CommandError::persistence)?;
        }
        let document = ProfileDocument {
            version: PROFILE_VERSION,
            profiles: profiles.to_vec(),
        };
        let content = serde_json::to_string_pretty(&document).map_err(CommandError::persistence)?;
        let parent = self
            .path
            .parent()
            .filter(|path| !path.as_os_str().is_empty())
            .unwrap_or_else(|| std::path::Path::new("."));
        let mut temporary =
            tempfile::NamedTempFile::new_in(parent).map_err(CommandError::persistence)?;
        temporary
            .write_all(content.as_bytes())
            .map_err(CommandError::persistence)?;
        temporary
            .as_file()
            .sync_all()
            .map_err(CommandError::persistence)?;
        temporary
            .persist(&self.path)
            .map(|_| ())
            .map_err(|error| CommandError::persistence(error.error))
    }
}

fn default_profiles() -> Vec<FingerProfile> {
    (1..=MAX_FINGERS).map(default_profile).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn test_secret_store(service: &str) -> SecretStore {
        SecretStore::mock(service)
    }

    #[test]
    fn lists_default_profiles_without_exposing_secret() {
        let dir = tempdir().unwrap();
        let store = ProfileStore::new(
            dir.path().join("profiles.json"),
            test_secret_store("touchpass-test-list"),
        );
        let profiles = store.list_profiles().unwrap();
        assert_eq!(profiles.len(), 10);
        assert!(profiles.iter().all(|profile| profile.secret_ref.is_none()));
    }

    #[test]
    fn rejects_invalid_custom_payload() {
        let dir = tempdir().unwrap();
        let store = ProfileStore::new(
            dir.path().join("profiles.json"),
            test_secret_store("touchpass-test-custom"),
        );
        let mut profile = default_profile(1);
        profile.action_type = ActionType::Custom;
        profile.custom_payload = Some("x".repeat(129));
        assert!(store.save_profile(profile, None).is_err());
    }

    #[test]
    fn rejects_empty_custom_payload_before_persisting() {
        let dir = tempdir().unwrap();
        let store = ProfileStore::new(
            dir.path().join("profiles.json"),
            test_secret_store("touchpass-test-empty-custom"),
        );
        let mut profile = default_profile(1);
        profile.action_type = ActionType::Custom;
        profile.custom_payload = Some("   ".to_string());

        assert!(store.save_profile(profile, None).is_err());
        assert_eq!(store.get_profile(1).unwrap().action_type, ActionType::Enter);
    }

    #[test]
    fn rejects_password_without_existing_or_new_secret_before_persisting() {
        let dir = tempdir().unwrap();
        let store = ProfileStore::new(
            dir.path().join("profiles.json"),
            test_secret_store("touchpass-test-missing-secret"),
        );
        let mut profile = default_profile(1);
        profile.action_type = ActionType::Password;

        assert!(store.save_profile(profile, None).is_err());
        let stored = store.get_profile(1).unwrap();
        assert_eq!(stored.action_type, ActionType::Enter);
        assert!(!stored.secret_configured);
    }

    #[test]
    fn new_action_is_not_configured_until_enrollment_finishes() {
        let dir = tempdir().unwrap();
        let store = ProfileStore::new(
            dir.path().join("profiles.json"),
            test_secret_store("touchpass-test-enrollment-state"),
        );
        let profile = default_profile(1);

        let saved = store.save_profile(profile, None).unwrap();
        assert!(!saved.configured);

        let enrolled = store.mark_enrolled(1).unwrap();
        assert!(enrolled.configured);
    }

    #[test]
    fn disabling_an_action_keeps_the_fingerprint_enrolled() {
        let dir = tempdir().unwrap();
        let store = ProfileStore::new(
            dir.path().join("profiles.json"),
            test_secret_store("touchpass-test-disable-action"),
        );
        let mut profile = default_profile(1);
        profile.configured = true;
        profile.action_type = ActionType::Disabled;

        let saved = store.save_profile(profile, None).unwrap();

        assert!(saved.configured);
        assert_eq!(saved.action_type, ActionType::Disabled);
    }

    #[test]
    fn disabling_an_action_preserves_stored_secret_in_keyring() {
        let dir = tempdir().unwrap();
        let store = ProfileStore::new(
            dir.path().join("profiles.json"),
            test_secret_store("touchpass-test-disable-secret"),
        );
        let mut profile = default_profile(1);
        profile.action_type = ActionType::Password;
        let saved = store
            .save_profile(profile.clone(), Some("SecretP@ss123".to_string()))
            .unwrap();
        assert!(saved.secret_configured);

        let mut disabled_profile = saved.clone();
        disabled_profile.action_type = ActionType::Disabled;
        let disabled_saved = store.save_profile(disabled_profile, None).unwrap();
        assert_eq!(disabled_saved.action_type, ActionType::Disabled);
        assert!(disabled_saved.secret_configured);

        // Verify that re-enabling password without passing new secret works and retains the password
        let mut reenabled_profile = disabled_saved.clone();
        reenabled_profile.action_type = ActionType::Password;
        let reenabled_saved = store.save_profile(reenabled_profile, None).unwrap();
        assert_eq!(reenabled_saved.action_type, ActionType::Password);
        assert!(reenabled_saved.secret_configured);
    }

    #[test]
    fn migrates_v1_profiles_without_localized_copy_and_creates_backup() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("profiles.json");
        std::fs::write(
            &path,
            r#"{
              "version": 1,
              "profiles": [{
                "id": 1,
                "name": "Ngon Cai Trai",
                "hand": "left",
                "configured": true,
                "actionType": "custom",
                "label": "Phim Tat",
                "description": "Mo ung dung",
                "icon": "wand",
                "requireConfirm": false,
                "secretConfigured": false,
                "customPayload": "/approve"
              }, {
                "id": 2,
                "name": "Ngon Tro Trai",
                "hand": "left",
                "configured": true,
                "actionType": "password",
                "label": "Mat Khau",
                "description": "Dien mat khau",
                "icon": "key",
                "requireConfirm": true,
                "secretConfigured": true,
                "secretRef": "legacy-vault-key"
              }]
            }"#,
        )
        .unwrap();
        let store = ProfileStore::new(path.clone(), test_secret_store("touchpass-test-migrate"));

        let profiles = store.list_profiles().unwrap();

        assert!(profiles[0].configured);
        assert_eq!(profiles[0].action_type, ActionType::Custom);
        assert_eq!(profiles[0].custom_payload.as_deref(), Some("/approve"));
        assert_eq!(profiles[1].secret_ref.as_deref(), Some("legacy-vault-key"));
        assert!(profiles[1].configured);
        assert_eq!(profiles.len(), MAX_FINGERS);
        assert_eq!(profiles[9], default_profile(10));
        assert!(path.with_file_name("profiles.v1.backup.json").exists());
        let migrated = std::fs::read_to_string(path).unwrap();
        assert!(migrated.contains("\"version\": 2"));
        assert!(!migrated.contains("\"name\""));
        assert!(!migrated.contains("\"label\""));
    }

    #[test]
    fn malformed_profile_file_is_reported_without_overwriting_user_data() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("profiles.json");
        let malformed = r#"{"version": 1, "profiles": ["#;
        std::fs::write(&path, malformed).unwrap();
        let store = ProfileStore::new(
            path.clone(),
            test_secret_store("touchpass-test-malformed-profile"),
        );

        let error = store.list_profiles().unwrap_err();

        assert_eq!(error.code, ErrorCode::PersistenceFailed);
        assert_eq!(std::fs::read_to_string(path).unwrap(), malformed);
    }
}
