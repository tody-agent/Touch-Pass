import SwiftUI
import TouchPassCore
import TouchPassStorage

public final class ActionEditorState: ObservableObject {
    @Published public var name: String = ""
    @Published public var actionType: ActionType = .aiAccept
    @Published public var customPayload: String = ""
    @Published public var passwordSecret: String = ""
    @Published public var requireTouchID: Bool = false
    @Published public var requireConfirm: Bool = false
    @Published public var showPresets: Bool = false

    public init() {}

    public func sync(with profile: FingerProfile?) {
        guard let profile else { return }
        self.name = profile.name
        self.actionType = profile.actionType
        self.customPayload = profile.customPayload ?? ""
        self.requireConfirm = profile.requireConfirm
        if let ref = profile.secretRef, let pw = try? KeychainManager.getPassword(account: ref) {
            self.passwordSecret = pw
        } else {
            self.passwordSecret = ""
        }
    }
}

public struct ActionPaneView: View {
    @ObservedObject var coordinator: AppCoordinator
    @StateObject private var editorState = ActionEditorState()

    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Slot \(coordinator.selectedSlot) Action")
                        .font(.title3)
                        .fontWeight(.bold)
                    Text("Assign hardware superpower to this finger")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()

                Button {
                    editorState.showPresets = true
                } label: {
                    Label("Presets", systemImage: "sparkles")
                        .font(.subheadline)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(TouchPassTheme.accentBlue.opacity(0.15))
                        .foregroundStyle(TouchPassTheme.accentBlue)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }

            Divider().opacity(0.4)

            // Name Field
            VStack(alignment: .leading, spacing: 6) {
                Text("Action Name")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                TextField("e.g. Approve AI Prompt", text: $editorState.name)
                    .textFieldStyle(.roundedBorder)
            }

            // Action Type Picker
            VStack(alignment: .leading, spacing: 6) {
                Text("Trigger Superpower")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Picker("Action Type", selection: $editorState.actionType) {
                    Text("AI Approve (y + ↵)").tag(ActionType.aiAccept)
                    Text("Fill OS Password").tag(ActionType.password)
                    Text("Custom Keystroke / Text").tag(ActionType.custom)
                    Text("Enter Key (↵)").tag(ActionType.enter)
                    Text("Escape Key (esc)").tag(ActionType.escape)
                    Text("Disabled").tag(ActionType.disabled)
                }
                .pickerStyle(.menu)
            }

            // Password Specific
            if editorState.actionType == .password {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Saved Password (OS Keychain)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    SecureField("Enter password to store in Keychain", text: $editorState.passwordSecret)
                        .textFieldStyle(.roundedBorder)

                    Toggle(isOn: $editorState.requireTouchID) {
                        Text("Require Mac Touch ID before unsealing")
                            .font(.caption)
                    }
                    .toggleStyle(.checkbox)
                }
                .padding(10)
                .background(Color.white.opacity(0.02))
                .cornerRadius(8)
            }

            // Custom Payload
            if editorState.actionType == .custom {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Payload (ASCII Text)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    TextField("e.g. git status, Cmd+Tab, /compact", text: $editorState.customPayload)
                        .textFieldStyle(.roundedBorder)
                }
            }

            // Safety Gate Toggle
            Toggle(isOn: $editorState.requireConfirm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Double-Touch Safety Guard")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    Text("Requires tapping twice within 3.0s to execute")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .toggleStyle(.switch)

            Spacer()

            // Action Buttons
            HStack(spacing: 12) {
                Button {
                    Task {
                        await saveCurrentProfile()
                    }
                } label: {
                    Text("Save Action")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(TouchPassTheme.accentBlue)
                        .foregroundStyle(.black)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)

                Button {
                    Task {
                        await coordinator.startEnrollment(slot: coordinator.selectedSlot)
                    }
                } label: {
                    Label("Enroll", systemImage: "touchid")
                        .font(.subheadline)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)

                Button {
                    Task {
                        await coordinator.resetProfile(slot: coordinator.selectedSlot)
                        editorState.sync(with: coordinator.selectedProfile)
                    }
                } label: {
                    Image(systemName: "trash")
                        .padding(8)
                        .background(Color.white.opacity(0.05))
                        .foregroundStyle(.secondary)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(20)
        .background(TouchPassTheme.panelBackground)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouchPassTheme.cardBorder, lineWidth: 1))
        .onAppear {
            editorState.sync(with: coordinator.selectedProfile)
        }
        .onChange(of: coordinator.selectedSlot) { _, _ in
            editorState.sync(with: coordinator.selectedProfile)
        }
        .sheet(isPresented: $editorState.showPresets) {
            presetSheet
        }
    }

    private func saveCurrentProfile() async {
        var secretRef: String? = nil
        if editorState.actionType == .password {
            secretRef = "slot_\(coordinator.selectedSlot)_secret"
            if !editorState.passwordSecret.isEmpty {
                try? KeychainManager.savePassword(account: secretRef!, secret: editorState.passwordSecret, requireBiometrics: editorState.requireTouchID)
            }
        }

        let updated = FingerProfile(
            slot: coordinator.selectedSlot,
            name: editorState.name.isEmpty ? "Finger \(coordinator.selectedSlot)" : editorState.name,
            actionType: editorState.actionType,
            customPayload: editorState.actionType == .custom ? editorState.customPayload : nil,
            secretRef: secretRef,
            requireConfirm: editorState.requireConfirm,
            configured: editorState.actionType != .disabled
        )
        await coordinator.saveProfile(updated)
    }

    private var presetSheet: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Select Shortcut Preset")
                    .font(.headline)
                Spacer()
                Button("Done") { editorState.showPresets = false }
            }

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    ForEach(PresetCategory.allCases) { category in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(category.rawValue)
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundStyle(TouchPassTheme.accentBlue)

                            let presets = PresetCatalog.allPresets.filter { $0.category == category }
                            ForEach(presets) { preset in
                                Button {
                                    applyPreset(preset)
                                    editorState.showPresets = false
                                } label: {
                                    HStack {
                                        Image(systemName: preset.iconName)
                                            .frame(width: 24)
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(preset.name).font(.subheadline).fontWeight(.medium)
                                            Text(preset.detail).font(.caption2).foregroundStyle(.secondary)
                                        }
                                        Spacer()
                                        Text(preset.badge)
                                            .font(.caption2)
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(Color.white.opacity(0.08))
                                            .cornerRadius(4)
                                    }
                                    .padding(8)
                                    .background(Color.white.opacity(0.03))
                                    .cornerRadius(8)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .frame(width: 440, height: 500)
    }

    private func applyPreset(_ preset: PresetItem) {
        editorState.name = preset.name
        editorState.actionType = preset.actionType
        editorState.customPayload = preset.customPayload ?? ""
    }
}
