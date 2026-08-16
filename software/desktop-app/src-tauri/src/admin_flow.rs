use crate::protocol::FirmwareLine;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AdminOperation {
    Enroll(usize),
    Delete(usize),
    ConfigureHid { enroll_after: Option<usize> },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AdminFlowAction {
    None,
    Write(String),
    UnlockPrompt,
    OperationPrompt(String),
    Completed(AdminOperation),
    Failed {
        operation: AdminOperation,
        reason: String,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum AdminPhase {
    Unlocking,
    SettingHidKey,
    SettingMode,
    RollingBackHidKey,
    Running,
}

#[derive(Debug, Default)]
pub struct AdminFlow {
    operation: Option<AdminOperation>,
    phase: Option<AdminPhase>,
    hid_key_hex: Option<String>,
}

impl AdminFlow {
    pub fn start(&mut self, operation: AdminOperation) -> Result<String, &'static str> {
        if self.operation.is_some() {
            return Err("an admin operation is already active");
        }
        self.operation = Some(operation);
        self.phase = Some(AdminPhase::Unlocking);
        Ok("CONFIG_UNLOCK\n".to_string())
    }

    pub fn start_hid_configuration(
        &mut self,
        key_hex: String,
        enroll_after: Option<usize>,
    ) -> Result<String, &'static str> {
        if key_hex.len() != 64
            || !key_hex
                .chars()
                .all(|character| character.is_ascii_hexdigit())
        {
            return Err("HID pairing key must contain 64 hex characters");
        }
        let command = self.start(AdminOperation::ConfigureHid { enroll_after })?;
        self.hid_key_hex = Some(key_hex);
        Ok(command)
    }

    pub fn is_active(&self) -> bool {
        self.operation.is_some()
    }

    pub fn expects_mode_confirmation(&self) -> bool {
        self.phase == Some(AdminPhase::SettingMode)
    }

    pub fn is_rolling_back(&self) -> bool {
        self.phase == Some(AdminPhase::RollingBackHidKey)
    }

    pub fn begin_hid_rollback(&mut self, old_key_hex: String) -> Result<String, &'static str> {
        if !self.expects_mode_confirmation() {
            return Err("HID rollback is not available in the current phase");
        }
        if old_key_hex.len() != 64
            || !old_key_hex
                .chars()
                .all(|character| character.is_ascii_hexdigit())
        {
            return Err("HID rollback key must contain 64 hex characters");
        }
        self.phase = Some(AdminPhase::RollingBackHidKey);
        Ok(format!("HID_KEY {old_key_hex}\n"))
    }

    pub fn clear(&mut self) {
        self.operation = None;
        self.phase = None;
        self.hid_key_hex = None;
    }

    pub fn cancel(&mut self, reason: impl Into<String>) -> AdminFlowAction {
        let Some(operation) = self.operation else {
            return AdminFlowAction::None;
        };
        self.clear();
        AdminFlowAction::Failed {
            operation,
            reason: reason.into(),
        }
    }

    pub fn handle(&mut self, line: &FirmwareLine) -> AdminFlowAction {
        let Some(operation) = self.operation else {
            return AdminFlowAction::None;
        };

        match (self.phase, line) {
            (Some(AdminPhase::Unlocking), FirmwareLine::ConfigUnlockOk) => match operation {
                AdminOperation::Enroll(slot) => {
                    self.phase = Some(AdminPhase::Running);
                    AdminFlowAction::Write(format!("ENROLL {slot}\n"))
                }
                AdminOperation::Delete(slot) => {
                    self.phase = Some(AdminPhase::Running);
                    AdminFlowAction::Write(format!("DELETE {slot}\n"))
                }
                AdminOperation::ConfigureHid { .. } => {
                    let Some(key_hex) = self.hid_key_hex.as_deref() else {
                        return self.cancel("pairing_key_unavailable");
                    };
                    self.phase = Some(AdminPhase::SettingHidKey);
                    AdminFlowAction::Write(format!("HID_KEY {key_hex}\n"))
                }
            },
            (Some(AdminPhase::Unlocking), FirmwareLine::Prompt(_)) => AdminFlowAction::UnlockPrompt,
            (_, FirmwareLine::ConfigUnlockErr(reason)) => {
                self.clear();
                AdminFlowAction::Failed {
                    operation,
                    reason: format!("config_unlock:{reason}"),
                }
            }
            (_, FirmwareLine::ConfigLocked) => {
                self.clear();
                AdminFlowAction::Failed {
                    operation,
                    reason: "config_locked".to_string(),
                }
            }
            (Some(AdminPhase::Running), FirmwareLine::Prompt(message)) => {
                AdminFlowAction::OperationPrompt(message.clone())
            }
            (Some(AdminPhase::SettingHidKey), FirmwareLine::HidKeyOk) => {
                self.hid_key_hex = None;
                self.phase = Some(AdminPhase::SettingMode);
                AdminFlowAction::Write("MODE hid\n".to_string())
            }
            (Some(AdminPhase::SettingHidKey), FirmwareLine::HidKeyErr(reason)) => {
                self.clear();
                AdminFlowAction::Failed {
                    operation,
                    reason: format!("hid_key:{reason}"),
                }
            }
            (Some(AdminPhase::SettingMode), FirmwareLine::ModeOk(mode)) if mode == "hid" => {
                if let AdminOperation::ConfigureHid {
                    enroll_after: Some(slot),
                } = operation
                {
                    self.operation = Some(AdminOperation::Enroll(slot));
                    self.phase = Some(AdminPhase::Running);
                    AdminFlowAction::Write(format!("ENROLL {slot}\n"))
                } else {
                    self.clear();
                    AdminFlowAction::Completed(operation)
                }
            }
            (Some(AdminPhase::SettingMode), FirmwareLine::ModeOk(mode)) => {
                self.clear();
                AdminFlowAction::Failed {
                    operation,
                    reason: format!("mode_unexpected:{mode}"),
                }
            }
            (Some(AdminPhase::SettingMode), FirmwareLine::ModeErr(mode)) => {
                self.clear();
                AdminFlowAction::Failed {
                    operation,
                    reason: format!("mode_failed:{mode}"),
                }
            }
            (Some(AdminPhase::RollingBackHidKey), FirmwareLine::HidKeyOk) => {
                self.clear();
                AdminFlowAction::Failed {
                    operation,
                    reason: "persistence_failed".to_string(),
                }
            }
            (Some(AdminPhase::RollingBackHidKey), FirmwareLine::HidKeyErr(_)) => {
                self.clear();
                AdminFlowAction::Failed {
                    operation,
                    reason: "pairing_in_doubt".to_string(),
                }
            }
            (Some(AdminPhase::Running), FirmwareLine::EnrollOk(slot))
                if operation == AdminOperation::Enroll(*slot) =>
            {
                self.clear();
                AdminFlowAction::Completed(operation)
            }
            (
                Some(AdminPhase::Running),
                FirmwareLine::EnrollErr {
                    slot,
                    stage,
                    confirm,
                },
            ) if operation == AdminOperation::Enroll(*slot) => {
                let reason = format!(
                    "enroll:{}:0x{:02x}",
                    stage.as_deref().unwrap_or("unknown"),
                    confirm.unwrap_or(0xff)
                );
                self.clear();
                AdminFlowAction::Failed { operation, reason }
            }
            (Some(AdminPhase::Running), FirmwareLine::DeleteOk(slot))
                if operation == AdminOperation::Delete(*slot) =>
            {
                self.clear();
                AdminFlowAction::Completed(operation)
            }
            (Some(AdminPhase::Running), FirmwareLine::DeleteErr(slot))
                if operation == AdminOperation::Delete(*slot) =>
            {
                self.clear();
                AdminFlowAction::Failed {
                    operation,
                    reason: "delete_failed".to_string(),
                }
            }
            _ => AdminFlowAction::None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{AdminFlow, AdminFlowAction, AdminOperation};
    use crate::protocol::parse_firmware_line;

    #[test]
    fn enrollment_unlocks_before_sending_enroll() {
        let mut flow = AdminFlow::default();
        let first = flow.start(AdminOperation::Enroll(6)).unwrap();
        assert_eq!(first, "CONFIG_UNLOCK\n");

        let next = flow.handle(&parse_firmware_line(
            "OK CONFIG_UNLOCK first_setup seconds=120",
        ));
        assert_eq!(next, AdminFlowAction::Write("ENROLL 6\n".to_string()));
    }

    #[test]
    fn active_operation_rejects_a_second_request() {
        let mut flow = AdminFlow::default();
        flow.start(AdminOperation::Enroll(1)).unwrap();
        assert!(flow.start(AdminOperation::Delete(2)).is_err());
    }

    #[test]
    fn unlock_failure_clears_the_active_operation() {
        let mut flow = AdminFlow::default();
        flow.start(AdminOperation::Enroll(1)).unwrap();
        let action = flow.handle(&parse_firmware_line("ERR CONFIG_UNLOCK fingerprint"));
        assert!(matches!(action, AdminFlowAction::Failed { .. }));
        assert!(!flow.is_active());
    }

    #[test]
    fn config_lock_during_running_operation_fails_immediately() {
        let mut flow = AdminFlow::default();
        flow.start(AdminOperation::Enroll(6)).unwrap();
        flow.handle(&parse_firmware_line(
            "OK CONFIG_UNLOCK first_setup seconds=120",
        ));

        let action = flow.handle(&parse_firmware_line("ERR CONFIG_LOCKED"));

        assert!(matches!(
            action,
            AdminFlowAction::Failed { reason, .. } if reason == "config_locked"
        ));
        assert!(!flow.is_active());
    }

    #[test]
    fn failed_delete_is_not_reported_as_completed() {
        let mut flow = AdminFlow::default();
        flow.start(AdminOperation::Delete(5)).unwrap();
        flow.handle(&parse_firmware_line(
            "OK CONFIG_UNLOCK authorized seconds=120",
        ));

        let action = flow.handle(&parse_firmware_line("ERR DELETE slot=5"));

        assert!(matches!(
            action,
            AdminFlowAction::Failed {
                operation: AdminOperation::Delete(5),
                ..
            }
        ));
        assert!(!flow.is_active());
    }

    #[test]
    fn configures_hid_only_after_unlocking() {
        let mut flow = AdminFlow::default();
        let key_hex = "11".repeat(32);

        assert_eq!(
            flow.start_hid_configuration(key_hex.clone(), None).unwrap(),
            "CONFIG_UNLOCK\n"
        );
        assert_eq!(
            flow.handle(&parse_firmware_line(
                "OK CONFIG_UNLOCK authorized seconds=120"
            )),
            AdminFlowAction::Write(format!("HID_KEY {key_hex}\n"))
        );
        assert_eq!(
            flow.handle(&parse_firmware_line("OK HID_KEY")),
            AdminFlowAction::Write("MODE hid\n".to_string())
        );
        assert_eq!(
            flow.handle(&parse_firmware_line("OK MODE mode=hid")),
            AdminFlowAction::Completed(AdminOperation::ConfigureHid { enroll_after: None })
        );
        assert!(!flow.is_active());
    }

    #[test]
    fn continues_from_hid_configuration_into_enrollment() {
        let mut flow = AdminFlow::default();
        flow.start_hid_configuration("22".repeat(32), Some(6))
            .unwrap();
        flow.handle(&parse_firmware_line(
            "OK CONFIG_UNLOCK authorized seconds=120",
        ));
        flow.handle(&parse_firmware_line("OK HID_KEY"));

        assert_eq!(
            flow.handle(&parse_firmware_line("OK MODE mode=hid")),
            AdminFlowAction::Write("ENROLL 6\n".to_string())
        );
        assert_eq!(
            flow.handle(&parse_firmware_line("OK ENROLL slot=6")),
            AdminFlowAction::Completed(AdminOperation::Enroll(6))
        );
    }

    #[test]
    fn hid_key_rejection_clears_sensitive_flow_state() {
        let mut flow = AdminFlow::default();
        let key_hex = "ab".repeat(32);
        flow.start_hid_configuration(key_hex.clone(), None).unwrap();
        flow.handle(&parse_firmware_line(
            "OK CONFIG_UNLOCK authorized seconds=120",
        ));

        let action = flow.handle(&parse_firmware_line("ERR HID_KEY write_failed"));

        assert!(matches!(
            action,
            AdminFlowAction::Failed {
                operation: AdminOperation::ConfigureHid { enroll_after: None },
                reason,
            } if reason == "hid_key:write_failed" && !reason.contains(&key_hex)
        ));
        assert!(!flow.is_active());
    }

    #[test]
    fn pairing_commit_failure_restores_the_old_device_key_before_failing() {
        let mut flow = AdminFlow::default();
        let old_key = "09".repeat(32);
        flow.start_hid_configuration("ab".repeat(32), None).unwrap();
        flow.handle(&parse_firmware_line(
            "OK CONFIG_UNLOCK authorized seconds=120",
        ));
        flow.handle(&parse_firmware_line("OK HID_KEY"));

        assert_eq!(
            flow.begin_hid_rollback(old_key.clone()).unwrap(),
            format!("HID_KEY {old_key}\n")
        );
        assert_eq!(
            flow.handle(&parse_firmware_line("OK HID_KEY")),
            AdminFlowAction::Failed {
                operation: AdminOperation::ConfigureHid { enroll_after: None },
                reason: "persistence_failed".to_string(),
            }
        );
        assert!(!flow.is_active());
    }

    #[test]
    fn mode_errors_and_unexpected_modes_fail_the_configuration() {
        for line in ["ERR MODE unsupported", "OK MODE mode=piv"] {
            let mut flow = AdminFlow::default();
            flow.start_hid_configuration("cd".repeat(32), None).unwrap();
            flow.handle(&parse_firmware_line(
                "OK CONFIG_UNLOCK authorized seconds=120",
            ));
            flow.handle(&parse_firmware_line("OK HID_KEY"));

            let action = flow.handle(&parse_firmware_line(line));

            assert!(matches!(action, AdminFlowAction::Failed { .. }));
            assert!(!flow.is_active());
        }
    }

    #[test]
    fn stale_mode_ack_is_ignored_before_the_mode_phase() {
        let mut flow = AdminFlow::default();
        flow.start_hid_configuration("ef".repeat(32), None).unwrap();

        assert_eq!(
            flow.handle(&parse_firmware_line("OK MODE mode=hid")),
            AdminFlowAction::None
        );
        assert!(!flow.expects_mode_confirmation());
        assert!(flow.is_active());
    }

    #[test]
    fn rollback_rejection_leaves_pairing_in_doubt() {
        let mut flow = AdminFlow::default();
        flow.start_hid_configuration("ab".repeat(32), None).unwrap();
        flow.handle(&parse_firmware_line(
            "OK CONFIG_UNLOCK authorized seconds=120",
        ));
        flow.handle(&parse_firmware_line("OK HID_KEY"));
        flow.begin_hid_rollback("09".repeat(32)).unwrap();

        assert!(matches!(
            flow.handle(&parse_firmware_line("ERR HID_KEY write_failed")),
            AdminFlowAction::Failed { reason, .. } if reason == "pairing_in_doubt"
        ));
        assert!(!flow.is_active());
    }

    #[test]
    fn timeout_or_disconnect_cancels_the_active_hid_flow() {
        for reason in ["timeout", "connection_lost"] {
            let mut flow = AdminFlow::default();
            flow.start_hid_configuration("12".repeat(32), None).unwrap();

            assert!(matches!(
                flow.cancel(reason),
                AdminFlowAction::Failed { reason: actual, .. } if actual == reason
            ));
            assert!(!flow.is_active());
        }
    }
}
