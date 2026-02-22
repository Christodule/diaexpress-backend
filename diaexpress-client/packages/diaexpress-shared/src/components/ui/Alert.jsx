import React from 'react';
import { cn } from '../../utils/cn';

const variants = {
  error: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
};

export function Alert({ className, variant = 'info', children, ...props }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm md:text-base',
        variants[variant] || variants.info,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
