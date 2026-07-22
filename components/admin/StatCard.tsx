type Props = {
  label: string;
  value: string | number;
};

export default function StatCard({ label, value }: Props) {
  return (
    <div className="admin-card p-4">
      <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--adm-text-faint)' }}>
        {label}
      </p>
      <p className="mt-2 font-display text-2xl" style={{ color: '#C8DEC8' }}>
        {value}
      </p>
    </div>
  );
}
