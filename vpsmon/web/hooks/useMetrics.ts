"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

import {
  fetchAgentHealth,
  fetchAlerts,
  fetchAnnotations,
  fetchBandwidth,
  fetchGroups,
  fetchHistory,
  fetchLogs,
  fetchMaintenanceWindows,
  fetchPing,
  fetchShareTokens,
  fetchSilences,
  fetchSnapshot,
  fetchUptimeData,
  fetchWidgets,
  type Period,
} from "@/lib/api";
import { useIntervals } from "@/providers/IntervalsProvider";

interface SnapshotHookResult {
  data: Awaited<ReturnType<typeof fetchSnapshot>> | undefined;
  isPending: boolean;
  isError: boolean;
  isStale: boolean;
  lastUpdated: number | null;
  refetch: () => Promise<unknown>;
}

export function useSnapshot(serverId: string): SnapshotHookResult {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["snapshot", serverId],
    queryFn: () => fetchSnapshot(serverId),
    enabled: serverId.length > 0,
    refetchInterval: getInterval("snapshot", 2000),
  });

  return {
    data: query.data,
    isPending: query.isPending,
    isError: query.isError,
    isStale: query.isStale,
    lastUpdated: query.dataUpdatedAt || null,
    refetch: query.refetch,
  };
}

interface QueryResult<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  isStale: boolean;
  refetch: () => Promise<unknown>;
}

interface QueryState<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  isStale: boolean;
  refetch: () => Promise<unknown>;
}

function toResult<T>(query: QueryState<T>): QueryResult<T> {
  return {
    data: query.data,
    isPending: query.isPending,
    isError: query.isError,
    isStale: query.isStale,
    refetch: query.refetch,
  };
}

export function useHistory(serverId: string, metric: string, durationSeconds: number): QueryResult<Awaited<ReturnType<typeof fetchHistory>>> {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["history", serverId, metric, durationSeconds],
    queryFn: () => fetchHistory(serverId, metric, String(durationSeconds), 300),
    enabled: serverId.length > 0 && metric.length > 0,
    refetchInterval: getInterval("history", 5000),
  });

  return toResult(query);
}

export function useAlerts(serverId: string): QueryResult<Awaited<ReturnType<typeof fetchAlerts>>> {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["alerts", serverId],
    queryFn: () => fetchAlerts(serverId),
    enabled: serverId.length > 0,
    refetchInterval: getInterval("alerts", 5000),
  });

  return toResult(query);
}

export function useAgentHealth(serverId: string): QueryResult<Awaited<ReturnType<typeof fetchAgentHealth>>> {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["agent-health", serverId],
    queryFn: () => fetchAgentHealth(serverId),
    enabled: serverId.length > 0,
    refetchInterval: getInterval("agentHealth", 30000),
  });

  return toResult(query);
}

export function useBandwidth(serverId: string, period: Period): QueryResult<Awaited<ReturnType<typeof fetchBandwidth>>> {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["bandwidth", serverId, period],
    queryFn: () => fetchBandwidth(serverId, period),
    enabled: serverId.length > 0,
    refetchInterval: getInterval("bandwidth", 30000),
  });

  return toResult(query);
}

export function useAnnotations(serverId: string): QueryResult<Awaited<ReturnType<typeof fetchAnnotations>>> {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["annotations", serverId],
    queryFn: () => fetchAnnotations(serverId),
    enabled: serverId.length > 0,
    refetchInterval: getInterval("annotations", 15000),
  });

  return toResult(query);
}

export function useUptimeData(serverId: string, period: Period): QueryResult<Awaited<ReturnType<typeof fetchUptimeData>>> {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["uptime", serverId, period],
    queryFn: () => fetchUptimeData(serverId, period),
    enabled: serverId.length > 0,
    refetchInterval: getInterval("uptime", 60000),
  });

  return toResult(query);
}

export function useLogs(serverId: string, lines: number, autoRefresh: boolean): QueryResult<Awaited<ReturnType<typeof fetchLogs>>> {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["logs", serverId, lines],
    queryFn: () => fetchLogs(serverId, lines),
    enabled: serverId.length > 0,
    refetchInterval: autoRefresh ? getInterval("logs", 10000) : false,
  });

  return toResult(query);
}

interface LatencyHistoryPoint {
  checkedAt: number;
  latencyMs: number;
}

interface LatencyHistoryHookResult extends QueryResult<Awaited<ReturnType<typeof fetchPing>>> {
  history: LatencyHistoryPoint[];
}

export function useLatencyHistory(serverId: string): LatencyHistoryHookResult {
  const { getInterval } = useIntervals();
  const historyRef = useRef<LatencyHistoryPoint[]>([]);
  const [, setTick] = useState(0);
  const query = useQuery({
    queryKey: ["ping", serverId],
    queryFn: async () => {
      const startedAt = Date.now();
      const result = await fetchPing(serverId);
      const entry = {
        checkedAt: result.checkedAt,
        latencyMs: Math.max(result.latencyMs, Date.now() - startedAt),
      };
      historyRef.current = [...historyRef.current, entry].slice(-60);
      setTick((value) => value + 1);
      return result;
    },
    enabled: serverId.length > 0,
    refetchInterval: getInterval("ping", 5000),
  });

  return {
    ...toResult(query),
    history: historyRef.current,
  };
}

export function useMaintenance(serverId?: string): QueryResult<Awaited<ReturnType<typeof fetchMaintenanceWindows>>> {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["maintenance", serverId ?? "all"],
    queryFn: () => fetchMaintenanceWindows(serverId),
    refetchInterval: getInterval("maintenance", 60000),
  });

  return toResult(query);
}

export function useGroups(): QueryResult<Awaited<ReturnType<typeof fetchGroups>>> {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
    refetchInterval: getInterval("groups", 30000),
  });

  return toResult(query);
}

export function useWidgets(serverId: string): QueryResult<Awaited<ReturnType<typeof fetchWidgets>>> {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["widgets", serverId],
    queryFn: () => fetchWidgets(serverId),
    enabled: serverId.length > 0,
    refetchInterval: getInterval("widgets", 10000),
  });

  return toResult(query);
}

export function useSilences(serverId: string): QueryResult<Awaited<ReturnType<typeof fetchSilences>>> {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["silences", serverId],
    queryFn: () => fetchSilences(serverId),
    enabled: serverId.length > 0,
    refetchInterval: getInterval("silences", 30000),
  });

  return toResult(query);
}

export function useShareTokens(serverId: string): QueryResult<Awaited<ReturnType<typeof fetchShareTokens>>> {
  const { getInterval } = useIntervals();
  const query = useQuery({
    queryKey: ["share-tokens", serverId],
    queryFn: () => fetchShareTokens(serverId),
    enabled: serverId.length > 0,
    refetchInterval: getInterval("shareTokens", 30000),
  });

  return toResult(query);
}
