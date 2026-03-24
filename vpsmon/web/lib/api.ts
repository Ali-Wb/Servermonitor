import { z } from "zod";

import {
  AgentHealthSchema,
  AlertCommentSchema,
  AlertEventSchema,
  AuditEntrySchema,
  BandwidthPeriodSchema,
  MaintenanceWindowSchema,
  ReportSectionSchema,
  ServerGroupSchema,
  ShareTokenSchema,
  SilenceSchema,
  SnapshotSchema,
  UptimeDataSchema,
  CustomWidgetSchema,
} from "@/lib/schemas";

const ServerSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  host: z.string(),
  status: z.enum(["online", "offline", "degraded", "unknown"]),
  groupId: z.string().nullable(),
  lastSeenAt: z.number().nullable(),
});

const HistoryPointSchema = z.object({
  timestamp: z.number(),
  value: z.number(),
});

const AnnotationSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.number(),
  timestamp: z.number(),
});

const CreateAnnotationSchema = AnnotationSchema.omit({
  id: true,
  createdAt: true,
});

const LogLineSchema = z.object({
  timestamp: z.number(),
  level: z.string(),
  message: z.string(),
});

const PingResponseSchema = z.object({
  latencyMs: z.number(),
  status: z.enum(["online", "offline", "degraded"]),
  checkedAt: z.number(),
});

const ExportFormatSchema = z.enum(["csv", "json", "pdf"]);
const PeriodSchema = z.enum(["day", "week", "month"]);

const ApiErrorPayloadSchema = z.object({
  error: z.string().optional(),
  message: z.string().optional(),
});

const CreateAlertCommentSchema = z.object({
  text: z.string().min(1),
});

const CreateGroupSchema = ServerGroupSchema.omit({ id: true, createdAt: true });
const UpdateGroupSchema = CreateGroupSchema.partial();
const CreateMaintenanceWindowSchema = MaintenanceWindowSchema.omit({ id: true, createdAt: true });
const UpdateMaintenanceWindowSchema = CreateMaintenanceWindowSchema.partial();
const CreateWidgetSchema = CustomWidgetSchema.omit({ id: true });
const CreateSilenceSchema = SilenceSchema.omit({ id: true, createdAt: true, serverId: true });
const CreateShareTokenSchema = ShareTokenSchema.omit({ id: true, createdAt: true, serverId: true, token: true });

export type ServerSummary = z.infer<typeof ServerSummarySchema>;
export type HistoryPoint = z.infer<typeof HistoryPointSchema>;
export type Annotation = z.infer<typeof AnnotationSchema>;
export type CreateAnnotationInput = z.infer<typeof CreateAnnotationSchema>;
export type LogLine = z.infer<typeof LogLineSchema>;
export type PingResponse = z.infer<typeof PingResponseSchema>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export type Period = z.infer<typeof PeriodSchema>;
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
export type UpdateGroupInput = z.infer<typeof UpdateGroupSchema>;
export type CreateMaintenanceWindowInput = z.infer<typeof CreateMaintenanceWindowSchema>;
export type UpdateMaintenanceWindowInput = z.infer<typeof UpdateMaintenanceWindowSchema>;
export type CreateWidgetInput = z.infer<typeof CreateWidgetSchema>;
export type CreateSilenceInput = z.infer<typeof CreateSilenceSchema>;
export type CreateShareTokenInput = z.infer<typeof CreateShareTokenSchema>;

export class ApiError extends Error {
  public readonly status: number;

  public constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return {};
  }

  const token = window.localStorage.getItem("vpsmon-api-key");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse<T>(response: Response, schema: z.ZodSchema<T>): Promise<T> {
  if (!response.ok) {
    const errorPayload = ApiErrorPayloadSchema.safeParse(await response.json().catch(() => ({})));
    const message = errorPayload.success
      ? errorPayload.data.error ?? errorPayload.data.message ?? response.statusText
      : response.statusText;

    if (response.status === 401) throw new ApiError(message || "Unauthorized", 401);
    if (response.status === 403) throw new ApiError(message || "Forbidden", 403);
    if (response.status === 429) throw new ApiError(message || "Rate limited", 429);

    throw new ApiError(message || `Request failed with status ${response.status}`, response.status);
  }

  const json = await response.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(`Invalid API response: ${parsed.error.message}`, response.status);
  }

  return parsed.data;
}

async function apiFetch<T>(path: string, init: RequestInit, schema: z.ZodSchema<T>): Promise<T> {
  const headers = new Headers(init.headers);

  Object.entries(getAuthHeaders()).forEach(([key, value]) => {
    if (typeof value === "string") {
      headers.set(key, value);
    }
  });

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  return parseResponse(response, schema);
}

function encode(value: string | number | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return encodeURIComponent(String(value));
}

export async function fetchSnapshot(serverId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/snapshot`, { method: "GET" }, SnapshotSchema);
}

export async function fetchHistory(serverId: string, metric: string, duration: string, maxPoints: number = 300) {
  const query = `metric=${encodeURIComponent(metric)}&duration=${encodeURIComponent(duration)}&maxPoints=${maxPoints}`;
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/history?${query}`, { method: "GET" }, z.array(HistoryPointSchema));
}

export async function fetchAlerts(serverId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/alerts`, { method: "GET" }, z.array(AlertEventSchema));
}

export async function acknowledgeAlert(serverId: string, alertId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/alerts/${encodeURIComponent(alertId)}`, { method: "PATCH", body: JSON.stringify({ acknowledged: true }) }, AlertEventSchema);
}

export async function fetchAlertComments(serverId: string, alertId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/alerts/${encodeURIComponent(alertId)}/comments`, { method: "GET" }, z.array(AlertCommentSchema));
}

export async function addAlertComment(serverId: string, alertId: string, text: string) {
  const payload = CreateAlertCommentSchema.parse({ text });
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/alerts/${encodeURIComponent(alertId)}/comments`, { method: "POST", body: JSON.stringify(payload) }, AlertCommentSchema);
}

export async function fetchPing(serverId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/ping`, { method: "GET" }, PingResponseSchema);
}

export async function fetchAgentHealth(serverId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/health`, { method: "GET" }, AgentHealthSchema);
}

export async function fetchBandwidth(serverId: string, period: Period) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/bandwidth?period=${encodeURIComponent(period)}`, { method: "GET" }, z.array(BandwidthPeriodSchema));
}

export async function exportMetrics(
  serverId: string,
  format: ExportFormat,
  range?: string,
  sections?: Array<z.infer<typeof ReportSectionSchema>>,
  companyName?: string,
  logoBase64?: string,
) {
  const query = new URLSearchParams();
  query.set("format", ExportFormatSchema.parse(format));
  if (range) query.set("range", range);
  if (sections?.length) query.set("sections", sections.join(","));
  if (companyName) query.set("companyName", companyName);
  if (logoBase64) query.set("logoBase64", logoBase64);

  const response = await fetch(`/api/servers/${encodeURIComponent(serverId)}/export?${query.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new ApiError(`Export failed with status ${response.status}`, response.status);
  }

  return response.blob();
}

export async function fetchServers() {
  return apiFetch(`/api/servers`, { method: "GET" }, z.array(ServerSummarySchema));
}

export async function fetchAnnotations(serverId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/annotations`, { method: "GET" }, z.array(AnnotationSchema));
}

export async function createAnnotation(serverId: string, data: CreateAnnotationInput) {
  const payload = CreateAnnotationSchema.parse(data);
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/annotations`, { method: "POST", body: JSON.stringify(payload) }, AnnotationSchema);
}

export async function deleteAnnotation(serverId: string, annotationId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/annotations/${encodeURIComponent(annotationId)}`, { method: "DELETE" }, z.object({ ok: z.boolean() }));
}

export async function sendTestAlert(serverId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/test-alert`, { method: "POST" }, z.object({ ok: z.boolean() }));
}

export async function fetchUptimeData(serverId: string, period: Period) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/uptime?period=${encodeURIComponent(period)}`, { method: "GET" }, UptimeDataSchema);
}

export async function fetchLogs(serverId: string, lines: number) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/logs?lines=${lines}`, { method: "GET" }, z.object({ lines: z.array(LogLineSchema) }));
}

export async function fetchGroups() {
  return apiFetch(`/api/groups`, { method: "GET" }, z.array(ServerGroupSchema));
}

export async function createGroup(data: CreateGroupInput) {
  const payload = CreateGroupSchema.parse(data);
  return apiFetch(`/api/groups`, { method: "POST", body: JSON.stringify(payload) }, ServerGroupSchema);
}

export async function updateGroup(groupId: string, data: UpdateGroupInput) {
  const payload = UpdateGroupSchema.parse(data);
  return apiFetch(`/api/groups/${encodeURIComponent(groupId)}`, { method: "PATCH", body: JSON.stringify(payload) }, ServerGroupSchema);
}

export async function deleteGroup(groupId: string) {
  return apiFetch(`/api/groups/${encodeURIComponent(groupId)}`, { method: "DELETE" }, z.object({ ok: z.boolean() }));
}

export async function fetchMaintenanceWindows(serverId?: string) {
  const query = encode(serverId);
  const suffix = query ? `?serverId=${query}` : "";
  return apiFetch(`/api/settings/maintenance${suffix}`, { method: "GET" }, z.array(MaintenanceWindowSchema));
}

export async function createMaintenanceWindow(data: CreateMaintenanceWindowInput) {
  const payload = CreateMaintenanceWindowSchema.parse(data);
  return apiFetch(`/api/settings/maintenance`, { method: "POST", body: JSON.stringify(payload) }, MaintenanceWindowSchema);
}

export async function updateMaintenanceWindow(id: string, data: UpdateMaintenanceWindowInput) {
  const payload = UpdateMaintenanceWindowSchema.parse(data);
  return apiFetch(`/api/settings/maintenance/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }, MaintenanceWindowSchema);
}

export async function deleteMaintenanceWindow(id: string) {
  return apiFetch(`/api/settings/maintenance/${encodeURIComponent(id)}`, { method: "DELETE" }, z.object({ ok: z.boolean() }));
}

export async function fetchWidgets(serverId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/widgets`, { method: "GET" }, z.array(CustomWidgetSchema));
}

export async function createWidget(data: CreateWidgetInput) {
  const payload = CreateWidgetSchema.parse(data);
  return apiFetch(`/api/widgets`, { method: "POST", body: JSON.stringify(payload) }, CustomWidgetSchema);
}

export async function deleteWidget(id: string) {
  return apiFetch(`/api/widgets/${encodeURIComponent(id)}`, { method: "DELETE" }, z.object({ ok: z.boolean() }));
}

export async function triggerSelfUpdate(serverId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/update`, { method: "POST" }, z.object({ ok: z.boolean() }));
}

export async function fetchSilences(serverId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/silences`, { method: "GET" }, z.array(SilenceSchema));
}

export async function createSilence(serverId: string, data: CreateSilenceInput) {
  const payload = CreateSilenceSchema.parse(data);
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/silences`, { method: "POST", body: JSON.stringify(payload) }, SilenceSchema);
}

export async function deleteSilence(serverId: string, silenceId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/silences/${encodeURIComponent(silenceId)}`, { method: "DELETE" }, z.object({ ok: z.boolean() }));
}

export async function fetchShareTokens(serverId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/share`, { method: "GET" }, z.array(ShareTokenSchema));
}

export async function createShareToken(serverId: string, data: CreateShareTokenInput) {
  const payload = CreateShareTokenSchema.parse(data);
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/share`, { method: "POST", body: JSON.stringify(payload) }, ShareTokenSchema);
}

export async function deleteShareToken(serverId: string, tokenId: string) {
  return apiFetch(`/api/servers/${encodeURIComponent(serverId)}/share/${encodeURIComponent(tokenId)}`, { method: "DELETE" }, z.object({ ok: z.boolean() }));
}

export async function fetchAuditLog() {
  return apiFetch(`/api/settings`, { method: "GET" }, z.array(AuditEntrySchema));
}
