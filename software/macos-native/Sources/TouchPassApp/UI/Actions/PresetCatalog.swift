import Foundation
import TouchPassCore

public enum PresetCategory: String, CaseIterable, Identifiable, Sendable {
    case aiAgent = "AI Agent Superpowers"
    case macNavigation = "macOS Shortcuts"
    case developer = "Terminal Automation"
    case securityKeys = "Security & Basic Keys"

    public var id: String { rawValue }
}

public struct PresetItem: Identifiable, Sendable, Equatable {
    public let id: String
    public let name: String
    public let detail: String
    public let category: PresetCategory
    public let actionType: ActionType
    public let customPayload: String?
    public let iconName: String
    public let badge: String

    public init(id: String, name: String, detail: String, category: PresetCategory, actionType: ActionType, customPayload: String? = nil, iconName: String, badge: String) {
        self.id = id
        self.name = name
        self.detail = detail
        self.category = category
        self.actionType = actionType
        self.customPayload = customPayload
        self.iconName = iconName
        self.badge = badge
    }
}

public struct PresetCatalog {
    public static let allPresets: [PresetItem] = [
        // AI Agent
        PresetItem(id: "ai_accept", name: "Approve AI Prompt", detail: "Types 'y' followed by Enter", category: .aiAgent, actionType: .aiAccept, iconName: "checkmark.circle.fill", badge: "y + ↵"),
        PresetItem(id: "ai_reject", name: "Reject AI Prompt", detail: "Types 'n' followed by Enter", category: .aiAgent, actionType: .custom, customPayload: "n", iconName: "xmark.circle.fill", badge: "n + ↵"),
        PresetItem(id: "claude_compact", name: "Claude Context Compact", detail: "Reduces context tokens with /compact", category: .aiAgent, actionType: .custom, customPayload: "/compact", iconName: "arrow.triangle.2.circlepath", badge: "/compact"),
        PresetItem(id: "antigravity_plan", name: "Antigravity Plan Mode", detail: "Switches agent to /plan architecture", category: .aiAgent, actionType: .custom, customPayload: "/plan", iconName: "doc.text.magnifyingglass", badge: "/plan"),
        PresetItem(id: "antigravity_grill", name: "Antigravity Clarification", detail: "Launches /grill-me interactive interview", category: .aiAgent, actionType: .custom, customPayload: "/grill-me", iconName: "bubble.left.and.bubble.right.fill", badge: "/grill-me"),

        // macOS Shortcuts
        PresetItem(id: "mac_switch", name: "Switch Applications", detail: "Cycles open apps", category: .macNavigation, actionType: .custom, customPayload: "Cmd+Tab", iconName: "macwindow.on.rectangle", badge: "⌘ + Tab"),
        PresetItem(id: "mac_spotlight", name: "Spotlight Search", detail: "Opens macOS system search", category: .macNavigation, actionType: .custom, customPayload: "Cmd+Space", iconName: "magnifyingglass", badge: "⌘ + Space"),
        PresetItem(id: "mac_mission", name: "Mission Control", detail: "Shows overview of all open spaces", category: .macNavigation, actionType: .custom, customPayload: "Ctrl+Up", iconName: "square.grid.2x2", badge: "⌃ + ↑"),

        // Terminal
        PresetItem(id: "git_status", name: "Git Status", detail: "Checks working branch status", category: .developer, actionType: .custom, customPayload: "git status", iconName: "terminal.fill", badge: "git status"),
        PresetItem(id: "git_diff", name: "Git Diff", detail: "Shows uncommitted changes", category: .developer, actionType: .custom, customPayload: "git diff", iconName: "plus.forwardslash.minus", badge: "git diff"),
        PresetItem(id: "terminal_clear", name: "Clear Terminal Screen", detail: "Clears scrollback buffer", category: .developer, actionType: .custom, customPayload: "clear", iconName: "trash", badge: "clear"),
        PresetItem(id: "docker_ps", name: "Docker Containers", detail: "Lists active docker instances", category: .developer, actionType: .custom, customPayload: "docker ps", iconName: "shippingbox.fill", badge: "docker ps"),

        // Security & Keys
        PresetItem(id: "sec_password", name: "Fill macOS Sudo Password", detail: "Secure Keychain payload unsealed by touch", category: .securityKeys, actionType: .password, iconName: "key.fill", badge: "Keychain"),
        PresetItem(id: "key_enter", name: "Press Enter Key", detail: "Sends physical Enter keystroke", category: .securityKeys, actionType: .enter, iconName: "return", badge: "↵"),
        PresetItem(id: "key_escape", name: "Press Escape Key", detail: "Sends physical Escape keystroke", category: .securityKeys, actionType: .escape, iconName: "escape", badge: "esc")
    ]
}
