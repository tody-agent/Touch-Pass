// @vitest-environment jsdom

import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SettingsPane from './SettingsPane.svelte';
import { defaultStatus } from '../lib/types';

function settingsProps() {
  return {
    open: true,
    locale: 'vi' as const,
    status: { ...defaultStatus(), connected: true, sensorStatus: 'ok' as const },
    autostartEnabled: false,
    autostartLoading: false,
    autostartAvailable: true,
    onLocaleChange: vi.fn(async () => undefined),
    onAutostartChange: vi.fn(async () => undefined),
    onRefresh: vi.fn(async () => undefined),
    onClose: vi.fn()
  };
}

describe('SettingsPane', () => {
  it('traps focus, closes with Escape, and restores the opener focus', async () => {
    const user = userEvent.setup();
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const props = settingsProps();
    const { rerender } = render(SettingsPane, { props });
    const dialog = await screen.findByRole('dialog', { name: 'Cài đặt' });
    const close = screen.getByRole('button', { name: 'Đóng' });

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(close);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Thông tin chẩn đoán/ }));
    await user.keyboard('{Escape}');
    expect(props.onClose).toHaveBeenCalledOnce();

    await rerender({ open: false });
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('requests a locale change and renders the new language immediately', async () => {
    const user = userEvent.setup();
    const props = settingsProps();
    const { rerender } = render(SettingsPane, { props });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ngôn ngữ' }), 'en');
    expect(props.onLocaleChange).toHaveBeenCalledWith('en');
    await rerender({ locale: 'en' });

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeTruthy();
  });
});
