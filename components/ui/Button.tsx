import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline';
};

export default function Button({ variant = 'primary', className, ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm uppercase tracking-[0.3em] transition';
  const style =
    variant === 'primary'
      ? 'border border-accent bg-accent text-bg-primary hover:opacity-90'
      : 'border border-border text-text-secondary hover:border-accent hover:text-accent';

  return <button className={`${base} ${style} ${className ?? ''}`} {...props} />;
}
