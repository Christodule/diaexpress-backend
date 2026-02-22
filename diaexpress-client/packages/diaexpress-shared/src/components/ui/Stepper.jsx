import React from 'react';
import { cn } from '../../utils/cn';

export function Stepper({ steps, currentIndex = 0, className }) {
  return (
    <nav aria-label="Progression" className={cn('flex flex-col gap-4', className)}>
      <ol className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        {steps.map((step, index) => {
          const status = step.status || (index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming');
          const isDone = status === 'done';
          const isCurrent = status === 'current';
          return (
            <li key={step.label} className="flex items-start gap-3 md:items-center">
              <div
                className={cn(
                  'flex h-10 w-10 flex-none items-center justify-center rounded-full border-2 text-sm font-semibold transition',
                  isDone && 'border-green-500 bg-green-500 text-white',
                  isCurrent && 'border-sky-500 text-sky-600',
                  !isDone && !isCurrent && 'border-slate-200 text-slate-400'
                )}
              >
                {isDone ? '✓' : index + 1}
              </div>
              <div className="flex flex-col">
                <span className={cn('text-sm font-semibold md:text-base', isCurrent ? 'text-sky-600' : 'text-slate-700')}>
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-xs text-slate-500 md:text-sm">{step.description}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className="hidden flex-1 border-t border-dashed border-slate-200 md:ml-4 md:block" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
