import { clsx } from 'clsx';
import { HTMLAttributes } from 'react';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={clsx('badge', className)} {...props} />;
}
