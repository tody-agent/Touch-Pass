use serde::{Deserialize, Serialize};

pub const MAX_FINGERS: usize = 10;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    AiAccept,
    Password,
    Enter,
    Escape,
    Custom,
    Disabled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FingerProfile {
    pub id: usize,
    pub name: String,
    pub hand: Hand,
    pub configured: bool,
    pub action_type: ActionType,
    pub label: String,
    pub description: String,
    pub icon: String,
    pub require_confirm: bool,
    #[serde(default)]
    pub secret_configured: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub secret_ref: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_payload: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Hand {
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AppStatusResponse {
    pub connected: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub device_id: Option<String>,
    pub sensor_status: String,
    pub firmware_mode: String,
    pub fingerprint_count: usize,
    pub hid_key_configured: bool,
    pub background_worker: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStatusChange {
    pub connected: bool,
    pub port: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EnrollStepProgress {
    pub finger_id: u8,
    pub step: u8,
    pub total: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FingerTouchEvent {
    pub finger_id: u8,
    pub action: String,
    pub status: TouchStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TouchStatus {
    Armed,
    Executed,
}

pub fn default_profile(id: usize) -> FingerProfile {
    let hand = if id <= 5 { Hand::Left } else { Hand::Right };
    let names = [
        "Ngon Cai Trai",
        "Ngon Tro Trai",
        "Ngon Giua Trai",
        "Ngon Ap Ut Trai",
        "Ngon Ut Trai",
        "Ngon Cai Phai",
        "Ngon Tro Phai",
        "Ngon Giua Phai",
        "Ngon Ap Ut Phai",
        "Ngon Ut Phai",
    ];
    FingerProfile {
        id,
        name: names[id.saturating_sub(1)].to_string(),
        hand,
        configured: false,
        action_type: ActionType::Enter,
        label: "Phim Enter".to_string(),
        description: "Go phim Enter vao cua so dang focus".to_string(),
        icon: "corner-down-left".to_string(),
        require_confirm: true,
        secret_configured: false,
        secret_ref: None,
        custom_payload: None,
    }
}
