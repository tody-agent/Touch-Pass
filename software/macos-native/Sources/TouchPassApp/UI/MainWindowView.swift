import SwiftUI
import TouchPassCore

public struct MainWindowView: View {
    @ObservedObject var coordinator: AppCoordinator

    public var body: some View {
        VStack(spacing: 0) {
            // Header TitleBar
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "touchid")
                        .font(.title2)
                        .foregroundStyle(TouchPassTheme.accentBlue)
                    Text("TouchPass")
                        .font(.headline)
                        .fontWeight(.bold)
                }

                Spacer()

                // Connection badge
                HStack(spacing: 6) {
                    Circle()
                        .fill(coordinator.isConnected ? TouchPassTheme.statusGreen : TouchPassTheme.statusAmber)
                        .frame(width: 8, height: 8)
                    Text(coordinator.isConnected ? "Connected (ESP32-S3)" : "Disconnected")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Color.white.opacity(0.05))
                .cornerRadius(12)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(TouchPassTheme.panelBackground)
            .overlay(Divider().opacity(0.5), alignment: .bottom)

            // Main Content Area: HandMap on Left, ActionPane on Right
            HStack(alignment: .top, spacing: 16) {
                VStack(spacing: 16) {
                    HandMapView(coordinator: coordinator)
                    ConsoleView(coordinator: coordinator)
                }
                .frame(maxWidth: .infinity)

                ActionPaneView(coordinator: coordinator)
                    .frame(width: 380)
            }
            .padding(20)
            .background(TouchPassTheme.windowBackground)
        }
        .sheet(isPresented: $coordinator.isEnrolling) {
            EnrollmentWizardView(coordinator: coordinator)
        }
    }
}
