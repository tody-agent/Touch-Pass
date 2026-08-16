// @vitest-environment jsdom

import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  beginInlineEnrollment,
  completeInlineEnrollment,
  confirmPendingNavigation,
  createVaultWorkspaceState,
  dismissCompletedInlineEnrollment,
  requestFingerSelection,
  requestWorkspaceMode,
  updateInlineEnrollment
} from './vaultWorkspaceState';
import VaultWorkspacePaneHarness from './VaultWorkspacePaneHarness.svelte';

describe('Vault Workspace state', () => {
  it('guards a dirty draft before navigating to another finger', () => {
    const dirty = { ...createVaultWorkspaceState(2), draftDirty: true };

    const guarded = requestFingerSelection(dirty, 7);

    expect(guarded.selectedFingerId).toBe(2);
    expect(guarded.pendingNavigation).toEqual({ type: 'finger', fingerId: 7 });
    expect(confirmPendingNavigation(guarded)).toMatchObject({
      selectedFingerId: 7,
      draftDirty: false,
      pendingNavigation: undefined
    });
  });

  it('guards a dirty draft before opening settings', () => {
    const dirty = { ...createVaultWorkspaceState(2), draftDirty: true };

    const guarded = requestWorkspaceMode(dirty, 'settings');

    expect(guarded).toMatchObject({
      mode: 'fingers',
      pendingNavigation: { type: 'workspace', mode: 'settings' }
    });
    expect(confirmPendingNavigation(guarded)).toMatchObject({ mode: 'settings', draftDirty: false });
  });

  it('transitions between the finger workspace and settings after navigation is allowed', () => {
    const fingers = createVaultWorkspaceState(4);
    const settings = requestWorkspaceMode(fingers, 'settings');

    expect(settings).toMatchObject({ mode: 'settings', selectedFingerId: 4 });
    expect(requestWorkspaceMode(settings, 'fingers')).toMatchObject({ mode: 'fingers', selectedFingerId: 4 });
  });

  it('synchronizes every rendered workspace pane after selecting a finger', async () => {
    const user = userEvent.setup();
    render(VaultWorkspacePaneHarness);

    expect(screen.getByTestId('navigator-finger').textContent).toBe('3');
    expect(screen.getByTestId('editor-finger').textContent).toBe('3');
    expect(screen.getByTestId('inspector-finger').textContent).toBe('3');

    await user.click(screen.getByRole('button', { name: 'Select finger 9' }));

    expect(screen.getByTestId('navigator-finger').textContent).toBe('9');
    expect(screen.getByTestId('editor-finger').textContent).toBe('9');
    expect(screen.getByTestId('inspector-finger').textContent).toBe('9');
  });

  it('tracks enrollment inline for the selected inspector and completes it', () => {
    const enrolling = beginInlineEnrollment(createVaultWorkspaceState(6), 4);
    const progressing = updateInlineEnrollment(enrolling, { step: 2, total: 4, message: 'remove_finger' });

    expect(progressing.inlineEnrollment).toEqual({
      fingerId: 6,
      state: 'scanning',
      step: 2,
      total: 4,
      message: 'remove_finger'
    });
    expect(completeInlineEnrollment(progressing).inlineEnrollment).toMatchObject({ state: 'success', step: 4 });
  });

  it('dismisses completed enrollment feedback without interrupting a scan', () => {
    const scanning = beginInlineEnrollment(createVaultWorkspaceState(6), 4);
    const complete = completeInlineEnrollment(scanning);

    expect(dismissCompletedInlineEnrollment(scanning).inlineEnrollment?.state).toBe('scanning');
    expect(dismissCompletedInlineEnrollment(complete).inlineEnrollment).toBeUndefined();
  });
});
