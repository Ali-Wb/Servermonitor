"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface UseKeyboardOptions {
  onToggleHelp?: () => void;
  onRefresh?: () => void;
  onToggleFullscreen?: () => void;
  onToggleTheme?: () => void;
}

export function useKeyboard(options: UseKeyboardOptions) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      if (key === "?" || (event.shiftKey && key === "/")) {
        event.preventDefault();
        options.onToggleHelp?.();
        return;
      }
      if (key === "r") {
        event.preventDefault();
        options.onRefresh?.();
        return;
      }
      if (key === "f") {
        event.preventDefault();
        options.onToggleFullscreen?.();
        return;
      }
      if (key === "t") {
        event.preventDefault();
        options.onToggleTheme?.();
        return;
      }
      if (key === "g") {
        return;
      }
      if (event.altKey && key === "h") {
        event.preventDefault();
        if (pathname !== "/") router.push("/");
        return;
      }
      if (event.altKey && key === "s") {
        event.preventDefault();
        if (!pathname.startsWith("/settings")) router.push("/settings");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [options, pathname, router]);
}
