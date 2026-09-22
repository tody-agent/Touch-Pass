import Foundation
import TouchPassCore

public struct FingerProfile: Codable, Equatable, Sendable {
    public var slot: Int
    public var name: String
    public var actionType: ActionType
    public var customPayload: String?
    public var secretRef: String?
    public var requireConfirm: Bool
    public var configured: Bool

    public init(
        slot: Int,
        name: String,
        actionType: ActionType,
        customPayload: String? = nil,
        secretRef: String? = nil,
        requireConfirm: Bool = false,
        configured: Bool = false
    ) {
        self.slot = slot
        self.name = name
        self.actionType = actionType
        self.customPayload = customPayload
        self.secretRef = secretRef
        self.requireConfirm = requireConfirm
        self.configured = configured
    }
}

public struct ProfilesDocument: Codable, Equatable, Sendable {
    public var version: Int
    public var slots: [FingerProfile]

    public init(version: Int = 2, slots: [FingerProfile]) {
        self.version = version
        self.slots = slots
    }

    public static func defaultDocument() -> ProfilesDocument {
        var slots: [FingerProfile] = []
        for s in 1...10 {
            if s == 1 {
                slots.append(FingerProfile(slot: 1, name: "AI Approve", actionType: .aiAccept, requireConfirm: false, configured: true))
            } else if s == 2 {
                slots.append(FingerProfile(slot: 2, name: "OS Password", actionType: .password, secretRef: "default_password", requireConfirm: false, configured: true))
            } else {
                slots.append(FingerProfile(slot: s, name: "Finger \(s)", actionType: .disabled, configured: false))
            }
        }
        return ProfilesDocument(version: 2, slots: slots)
    }
}

public actor ProfileStore {
    private let fileURL: URL
    private let backupURL: URL
    private var document: ProfilesDocument

    public init(storageURL: URL? = nil) {
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let baseDir = storageURL ?? appSupport.appendingPathComponent("TouchPass", isDirectory: true)
        try? FileManager.default.createDirectory(at: baseDir, withIntermediateDirectories: true)

        self.fileURL = baseDir.appendingPathComponent("profiles.json")
        self.backupURL = baseDir.appendingPathComponent("profiles.backup.json")

        if let data = try? Data(contentsOf: fileURL),
           let loaded = try? JSONDecoder().decode(ProfilesDocument.self, from: data) {
            self.document = loaded
        } else if let migrated = MigrationAdapter.migrateLegacyProfilesIfPresent() {
            self.document = migrated
            try? MigrationAdapter.saveDocument(migrated, to: fileURL)
        } else {
            let def = ProfilesDocument.defaultDocument()
            self.document = def
            try? MigrationAdapter.saveDocument(def, to: fileURL)
        }
    }

    public func getAllProfiles() -> [FingerProfile] {
        return document.slots
    }

    public func getProfile(slot: Int) -> FingerProfile? {
        return document.slots.first(where: { $0.slot == slot })
    }

    public func updateProfile(_ profile: FingerProfile) throws {
        if let idx = document.slots.firstIndex(where: { $0.slot == profile.slot }) {
            document.slots[idx] = profile
        } else {
            document.slots.append(profile)
        }
        document.slots.sort(by: { $0.slot < $1.slot })
        try persist()
    }

    public func resetProfile(slot: Int) throws {
        if let idx = document.slots.firstIndex(where: { $0.slot == slot }) {
            document.slots[idx] = FingerProfile(slot: slot, name: "Finger \(slot)", actionType: .disabled, configured: false)
            try persist()
        }
    }

    private func persist() throws {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(document)

        // Write to temp file then replace atomically
        let tempURL = fileURL.deletingLastPathComponent().appendingPathComponent("profiles.tmp")
        try data.write(to: tempURL, options: .atomic)

        // Keep backup
        if FileManager.default.fileExists(atPath: fileURL.path) {
            _ = try? FileManager.default.removeItem(at: backupURL)
            _ = try? FileManager.default.copyItem(at: fileURL, to: backupURL)
        }

        _ = try? FileManager.default.removeItem(at: fileURL)
        try FileManager.default.moveItem(at: tempURL, to: fileURL)
    }
}
