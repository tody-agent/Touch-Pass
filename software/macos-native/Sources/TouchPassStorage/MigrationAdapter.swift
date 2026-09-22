import Foundation

public struct MigrationAdapter {
    public static func legacyProfileURL() -> URL? {
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let legacyPath = appSupport.appendingPathComponent("tinyTouch", isDirectory: true).appendingPathComponent("profiles.json")
        return FileManager.default.fileExists(atPath: legacyPath.path) ? legacyPath : nil
    }

    public static func migrateLegacyProfilesIfPresent() -> ProfilesDocument? {
        guard let url = legacyProfileURL(), let data = try? Data(contentsOf: url) else {
            return nil
        }
        // Try decoding directly if already matches format
        if let doc = try? JSONDecoder().decode(ProfilesDocument.self, from: data) {
            return doc
        }
        return nil
    }

    public static func saveDocument(_ doc: ProfilesDocument, to url: URL) throws {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(doc)
        try data.write(to: url, options: .atomic)
    }
}
