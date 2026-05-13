export default function FooterPublic() {
  return (
    <footer className="py-16 text-center" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="gold-divider mx-auto mb-8 w-24" />
      <p className="font-display text-2xl italic" style={{ color: 'var(--text-secondary)' }}>
        Terima kasih atas doa dan kehadiran Anda.
      </p>
      <p className="mt-4 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--text-muted)' }}>
        With Love
      </p>
    </footer>
  );
}
