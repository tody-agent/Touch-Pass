import SwiftUI

public struct MenuBarView: View {
    @ObservedObject var coordinator: AppCoordinator
    @Environment(\.openWindow) private var openWindow

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Circle()
                    .fill(coordinator.isConnected ? TouchPassTheme.statusGreen : TouchPassTheme.statusAmber)
                    .frame(width: 8, height: 8)
                Text(coordinator.isConnected ? "TouchPass Active" : "Waiting for Device")
                    .font(.caption)
                    .fontWeight(.semibold)
                Spacer()
                if let mode = coordinator.status?.mode {
                    Text(mode.uppercased())
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(4)
                }
            }

            Divider()

            // Quick finger summary
            VStack(alignment: .leading, spacing: 4) {
                Text("Enrolled Shortcuts")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                ForEach(coordinator.profiles.filter { $0.configured }.prefix(4), id: \.slot) { p in
                    HStack {
                        Text("Slot \(p.slot):")
                            .font(.caption2)
                            .fontWeight(.medium)
                        Text(p.name)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Divider()

            Button {
                openWindow(id: "main-window")
                NSApp.activate(ignoringOtherApps: true)
            } label: {
                Label("Open Dashboard", systemImage: "macwindow")
                    .font(.caption)
            }
            .buttonStyle(.plain)

            Button {
                NSApplication.shared.terminate(nil)
            } label: {
                Label("Quit TouchPass", systemImage: "power")
                    .font(.caption)
                    .foregroundStyle(TouchPassTheme.statusRed)
            }
            .buttonStyle(.plain)
        }
        .padding(12)
        .frame(width: 240)
    }
}
