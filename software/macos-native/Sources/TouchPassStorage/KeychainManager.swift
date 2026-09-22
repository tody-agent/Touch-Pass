import Foundation
import Security
import LocalAuthentication

public enum KeychainError: Error, Equatable {
    case statusError(OSStatus)
    case itemNotFound
    case invalidData
}

public struct KeychainManager: Sendable {
    public static let serviceName = "com.touchpass.desktop"
    public static let legacyServiceName = "tinyTouch"
    public static let pairingKeyAccount = "pairing_key"

    public static func savePassword(account: String, secret: String, requireBiometrics: Bool = false) throws {
        var accessControl: SecAccessControl?
        if requireBiometrics {
            var error: Unmanaged<CFError>?
            accessControl = SecAccessControlCreateWithFlags(
                kCFAllocatorDefault,
                kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                [.biometryAny, .or, .userPresence],
                &error
            )
        }

        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: account,
            kSecValueData as String: Data(secret.utf8)
        ]

        if let accessControl {
            query[kSecAttrAccessControl as String] = accessControl
        }

        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.statusError(status)
        }
    }

    public static func getPassword(account: String) throws -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        var status = SecItemCopyMatching(query as CFDictionary, &result)

        // Fallback to legacy service name if not found
        if status == errSecItemNotFound {
            var legacyQuery = query
            legacyQuery[kSecAttrService as String] = legacyServiceName
            status = SecItemCopyMatching(legacyQuery as CFDictionary, &result)
        }

        if status == errSecItemNotFound {
            return nil
        }

        guard status == errSecSuccess, let data = result as? Data, let secret = String(data: data, encoding: .utf8) else {
            throw KeychainError.statusError(status)
        }

        return secret
    }

    public static func deletePassword(account: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: account
        ]
        let status = SecItemDelete(query as CFDictionary)
        if status != errSecSuccess && status != errSecItemNotFound {
            throw KeychainError.statusError(status)
        }
    }

    public static func getPairingKey(deviceAccount: String = pairingKeyAccount) throws -> Data? {
        guard let hex = try getPassword(account: deviceAccount) else {
            return nil
        }
        var data = Data()
        var index = hex.startIndex
        while index < hex.endIndex {
            let nextIndex = hex.index(index, offsetBy: 2)
            if let byte = UInt8(hex[index..<nextIndex], radix: 16) {
                data.append(byte)
            }
            index = nextIndex
        }
        return data.count == 32 ? data : nil
    }

    public static func savePairingKey(deviceAccount: String = pairingKeyAccount, key: Data) throws {
        let hex = key.map { String(format: "%02x", $0) }.joined()
        try savePassword(account: deviceAccount, secret: hex, requireBiometrics: false)
    }
}
