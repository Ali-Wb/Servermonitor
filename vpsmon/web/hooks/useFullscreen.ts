"use client";

import { useCallback, useState } from "react";

export function useFullscreen() {
  const [activePanelId, setActivePanelId] = useState<string | null>(null);

  const openFullscreen = useCallback((panelId: string) => {
    const transition = (document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition;
    if (transition) {
      transition(() => setActivePanelId(panelId));
      return;
    }
    setActivePanelId(panelId);
  }, []);

  const closeFullscreen = useCallback(() => {
    const transition = (document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition;
    if (transition) {
      transition(() => setActivePanelId(null));
      return;
    }
    setActivePanelId(null);
  }, []);

  return { activePanelId, openFullscreen, closeFullscreen };
}
