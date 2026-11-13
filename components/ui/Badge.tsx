type Props = {
  label: string;
};

export default function Badge({ label }: Props) {
  return (
    <span className="rounded-full px-3 py-1 text-xs" style={{ background: 'var(--adm-selected-bg)', color: 'var(--adm-accent-text)' }}>
      {label}
    </span>
  );
}
