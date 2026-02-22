import { SelectHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select ref={ref} className={clsx('select', className)} {...props}>
      {children}
    </select>
  );
});
