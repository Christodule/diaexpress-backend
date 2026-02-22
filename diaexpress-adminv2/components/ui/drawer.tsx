'use client';

export function Drawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="drawer" role="dialog" aria-modal="true">
      <div className="drawer__overlay" onClick={onClose} />
      <div className="drawer__panel">{children}</div>
    </div>
  );
}
