type Props = {
  groomName: string;
  brideName: string;
};

export default function FooterPublic({ groomName, brideName }: Props) {
  const couple = groomName && brideName ? `${groomName} & ${brideName}` : '';

  return (
    <footer
      className="px-6 py-16 text-center"
      style={{
        background: 'var(--hero-bg)',
        paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))'
      }}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-4">
          <div className="h-px w-14 bg-[var(--hero-text)]/28" />
          <div className="ornament-diamond text-[var(--hero-text)]/42" />
          <div className="h-px w-14 bg-[var(--hero-text)]/28" />
        </div>
        {couple && (
          <h2
            className="font-display italic"
            style={{ color: 'var(--hero-text)', fontSize: 'clamp(2.25rem, 6vw, 3.75rem)' }}
          >
            {couple}
          </h2>
        )}
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--hero-text)]/55">
          Thank you for your love and blessings
        </p>
        <div className="flex items-center gap-4">
          <div className="h-px w-14 bg-[var(--hero-text)]/28" />
          <div className="ornament-diamond text-[var(--hero-text)]/42" />
          <div className="h-px w-14 bg-[var(--hero-text)]/28" />
        </div>
      </div>
    </footer>
  );
}
