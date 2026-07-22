type Props = {
  label: string;
};

export default function Badge({ label }: Props) {
  return (
    <span className="rounded-full px-3 py-1 text-xs" style={{ background: 'rgba(122,158,122,0.15)', color: '#7A9E7A' }}>
      {label}
    </span>
  );
}
