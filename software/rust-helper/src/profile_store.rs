use std::path::PathBuf;
use serde_json::{json, Value};

pub const MAX_FINGERS: usize = 10;

fn default_profile(slot: usize) -> Value {
    json!({
        "slot": slot,
        "label": format!("Ngón {}", slot),
        "enrolled": false,
        "action": { "preset": "enter", "confirm": true }
    })
}

pub struct ProfileStore {
    path: PathBuf,
}

impl ProfileStore {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    fn validate_slot(slot: usize) -> Result<(), String> {
        if (1..=MAX_FINGERS).contains(&slot) {
            Ok(())
        } else {
            Err("slot must be between 1 and 10".to_string())
        }
    }

    pub fn list_profiles(&self) -> Vec<Value> {
        if let Ok(content) = std::fs::read_to_string(&self.path) {
            if let Ok(doc) = serde_json::from_str::<Value>(&content) {
                if let Some(arr) = doc.get("profiles").and_then(|v| v.as_array()) {
                    let mut profiles = vec![];
                    for slot in 1..=MAX_FINGERS {
                        let existing = arr.iter().find(|p| p.get("slot").and_then(|s| s.as_u64()) == Some(slot as u64));
                        profiles.push(existing.cloned().unwrap_or_else(|| default_profile(slot)));
                    }
                    return profiles;
                }
            }
        }
        (1..=MAX_FINGERS).map(default_profile).collect()
    }

    pub fn get_profile(&self, slot: usize) -> Result<Value, String> {
        Self::validate_slot(slot)?;
        let profiles = self.list_profiles();
        Ok(profiles[slot - 1].clone())
    }

    pub fn update_profile(&self, slot: usize, changes: Value) -> Result<Value, String> {
        Self::validate_slot(slot)?;
        let mut profiles = self.list_profiles();
        if let Some(label) = changes.get("label").and_then(|v| v.as_str()) {
            profiles[slot - 1]["label"] = json!(label);
        }
        if let Some(enrolled) = changes.get("enrolled").and_then(|v| v.as_bool()) {
            profiles[slot - 1]["enrolled"] = json!(enrolled);
        }
        if let Some(action) = changes.get("action") {
            profiles[slot - 1]["action"] = action.clone();
        }
        self.save(&profiles)?;
        Ok(profiles[slot - 1].clone())
    }


    pub fn set_enrolled(&self, slot: usize, enrolled: bool) -> Result<Value, String> {
        Self::validate_slot(slot)?;
        let mut profiles = self.list_profiles();
        profiles[slot - 1]["enrolled"] = json!(enrolled);
        self.save(&profiles)?;
        Ok(profiles[slot - 1].clone())
    }

    pub fn delete_profile(&self, slot: usize) -> Result<Value, String> {
        Self::validate_slot(slot)?;
        let mut profiles = self.list_profiles();
        profiles[slot - 1] = default_profile(slot);
        self.save(&profiles)?;
        Ok(profiles[slot - 1].clone())
    }

    fn save(&self, profiles: &[Value]) -> Result<(), String> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let doc = json!({
            "version": 1,
            "profiles": profiles
        });
        let content = serde_json::to_string_pretty(&doc).map_err(|e| e.to_string())?;
        std::fs::write(&self.path, content).map_err(|e| e.to_string())
    }
}
