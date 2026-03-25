"use client";

interface PanelErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function PanelError({ title = "Panel unavailable", message = "Failed to load data.", onRetry }: PanelErrorProps) {
  return (
    <section className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
      <h3 className="font-semibold text-red-200">{title}</h3>
      <p className="mt-1 text-red-100/80">{message}</p>
      {onRetry ? <button type="button" className="mt-2 rounded border border-red-300/40 px-2 py-1 text-xs" onClick={onRetry}>Retry</button> : null}
    </section>
  );
}
