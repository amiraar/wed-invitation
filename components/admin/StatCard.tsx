type Props = {
  label: string;
  value: string | number;
};

export default function StatCard({ label, value }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-800">{value}</p>
    </div>
  );
}
