"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface GroupOption {
  id: string;
  name: string;
}

interface ServerSearchProps {
  value: string;
  onChange: (value: string) => void;
  statusFilter: "all" | "online" | "degraded" | "offline";
  onStatusFilterChange: (value: "all" | "online" | "degraded" | "offline") => void;
  cpuFilter: "all" | "high";
  onCpuFilterChange: (value: "all" | "high") => void;
  groupId?: string;
  onGroupChange?: (groupId: string) => void;
  groups?: GroupOption[];
}

export function ServerSearch({
  value,
  onChange,
  statusFilter,
  onStatusFilterChange,
  cpuFilter,
  onCpuFilterChange,
  groupId = "",
  onGroupChange,
  groups = [],
}: ServerSearchProps) {
  const activeFilters = useMemo(() => {
    let total = 0;
    if (statusFilter !== "all") total += 1;
    if (cpuFilter !== "all") total += 1;
    if (groupId) total += 1;
    return total;
  }, [cpuFilter, groupId, statusFilter]);

  return (
    <div className="flex w-full max-w-2xl items-center gap-2">
      <InputGroup>
        <InputGroupAddon>
          <Search className="h-4 w-4" />
        </InputGroupAddon>
        <input
          className="h-8 flex-1 bg-transparent px-2 text-sm outline-none"
          placeholder="Search servers..."
          aria-label="Search servers"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </InputGroup>

      <Popover>
        <PopoverTrigger>
          <button type="button" className="inline-flex h-8 items-center gap-2 rounded border px-2 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilters > 0 ? <Badge>{activeFilters}</Badge> : null}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-3 p-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Status</label>
            <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as "all" | "online" | "degraded" | "offline")} className="h-8 w-full rounded border bg-background px-2 text-xs">
              <option value="all">All</option>
              <option value="online">Online</option>
              <option value="degraded">Degraded</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">CPU</label>
            <select value={cpuFilter} onChange={(event) => onCpuFilterChange(event.target.value as "all" | "high")} className="h-8 w-full rounded border bg-background px-2 text-xs">
              <option value="all">All usage</option>
              <option value="high">High (&gt; 80%)</option>
            </select>
          </div>

          {onGroupChange ? (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Group</label>
              <select value={groupId} onChange={(event) => onGroupChange(event.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs">
                <option value="">All groups</option>
                {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
