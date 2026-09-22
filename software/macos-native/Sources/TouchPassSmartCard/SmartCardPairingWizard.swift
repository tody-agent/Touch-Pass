import Foundation

public struct SmartCardPairingWizard {
    public static func pairingCommand(username: String = NSUserName(), identityHash: String) -> String {
        return "sudo sc_auth pair -u \(username) -h \(identityHash)"
    }

    public static func unpairCommand(username: String = NSUserName()) -> String {
        return "sudo sc_auth unpair -u \(username)"
    }

    public static func isUserPaired(username: String = NSUserName()) -> Bool {
        return !SmartCardManager.listPairedIdentities(username: username).isEmpty
    }
}
