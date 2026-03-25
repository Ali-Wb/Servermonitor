"use client";

import { Laptop, Moon, Sun } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const icon = theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "light" ? <Sun className="h-4 w-4" /> : <Laptop className="h-4 w-4" />;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <button type="button" onClick={cycleTheme} className="rounded border p-2">{icon}</button>
        </TooltipTrigger>
        <TooltipContent>Cycle theme</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
