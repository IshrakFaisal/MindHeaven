import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION = 3600;
const ACTION_DURATION = 6500;

export default function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current);
    setToast(null);
  }, []);

  const notify = useCallback((message, options = {}) => {
    window.clearTimeout(timer.current);
    setToast({ message, ...options });
    timer.current = window.setTimeout(
      () => setToast(null),
      options.duration || (options.actionLabel ? ACTION_DURATION : DEFAULT_DURATION),
    );
  }, []);

  const runAction = useCallback(async () => {
    const action = toast?.onAction;
    dismiss();
    if (!action) return;

    try {
      await action();
    } catch (error) {
      notify(error.message || 'That action could not be completed.');
    }
  }, [dismiss, notify, toast]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { dismiss, notify, runAction, toast };
}
