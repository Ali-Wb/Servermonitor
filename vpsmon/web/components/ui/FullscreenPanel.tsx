"use client";

import { X } from "lucide-react";
import type { PropsWithChildren } from "react";

interface FullscreenPanelProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
}

export function FullscreenPanel({ open, title, onClose, children }: FullscreenPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 p-4 backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl flex-col rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded border p-1"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}
