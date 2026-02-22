import React from 'react';
import { cn } from '../../utils/cn';

export function Label({ className, children, ...props }) {
  return (
    <label
      className={cn('text-sm font-medium text-slate-700 md:text-base', className)}
      {...props}
    >
      {children}
    </label>
  );
}
