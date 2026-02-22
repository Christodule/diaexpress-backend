import React from 'react';
import { cn } from '../../utils/cn';

const variants = {
  default: 'bg-slate-100 text-slate-700',
  sky: 'bg-sky-100 text-sky-700',
  green: 'bg-green-100 text-green-700',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
