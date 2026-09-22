import Foundation

public struct StatusLine: Equatable, Sendable {
    public let mode: String
    public let sensorOk: Bool
    public let fingerprints: Int
    public let hidKeyConfigured: Bool
    public let hidConfigurationSupported: Bool

    public init(mode: String, sensorOk: Bool, fingerprints: Int, hidKeyConfigured: Bool, hidConfigurationSupported: Bool) {
        self.mode = mode
        self.sensorOk = sensorOk
        self.fingerprints = fingerprints
        self.hidKeyConfigured = hidKeyConfigured
        self.hidConfigurationSupported = hidConfigurationSupported
    }
}

public struct SensorEvent: Equatable, Sendable {
    public let nonce: String
    public let counter: String
    public let slot: Int
    public let score: String
    public let mac: String

    public init(nonce: String, counter: String, slot: Int, score: String, mac: String) {
        self.nonce = nonce
        self.counter = counter
        self.slot = slot
        self.score = score
        self.mac = mac
    }
}

public enum FirmwareLine: Equatable, Sendable {
    case status(StatusLine)
    case prompt(String)
    case configUnlockOk
    case configUnlockErr(String)
    case configLocked
    case hidKeyOk
    case hidKeyErr(String)
    case modeOk(String)
    case modeErr(String)
    case enrollOk(Int)
    case enrollErr(slot: Int, stage: String?, confirm: UInt8?)
    case deleteOk(Int)
    case deleteErr(Int)
    case event(SensorEvent)
    case other(String)
}

public struct TouchPassProtocol {
    public static func parseFirmwareLine(_ line: String) -> FirmwareLine {
        let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)

        if trimmed.hasPrefix("OK STATUS") {
            let mode = tokenValue(trimmed, key: "mode") ?? "unknown"
            let fingerprints = Int(tokenValue(trimmed, key: "fingerprints") ?? "") ?? 0
            let hidKeyConfigured = tokenValue(trimmed, key: "hid_key") == "configured"
            let keys = tokenValue(trimmed, key: "keys")
            let hidConfigurationSupported = (keys == "nvs" || keys == "unconfigured")
            let sensorOk = trimmed.contains("sensor=ok")

            return .status(StatusLine(
                mode: mode,
                sensorOk: sensorOk,
                fingerprints: fingerprints,
                hidKeyConfigured: hidKeyConfigured,
                hidConfigurationSupported: hidConfigurationSupported
            ))
        }

        if trimmed.hasPrefix("PROMPT ") {
            let prompt = String(trimmed.dropFirst(7))
            return .prompt(prompt)
        }

        if trimmed.hasPrefix("OK CONFIG_UNLOCK") {
            return .configUnlockOk
        }

        if trimmed.hasPrefix("ERR CONFIG_UNLOCK ") {
            let reason = String(trimmed.dropFirst(18))
            return .configUnlockErr(reason)
        }

        if trimmed.hasPrefix("ERR CONFIG_LOCKED") {
            return .configLocked
        }

        if trimmed.hasPrefix("OK HID_KEY") {
            return .hidKeyOk
        }

        if trimmed.hasPrefix("ERR HID_KEY") {
            let reason = String(trimmed.dropFirst(11)).trimmingCharacters(in: .whitespaces)
            return .hidKeyErr(reason)
        }

        if trimmed.hasPrefix("OK MODE") {
            let mode = tokenValue(trimmed, key: "mode") ?? "unknown"
            return .modeOk(mode)
        }

        if trimmed.hasPrefix("ERR MODE") {
            let mode = tokenValue(trimmed, key: "mode") ?? "unknown"
            return .modeErr(mode)
        }

        if trimmed.hasPrefix("OK ENROLL") {
            let slot = slotFromLine(trimmed)
            return .enrollOk(slot)
        }

        if trimmed.hasPrefix("ERR ENROLL") {
            let slot = slotFromLine(trimmed)
            let stage = tokenValue(trimmed, key: "stage")
            let confirm = tokenValue(trimmed, key: "confirm").flatMap { UInt8($0, radix: 16) }
            return .enrollErr(slot: slot, stage: stage, confirm: confirm)
        }

        if trimmed.hasPrefix("OK DELETE") {
            let slot = slotFromLine(trimmed)
            return .deleteOk(slot)
        }

        if trimmed.hasPrefix("ERR DELETE") {
            let slot = slotFromLine(trimmed)
            return .deleteErr(slot)
        }

        if trimmed.hasPrefix("EV ") {
            let parts = trimmed.split(separator: " ").map(String.init)
            if parts.count == 6, let slot = Int(parts[3]) {
                return .event(SensorEvent(
                    nonce: parts[1],
                    counter: parts[2],
                    slot: slot,
                    score: parts[4],
                    mac: parts[5]
                ))
            }
        }

        return .other(trimmed)
    }

    private static func tokenValue(_ line: String, key: String) -> String? {
        let prefix = "\(key)="
        for part in line.split(separator: " ") {
            if part.hasPrefix(prefix) {
                return String(part.dropFirst(prefix.count))
            }
        }
        return nil
    }

    private static func slotFromLine(_ line: String) -> Int {
        if let slotStr = tokenValue(line, key: "slot"), let s = Int(slotStr) {
            return s
        }
        let parts = line.split(separator: " ")
        if parts.count >= 3, let s = Int(parts[2]) {
            return s
        }
        return 0
    }
}
