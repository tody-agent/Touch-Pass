// @vitest-environment jsdom

import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SettingsPane from './SettingsPane.svelte';
import { defaultStatus } from '../lib/types';

function settingsProps() {
  return {
    open: true,
    locale: 'en' as const,
    status: {
      ...defaultStatus(),
      connected: true,
      sensorStatus: 'ok' as const,
      hidConfigurationSupported: true
    },
    autostartEnabled: false,
    autostartLoading: false,
    autostartAvailable: true,
    hidConfigurationLoading: false,
    onLocaleChange: vi.fn(async () => undefined),
    onAutostartChange: vi.fn(async () => undefined),
    onRefresh: vi.fn(async () => undefined),
    onConfigureHid: vi.fn(async (_repair: boolean) => undefined),
    onClose: vi.fn()
  };
}

describe('SettingsPane', () => {
  it('renders a full three-pane settings workspace without dialog semantics', () => {
    render(SettingsPane, { props: settingsProps() });

    expect(screen.getByRole('navigation', { name: 'Settings navigation' })).toBeTruthy();
    expect(screen.getByRole('main', { name: 'General' })).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'Device and privacy status' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'General' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Device' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Security' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Developer' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('switches categories and keeps live device actions available', async () => {
    const user = userEvent.setup();
    const props = settingsProps();
    render(SettingsPane, { props });

    await user.click(screen.getByRole('button', { name: 'Device' }));
    expect(screen.getByRole('main', { name: 'Device' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Refresh status' }));
    expect(props.onRefresh).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Developer' }));
    expect(screen.getByText('Diagnostic information')).toBeTruthy();
  });

  it('offers HID configuration when unified firmware is not ready', async () => {
    const user = userEvent.setup();
    const props = settingsProps();
    props.status.firmwareMode = 'piv';
    props.status.hidKeyConfigured = false;
    render(SettingsPane, { props });

    await user.click(screen.getByRole('button', { name: 'Device' }));
    await user.click(screen.getByRole('button', { name: 'Configure HID mode' }));

    expect(props.onConfigureHid).toHaveBeenCalledWith(false);
  });

  it('confirms before rotating an existing HID pairing key', async () => {
    const user = userEvent.setup();
    const props = settingsProps();
    props.status.firmwareMode = 'hid';
    props.status.hidKeyConfigured = true;
    props.status.localPairingKeyConfigured = true;
    render(SettingsPane, { props });

    await user.click(screen.getByRole('button', { name: 'Device' }));
    await user.click(screen.getByRole('button', { name: 'Repair HID pairing' }));
    expect(screen.getByRole('alertdialog', { name: 'Replace the HID pairing key?' })).toBeTruthy();
    expect(props.onConfigureHid).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Replace key' }));
    expect(props.onConfigureHid).toHaveBeenCalledWith(true);
  });

  it('does not offer repair for Arduino firmware with a compiled HID key', async () => {
    const user = userEvent.setup();
    const props = settingsProps();
    props.status.firmwareMode = 'hid';
    props.status.hidKeyConfigured = true;
    props.status.hidConfigurationSupported = false;
    render(SettingsPane, { props });

    await user.click(screen.getByRole('button', { name: 'Device' }));
    expect(screen.queryByRole('button', { name: 'Repair HID pairing' })).toBeNull();
    expect(screen.getByText('Setup required')).toBeTruthy();
    expect(screen.getByText(/embedded in Arduino firmware/i)).toBeTruthy();
  });

  it('recovers a staged pairing key through the confirmed repair path', async () => {
    const user = userEvent.setup();
    const props = settingsProps();
    props.status.firmwareMode = 'hid';
    props.status.hidKeyConfigured = true;
    props.status.localPairingKeyConfigured = true;
    props.status.pairingInDoubt = true;
    render(SettingsPane, { props });

    await user.click(screen.getByRole('button', { name: 'Device' }));
    expect(screen.getByText(/pairing is incomplete/i)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Repair HID pairing' }));
    await user.click(screen.getByRole('button', { name: 'Replace key' }));

    expect(props.onConfigureHid).toHaveBeenCalledWith(true);
  });

  it('requests locale changes and renders the localized workspace after rerender', async () => {
    const user = userEvent.setup();
    const props = settingsProps();
    const { rerender } = render(SettingsPane, { props });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'vi');
    expect(props.onLocaleChange).toHaveBeenCalledWith('vi');
    await rerender({ locale: 'vi' });

    expect(screen.getByRole('navigation', { name: 'Điều hướng cài đặt' })).toBeTruthy();
    expect(screen.getByRole('main', { name: 'Chung' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Ngôn ngữ' })).toBeTruthy();
  });

  it('requests autostart changes in both directions', async () => {
    const user = userEvent.setup();
    const props = settingsProps();
    render(SettingsPane, { props });

    await user.click(screen.getByRole('button', { name: 'Security' }));
    const autostart = screen.getByRole('checkbox', { name: 'Open TouchPass at login' });
    await user.click(autostart);
    await user.click(autostart);

    expect(props.onAutostartChange).toHaveBeenNthCalledWith(1, true);
    expect(props.onAutostartChange).toHaveBeenNthCalledWith(2, false);
  });

  it('does not close when a higher-priority handler has handled Escape', () => {
    const props = settingsProps();
    render(SettingsPane, { props });
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    escape.preventDefault();

    window.dispatchEvent(escape);

    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('closes when Escape is not handled by a higher-priority control', () => {
    const props = settingsProps();
    render(SettingsPane, { props });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('closes with Back and restores the opener focus after closing', async () => {
    const user = userEvent.setup();
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const props = settingsProps();
    const { rerender } = render(SettingsPane, { props });

    const back = await screen.findByRole('button', { name: 'Back' });
    expect(document.activeElement).toBe(back);
    await user.click(back);
    expect(props.onClose).toHaveBeenCalledOnce();

    await rerender({ open: false });
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
