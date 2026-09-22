import Foundation
import CryptoTokenKit

public struct SmartCardIdentity: Sendable, Equatable {
    public let slotName: String
    public let cardName: String
    public let certificateHash: String?

    public init(slotName: String, cardName: String, certificateHash: String? = nil) {
        self.slotName = slotName
        self.cardName = cardName
        self.certificateHash = certificateHash
    }
}

public actor SmartCardManager {
    private var isObserving = false
    public var onCardStateChanged: (@Sendable (Bool, SmartCardIdentity?) -> Void)?

    public init() {}

    public func startObserving() {
        guard !isObserving else { return }
        isObserving = true

        guard let manager = TKSmartCardSlotManager.default else {
            return
        }

        for slotName in manager.slotNames {
            if let slot = manager.slotNamed(slotName), slot.state == .validCard {
                let identity = SmartCardIdentity(slotName: slotName, cardName: "TouchPass PIV Token")
                onCardStateChanged?(true, identity)
            }
        }
    }

    public static func listPairedIdentities(username: String = NSUserName()) -> [String] {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/sc_auth")
        process.arguments = ["list", username]
        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = Pipe()

        do {
            try process.run()
            process.waitUntilExit()
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            guard let output = String(data: data, encoding: .utf8) else { return [] }
            var hashes: [String] = []
            for line in output.components(separatedBy: .newlines) {
                let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
                if trimmed.count == 40 && trimmed.allSatisfy({ $0.isHexDigit }) {
                    hashes.append(trimmed)
                }
            }
            return hashes
        } catch {
            return []
        }
    }
}
