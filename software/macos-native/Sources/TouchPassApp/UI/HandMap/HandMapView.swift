import SwiftUI
import TouchPassCore
import TouchPassStorage

public struct HandMapView: View {
    @ObservedObject var coordinator: AppCoordinator

    public var body: some View {
        VStack(spacing: 20) {
            Text("10-Finger Biometric Map")
                .font(.headline)
                .foregroundStyle(.secondary)

            HStack(spacing: 40) {
                // Left Hand: Pinky 10, Ring 9, Middle 8, Index 7, Thumb 6
                VStack(spacing: 12) {
                    Text("Left Hand")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.tertiary)

                    HStack(alignment: .bottom, spacing: 10) {
                        fingerButton(slot: 10, name: "Pinky", height: 75)
                        fingerButton(slot: 9, name: "Ring", height: 105)
                        fingerButton(slot: 8, name: "Middle", height: 120)
                        fingerButton(slot: 7, name: "Index", height: 100)
                        fingerButton(slot: 6, name: "Thumb", height: 65)
                    }
                }

                // Right Hand: Thumb 1, Index 2, Middle 3, Ring 4, Pinky 5
                VStack(spacing: 12) {
                    Text("Right Hand")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.tertiary)

                    HStack(alignment: .bottom, spacing: 10) {
                        fingerButton(slot: 1, name: "Thumb", height: 65)
                        fingerButton(slot: 2, name: "Index", height: 100)
                        fingerButton(slot: 3, name: "Middle", height: 120)
                        fingerButton(slot: 4, name: "Ring", height: 105)
                        fingerButton(slot: 5, name: "Pinky", height: 75)
                    }
                }
            }
            .padding(.vertical, 16)
        }
        .padding()
        .background(TouchPassTheme.cardBackground)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouchPassTheme.cardBorder, lineWidth: 1))
    }

    @ViewBuilder
    private func fingerButton(slot: Int, name: String, height: CGFloat) -> some View {
        let isSelected = coordinator.selectedSlot == slot
        let isTouched = coordinator.activeTouchSlot == slot
        let profile = coordinator.profiles.first(where: { $0.slot == slot })
        let isConfigured = profile?.configured ?? false

        Button {
            coordinator.selectSlot(slot)
        } label: {
            VStack(spacing: 6) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(
                            isSelected ? TouchPassTheme.accentBlue.opacity(0.2) :
                            isConfigured ? Color.white.opacity(0.08) : Color.white.opacity(0.03)
                        )
                        .frame(width: 44, height: height)
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(
                                    isTouched ? TouchPassTheme.statusGreen :
                                    isSelected ? TouchPassTheme.accentBlue :
                                    isConfigured ? Color.white.opacity(0.2) : Color.white.opacity(0.06),
                                    lineWidth: isTouched ? 3 : isSelected ? 2 : 1
                                )
                        )
                        .scaleEffect(isTouched ? 1.08 : 1.0)
                        .animation(.spring(response: 0.25, dampingFraction: 0.6), value: isTouched)

                    VStack(spacing: 4) {
                        Image(systemName: isTouched ? "touchid" : isConfigured ? "lock.open.fill" : "lock.fill")
                            .font(.system(size: 14))
                            .foregroundStyle(
                                isTouched ? TouchPassTheme.statusGreen :
                                isSelected ? TouchPassTheme.accentBlue :
                                isConfigured ? .primary : .secondary
                            )

                        Text("\(slot)")
                            .font(.system(size: 11, weight: .bold, design: .monospaced))
                            .foregroundStyle(.secondary)
                    }
                }

                Text(name)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(isSelected ? TouchPassTheme.accentBlue : .secondary)
            }
        }
        .buttonStyle(.plain)
    }
}
