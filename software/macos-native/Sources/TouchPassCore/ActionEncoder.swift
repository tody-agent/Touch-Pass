import Foundation

public enum ActionType: String, Codable, Sendable, Equatable, CaseIterable {
    case disabled = "disabled"
    case aiAccept = "ai_accept"
    case enter = "enter"
    case escape = "escape"
    case password = "password"
    case custom = "custom"
}

public enum ActionEncoderError: Error, Equatable {
    case passwordMissingSecretRef
    case customPayloadInvalid
    case payloadTooLarge
}

public struct ActionEncoder {
    public static let actionVersion: UInt8 = 1
    public static let maxActionBytes: Int = 256
    public static let opText: UInt8 = 1
    public static let opKey: UInt8 = 2
    public static let opDelay: UInt8 = 3
    public static let keyEnter: UInt8 = 0x28
    public static let keyEscape: UInt8 = 0x29

    public static func textStep(_ bytes: Data) -> Data {
        var step = Data([opText, UInt8(bytes.count)])
        step.append(bytes)
        return step
    }

    public static func keyStep(_ keycode: UInt8, modifier: UInt8 = 0) -> Data {
        return Data([opKey, modifier, keycode])
    }

    public static func delayStep(_ ms: UInt16) -> Data {
        return Data([opDelay, UInt8(ms >> 8), UInt8(ms & 0xFF)])
    }

    public static func encode(
        actionType: ActionType,
        secretRef: String? = nil,
        customPayload: String? = nil,
        secretResolver: (String) throws -> Data
    ) throws -> Data {
        var steps: [Data] = []

        switch actionType {
        case .password:
            guard let refName = secretRef, !refName.isEmpty else {
                throw ActionEncoderError.passwordMissingSecretRef
            }
            let secretData = try secretResolver(refName)
            steps.append(textStep(secretData))
            steps.append(keyStep(keyEnter))

        case .enter:
            steps.append(keyStep(keyEnter))

        case .escape:
            steps.append(keyStep(keyEscape))

        case .aiAccept:
            steps.append(textStep(Data("y".utf8)))
            steps.append(keyStep(keyEnter))

        case .custom:
            guard let payload = customPayload?.trimmingCharacters(in: .whitespacesAndNewlines),
                  !payload.isEmpty,
                  payload.count <= 128,
                  payload.allSatisfy({ $0.isASCII }) else {
                throw ActionEncoderError.customPayloadInvalid
            }
            steps.append(textStep(Data(payload.utf8)))

        case .disabled:
            break
        }

        var out = Data([actionVersion, UInt8(steps.count)])
        for step in steps {
            out.append(step)
        }

        if out.count > maxActionBytes {
            throw ActionEncoderError.payloadTooLarge
        }

        return out
    }
}
