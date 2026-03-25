"use client";

import { Kbd } from "@/components/ui/kbd";

interface KeyboardHelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "?", action: "Open keyboard help" },
  { key: "R", action: "Refresh current dashboard" },
  { key: "F", action: "Toggle fullscreen panel" },
  { key: "T", action: "Cycle theme" },
  { key: "Alt+H", action: "Go to home" },
  { key: "Alt+S", action: "Go to settings" },
];

export function KeyboardHelpOverlay({ open, onClose }: KeyboardHelpOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border bg-background p-4" onClick={(event) => event.stopPropagation()}>
        <h2 className="mb-3 text-sm font-semibold">Keyboard shortcuts</h2>
        <table className="w-full text-left text-xs">
          <tbody>
            {SHORTCUTS.map((shortcut) => (
              <tr key={shortcut.key} className="border-t">
                <td className="py-2"><Kbd>{shortcut.key}</Kbd></td>
                <td>{shortcut.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
