"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button type="button" onClick={reset} className="mt-4 rounded border px-3 py-1 text-sm">Try again</button>
    </main>
  );
}
