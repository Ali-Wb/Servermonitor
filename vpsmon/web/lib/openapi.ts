import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import {
  AgentHealthSchema,
  AlertCommentSchema,
  AlertEventSchema,
  BandwidthPeriodSchema,
  SnapshotSchema,
  UptimeDataSchema,
  ServerGroupSchema,
  MaintenanceWindowSchema,
  CustomWidgetSchema,
  SilenceSchema,
  ShareTokenSchema,
  AuditEntrySchema,
} from "@/lib/schemas";

const ErrorSchema = z.object({ error: z.string() });

export function buildOpenApiDocument() {
  const components = {
    Snapshot: zodToJsonSchema(SnapshotSchema as any, "Snapshot"),
    AlertEvent: zodToJsonSchema(AlertEventSchema as any, "AlertEvent"),
    AlertComment: zodToJsonSchema(AlertCommentSchema as any, "AlertComment"),
    AgentHealth: zodToJsonSchema(AgentHealthSchema as any, "AgentHealth"),
    BandwidthPeriod: zodToJsonSchema(BandwidthPeriodSchema as any, "BandwidthPeriod"),
    UptimeData: zodToJsonSchema(UptimeDataSchema as any, "UptimeData"),
    ServerGroup: zodToJsonSchema(ServerGroupSchema as any, "ServerGroup"),
    MaintenanceWindow: zodToJsonSchema(MaintenanceWindowSchema as any, "MaintenanceWindow"),
    CustomWidget: zodToJsonSchema(CustomWidgetSchema as any, "CustomWidget"),
    Silence: zodToJsonSchema(SilenceSchema as any, "Silence"),
    ShareToken: zodToJsonSchema(ShareTokenSchema as any, "ShareToken"),
    AuditEntry: zodToJsonSchema(AuditEntrySchema as any, "AuditEntry"),
    Error: zodToJsonSchema(ErrorSchema as any, "Error"),
  };

  return {
    openapi: "3.1.0",
    info: { title: "VPSMon API", version: "0.1.0" },
    paths: {
      "/api/servers/{serverId}/snapshot": { get: { summary: "Snapshot" } },
      "/api/servers/{serverId}/history": { get: { summary: "History" } },
      "/api/servers/{serverId}/alerts": { get: { summary: "Alerts" } },
      "/api/servers/{serverId}/alerts/{alertId}": { patch: { summary: "Acknowledge alert" } },
      "/api/servers/{serverId}/alerts/{alertId}/comments": { get: { summary: "List alert comments" }, post: { summary: "Create alert comment" } },
      "/api/servers/{serverId}/ping": { get: { summary: "Ping" } },
      "/api/servers/{serverId}/health": { get: { summary: "Health" } },
      "/api/servers/{serverId}/bandwidth": { get: { summary: "Bandwidth" } },
      "/api/servers/{serverId}/uptime": { get: { summary: "Uptime" } },
      "/api/servers/{serverId}/logs": { get: { summary: "Logs" } },
      "/api/servers/{serverId}/groups": { get: { summary: "Groups" } },
      "/api/servers/{serverId}/maintenance": { get: { summary: "Maintenance windows" } },
      "/api/servers/{serverId}/widgets": { get: { summary: "Widgets" } },
      "/api/servers/{serverId}/silences": { get: { summary: "Silences" }, post: { summary: "Create silence" } },
      "/api/servers/{serverId}/share": { get: { summary: "Share tokens" } },
      "/api/servers/{serverId}/export": { get: { summary: "Export" } },
      "/api/auth/audit": { get: { summary: "Audit" } },
      "/api/webhook/deploy": { post: { summary: "Deploy webhook" } },
    },
    components: { schemas: components },
  };
}
