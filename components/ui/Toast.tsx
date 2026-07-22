'use client';

type Props = {
  message: string;
  variant?: 'success' | 'error';
};

export default function Toast({ message, variant = 'success' }: Props) {
  if (!message) return null;
  return (
    <div
      className="rounded-2xl px-4 py-2 text-sm"
      style={
        variant === 'success'
          ? { background: 'rgba(122,158,122,0.15)', color: '#C8DEC8' }
          : { background: 'rgba(180,80,80,0.15)', color: '#E8B4B4' }
      }
    >
      {message}
    </div>
  );
}
