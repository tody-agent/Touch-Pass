export type WorkspaceMode = 'fingers' | 'settings';

export interface InlineEnrollmentState {
  fingerId: number;
  state: 'scanning' | 'success';
  step: number;
  total: number;
  message?: string;
}

export type PendingNavigation =
  | { type: 'finger'; fingerId: number }
  | { type: 'workspace'; mode: WorkspaceMode };

export interface VaultWorkspaceState {
  mode: WorkspaceMode;
  selectedFingerId: number;
  draftDirty: boolean;
  pendingNavigation?: PendingNavigation;
  inlineEnrollment?: InlineEnrollmentState;
}

export function createVaultWorkspaceState(selectedFingerId = 1): VaultWorkspaceState {
  return { mode: 'fingers', selectedFingerId, draftDirty: false };
}

export function requestFingerSelection(state: VaultWorkspaceState, fingerId: number): VaultWorkspaceState {
  if (fingerId === state.selectedFingerId) return state;
  if (state.draftDirty) return { ...state, pendingNavigation: { type: 'finger', fingerId } };
  return { ...state, selectedFingerId: fingerId };
}

export function requestWorkspaceMode(state: VaultWorkspaceState, mode: WorkspaceMode): VaultWorkspaceState {
  if (mode === state.mode) return state;
  if (state.mode === 'fingers' && mode === 'settings' && state.draftDirty) {
    return { ...state, pendingNavigation: { type: 'workspace', mode } };
  }
  return { ...state, mode };
}

export function confirmPendingNavigation(state: VaultWorkspaceState): VaultWorkspaceState {
  if (!state.pendingNavigation) return state;
  const { pendingNavigation } = state;
  const cleared = { ...state, draftDirty: false, pendingNavigation: undefined };
  return pendingNavigation.type === 'finger'
    ? { ...cleared, selectedFingerId: pendingNavigation.fingerId }
    : { ...cleared, mode: pendingNavigation.mode };
}

export function beginInlineEnrollment(state: VaultWorkspaceState, total: number): VaultWorkspaceState {
  return {
    ...state,
    inlineEnrollment: { fingerId: state.selectedFingerId, state: 'scanning', step: 1, total }
  };
}

export function updateInlineEnrollment(
  state: VaultWorkspaceState,
  progress: Pick<InlineEnrollmentState, 'step' | 'total' | 'message'>
): VaultWorkspaceState {
  if (!state.inlineEnrollment) return state;
  return {
    ...state,
    inlineEnrollment: { ...state.inlineEnrollment, ...progress, state: 'scanning' }
  };
}

export function completeInlineEnrollment(state: VaultWorkspaceState): VaultWorkspaceState {
  if (!state.inlineEnrollment) return state;
  return {
    ...state,
    inlineEnrollment: {
      ...state.inlineEnrollment,
      state: 'success',
      step: state.inlineEnrollment.total
    }
  };
}

export function dismissCompletedInlineEnrollment(state: VaultWorkspaceState): VaultWorkspaceState {
  if (state.inlineEnrollment?.state !== 'success') return state;
  return { ...state, inlineEnrollment: undefined };
}
