import SwiftUI

public struct EnrollmentWizardView: View {
    @ObservedObject var coordinator: AppCoordinator

    public var body: some View {
        VStack(spacing: 24) {
            Text("Biometric Fingerprint Enrollment")
                .font(.headline)

            ZStack {
                Circle()
                    .stroke(TouchPassTheme.accentBlue.opacity(0.3), lineWidth: 4)
                    .frame(width: 120, height: 120)

                Circle()
                    .stroke(TouchPassTheme.accentBlue, lineWidth: 2)
                    .frame(width: 90, height: 90)

                Image(systemName: "touchid")
                    .font(.system(size: 48))
                    .foregroundStyle(TouchPassTheme.accentBlue)
            }
            .padding()

            VStack(spacing: 8) {
                Text(coordinator.enrollPrompt ?? "Initializing hardware sensor...")
                    .font(.subheadline)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.primary)

                Text("Touch sensor repeatedly when prompted until enrollment completes.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 16) {
                Button("Cancel") {
                    Task {
                        await coordinator.cancelEnrollment()
                    }
                }
                .keyboardShortcut(.cancelAction)
            }
        }
        .padding(32)
        .frame(width: 380, height: 360)
    }
}
