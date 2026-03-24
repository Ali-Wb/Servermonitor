"use client";

import { Badge } from "@/components/ui/badge";
import type { ServiceStatus } from "@/lib/schemas";

interface ServicesPanelProps { services: ServiceStatus[] }

function statusClasses(status: ServiceStatus["status"]): string {
  if (status === "active") return "bg-emerald-600";
  if (status === "failed") return "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]";
  return "bg-slate-500";
}

export function ServicesPanel({ services }: ServicesPanelProps) {
  const active = services.filter((s) => s.status === "active").length;
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2"><h3 className="text-sm font-medium">Services</h3><Badge>{active}/{services.length}</Badge></div>
      <div className="space-y-2">
        {services.map((service) => (
          <article key={service.name} className="flex items-center justify-between rounded border p-2 text-xs">
            <span className="inline-flex items-center gap-2"><span className={`h-2 w-2 rounded-full animate-pulse ${service.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />{service.name}</span>
            <Badge className={statusClasses(service.status)}>{service.status}</Badge>
          </article>
        ))}
      </div>
    </section>
  );
}
