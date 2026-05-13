'use client';

type Props = {
  message: string;
  variant?: 'success' | 'error';
};

export default function Toast({ message, variant = 'success' }: Props) {
  if (!message) return null;
  return (
    <div
      className={`rounded-2xl px-4 py-2 text-sm ${
        variant === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {message}
    </div>
  );
}
