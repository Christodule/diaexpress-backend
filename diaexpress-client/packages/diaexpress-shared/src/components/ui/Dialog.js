import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

function useIsBrowser() {
  const [isBrowser, setIsBrowser] = React.useState(false);
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  return isBrowser;
}

export function Dialog({ open, onOpenChange, children }) {
  const isBrowser = useIsBrowser();

  useEffect(() => {
    if (!open) return;
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onOpenChange?.(false);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  if (!open || !isBrowser) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    document.body
  );
}

export function DialogContent({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, children, ...props }) {
  return (
    <div className={cn('mb-4 flex flex-col gap-1 text-left', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-lg font-semibold text-slate-900', className)} {...props}>
      {children}
    </h3>
  );
}

export function DialogDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-sm text-slate-500', className)} {...props}>
      {children}
    </p>
  );
}

export function DialogFooter({ className, children, ...props }) {
  return (
    <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props}>
      {children}
    </div>
  );
}
