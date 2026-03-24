"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { cycleTheme, resolvedTheme } = useTheme();
  return (
    <Button variant="secondary" size="sm" onClick={cycleTheme}>
      {resolvedTheme === "dark" ? "🌙" : "☀️"}
    </Button>
  );
}
