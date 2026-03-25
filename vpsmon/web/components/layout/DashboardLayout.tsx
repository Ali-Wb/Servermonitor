"use client";

import Link from "next/link";
import { useState } from "react";

import { KeyboardHelpOverlay } from "@/components/layout/KeyboardHelpOverlay";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ServerSearch } from "@/components/layout/ServerSearch";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useTheme } from "@/hooks/useTheme";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: React.ReactNode;
  serverId?: string;
  serverName?: string;
  isOnline?: boolean;
  isMaintenance?: boolean;
}

export function DashboardLayout({ children, serverId, serverName, isOnline, isMaintenance }: DashboardLayoutProps) {
  const detail = Boolean(serverId);
  const [helpOpen, setHelpOpen] = useState(false);
  const { cycleTheme } = useTheme();

  useKeyboard({
    onToggleHelp: () => setHelpOpen((value) => !value),
    onToggleTheme: cycleTheme,
    onRefresh: () => window.location.reload(),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 h-12 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">vpsmon</span>
            <Badge>v0.1</Badge>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            {detail ? (
              <>
                <span className="truncate text-sm font-medium">{serverName ?? serverId}</span>
                <Badge className={isOnline ? "" : "bg-red-600 text-white"}>{isOnline ? "Online" : "Offline"}</Badge>
              </>
            ) : (
              <ServerSearch
                value=""
                onChange={() => {}}
                statusFilter="all"
                onStatusFilterChange={() => {}}
                cpuFilter="all"
                onCpuFilterChange={() => {}}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {isMaintenance ? <Badge className="bg-purple-600 text-white">In Maintenance</Badge> : null}
            <NotificationBell />
            <ThemeToggle />
            <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">Settings</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">GitHub</a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">{children}</main>
      <KeyboardHelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
