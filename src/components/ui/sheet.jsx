// Lightweight Sheet/Drawer component with backdrop
import React from "react";

export function Sheet({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

export function SheetContent({ side = "right", className = "", children }) {
  const base =
    side === "bottom"
      ? "inset-x-0 bottom-0 w-full max-h-[90vh] rounded-t-xl"
      : "inset-y-0 right-0 w-full max-w-[560px] md:max-w-[640px]";
  return (
    <div
      className={`absolute ${base} bg-background shadow-xl outline-none ${className}`}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}

export function SheetTrigger({ asChild, children, ...props }) {
  if (asChild) {
    return React.cloneElement(children, props);
  }
  return <button {...props}>{children}</button>;
}


