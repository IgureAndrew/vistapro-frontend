import React from "react";

export default function ConfirmDialog({
  open,
  title = "Are you absolutely sure?",
  description,
  confirmText = "Continue",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-[480px] bg-background rounded-xl shadow-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-soft px-4 py-2">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded font-medium bg-[#f59e0b] text-black hover:bg-[#f59e0b]/90">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}


