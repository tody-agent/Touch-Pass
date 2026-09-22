import Foundation
import SwiftUI
import TouchPassCore
import TouchPassSerial
import TouchPassStorage
import TouchPassSmartCard

@MainActor
public final class AppCoordinator: ObservableObject {
    @Published public var isConnected = false
    @Published public var devicePath: String = ""
    @Published public var status: StatusLine?
    @Published public var profiles: [FingerProfile] = []
    @Published public var selectedSlot: Int = 1
    @Published public var activeTouchSlot: Int? = nil
    @Published public var enrollPrompt: String? = nil
    @Published public var isEnrolling: Bool = false
    @Published public var logs: [String] = []

    private let serialManager = SerialManager()
    private let profileStore = ProfileStore()
    private let smartCardManager = SmartCardManager()
    private var triggerGate = TriggerGate(windowSeconds: 3.0)
    private let replayFilter = NonceReplayFilter(capacity: 64)
    private var pairingKey: Data = Data(repeating: 0x41, count: 32)

    public var selectedProfile: FingerProfile? {
        profiles.first(where: { $0.slot == selectedSlot })
    }

    public var menuBarIcon: String {
        if !isConnected {
            return "touchid.slash"
        }
        if activeTouchSlot != nil {
            return "touchid.badge.checkmark"
        }
        return "touchid"
    }

    public init() {
        Task {
            await initialize()
        }
    }

    public func initialize() async {
        self.profiles = await profileStore.getAllProfiles()
        if let storedKey = try? KeychainManager.getPairingKey() {
            self.pairingKey = storedKey
        }

        await serialManager.start()

        await serialManager.setCallbacks(
            onConnectionChanged: { [weak self] connected, device in
                Task { @MainActor [weak self] in
                    guard let self else { return }
                    self.isConnected = connected
                    self.devicePath = device?.path ?? ""
                    self.log("Device connection changed: \(connected ? "Connected" : "Disconnected") (\(device?.path ?? "none"))")
                }
            },
            onStatusUpdated: { [weak self] statusLine in
                Task { @MainActor [weak self] in
                    guard let self else { return }
                    self.status = statusLine
                    self.log("Status updated: mode=\(statusLine.mode), fingerprints=\(statusLine.fingerprints)")
                }
            },
            onSensorEventReceived: { [weak self] event in
                Task { @MainActor [weak self] in
                    await self?.handleSensorEvent(event)
                }
            },
            onEnrollPrompt: { [weak self] prompt in
                Task { @MainActor [weak self] in
                    guard let self else { return }
                    self.enrollPrompt = prompt
                    self.log("Enrollment prompt: \(prompt)")
                }
            },
            onRawLineReceived: { [weak self] line in
                Task { @MainActor [weak self] in
                    self?.log("<< \(line)")
                }
            }
        )

        await smartCardManager.startObserving()
    }

    public func selectSlot(_ slot: Int) {
        self.selectedSlot = slot
    }

    public func saveProfile(_ profile: FingerProfile) async {
        do {
            try await profileStore.updateProfile(profile)
            self.profiles = await profileStore.getAllProfiles()
            log("Saved profile for slot \(profile.slot): \(profile.name)")
        } catch {
            log("Error saving profile: \(error)")
        }
    }

    public func resetProfile(slot: Int) async {
        do {
            try await profileStore.resetProfile(slot: slot)
            self.profiles = await profileStore.getAllProfiles()
            log("Reset profile for slot \(slot)")
        } catch {
            log("Error resetting profile: \(error)")
        }
    }

    public func startEnrollment(slot: Int) async {
        self.isEnrolling = true
        self.enrollPrompt = "Place finger on sensor..."
        try? await serialManager.sendCommand("ENROLL \(slot)")
    }

    public func cancelEnrollment() async {
        self.isEnrolling = false
        self.enrollPrompt = nil
    }

    public func deleteHardwareSlot(slot: Int) async {
        try? await serialManager.sendCommand("DELETE \(slot)")
    }

    public func switchFirmwareMode(_ mode: String) async {
        try? await serialManager.sendCommand("MODE \(mode)")
    }

    private func handleSensorEvent(_ event: SensorEvent) async {
        // 1. Verify replay
        let isFresh = await replayFilter.validateAndRecord(nonce: event.nonce)
        guard isFresh else {
            log("⚠️ Replay attack detected for nonce \(event.nonce)")
            return
        }

        // 2. Animate visual touch feedback
        self.activeTouchSlot = event.slot
        Task {
            try? await Task.sleep(nanoseconds: 600_000_000)
            if self.activeTouchSlot == event.slot {
                self.activeTouchSlot = nil
            }
        }

        // 3. Resolve profile
        guard let profile = profiles.first(where: { $0.slot == event.slot }), profile.configured else {
            log("Ignored touch on unconfigured slot \(event.slot)")
            return
        }

        // 4. Gate decision (Double-touch safety)
        let decision = triggerGate.touch(slot: event.slot, requireConfirm: profile.requireConfirm, nowSeconds: Date().timeIntervalSince1970)
        switch decision {
        case .armed:
            log("Armed slot \(event.slot), waiting for second touch confirmation...")
            let expiresMs: UInt64 = 3000
            let mac = TouchPassCrypto.hmacSHA256Hex(key: pairingKey, message: "ARM|\(event.nonce)|\(event.slot)|\(expiresMs)")
            let armCmd = "ARM \(event.nonce) \(event.slot) \(expiresMs) \(mac)"
            try? await serialManager.sendCommand(armCmd)

        case .execute:
            log("Executing action for slot \(event.slot) (\(profile.actionType.rawValue))...")
            do {
                let payload = try ActionEncoder.encode(
                    actionType: profile.actionType,
                    secretRef: profile.secretRef,
                    customPayload: profile.customPayload
                ) { secretRef in
                    let pw = (try? KeychainManager.getPassword(account: secretRef)) ?? ""
                    return Data(pw.utf8)
                }

                let sessionKey = TouchPassCrypto.deriveSessionKey(pairingKey: pairingKey, nonce: event.nonce)
                let (ivHex, cipherHex) = try TouchPassCrypto.encryptAESCTR(key: sessionKey, nonce: event.nonce, plaintext: payload)
                let replyMac = TouchPassCrypto.hmacSHA256Hex(key: pairingKey, message: "ACT|\(event.nonce)|\(ivHex)|\(cipherHex)")
                let actCmd = "ACT \(event.nonce) \(ivHex) \(cipherHex) \(replyMac)"
                try? await serialManager.sendCommand(actCmd)
            } catch {
                log("❌ Failed to encode/execute action: \(error)")
            }
        }
    }

    private func log(_ message: String) {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        let timestamp = formatter.string(from: Date())
        logs.append("[\(timestamp)] \(message)")
        if logs.count > 100 {
            logs.removeFirst()
        }
    }
}
