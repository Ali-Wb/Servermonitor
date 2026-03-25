"use client";

import { useCallback, useMemo, useState } from "react";

export const DEFAULT_LAYOUT = [
  "cpu",
  "ram",
  "disk",
  "network",
  "uptime",
  "logs",
  "config_changes",
  "bandwidth",
] as const;

interface UseLayoutResult {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  panelOrder: string[];
  setPanelOrder: (next: string[]) => void;
  addWidgetPanel: (widgetId: string) => void;
  removeWidgetPanel: (widgetId: string) => void;
}

export function useLayout(serverId: string): UseLayoutResult {
  const [activeTab, setActiveTab] = useState("live");
  const [panelOrder, setPanelOrder] = useState<string[]>([...DEFAULT_LAYOUT]);

  const addWidgetPanel = useCallback((widgetId: string) => {
    const id = `widget_${widgetId}`;
    setPanelOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeWidgetPanel = useCallback((widgetId: string) => {
    const id = `widget_${widgetId}`;
    setPanelOrder((prev) => prev.filter((panelId) => panelId !== id));
  }, []);

  return useMemo(() => ({
    activeTab,
    setActiveTab,
    panelOrder,
    setPanelOrder,
    addWidgetPanel,
    removeWidgetPanel,
  }), [activeTab, panelOrder, addWidgetPanel, removeWidgetPanel, serverId]);
}
