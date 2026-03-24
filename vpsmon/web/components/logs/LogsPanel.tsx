"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useLogs } from "@/hooks/useMetrics";

interface LogsPanelProps {
  serverId: string;
}

export function LogsPanel({ serverId }: LogsPanelProps) {
  const [lineCount, setLineCount] = useState(200);
  const [query, setQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { data } = useLogs(serverId, lineCount, true);

  const lines = useMemo(() => data?.lines ?? [], [data]);

  useEffect(() => {
    if (autoScroll && panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [autoScroll, lines]);

  const filtered = query.trim().length > 0
    ? lines.filter((line) => line.message.toLowerCase().includes(query.toLowerCase()))
    : lines;

  const download = () => {
    const blob = new Blob([filtered.map((line) => `[${new Date(line.timestamp).toISOString()}] ${line.level} ${line.message}`).join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${serverId}-logs.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="mr-auto text-sm font-medium">Logs</h3>
        <select className="h-8 rounded border bg-background px-2 text-xs" value={lineCount} onChange={(event) => setLineCount(Number(event.target.value))}>
          <option value={100}>100 lines</option>
          <option value={200}>200 lines</option>
          <option value={500}>500 lines</option>
        </select>
        <input placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} className="h-8 rounded border bg-background px-2 text-xs" />
        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={autoScroll} onChange={(event) => setAutoScroll(event.target.checked)} />Auto-scroll</label>
        <button type="button" onClick={download} className="rounded border px-2 py-1 text-xs">Download</button>
      </div>
      <div ref={panelRef} className="max-h-80 overflow-auto rounded bg-muted p-2 font-mono text-xs">
        {filtered.map((line, index) => (
          <div key={`${line.timestamp}-${index}`}>
            <span className="text-muted-foreground">[{new Date(line.timestamp).toLocaleTimeString()}]</span>{" "}
            <span className="uppercase">{line.level}</span>{" "}
            {query.length > 0 && line.message.toLowerCase().includes(query.toLowerCase())
              ? <mark className="bg-amber-400/50">{line.message}</mark>
              : line.message}
          </div>
        ))}
      </div>
    </section>
  );
}
