import type { HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  as?: 'div' | 'section' | 'article';
  padded?: boolean;
}

export default function GlassCard({
  children,
  className = '',
  padded = true,
  as: _as,
  ...rest
}: Props) {
  return (
    <div
      className={`glass ${padded ? 'p-6' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
