// @vitest-environment jsdom

import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import HandMap from './HandMap.svelte';
import ActionPane from './ActionPane.svelte';
import DeviceInspector from './DeviceInspector.svelte';
import { translate } from '../lib/i18n';
import { defaultProfiles, defaultStatus, previewProfiles } from '../lib/types';

describe('HandMap', () => {
  it('exposes all fingers through one accessible navigator', () => {
    render(HandMap, {
      locale: 'en',
      profiles: defaultProfiles(),
      selectedId: 1,
      onSelect: () => undefined
    });

    const navigator = screen.getByRole('navigation', { name: translate('en', 'handMap.title') });

    expect(navigator.getAttribute('aria-label')).toBe(translate('en', 'handMap.title'));
    expect(screen.getAllByRole('button')).toHaveLength(10);
  });

  it('does not select another finger while enrollment locks navigation', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(HandMap, {
      locale: 'en',
      profiles: defaultProfiles(),
      selectedId: 1,
      locked: true,
      onSelect
    });

    const secondFinger = screen.getByRole('button', { name: 'Left index finger' });
    expect(secondFinger.hasAttribute('disabled')).toBe(true);
    await user.click(secondFinger);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('resets its local draft when the confirmed discard revision changes', async () => {
    const user = userEvent.setup();
    const props = {
      locale: 'en' as const,
      profile: defaultProfiles()[0],
      saving: false,
      deviceConnected: true,
      resetRevision: 0,
      interactionLocked: false,
      onSave: vi.fn(async () => defaultProfiles()[0]),
      onEnroll: vi.fn(async () => undefined),
      onReset: vi.fn(async () => undefined),
      onTest: vi.fn(async () => undefined),
      onDirtyChange: vi.fn()
    };
    const { rerender } = render(ActionPane, { props });

    const radios = screen.getAllByRole('radio');
    await user.click(radios[1]);
    expect(radios[1].getAttribute('aria-checked')).toBe('true');

    await rerender({ resetRevision: 1 });

    expect(screen.getAllByRole('radio')[2].getAttribute('aria-checked')).toBe('true');
  });

  it('locks editor save and rescan controls during enrollment', async () => {
    const user = userEvent.setup();
    const onEnroll = vi.fn(async () => undefined);
    const profile = defaultProfiles()[0];
    render(ActionPane, {
      locale: 'en',
      profile,
      saving: false,
      deviceConnected: true,
      resetRevision: 0,
      interactionLocked: true,
      onSave: vi.fn(async () => profile),
      onEnroll,
      onReset: vi.fn(async () => undefined),
      onTest: vi.fn(async () => undefined),
      onDirtyChange: vi.fn()
    });

    const primary = screen.getByRole('button', { name: translate('en', 'button.saveAndEnroll') });
    const more = screen.getByRole('button', { name: translate('en', 'button.more') });
    expect(primary.hasAttribute('disabled')).toBe(true);
    expect(more.hasAttribute('disabled')).toBe(true);
    await user.click(more);
    expect(onEnroll).not.toHaveBeenCalled();
  });

  it('does not rescan through a stale menu element after enrollment locks', async () => {
    const user = userEvent.setup();
    const onEnroll = vi.fn(async () => undefined);
    const profile = defaultProfiles()[0];
    const { rerender } = render(ActionPane, {
      locale: 'en',
      profile,
      saving: false,
      deviceConnected: true,
      resetRevision: 0,
      interactionLocked: false,
      onSave: vi.fn(async () => profile),
      onEnroll,
      onReset: vi.fn(async () => undefined),
      onTest: vi.fn(async () => undefined),
      onDirtyChange: vi.fn()
    });

    await user.click(screen.getByRole('button', { name: translate('en', 'button.more') }));
    const rescan = screen.getByRole('menuitem', { name: translate('en', 'button.rescan') });
    await rerender({ interactionLocked: true });

    rescan.click();
    expect(onEnroll).not.toHaveBeenCalled();
  });

  it('does not emit a parent dirty transition while synchronizing profile props', async () => {
    const profile = defaultProfiles()[0];
    const onDirtyChange = vi.fn();
    const { rerender } = render(ActionPane, {
      locale: 'en',
      profile,
      saving: false,
      deviceConnected: true,
      resetRevision: 0,
      interactionLocked: false,
      onSave: vi.fn(async () => profile),
      onEnroll: vi.fn(async () => undefined),
      onReset: vi.fn(async () => undefined),
      onTest: vi.fn(async () => undefined),
      onDirtyChange
    });

    await tick();
    expect(onDirtyChange).not.toHaveBeenCalled();

    await rerender({ resetRevision: 1 });
    await tick();
    expect(onDirtyChange).not.toHaveBeenCalled();
  });

  it('uses one tab stop and arrow keys to select action presets', async () => {
    const user = userEvent.setup();
    const profile = defaultProfiles()[0];
    render(ActionPane, {
      locale: 'en', profile, saving: false, deviceConnected: true, resetRevision: 0,
      interactionLocked: false, onSave: vi.fn(async () => profile), onEnroll: vi.fn(async () => undefined),
      onReset: vi.fn(async () => undefined), onTest: vi.fn(async () => undefined), onDirtyChange: vi.fn()
    });

    const radios = screen.getAllByRole('radio');
    expect(radios.filter((radio) => radio.tabIndex === 0)).toHaveLength(1);
    radios[2].focus();
    await user.keyboard('{ArrowDown}');
    expect(radios[3].getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(radios[3]);
  });

  it('disables rescan while an action draft is dirty', async () => {
    const user = userEvent.setup();
    const profile = previewProfiles()[1];
    const onEnroll = vi.fn(async () => undefined);
    render(ActionPane, {
      locale: 'en', profile, saving: false, deviceConnected: true, resetRevision: 0,
      interactionLocked: false, draftDirty: true, onSave: vi.fn(async () => profile), onEnroll,
      onReset: vi.fn(async () => undefined), onTest: vi.fn(async () => undefined), onDirtyChange: vi.fn()
    });

    await user.click(screen.getByRole('button', { name: translate('en', 'button.more') }));
    expect(screen.getByRole('menuitem', { name: translate('en', 'button.rescan') }).hasAttribute('disabled')).toBe(true);
    expect(onEnroll).not.toHaveBeenCalled();
  });

  it('announces inline enrollment progress with progressbar semantics', () => {
    const profile = defaultProfiles()[0];
    render(DeviceInspector, {
      locale: 'en',
      status: { ...defaultStatus(), connected: true, sensorStatus: 'ok' },
      profile,
      enrollment: { fingerId: 1, state: 'scanning', step: 2, total: 4, message: 'lift' },
      deviceReady: true,
      onEnroll: vi.fn(async () => undefined)
    });

    expect(screen.getByRole('status').textContent).toContain('Linking Left thumb');
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('2');
    expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('4');
  });
});
