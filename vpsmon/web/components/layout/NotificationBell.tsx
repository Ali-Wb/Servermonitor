"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NotificationBell() {
  return (
    <Button variant="ghost" size="sm" aria-label="Notifications">
      <Bell className="h-4 w-4" />
    </Button>
  );
}
