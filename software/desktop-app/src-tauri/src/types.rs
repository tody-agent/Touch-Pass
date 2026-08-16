use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};

pub const MAX_FINGERS: usize = 10;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    AiAccept,
    Password,
    Enter,
    Escape,
    Custom,
    Disabled,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Hand {
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FingerProfile {
    pub id: usize,
    pub hand: Hand,
    pub configured: bool,
    pub action_type: ActionType,
    pub require_confirm: bool,
    #[serde(default)]
    pub secret_configured: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub secret_ref: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_payload: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SensorStatus {
    Ok,
    Error,
    Checking,
    Bootloader,
    Unavailable,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WorkerStatus {
    Starting,
    Running,
    Unavailable,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AppStatusResponse {
    pub connected: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub device_id: Option<String>,
    pub sensor_status: SensorStatus,
    pub firmware_mode: String,
    pub fingerprint_count: usize,
    pub hid_key_configured: bool,
    pub background_worker: WorkerStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStatusChange {
    pub connected: bool,
    pub port: Option<String>,
    pub sensor_status: SensorStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EnrollStepProgress {
    pub finger_id: u8,
    pub step: u8,
    pub total: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FingerTouchEvent {
    pub finger_id: u8,
    pub action_type: ActionType,
    pub status: TouchStatus,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TouchStatus {
    Armed,
    Executed,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCode {
    InvalidFinger,
    SecretRequired,
    InvalidPassword,
    InvalidCustomPayload,
    HardwareUnavailable,
    PersistenceFailed,
    Internal,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum Locale {
    #[serde(rename = "vi")]
    Vi,
    #[serde(rename = "en")]
    En,
    #[serde(rename = "zh-CN")]
    ZhCn,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppPreferences {
    pub locale: Option<Locale>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: ErrorCode,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

impl CommandError {
    pub fn new(code: ErrorCode) -> Self {
        Self { code, detail: None }
    }

    pub fn with_detail(code: ErrorCode, detail: impl Into<String>) -> Self {
        Self {
            code,
            detail: Some(detail.into()),
        }
    }

    pub fn persistence(detail: impl Display) -> Self {
        Self::with_detail(ErrorCode::PersistenceFailed, detail.to_string())
    }

    pub fn internal(detail: impl Display) -> Self {
        Self::with_detail(ErrorCode::Internal, detail.to_string())
    }
}

impl Display for CommandError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{:?}", self.code)?;
        if let Some(detail) = &self.detail {
            write!(formatter, ": {detail}")?;
        }
        Ok(())
    }
}

impl std::error::Error for CommandError {}

pub fn default_profile(id: usize) -> FingerProfile {
    FingerProfile {
        id,
        hand: if id <= 5 { Hand::Left } else { Hand::Right },
        configured: false,
        action_type: ActionType::Enter,
        require_confirm: true,
        secret_configured: false,
        secret_ref: None,
        custom_payload: None,
    }
}
