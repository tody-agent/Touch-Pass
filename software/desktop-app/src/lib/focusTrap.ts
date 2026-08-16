export function focusTrapTargetIndex(
  currentIndex: number,
  focusableCount: number,
  movingBackward: boolean
): number | null {
  if (focusableCount === 0) return null;
  if (currentIndex < 0) return movingBackward ? focusableCount - 1 : 0;
  if (movingBackward && currentIndex === 0) return focusableCount - 1;
  if (!movingBackward && currentIndex === focusableCount - 1) return 0;
  return null;
}

export const focusableSelector =
  'button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusFirstInDialog(dialog: HTMLElement | undefined): void {
  dialog?.querySelector<HTMLElement>(focusableSelector)?.focus();
}

export function handleDialogKeydown(
  event: KeyboardEvent,
  dialog: HTMLElement | undefined,
  onClose: () => void
): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    onClose();
    return;
  }
  if (event.key !== 'Tab' || !dialog) return;
  const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
  const current = focusable.indexOf(document.activeElement as HTMLElement);
  const targetIndex = focusTrapTargetIndex(current, focusable.length, event.shiftKey);
  if (targetIndex !== null) {
    event.preventDefault();
    focusable[targetIndex].focus();
  }
}
