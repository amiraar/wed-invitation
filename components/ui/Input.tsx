import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ label, className, ...props }: Props) {
  return (
    <label className="grid gap-2 text-sm">
      {label && <span className="text-text-secondary">{label}</span>}
      <input
        className={`w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm ${
          className ?? ''
        }`}
        {...props}
      />
    </label>
  );
}
