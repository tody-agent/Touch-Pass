use crate::admin_flow::{AdminFlow, AdminFlowAction, AdminOperation};
use crate::gate::TriggerGate;
use crate::protocol::{handle_sensor_event, parse_firmware_line, FirmwareLine};
use crate::secret_store::PreparedPairingKey;
use crate::serial::{list_touchpass_ports, TouchPassPortKind};
use crate::state::{AdminCommand, AppState};
use crate::types::{
    CommandError, DeviceStatusChange, EnrollStepProgress, ErrorCode, FingerProfile,
    FingerTouchEvent, SensorStatus, TouchStatus, WorkerStatus,
};
use std::collections::VecDeque;
use std::io::{Read, Write};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

pub fn spawn_serial_worker(app: AppHandle, state: AppState) -> AppState {
    let (tx, rx) = mpsc::channel::<AdminCommand>();
    let worker_state = state.with_admin_channel(tx.clone());
    let thread_state = worker_state.clone();
    thread::spawn(move || run_worker(app, thread_state, rx));
    worker_state
}

fn run_worker(app: AppHandle, state: AppState, rx: mpsc::Receiver<AdminCommand>) {
    let mut gate = TriggerGate::new(3.0);
    let mut seen_nonces = VecDeque::new();
    let started = Instant::now();

    loop {
        let ports = list_touchpass_ports();
        let selected = ports.first().cloned();
        let selected_name = selected.as_ref().map(|port| port.name.clone());
        if matches!(
            selected.as_ref().map(|port| port.kind),
            Some(TouchPassPortKind::Bootloader)
        ) {
            update_connection(
                &app,
                &state,
                selected_name,
                Some(TouchPassPortKind::Bootloader),
            );
            reject_pending_commands(&app, &rx, "bootloader");
            thread::sleep(Duration::from_millis(750));
            continue;
        }

        if let Some(port_name) = selected_name {
            let open_result = serialport::new(&port_name, 115_200)
                .timeout(Duration::from_millis(120))
                .open();
            if let Ok(mut port) = open_result {
                update_connection(
                    &app,
                    &state,
                    Some(port_name),
                    selected.as_ref().map(|port| port.kind),
                );
                let _ = port.write_all(b"STATUS\n");
                let mut line = String::new();
                let mut buffer = [0u8; 1];
                let mut enroll_step = 1u8;
                let mut admin_flow = AdminFlow::default();
                let mut pending_delete_reply: Option<
                    mpsc::Sender<Result<FingerProfile, CommandError>>,
                > = None;
                let mut pending_configure_reply: Option<mpsc::Sender<Result<(), CommandError>>> =
                    None;
                let mut pending_pairing_key: Option<PreparedPairingKey> = None;
                let mut pairing_key_sent = false;
                let mut admin_started: Option<Instant> = None;
                let mut last_status = Instant::now();
                let mut last_rx = Instant::now();
                loop {
                    while let Ok(command) = rx.try_recv() {
                        if admin_flow.is_active() {
                            reject_admin_command(Some(&app), command, "admin_busy");
                            continue;
                        }
                        let mut delete_reply = None;
                        let mut configure_reply = None;
                        let (operation, start_result) = match command {
                            AdminCommand::Enroll(slot) => {
                                let needs_setup = state
                                    .status
                                    .lock()
                                    .map(|status| hid_setup_required(&status))
                                    .unwrap_or(true);
                                if needs_setup {
                                    let operation = AdminOperation::ConfigureHid {
                                        enroll_after: Some(slot),
                                    };
                                    let result = state
                                        .secret_store
                                        .prepare_pairing_key("default", false)
                                        .map_err(|_| "persistence_failed".to_string())
                                        .and_then(|prepared| {
                                            let start = admin_flow
                                                .start_hid_configuration(
                                                    hex::encode(&prepared.key),
                                                    Some(slot),
                                                )
                                                .map_err(str::to_string);
                                            if start.is_ok() {
                                                pending_pairing_key = Some(prepared);
                                                pairing_key_sent = false;
                                            }
                                            start
                                        });
                                    (operation, result)
                                } else {
                                    let operation = AdminOperation::Enroll(slot);
                                    let result =
                                        admin_flow.start(operation).map_err(str::to_string);
                                    (operation, result)
                                }
                            }
                            AdminCommand::Delete { slot, reply } => {
                                delete_reply = Some(reply);
                                let operation = AdminOperation::Delete(slot);
                                let result = admin_flow.start(operation).map_err(str::to_string);
                                (operation, result)
                            }
                            AdminCommand::ConfigureHid { rotate, reply } => {
                                configure_reply = Some(reply);
                                let operation = AdminOperation::ConfigureHid { enroll_after: None };
                                let supported = state
                                    .status
                                    .lock()
                                    .map(|status| status.hid_configuration_supported)
                                    .unwrap_or(false);
                                let result = if !supported {
                                    Err("hid_configuration_unsupported".to_string())
                                } else {
                                    state
                                        .secret_store
                                        .prepare_pairing_key("default", rotate)
                                        .map_err(|_| "persistence_failed".to_string())
                                        .and_then(|prepared| {
                                            let start = admin_flow
                                                .start_hid_configuration(
                                                    hex::encode(&prepared.key),
                                                    None,
                                                )
                                                .map_err(str::to_string);
                                            if start.is_ok() {
                                                pending_pairing_key = Some(prepared);
                                                pairing_key_sent = false;
                                            }
                                            start
                                        })
                                };
                                (operation, result)
                            }
                        };
                        match start_result {
                            Ok(unlock) => {
                                pending_delete_reply = delete_reply;
                                pending_configure_reply = configure_reply;
                                if port
                                    .write_all(unlock.as_bytes())
                                    .and_then(|_| port.flush())
                                    .is_err()
                                {
                                    cleanup_prepared_pairing_after_failure(
                                        &state,
                                        &mut pending_pairing_key,
                                        pairing_key_sent,
                                        false,
                                    );
                                    pairing_key_sent = false;
                                    emit_admin_action(
                                        &app,
                                        &state,
                                        AdminFlowAction::Failed {
                                            operation,
                                            reason: "serial_write".to_string(),
                                        },
                                        &mut enroll_step,
                                        &mut pending_delete_reply,
                                        &mut pending_configure_reply,
                                    );
                                    admin_flow.clear();
                                } else {
                                    admin_started = Some(Instant::now());
                                }
                            }
                            Err(reason) => {
                                let mut rejected_delete_reply = delete_reply;
                                let mut rejected_configure_reply = configure_reply;
                                emit_admin_action(
                                    &app,
                                    &state,
                                    AdminFlowAction::Failed {
                                        operation,
                                        reason: reason.to_string(),
                                    },
                                    &mut enroll_step,
                                    &mut rejected_delete_reply,
                                    &mut rejected_configure_reply,
                                )
                            }
                        }
                    }
                    if admin_flow.is_active()
                        && admin_started
                            .is_some_and(|started| admin_operation_timed_out(started.elapsed()))
                    {
                        let rolling_back = admin_flow.is_rolling_back();
                        let action = admin_flow.cancel(if rolling_back {
                            "pairing_in_doubt"
                        } else {
                            "timeout"
                        });
                        cleanup_prepared_pairing_after_failure(
                            &state,
                            &mut pending_pairing_key,
                            pairing_key_sent,
                            rolling_back,
                        );
                        pairing_key_sent = false;
                        emit_admin_action(
                            &app,
                            &state,
                            action,
                            &mut enroll_step,
                            &mut pending_delete_reply,
                            &mut pending_configure_reply,
                        );
                        admin_started = None;
                    }
                    if last_status.elapsed() >= Duration::from_secs(2) {
                        if port.write_all(b"STATUS\n").is_err() {
                            let rolling_back = admin_flow.is_rolling_back();
                            let action = admin_flow.cancel(if rolling_back {
                                "pairing_in_doubt"
                            } else {
                                "connection_lost"
                            });
                            cleanup_prepared_pairing_after_failure(
                                &state,
                                &mut pending_pairing_key,
                                pairing_key_sent,
                                rolling_back,
                            );
                            emit_admin_action(
                                &app,
                                &state,
                                action,
                                &mut enroll_step,
                                &mut pending_delete_reply,
                                &mut pending_configure_reply,
                            );
                            break;
                        }
                        let _ = port.flush();
                        last_status = Instant::now();
                    }
                    match port.read(&mut buffer) {
                        Ok(1) if buffer[0] == b'\n' => {
                            last_rx = Instant::now();
                            let context = LineContext {
                                app: &app,
                                state: &state,
                                gate: &mut gate,
                                seen_nonces: &mut seen_nonces,
                                enroll_step: &mut enroll_step,
                                admin_flow: &mut admin_flow,
                                pending_delete_reply: &mut pending_delete_reply,
                                pending_configure_reply: &mut pending_configure_reply,
                                pending_pairing_key: &mut pending_pairing_key,
                                pairing_key_sent: &mut pairing_key_sent,
                                started,
                            };
                            if let Some(reply) = handle_line(context, line.trim()) {
                                if port
                                    .write_all(reply.as_bytes())
                                    .and_then(|_| port.flush())
                                    .is_err()
                                {
                                    let rolling_back = admin_flow.is_rolling_back();
                                    let action = admin_flow.cancel(if rolling_back {
                                        "pairing_in_doubt"
                                    } else {
                                        "serial_write"
                                    });
                                    cleanup_prepared_pairing_after_failure(
                                        &state,
                                        &mut pending_pairing_key,
                                        pairing_key_sent,
                                        rolling_back,
                                    );
                                    emit_admin_action(
                                        &app,
                                        &state,
                                        action,
                                        &mut enroll_step,
                                        &mut pending_delete_reply,
                                        &mut pending_configure_reply,
                                    );
                                    break;
                                }
                            }
                            if !admin_flow.is_active() {
                                admin_started = None;
                            }
                            line.clear();
                        }
                        Ok(1) => {
                            last_rx = Instant::now();
                            if line.len() < 512 {
                                line.push(buffer[0] as char);
                            }
                        }
                        Ok(_) => {}
                        Err(_) => {
                            if should_disconnect(admin_flow.is_active(), last_rx.elapsed()) {
                                let rolling_back = admin_flow.is_rolling_back();
                                let action = admin_flow.cancel(if rolling_back {
                                    "pairing_in_doubt"
                                } else {
                                    "connection_lost"
                                });
                                cleanup_prepared_pairing_after_failure(
                                    &state,
                                    &mut pending_pairing_key,
                                    pairing_key_sent,
                                    rolling_back,
                                );
                                emit_admin_action(
                                    &app,
                                    &state,
                                    action,
                                    &mut enroll_step,
                                    &mut pending_delete_reply,
                                    &mut pending_configure_reply,
                                );
                                break;
                            }
                        }
                    }
                }
                update_connection(&app, &state, None, None);
            } else {
                reject_pending_commands(&app, &rx, "serial_open");
                update_connection(&app, &state, None, None);
            }
        } else {
            reject_pending_commands(&app, &rx, "sensor_unavailable");
            update_connection(&app, &state, None, None);
        }
        thread::sleep(Duration::from_millis(750));
    }
}

fn should_disconnect(admin_active: bool, silence: Duration) -> bool {
    !admin_active && silence > Duration::from_secs(8)
}

fn admin_operation_timed_out(elapsed: Duration) -> bool {
    elapsed > Duration::from_secs(120)
}

fn hid_setup_required(status: &crate::types::AppStatusResponse) -> bool {
    status.hid_configuration_supported
        && (status.firmware_mode != "hid"
            || !status.hid_key_configured
            || !status.local_pairing_key_configured
            || status.pairing_in_doubt)
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum CommitFailureRecovery {
    RollBack(Vec<u8>),
    KeepPendingInDoubt,
}

fn commit_failure_recovery(prepared: Option<&PreparedPairingKey>) -> CommitFailureRecovery {
    prepared
        .and_then(|candidate| candidate.old_key.clone())
        .map(CommitFailureRecovery::RollBack)
        .unwrap_or(CommitFailureRecovery::KeepPendingInDoubt)
}

fn pairing_is_in_doubt_after_failure(key_sent: bool, rollback_failed: bool) -> bool {
    key_sent || rollback_failed
}

fn cleanup_prepared_pairing_after_failure(
    state: &AppState,
    pending: &mut Option<PreparedPairingKey>,
    key_sent: bool,
    rollback_failed: bool,
) {
    if pending.take().is_none() {
        return;
    }
    let pairing_in_doubt = pairing_is_in_doubt_after_failure(key_sent, rollback_failed);
    if !pairing_in_doubt {
        let _ = state.secret_store.discard_prepared_pairing_key("default");
    }
    if let Ok(mut status) = state.status.lock() {
        status.local_pairing_key_configured = state.secret_store.has_live_pairing_key("default");
        status.pairing_in_doubt =
            pairing_in_doubt || state.secret_store.has_pending_pairing_key("default");
    }
}

fn reject_pending_commands(app: &AppHandle, rx: &mpsc::Receiver<AdminCommand>, reason: &str) {
    while let Ok(command) = rx.try_recv() {
        reject_admin_command(Some(app), command, reason);
    }
}

fn reject_admin_command(app: Option<&AppHandle>, command: AdminCommand, reason: &str) {
    match command {
        AdminCommand::Enroll(finger_id) => {
            if let Some(app) = app {
                emit_enroll_error_with_reason(app, finger_id as u8, reason);
            }
        }
        AdminCommand::Delete { reply, .. } => {
            let _ = reply.send(Err(CommandError::with_detail(
                ErrorCode::HardwareUnavailable,
                reason,
            )));
        }
        AdminCommand::ConfigureHid { reply, .. } => {
            let _ = reply.send(Err(CommandError::with_detail(
                ErrorCode::HardwareUnavailable,
                reason,
            )));
        }
    }
}

struct LineContext<'a> {
    app: &'a AppHandle,
    state: &'a AppState,
    gate: &'a mut TriggerGate,
    seen_nonces: &'a mut VecDeque<String>,
    enroll_step: &'a mut u8,
    admin_flow: &'a mut AdminFlow,
    pending_delete_reply: &'a mut Option<mpsc::Sender<Result<FingerProfile, CommandError>>>,
    pending_configure_reply: &'a mut Option<mpsc::Sender<Result<(), CommandError>>>,
    pending_pairing_key: &'a mut Option<PreparedPairingKey>,
    pairing_key_sent: &'a mut bool,
    started: Instant,
}

fn handle_line(context: LineContext<'_>, line: &str) -> Option<String> {
    let LineContext {
        app,
        state,
        gate,
        seen_nonces,
        enroll_step,
        admin_flow,
        pending_delete_reply,
        pending_configure_reply,
        pending_pairing_key,
        pairing_key_sent,
        started,
    } = context;
    let parsed = parse_firmware_line(line);
    let confirms_expected_mode = matches!(&parsed, FirmwareLine::ModeOk(mode) if mode == "hid")
        && admin_flow.expects_mode_confirmation();
    if confirms_expected_mode
        && pending_pairing_key
            .as_ref()
            .is_some_and(|prepared| prepared.needs_commit)
    {
        if state
            .secret_store
            .commit_prepared_pairing_key("default")
            .is_err()
        {
            if let CommitFailureRecovery::RollBack(old_key) =
                commit_failure_recovery(pending_pairing_key.as_ref())
            {
                if let Ok(command) = admin_flow.begin_hid_rollback(hex::encode(old_key)) {
                    *pairing_key_sent = true;
                    if let Ok(mut status) = state.status.lock() {
                        status.pairing_in_doubt = true;
                    }
                    return Some(command);
                }
            }
            let action = admin_flow.cancel("persistence_failed");
            cleanup_prepared_pairing_after_failure(state, pending_pairing_key, true, false);
            *pairing_key_sent = false;
            emit_admin_action(
                app,
                state,
                action,
                enroll_step,
                pending_delete_reply,
                pending_configure_reply,
            );
            return None;
        }
        pending_pairing_key.take();
        *pairing_key_sent = false;
    }
    let was_rolling_back = admin_flow.is_rolling_back();
    let admin_action = admin_flow.handle(&parsed);
    let confirms_hid_pairing = confirms_expected_mode
        && (matches!(
            &admin_action,
            AdminFlowAction::Write(command) if command.starts_with("ENROLL ")
        ) || matches!(
            &admin_action,
            AdminFlowAction::Completed(AdminOperation::ConfigureHid { .. })
        ));
    if confirms_hid_pairing {
        if let Ok(mut status) = state.status.lock() {
            status.firmware_mode = "hid".to_string();
            status.hid_key_configured = true;
            status.local_pairing_key_configured =
                state.secret_store.has_live_pairing_key("default");
            status.pairing_in_doubt = false;
        }
    }
    if !matches!(admin_action, AdminFlowAction::None) {
        if let AdminFlowAction::Write(command) = &admin_action {
            if command.starts_with("HID_KEY ") && pending_pairing_key.is_some() {
                *pairing_key_sent = true;
            }
            return Some(command.clone());
        }
        if let AdminFlowAction::Failed { reason, .. } = &admin_action {
            if was_rolling_back && reason == "persistence_failed" {
                let _ = state.secret_store.discard_prepared_pairing_key("default");
                pending_pairing_key.take();
                *pairing_key_sent = false;
                if let Ok(mut status) = state.status.lock() {
                    status.local_pairing_key_configured =
                        state.secret_store.has_live_pairing_key("default");
                    status.pairing_in_doubt = false;
                }
            } else {
                cleanup_prepared_pairing_after_failure(
                    state,
                    pending_pairing_key,
                    *pairing_key_sent,
                    was_rolling_back,
                );
                *pairing_key_sent = false;
            }
        }
        emit_admin_action(
            app,
            state,
            admin_action,
            enroll_step,
            pending_delete_reply,
            pending_configure_reply,
        );
        return None;
    }

    match parsed {
        FirmwareLine::Status(status) => {
            let change = if let Ok(mut current) = state.status.lock() {
                current.sensor_status = if status.sensor_ok {
                    SensorStatus::Ok
                } else {
                    SensorStatus::Error
                };
                current.firmware_mode = status.mode;
                current.fingerprint_count = status.fingerprints;
                current.hid_key_configured = status.hid_key_configured;
                current.hid_configuration_supported = status.hid_configuration_supported;
                current.local_pairing_key_configured =
                    state.secret_store.has_live_pairing_key("default");
                current.pairing_in_doubt = state.secret_store.has_pending_pairing_key("default");
                current.background_worker = WorkerStatus::Running;
                Some(DeviceStatusChange {
                    connected: current.connected,
                    port: current.port.clone(),
                    sensor_status: current.sensor_status,
                    firmware_mode: current.firmware_mode.clone(),
                    hid_key_configured: current.hid_key_configured,
                    hid_configuration_supported: current.hid_configuration_supported,
                    local_pairing_key_configured: current.local_pairing_key_configured,
                    pairing_in_doubt: current.pairing_in_doubt,
                })
            } else {
                None
            };
            if let Some(change) = change {
                let _ = app.emit("device_status_change", change);
            }
            None
        }
        FirmwareLine::Prompt(_)
        | FirmwareLine::ConfigUnlockOk
        | FirmwareLine::ConfigUnlockErr(_)
        | FirmwareLine::ConfigLocked
        | FirmwareLine::HidKeyOk
        | FirmwareLine::HidKeyErr(_)
        | FirmwareLine::ModeOk(_)
        | FirmwareLine::ModeErr(_)
        | FirmwareLine::EnrollOk(_)
        | FirmwareLine::EnrollErr { .. }
        | FirmwareLine::DeleteOk(_)
        | FirmwareLine::DeleteErr(_) => None,
        FirmwareLine::Event(event) => {
            let profiles = state.profiles.clone();
            let secret_store = state.secret_store.clone();
            let pairing_key = state.secret_store.pairing_key("default");
            let result = handle_sensor_event(
                &event,
                &pairing_key,
                seen_nonces,
                |slot| profiles.lock().ok()?.get_profile(slot).ok(),
                |reference| secret_store.get(reference),
                gate,
                started.elapsed().as_secs_f64(),
            );
            if let Ok(Some((reply, executed, action_type))) = result {
                let _ = app.emit(
                    "finger_touch_event",
                    FingerTouchEvent {
                        finger_id: event.slot as u8,
                        action_type,
                        status: if executed {
                            TouchStatus::Executed
                        } else {
                            TouchStatus::Armed
                        },
                    },
                );
                return Some(reply);
            }
            None
        }
        FirmwareLine::Other(_) => None,
    }
}

fn update_connection(
    app: &AppHandle,
    state: &AppState,
    port: Option<String>,
    kind: Option<TouchPassPortKind>,
) {
    let connected = port.is_some();
    let sensor_status = match kind {
        Some(TouchPassPortKind::Runtime) => SensorStatus::Checking,
        Some(TouchPassPortKind::Bootloader) => SensorStatus::Bootloader,
        Some(TouchPassPortKind::Candidate) if connected => SensorStatus::Checking,
        _ => SensorStatus::Unavailable,
    };
    let change = if let Ok(mut status) = state.status.lock() {
        let changed = status.connected != connected
            || status.port != port
            || status.sensor_status != sensor_status;
        status.connected = connected;
        status.port = port.clone();
        status.device_id = port.clone();
        status.sensor_status = sensor_status;
        status.firmware_mode = match kind {
            Some(TouchPassPortKind::Runtime) => "checking".to_string(),
            Some(TouchPassPortKind::Bootloader) => "bootloader".to_string(),
            Some(TouchPassPortKind::Candidate) if connected => "unknown".to_string(),
            _ => "unknown".to_string(),
        };
        status.background_worker = WorkerStatus::Running;
        changed.then(|| DeviceStatusChange {
            connected,
            port: port.clone(),
            sensor_status,
            firmware_mode: status.firmware_mode.clone(),
            hid_key_configured: status.hid_key_configured,
            hid_configuration_supported: status.hid_configuration_supported,
            local_pairing_key_configured: status.local_pairing_key_configured,
            pairing_in_doubt: status.pairing_in_doubt,
        })
    } else {
        None
    };
    if let Some(change) = change {
        let _ = app.emit("device_status_change", change);
    }
}

fn emit_enroll_error_with_reason(app: &AppHandle, finger_id: u8, reason: &str) {
    let _ = app.emit(
        "enroll_step_progress",
        EnrollStepProgress {
            finger_id,
            step: 0,
            total: 4,
            message: Some(reason.to_string()),
        },
    );
}

fn emit_admin_action(
    app: &AppHandle,
    state: &AppState,
    action: AdminFlowAction,
    enroll_step: &mut u8,
    pending_delete_reply: &mut Option<mpsc::Sender<Result<FingerProfile, CommandError>>>,
    pending_configure_reply: &mut Option<mpsc::Sender<Result<(), CommandError>>>,
) {
    match action {
        AdminFlowAction::UnlockPrompt => {
            let _ = app.emit(
                "enroll_step_progress",
                EnrollStepProgress {
                    finger_id: 0,
                    step: 1,
                    total: 4,
                    message: Some("unlock_existing".to_string()),
                },
            );
        }
        AdminFlowAction::OperationPrompt(message) => {
            let step = (*enroll_step).min(3);
            let _ = app.emit(
                "enroll_step_progress",
                EnrollStepProgress {
                    finger_id: 0,
                    step,
                    total: 4,
                    message: Some(message.to_ascii_lowercase()),
                },
            );
            *enroll_step = enroll_step.saturating_add(1);
        }
        AdminFlowAction::Completed(AdminOperation::Enroll(slot)) => {
            let persisted = state
                .profiles
                .lock()
                .map_err(|_| CommandError::internal("profile store lock poisoned"))
                .and_then(|profiles| profiles.mark_enrolled(slot));
            if persisted.is_err() {
                emit_enroll_error_with_reason(app, slot as u8, "persistence_failed");
                *enroll_step = 1;
                return;
            }
            let _ = app.emit(
                "enroll_step_progress",
                EnrollStepProgress {
                    finger_id: slot as u8,
                    step: 4,
                    total: 4,
                    message: Some("stored".to_string()),
                },
            );
            *enroll_step = 1;
        }
        AdminFlowAction::Completed(AdminOperation::Delete(slot)) => {
            let result = state
                .profiles
                .lock()
                .map_err(|_| CommandError::internal("profile store lock poisoned"))
                .and_then(|profiles| profiles.reset_profile(slot));
            if let Some(reply) = pending_delete_reply.take() {
                let _ = reply.send(result);
            }
        }
        AdminFlowAction::Completed(AdminOperation::ConfigureHid { .. }) => {
            if let Ok(mut status) = state.status.lock() {
                status.firmware_mode = "hid".to_string();
                status.hid_key_configured = true;
            }
            if let Some(reply) = pending_configure_reply.take() {
                let _ = reply.send(Ok(()));
            }
        }
        AdminFlowAction::Failed { operation, reason } => {
            let slot = match operation {
                AdminOperation::Enroll(slot) | AdminOperation::Delete(slot) => Some(slot),
                AdminOperation::ConfigureHid { enroll_after } => enroll_after,
            };
            if let Some(slot) = slot {
                emit_enroll_error_with_reason(app, slot as u8, &reason);
            }
            if matches!(operation, AdminOperation::Delete(_)) {
                if let Some(reply) = pending_delete_reply.take() {
                    let _ = reply.send(Err(CommandError::with_detail(
                        ErrorCode::HardwareUnavailable,
                        reason.clone(),
                    )));
                }
            }
            if matches!(
                operation,
                AdminOperation::ConfigureHid { enroll_after: None }
            ) {
                if let Some(reply) = pending_configure_reply.take() {
                    let code = if reason == "persistence_failed" {
                        ErrorCode::PersistenceFailed
                    } else {
                        ErrorCode::DeviceConfigurationFailed
                    };
                    let _ = reply.send(Err(CommandError::with_detail(code, reason)));
                }
            }
            *enroll_step = 1;
        }
        AdminFlowAction::None | AdminFlowAction::Write(_) => {}
    }
}

#[cfg(test)]
mod tests {
    use super::{
        admin_operation_timed_out, commit_failure_recovery, hid_setup_required,
        pairing_is_in_doubt_after_failure, reject_admin_command, should_disconnect,
        CommitFailureRecovery,
    };
    use crate::secret_store::PreparedPairingKey;
    use crate::state::AdminCommand;
    use crate::types::{AppStatusResponse, SensorStatus, WorkerStatus};
    use std::sync::mpsc;
    use std::time::Duration;

    #[test]
    fn enrollment_silence_does_not_force_disconnect() {
        assert!(!should_disconnect(true, Duration::from_secs(15)));
        assert!(!should_disconnect(true, Duration::from_secs(60)));
    }

    #[test]
    fn idle_silence_still_detects_lost_connection() {
        assert!(should_disconnect(false, Duration::from_secs(9)));
    }

    #[test]
    fn whole_operation_timeout_allows_the_firmware_worst_case() {
        assert!(!admin_operation_timed_out(Duration::from_secs(90)));
        assert!(!admin_operation_timed_out(Duration::from_secs(120)));
        assert!(admin_operation_timed_out(Duration::from_secs(121)));
    }

    #[test]
    fn queued_delete_is_rejected_when_runtime_port_is_unusable() {
        let (reply_tx, reply_rx) = mpsc::channel();
        reject_admin_command(
            None,
            AdminCommand::Delete {
                slot: 6,
                reply: reply_tx,
            },
            "bootloader",
        );

        let error = reply_rx.recv().unwrap().unwrap_err();
        assert_eq!(error.detail.as_deref(), Some("bootloader"));
    }

    #[test]
    fn hid_bootstrap_is_required_until_mode_and_key_are_ready() {
        let mut status = AppStatusResponse {
            connected: true,
            port: Some("COM9".to_string()),
            device_id: Some("COM9".to_string()),
            sensor_status: SensorStatus::Ok,
            firmware_mode: "piv".to_string(),
            fingerprint_count: 1,
            hid_key_configured: false,
            hid_configuration_supported: true,
            local_pairing_key_configured: false,
            pairing_in_doubt: false,
            background_worker: WorkerStatus::Running,
        };

        assert!(hid_setup_required(&status));
        status.firmware_mode = "hid".to_string();
        assert!(hid_setup_required(&status));
        status.hid_key_configured = true;
        status.local_pairing_key_configured = true;
        assert!(!hid_setup_required(&status));

        status.hid_configuration_supported = false;
        status.local_pairing_key_configured = false;
        assert!(!hid_setup_required(&status));
    }

    #[test]
    fn pairing_failure_ownership_is_conservative_after_device_mutation() {
        assert!(!pairing_is_in_doubt_after_failure(false, false));
        assert!(pairing_is_in_doubt_after_failure(true, false));
        assert!(pairing_is_in_doubt_after_failure(false, true));
    }

    #[test]
    fn commit_failure_rolls_back_only_when_an_old_key_exists() {
        let with_old = PreparedPairingKey {
            key: vec![2; 32],
            old_key: Some(vec![1; 32]),
            needs_commit: true,
        };
        let first_setup = PreparedPairingKey {
            key: vec![2; 32],
            old_key: None,
            needs_commit: true,
        };

        assert_eq!(
            commit_failure_recovery(Some(&with_old)),
            CommitFailureRecovery::RollBack(vec![1; 32])
        );
        assert_eq!(
            commit_failure_recovery(Some(&first_setup)),
            CommitFailureRecovery::KeepPendingInDoubt
        );
    }

    #[test]
    fn queued_hid_configuration_is_rejected_when_runtime_port_is_unusable() {
        let (reply_tx, reply_rx) = mpsc::channel();
        reject_admin_command(
            None,
            AdminCommand::ConfigureHid {
                rotate: false,
                reply: reply_tx,
            },
            "bootloader",
        );

        let error = reply_rx.recv().unwrap().unwrap_err();
        assert_eq!(error.detail.as_deref(), Some("bootloader"));
    }
}
