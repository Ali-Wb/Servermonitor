"use client";

import { useEffect } from "react";

interface ShortcutsHandlers {
  onRefresh?: () => void;
  onToggleTab?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutsHandlers) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "r" && event.shiftKey) {
        event.preventDefault();
        handlers.onRefresh?.();
      }
      if (event.key.toLowerCase() === "t" && event.shiftKey) {
        event.preventDefault();
        handlers.onToggleTab?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
