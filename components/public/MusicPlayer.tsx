'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  autoplay: boolean;
};

export default function MusicPlayer({ src, autoplay }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!autoplay || !src) return;
    const onFirstInteraction = () => {
      audioRef.current?.play().then(() => setPlaying(true)).catch(() => undefined);
      window.removeEventListener('click', onFirstInteraction);
    };
    window.addEventListener('click', onFirstInteraction);
    return () => window.removeEventListener('click', onFirstInteraction);
  }, [autoplay, src]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => undefined);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={toggle}
        className={`flex h-11 w-11 items-center justify-center rounded-full border text-xs uppercase tracking-widest transition-all duration-300 ${playing ? 'animate-spin-slow' : ''}`}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: playing ? 'var(--accent)' : 'var(--text-muted)',
          boxShadow: 'var(--shadow)'
        }}
        aria-label="Toggle music"
      >
        <span style={{ fontSize: '14px' }}>♫</span>
      </button>
      <audio ref={audioRef} src={src} loop />
    </div>
  );
}
