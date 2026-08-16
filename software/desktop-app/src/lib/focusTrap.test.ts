import { describe, expect, it } from 'vitest';
import { focusTrapTargetIndex } from './focusTrap';

describe('focusTrapTargetIndex', () => {
  it('wraps forward from the last focusable element', () => {
    expect(focusTrapTargetIndex(3, 4, false)).toBe(0);
  });

  it('wraps backward from the first focusable element', () => {
    expect(focusTrapTargetIndex(0, 4, true)).toBe(3);
  });

  it('keeps normal browser tab order away from the boundaries', () => {
    expect(focusTrapTargetIndex(1, 4, false)).toBeNull();
    expect(focusTrapTargetIndex(2, 4, true)).toBeNull();
  });

  it('moves focus into the dialog when focus starts outside it', () => {
    expect(focusTrapTargetIndex(-1, 4, false)).toBe(0);
    expect(focusTrapTargetIndex(-1, 4, true)).toBe(3);
  });

  it('does nothing when the dialog has no focusable controls', () => {
    expect(focusTrapTargetIndex(-1, 0, false)).toBeNull();
  });
});
