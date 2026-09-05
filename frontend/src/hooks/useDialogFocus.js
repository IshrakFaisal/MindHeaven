import { useEffect } from 'react';

// Keep keyboard navigation inside an open dialog and return focus on close.
export default function useDialogFocus(ref, open) {
  useEffect(() => {
    if (!open || !ref.current) return undefined;
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const focusable = () => [...dialog.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
    )].filter((element) => element.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => {
      const first = dialog.querySelector('input:not([type="checkbox"]):not([disabled])') || focusable()[0] || dialog;
      first.focus({ preventScroll: true });
    });
    const handleTab = (event) => {
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (!dialog.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleTab);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open, ref]);
}
