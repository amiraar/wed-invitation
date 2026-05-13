'use client';

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
};

export default function Toggle({ checked, onChange }: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-12 rounded-full transition ${
        checked ? 'bg-amber-400' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
          checked ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  );
}
