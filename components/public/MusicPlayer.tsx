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
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-card shadow-lg ${
          playing ? 'animate-spin-slow text-accent' : 'text-text-secondary'
        }`}
        aria-label="Toggle music"
      >
        M
      </button>
      <audio ref={audioRef} src={src} loop />
    </div>
  );
}
