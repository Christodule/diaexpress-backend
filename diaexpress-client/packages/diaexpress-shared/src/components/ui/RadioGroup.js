import React from 'react';
import { cn } from '../../utils/cn';

export function RadioGroup({ className, children, ...props }) {
  return (
    <div role="radiogroup" className={cn('flex flex-col gap-3', className)} {...props}>
      {children}
    </div>
  );
}

export function RadioGroupItem({ className, children, value, checked, onChange, ...props }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-sky-300 focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2',
        checked && 'border-sky-500 shadow-sm',
        className
      )}
    >
      <input
        type="radio"
        className="mt-1 h-4 w-4 cursor-pointer rounded-full border-slate-400 text-sky-500 focus:ring-sky-500"
        value={value}
        checked={checked}
        onChange={onChange}
        {...props}
      />
      <div className="flex-1 text-sm md:text-base text-slate-700">{children}</div>
    </label>
  );
}
