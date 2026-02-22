import { type HTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  value?: string;
  meta?: ReactNode;
  badge?: ReactNode;
};

export function Card({ title, value, meta, badge, children, className, ...props }: CardProps) {
  return (
    <div className={clsx('card', className)} {...props}>
      {title ? <div className="card__title">{title}</div> : null}
      {value ? <div className="card__value">{value}</div> : null}
      {meta ? <div className="card__meta">{meta}</div> : null}
      {badge ? <div style={{ marginTop: 12 }}>{badge}</div> : null}
      {children}
    </div>
  );
}
