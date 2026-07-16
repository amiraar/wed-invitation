'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

export type MusicPlayerHandle = {
  play: () => void;
  pause: () => void;
};

type Props = {
  src: string;
};

// Playback is started by the parent (via the imperative handle) inside the
// "open invitation" tap, so mobile autoplay policies are satisfied.
const MusicPlayer = forwardRef<MusicPlayerHandle, Props>(function MusicPlayer({ src }, ref) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    audioRef.current?.play().catch(() => undefined);
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
        aria-label={playing ? 'Jeda musik' : 'Putar musik'}
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
