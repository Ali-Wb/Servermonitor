"use client";

import { useTheme as useNextTheme } from "next-themes";

interface UseThemeResult {
  theme: string | undefined;
  resolvedTheme: string | undefined;
  setTheme: (theme: string) => void;
  cycleTheme: () => void;
}

export function useTheme(): UseThemeResult {
  const { theme, resolvedTheme, setTheme } = useNextTheme();

  function cycleTheme(): void {
    if (theme === "dark") {
      setTheme("light");
      return;
    }

    if (theme === "light") {
      setTheme("system");
      return;
    }

    setTheme("dark");
  }

  return {
    theme,
    resolvedTheme,
    setTheme,
    cycleTheme,
  };
}
