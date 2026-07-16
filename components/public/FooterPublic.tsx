type Props = {
  groomName: string;
  brideName: string;
};

export default function FooterPublic({ groomName, brideName }: Props) {
  const couple = groomName && brideName ? `${groomName} & ${brideName}` : '';

  return (
    <footer
      className="px-6 py-16 text-center"
      style={{ borderTop: '1px solid var(--border)', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
    >
      <div className="gold-divider mx-auto mb-8 w-24" />
      <p className="font-display text-xl italic sm:text-2xl" style={{ color: 'var(--text-secondary)' }}>
        Terima kasih atas doa dan kehadiran Anda.
      </p>
      {couple && (
        <p className="mt-6 font-display text-3xl italic" style={{ color: 'var(--text-primary)' }}>
          {couple}
        </p>
      )}
      <p className="mt-4 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--text-muted)' }}>
        With Love
      </p>
    </footer>
  );
}
