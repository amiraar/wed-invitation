'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

export type MusicPlayerHandle = {
  play: () => void;
  pause: () => void;
};

type Props = {
  src: string;
};

// The parent attempts playback on mount via the imperative handle; if the
// browser blocks autoplay, `play()` falls back to the guest's first tap/key.
const MusicPlayer = forwardRef<MusicPlayerHandle, Props>(function MusicPlayer({ src }, ref) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const attempt = audio.play();
    if (attempt && attempt.catch) {
      attempt.catch(() => {
        // Autoplay was blocked; retry on the guest's first interaction.
        const retry = () => audio.play().catch(() => undefined);
        document.addEventListener('pointerdown', retry, { once: true });
        document.addEventListener('keydown', retry, { once: true });
      });
    }
  };

  const pause = () => {
    audioRef.current?.pause();
  };

  useImperativeHandle(ref, () => ({ play, pause }));

  return (
    <div
      className="fixed right-5 z-50"
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
    >
      <button
        onClick={playing ? pause : play}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          borderColor: playing ? 'var(--accent)' : 'var(--border)',
          color: playing ? 'var(--accent)' : 'var(--text-muted)',
          boxShadow: 'var(--shadow)'
        }}
        aria-label={playing ? 'Pause music' : 'Play music'}
        aria-pressed={playing}
      >
        <span className={`text-base ${playing ? 'animate-spin-slow' : ''}`} aria-hidden>
          ♫
        </span>
        {!playing && (
          <span
            aria-hidden
            className="absolute h-px w-6 -rotate-45"
            style={{ background: 'currentColor' }}
          />
        )}
      </button>
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
});

export default MusicPlayer;
