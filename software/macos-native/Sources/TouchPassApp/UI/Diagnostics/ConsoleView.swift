import SwiftUI

public struct ConsoleView: View {
    @ObservedObject var coordinator: AppCoordinator

    public var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Label("UART Serial Traffic", systemImage: "terminal")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                Spacer()
                Button("Clear") {
                    coordinator.logs.removeAll()
                }
                .font(.caption2)
                .buttonStyle(.plain)
            }

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 3) {
                        ForEach(Array(coordinator.logs.enumerated()), id: \.offset) { idx, log in
                            Text(log)
                                .font(.system(size: 10, design: .monospaced))
                                .foregroundStyle(log.contains("❌") ? TouchPassTheme.statusRed : log.contains("⚠️") ? TouchPassTheme.statusAmber : .secondary)
                                .id(idx)
                        }
                    }
                }
                .frame(height: 90)
                .padding(8)
                .background(Color.black.opacity(0.4))
                .cornerRadius(8)
                .onChange(of: coordinator.logs.count) { _, _ in
                    if let lastIdx = coordinator.logs.indices.last {
                        proxy.scrollTo(lastIdx, anchor: .bottom)
                    }
                }
            }
        }
    }
}
