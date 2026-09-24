// @vitest-environment jsdom

import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import OnboardingModal from './OnboardingModal.svelte';
import { defaultProfiles, defaultStatus } from '../lib/types';

function onboardingProps(overrides: Record<string, any> = {}) {
  return {
    open: true,
    locale: 'vi' as const,
    status: {
      ...defaultStatus(),
      connected: true,
      port: '/dev/cu.usbmodem1101',
      sensorStatus: 'ok' as const,
      firmwareMode: 'hid'
    },
    profiles: defaultProfiles(),
    autostartEnabled: false,
    autostartLoading: false,
    autostartAvailable: true,
    inlineEnrollment: undefined,
    onRefresh: vi.fn(async () => undefined),
    onSaveProfile: vi.fn(async (p, _s) => ({ ...p, configured: true, secretConfigured: true })),
    onEnroll: vi.fn(async (_id) => undefined),
    onAutostartChange: vi.fn(async (_enabled) => undefined),
    onApplyRecommendedPresets: vi.fn(async () => undefined),
    onClose: vi.fn(),
    onComplete: vi.fn(),
    onTestUnlock: vi.fn(),
    ...overrides
  };
}

describe('OnboardingModal', () => {
  it('renders Step 1 (Connect & Diagnose) on launch with full hardware diagnostics', async () => {
    const user = userEvent.setup();
    const props = onboardingProps();
    render(OnboardingModal, { props });

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Hướng dẫn cài đặt TouchPass')).toBeTruthy();
    expect(screen.getByText('Thiết bị đã kết nối sẵn sàng')).toBeTruthy();
    expect(screen.getAllByText('/dev/cu.usbmodem1101').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Chẩn đoán phần cứng')).toBeTruthy();

    // Recheck connection
    const recheckBtn = screen.getByRole('button', { name: /Kiểm tra lại kết nối/i });
    await user.click(recheckBtn);
    expect(props.onRefresh).toHaveBeenCalledOnce();

    // Toggle troubleshooting accordion
    const troubleshootBtn = screen.getByRole('button', { name: /Mẹo khắc phục sự cố kết nối/i });
    expect(troubleshootBtn).toBeTruthy();
    await user.click(troubleshootBtn);
    expect(screen.getByText(/Cáp lỏng hoặc cáp sạc thuần/i)).toBeTruthy();
  });

  it('navigates through step 1 to step 2 focusing on Mac Unlock', async () => {
    const user = userEvent.setup();
    const props = onboardingProps();
    render(OnboardingModal, { props });

    const nextBtn = screen.getByRole('button', { name: /Tiếp tục/i });
    await user.click(nextBtn);

    // Step 2 content
    expect(screen.getByText('Mở khóa Mac bằng vân tay')).toBeTruthy();
    expect(screen.getByLabelText(/Mật khẩu máy Mac/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Lưu & Quét vân tay/i })).toBeTruthy();
  });

  it('validates password requirement and triggers save & enroll on Step 2', async () => {
    const user = userEvent.setup();
    const props = onboardingProps();
    render(OnboardingModal, { props });

    // Go to step 2
    await user.click(screen.getByRole('button', { name: /Tiếp tục/i }));

    // Try clicking enroll without entering password
    const enrollBtn = screen.getByRole('button', { name: /Lưu & Quét vân tay/i });
    await user.click(enrollBtn);
    expect(screen.getByText('Nhập mật khẩu trước khi lưu tác vụ này.')).toBeTruthy();
    expect(props.onSaveProfile).not.toHaveBeenCalled();

    // Enter password and submit
    const passwordInput = screen.getByLabelText(/Mật khẩu máy Mac/i);
    await user.type(passwordInput, 'MySecretMac123');
    await user.click(enrollBtn);

    expect(props.onSaveProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, actionType: 'password' }),
      'MySecretMac123'
    );
    expect(props.onEnroll).toHaveBeenCalledWith(7);
  });

  it('displays live enrollment progress during Step 2 scan', async () => {
    const user = userEvent.setup();
    const props = onboardingProps({
      inlineEnrollment: {
        fingerId: 7,
        state: 'scanning',
        step: 2,
        total: 4,
        message: 'touch_again'
      }
    });
    render(OnboardingModal, { props });

    // Switch to step 2 by clicking navigation pill
    const step2Pill = screen.getByRole('button', { name: /2.*Mở khóa Mac/i });
    await user.click(step2Pill);

    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.getByText('Bước 2/4')).toBeTruthy();
    expect(screen.getByText(/Đặt lại cùng ngón tay lên cảm biến/i)).toBeTruthy();
  });

  it('displays completion and allows testing unlock once enrolled', async () => {
    const user = userEvent.setup();
    const configuredProfiles = defaultProfiles().map((p) =>
      p.id === 7 ? { ...p, actionType: 'password' as const, configured: true, secretConfigured: true } : p
    );
    const props = onboardingProps({ profiles: configuredProfiles });
    render(OnboardingModal, { props });

    // Go to step 2
    await user.click(screen.getByRole('button', { name: /2.*Mở khóa Mac/i }));

    expect(screen.getByText(/Đã liên kết vân tay thành công/i)).toBeTruthy();
    const testBtn = screen.getByRole('button', { name: /Thử nghiệm mở khóa/i });
    await user.click(testBtn);
    expect(props.onTestUnlock).toHaveBeenCalledWith(7);
  });

  it('suggests superpowers and AI presets on Step 3 and applies them', async () => {
    const user = userEvent.setup();
    const props = onboardingProps();
    render(OnboardingModal, { props });

    // Jump directly to step 3
    await user.click(screen.getByRole('button', { name: /3.*Phím tắt & AI/i }));

    expect(screen.getByText('Siêu năng lực cho các ngón tay còn lại')).toBeTruthy();
    expect(screen.getByText('AI Coding')).toBeTruthy();
    expect(screen.getByText('macOS Fast')).toBeTruthy();
    expect(screen.getByText('Developer')).toBeTruthy();

    const applyBtn = screen.getByRole('button', { name: /Áp dụng cấu hình gợi ý/i });
    await user.click(applyBtn);

    expect(props.onApplyRecommendedPresets).toHaveBeenCalledOnce();
    expect(screen.getAllByText('Đã áp dụng cấu hình gợi ý!').length).toBeGreaterThanOrEqual(1);
  });

  it('presents health summary and autostart toggle on Step 4 and finishes onboarding', async () => {
    const user = userEvent.setup();
    const props = onboardingProps();
    render(OnboardingModal, { props });

    // Jump to step 4
    await user.click(screen.getByRole('button', { name: /4.*Sẵn sàng/i }));

    expect(screen.getByText('Sẵn sàng trải nghiệm TouchPass!')).toBeTruthy();
    expect(screen.getByText('100% Local')).toBeTruthy();

    // Toggle autostart
    const autostartSwitch = screen.getByRole('checkbox', { name: /Khởi động TouchPass khi đăng nhập Mac/i });
    await user.click(autostartSwitch);
    expect(props.onAutostartChange).toHaveBeenCalledWith(true);

    // Click finish
    const finishBtn = screen.getByRole('button', { name: /Bắt đầu sử dụng TouchPass/i });
    await user.click(finishBtn);
    expect(props.onComplete).toHaveBeenCalledOnce();
  });

  it('allows skipping onboarding at any point via skip button or close button', async () => {
    const user = userEvent.setup();
    const props = onboardingProps();
    render(OnboardingModal, { props });

    const skipBtn = screen.getByRole('button', { name: 'Bỏ qua thiết lập' });
    await user.click(skipBtn);
    expect(props.onClose).toHaveBeenCalledOnce();

    const closeBtn = screen.getByRole('button', { name: 'Đóng' });
    await user.click(closeBtn);
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  it('renders localized copy in English and Chinese', () => {
    const enProps = onboardingProps({ locale: 'en' });
    const { rerender } = render(OnboardingModal, { props: enProps });

    expect(screen.getByText('TouchPass Setup Guide')).toBeTruthy();
    expect(screen.getByText('Device connected and ready')).toBeTruthy();
    expect(screen.getByText('Hardware diagnostics')).toBeTruthy();

    rerender({ locale: 'zh-CN' });
    expect(screen.getByText('TouchPass 设置指南')).toBeTruthy();
    expect(screen.getByText('设备已连接并就绪')).toBeTruthy();
    expect(screen.getByText('硬件诊断')).toBeTruthy();
  });
});
