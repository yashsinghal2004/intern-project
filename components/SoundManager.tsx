'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface SoundManagerContextType {
  playPegHit: () => void;
  playLanding: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const SoundManagerContext = createContext<SoundManagerContextType | null>(null);

export function SoundManagerProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    const initAudio = () => {
      if (!audioContext) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          setAudioContext(ctx);
        } catch (e) {
          console.warn('AudioContext not supported');
        }
      }
    };

    const events = ['click', 'touchstart', 'keydown'];
    events.forEach((event) => {
      document.addEventListener(event, initAudio, { once: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, initAudio);
      });
    };
  }, [audioContext]);

  const playPegHit = useCallback(() => {
    if (isMuted || !audioContext) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
    }
  }, [isMuted, audioContext]);

  const playLanding = useCallback(() => {
    if (isMuted || !audioContext) return;

    try {
      const frequencies = [523.25, 659.25, 783.99];
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        const startTime = audioContext.currentTime + index * 0.1;
        gainNode.gain.setValueAtTime(0.15, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      });
    } catch (e) {
    }
  }, [isMuted, audioContext]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return (
    <SoundManagerContext.Provider
      value={{ playPegHit, playLanding, isMuted, toggleMute }}
    >
      {children}
    </SoundManagerContext.Provider>
  );
}

export function useSoundManager() {
  const context = useContext(SoundManagerContext);
  if (!context) {
    throw new Error('useSoundManager must be used within SoundManagerProvider');
  }
  return context;
}

