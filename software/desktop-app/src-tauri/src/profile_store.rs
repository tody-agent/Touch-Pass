use crate::secret_store::SecretStore;
use crate::types::{default_profile, ActionType, FingerProfile, MAX_FINGERS};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

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

    pub fn list_profiles(&self) -> Vec<FingerProfile> {
        let stored = self.read_document().unwrap_or_else(default_profiles);
        (1..=MAX_FINGERS)
            .map(|id| {
                let mut profile = stored
                    .iter()
                    .find(|profile| profile.id == id)
                    .cloned()
                    .unwrap_or_else(|| default_profile(id));
                profile.secret_configured = profile
                    .secret_ref
                    .as_deref()
                    .map(|reference| self.secret_store.exists(reference))
                    .unwrap_or(false);
                if profile.action_type == ActionType::Password {
                    profile.configured = profile.secret_configured;
                }
                profile
            })
            .collect()
    }

    pub fn get_profile(&self, id: usize) -> Result<FingerProfile, String> {
        Self::validate_id(id)?;
        Ok(self.list_profiles()[id - 1].clone())
    }

    pub fn save_profile(
        &self,
        mut profile: FingerProfile,
        secret: Option<String>,
    ) -> Result<FingerProfile, String> {
        Self::validate_profile(&profile, secret.as_deref())?;
        if profile.action_type == ActionType::Password {
            let reference = format!("slot-{}", profile.id);
            if secret.is_none() && !self.secret_store.exists(&reference) {
                return Err("password action requires a stored password".to_string());
            }
            if let Some(secret) = secret {
                self.secret_store.set(&reference, secret.as_bytes())?;
            }
            profile.secret_ref = Some(reference);
            profile.secret_configured = profile
                .secret_ref
                .as_deref()
                .map(|reference| self.secret_store.exists(reference))
                .unwrap_or(false);
            profile.configured = profile.secret_configured;
        } else {
            self.secret_store.delete(&format!("slot-{}", profile.id))?;
            profile.secret_ref = None;
            profile.secret_configured = false;
            profile.configured = profile.action_type != ActionType::Disabled;
        }

        let mut profiles = self.list_profiles();
        profiles[profile.id - 1] = profile.clone();
        self.save(&profiles)?;
        Ok(profile)
    }

    pub fn reset_profile(&self, id: usize) -> Result<FingerProfile, String> {
        Self::validate_id(id)?;
        self.secret_store.delete(&format!("slot-{}", id))?;
        let mut profiles = self.list_profiles();
        profiles[id - 1] = default_profile(id);
        self.save(&profiles)?;
        Ok(profiles[id - 1].clone())
    }

    pub fn mark_enrolled(&self, id: usize) -> Result<FingerProfile, String> {
        Self::validate_id(id)?;
        let mut profiles = self.list_profiles();
        profiles[id - 1].configured = true;
        self.save(&profiles)?;
        Ok(profiles[id - 1].clone())
    }

    pub fn validate_id(id: usize) -> Result<(), String> {
        if (1..=MAX_FINGERS).contains(&id) {
            Ok(())
        } else {
            Err("finger id must be between 1 and 10".to_string())
        }
    }

    fn validate_profile(profile: &FingerProfile, secret: Option<&str>) -> Result<(), String> {
        Self::validate_id(profile.id)?;
        let label = profile.label.trim();
        if label.is_empty() || label.chars().count() > 64 {
            return Err("label must contain between 1 and 64 characters".to_string());
        }
        if let Some(secret) = secret {
            if secret.is_empty() || secret.len() > 128 || !secret.is_ascii() {
                return Err("password must contain 1..128 ASCII bytes".to_string());
            }
        }
        if profile.action_type == ActionType::Custom {
            let payload = profile.custom_payload.as_deref().unwrap_or("").trim();
            if payload.is_empty() || payload.len() > 128 || !payload.is_ascii() {
                return Err("customPayload must contain 1..128 ASCII bytes".to_string());
            }
        }
        Ok(())
    }

    fn read_document(&self) -> Option<Vec<FingerProfile>> {
        let content = std::fs::read_to_string(&self.path).ok()?;
        let document = serde_json::from_str::<ProfileDocument>(&content).ok()?;
        Some(document.profiles)
    }

    fn save(&self, profiles: &[FingerProfile]) -> Result<(), String> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let document = ProfileDocument {
            version: 1,
            profiles: profiles.to_vec(),
        };
        let content = serde_json::to_string_pretty(&document).map_err(|e| e.to_string())?;
        let temporary = self.path.with_extension("tmp");
        std::fs::write(&temporary, content).map_err(|e| e.to_string())?;
        if self.path.exists() {
            std::fs::remove_file(&self.path).map_err(|e| e.to_string())?;
        }
        std::fs::rename(&temporary, &self.path).map_err(|e| e.to_string())
    }
}

fn default_profiles() -> Vec<FingerProfile> {
    (1..=MAX_FINGERS).map(default_profile).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn lists_default_profiles_without_exposing_secret() {
        let dir = tempdir().unwrap();
        let store = ProfileStore::new(
            dir.path().join("profiles.json"),
            SecretStore::new("touchpass-test-list"),
        );
        let profiles = store.list_profiles();
        assert_eq!(profiles.len(), 10);
        assert!(profiles.iter().all(|profile| profile.secret_ref.is_none()));
    }

    #[test]
    fn rejects_invalid_custom_payload() {
        let dir = tempdir().unwrap();
        let store = ProfileStore::new(
            dir.path().join("profiles.json"),
            SecretStore::new("touchpass-test-custom"),
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
            SecretStore::new("touchpass-test-empty-custom"),
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
            SecretStore::new("touchpass-test-missing-secret"),
        );
        let mut profile = default_profile(1);
        profile.action_type = ActionType::Password;

        assert!(store.save_profile(profile, None).is_err());
        let stored = store.get_profile(1).unwrap();
        assert_eq!(stored.action_type, ActionType::Enter);
        assert!(!stored.secret_configured);
    }
}
