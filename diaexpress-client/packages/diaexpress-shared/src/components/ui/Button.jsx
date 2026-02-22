import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const variants = {
  default: 'bg-sky-500 text-white hover:bg-sky-600 focus-visible:ring-sky-500',
  secondary:
    'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300',
  outline:
    'border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 focus-visible:ring-slate-400',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm md:text-base',
  lg: 'h-12 px-6 text-base',
};

const baseClasses =
  'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 gap-2';

export const Button = forwardRef(function Button(
  { className, variant = 'default', size = 'md', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(baseClasses, variants[variant] || variants.default, sizes[size], className)}
      {...props}
    />
  );
});
