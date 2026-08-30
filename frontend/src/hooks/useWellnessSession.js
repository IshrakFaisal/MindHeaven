import { useEffect, useMemo, useState } from 'react';
import { createSessionClock } from '../lib/wellness';

export function useWellnessSession(durationMs) {
  const clock = useMemo(() => createSessionClock(durationMs), [durationMs]);
  const [snapshot, setSnapshot] = useState(() => clock.snapshot());

  useEffect(() => {
    setSnapshot(clock.snapshot());
    const pauseWhenHidden = () => {
      if (document.hidden) setSnapshot(clock.pause());
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      clock.pause();
      document.removeEventListener('visibilitychange', pauseWhenHidden);
    };
  }, [clock]);

  useEffect(() => {
    if (snapshot.status !== 'running') return undefined;
    const interval = window.setInterval(() => setSnapshot(clock.snapshot()), 100);
    return () => window.clearInterval(interval);
  }, [clock, snapshot.status]);

  return {
    ...snapshot,
    start: () => setSnapshot(clock.start()),
    pause: () => setSnapshot(clock.pause()),
    reset: () => setSnapshot(clock.reset()),
  };
}

export function useSpokenGuidance({ status, cueKey, text }) {
  const [enabled, setEnabled] = useState(false);
  const [voice, setVoice] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return undefined;
    const speech = window.speechSynthesis;
    // Use only a device voice. No journal content or personal information is spoken.
    const loadVoices = () => setVoice(speech.getVoices().find((item) => item.localService && /^en[-_]/i.test(item.lang)) || null);
    loadVoices();
    speech.addEventListener('voiceschanged', loadVoices);
    return () => {
      speech.removeEventListener('voiceschanged', loadVoices);
      speech.cancel();
    };
  }, []);

  useEffect(() => {
    if (!enabled || !voice || status !== 'running') return undefined;
    const speech = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.9;
    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      setError('Voice guidance could not play. You can continue with the written prompts.');
      setEnabled(false);
    };
    speech.cancel();
    speech.speak(utterance);
    return () => {
      utterance.onerror = null;
      speech.cancel();
    };
  }, [enabled, voice, status, cueKey, text]);

  return {
    enabled,
    available: Boolean(voice),
    error,
    toggle: () => { setError(''); setEnabled((current) => !current); },
  };
}
