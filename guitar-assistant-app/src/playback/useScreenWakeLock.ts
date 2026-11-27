import { useEffect, useState } from 'react';

export function useScreenWakeLock(isPlaying: boolean): string {
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setNotice('');
    if (!isPlaying) return;

    if (!navigator.wakeLock) {
      setNotice(window.isSecureContext
        ? 'This browser may let the screen sleep during playback.'
        : 'Open the app over HTTPS to keep the screen on during playback.');
      return;
    }

    let lock: WakeLockSentinel | undefined;
    let generation = 0;
    const unavailable = 'Your device may let the screen sleep during playback.';

    const release = () => {
      // A pending request can finish after the tab is hidden or playback ends.
      generation++;
      if (lock) {
        lock.onrelease = null;
        void lock.release();
        lock = undefined;
      }
    };

    const syncVisibility = async () => {
      release();
      if (document.visibilityState !== 'visible') return;

      const requestGeneration = generation;
      try {
        const acquired = await navigator.wakeLock.request('screen');
        if (requestGeneration !== generation) {
          await acquired.release();
          return;
        }
        lock = acquired;
        lock.onrelease = () => setNotice(unavailable);
        setNotice(lock.released ? unavailable : '');
      } catch {
        if (requestGeneration === generation) setNotice(unavailable);
      }
    };

    void syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
      release();
    };
  }, [isPlaying]);

  return isPlaying ? notice : '';
}
