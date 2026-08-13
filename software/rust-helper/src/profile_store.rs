use std::path::PathBuf;
use serde_json::{json, Value};

pub struct ProfileStore {
    path: PathBuf,
}

impl ProfileStore {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    pub fn list_profiles(&self) -> Vec<Value> {
        if let Ok(content) = std::fs::read_to_string(&self.path) {
            if let Ok(doc) = serde_json::from_str::<Value>(&content) {
                if let Some(arr) = doc.get("profiles").and_then(|v| v.as_array()) {
                    return arr.clone();
                }
            }
        }
        (1..=10).map(|slot| {
            json!({
                "slot": slot,
                "label": format!("Ngón {}", slot),
                "enrolled": false,
                "action": { "preset": "enter", "confirm": true }
            })
        }).collect()
    }
}
