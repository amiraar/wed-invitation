type Props = {
  label: string;
};

export default function Badge({ label }: Props) {
  return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">{label}</span>;
}
