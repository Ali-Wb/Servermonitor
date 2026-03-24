"use client";

import { useMemo, useState } from "react";

import type { ServerSummary } from "@/lib/api";
import type { ServerGroup } from "@/lib/schemas";

interface GroupManagementViewProps {
  initialGroups: ServerGroup[];
  servers: ServerSummary[];
}

interface DraftState {
  name: string;
  color: string;
  description: string;
  serverIds: string[];
}

const EMPTY_DRAFT: DraftState = {
  name: "",
  color: "#8b5cf6",
  description: "",
  serverIds: [],
};

export function GroupManagementView({ initialGroups, servers }: GroupManagementViewProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);

  const editing = useMemo(() => groups.find((group) => group.id === editingId) ?? null, [editingId, groups]);

  const startCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const startEdit = (group: ServerGroup) => {
    setEditingId(group.id);
    setDraft({
      name: group.name,
      color: group.color,
      description: group.description ?? "",
      serverIds: [...group.serverIds],
    });
  };

  const save = async () => {
    const payload = {
      name: draft.name,
      color: draft.color,
      description: draft.description.length > 0 ? draft.description : undefined,
      serverIds: draft.serverIds,
    };

    if (editing) {
      const response = await fetch(`/api/groups/${encodeURIComponent(editing.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return;
      const next = await response.json() as ServerGroup;
      setGroups((prev) => prev.map((item) => item.id === next.id ? next : item));
      return;
    }

    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return;
    const created = await response.json() as ServerGroup;
    setGroups((prev) => [created, ...prev]);
  };

  const removeGroup = async (groupId: string) => {
    const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, { method: "DELETE" });
    if (!response.ok) return;
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
    if (editingId === groupId) {
      setEditingId(null);
      setDraft(EMPTY_DRAFT);
    }
  };

  const toggleServer = (serverId: string) => {
    setDraft((prev) => ({
      ...prev,
      serverIds: prev.serverIds.includes(serverId)
        ? prev.serverIds.filter((id) => id !== serverId)
        : [...prev.serverIds, serverId],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{editing ? "Edit group" : "Create group"}</h2>
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={startCreate}>New</button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input className="h-9 rounded border bg-background px-2 text-sm" placeholder="Group name" value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
          <input className="h-9 rounded border bg-background px-2 text-sm" type="color" value={draft.color} onChange={(event) => setDraft((prev) => ({ ...prev, color: event.target.value }))} />
          <textarea className="min-h-20 rounded border bg-background p-2 text-sm md:col-span-2" placeholder="Description" value={draft.description} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} />
        </div>

        <div className="mt-3 rounded border p-2">
          <p className="mb-2 text-xs font-medium">Servers</p>
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            {servers.map((server) => (
              <label key={server.id} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={draft.serverIds.includes(server.id)} onChange={() => toggleServer(server.id)} />
                <span>{server.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <button type="button" className="rounded border px-3 py-1 text-xs" onClick={() => void save()} disabled={draft.name.trim().length === 0}>Save</button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Groups</h2>
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground"><tr><th>Name</th><th>Color</th><th>Servers</th><th>Actions</th></tr></thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className="border-t">
                <td className="py-1">{group.name}</td>
                <td><span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} /></td>
                <td>{group.serverIds.length}</td>
                <td className="space-x-2">
                  <button type="button" className="rounded border px-2 py-0.5" onClick={() => startEdit(group)}>Edit</button>
                  <button type="button" className="rounded border px-2 py-0.5" onClick={() => void removeGroup(group.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
