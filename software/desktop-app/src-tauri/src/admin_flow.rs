use crate::protocol::FirmwareLine;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AdminOperation {
    Enroll(usize),
    Delete(usize),
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
    Running,
}

#[derive(Debug, Default)]
pub struct AdminFlow {
    operation: Option<AdminOperation>,
    phase: Option<AdminPhase>,
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

    pub fn is_active(&self) -> bool {
        self.operation.is_some()
    }

    pub fn clear(&mut self) {
        self.operation = None;
        self.phase = None;
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
            (Some(AdminPhase::Unlocking), FirmwareLine::ConfigUnlockOk) => {
                self.phase = Some(AdminPhase::Running);
                AdminFlowAction::Write(match operation {
                    AdminOperation::Enroll(slot) => format!("ENROLL {slot}\n"),
                    AdminOperation::Delete(slot) => format!("DELETE {slot}\n"),
                })
            }
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
}
