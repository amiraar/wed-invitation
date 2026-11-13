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
          ? { background: 'var(--adm-selected-bg)', color: 'var(--adm-heading)' }
          : { background: 'var(--adm-danger-bg)', color: 'var(--adm-danger)' }
      }
    >
      {message}
    </div>
  );
}
