"use client";

import { useCallback, useMemo, useState } from "react";

interface UseLayoutResult {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  widgetPanels: string[];
  addWidgetPanel: (widgetId: string) => void;
  removeWidgetPanel: (widgetId: string) => void;
}

export function useLayout(serverId: string): UseLayoutResult {
  const [activeTab, setActiveTab] = useState("live");
  const [widgetPanels, setWidgetPanels] = useState<string[]>([]);

  const addWidgetPanel = useCallback((widgetId: string) => {
    setWidgetPanels((prev) => (prev.includes(widgetId) ? prev : [...prev, widgetId]));
  }, []);

  const removeWidgetPanel = useCallback((widgetId: string) => {
    setWidgetPanels((prev) => prev.filter((id) => id !== widgetId));
  }, []);

  return useMemo(() => ({
    activeTab,
    setActiveTab,
    widgetPanels,
    addWidgetPanel,
    removeWidgetPanel,
  }), [activeTab, widgetPanels, addWidgetPanel, removeWidgetPanel, serverId]);
}
