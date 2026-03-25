import { AuditLogTable } from "@/components/settings/AuditLogTable";
import { KeyManager } from "@/components/settings/KeyManager";
import { ShareManager } from "@/components/settings/ShareManager";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { WidgetManager } from "@/components/settings/WidgetManager";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <section className="rounded-lg border bg-card p-4"><h2 className="mb-2 text-sm font-semibold">General</h2><ThemeToggle /></section>
        <KeyManager />
        <ShareManager />
        <WidgetManager />
        <AuditLogTable />
      </div>
    </DashboardLayout>
  );
}
