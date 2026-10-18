'use client';

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
};

export default function Toggle({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-12 shrink-0 rounded-full transition"
      style={{ background: checked ? 'var(--adm-accent-strong, #4A7A4A)' : 'rgba(120,160,120,0.25)' }}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
          checked ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  );
}
