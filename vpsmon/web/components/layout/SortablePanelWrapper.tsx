"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Maximize2 } from "lucide-react";
import type { PropsWithChildren } from "react";

interface SortablePanelWrapperProps extends PropsWithChildren {
  id: string;
  title: string;
  onMaximize?: (id: string) => void;
}

export function SortablePanelWrapper({ id, title, onMaximize, children }: SortablePanelWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section ref={setNodeRef} style={style} className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-1">
          <button type="button" className="rounded border p-1" {...attributes} {...listeners}><GripVertical className="h-3 w-3" /></button>
          <span>{title}</span>
        </div>
        {onMaximize ? <button type="button" className="rounded border p-1" onClick={() => onMaximize(id)}><Maximize2 className="h-3 w-3" /></button> : null}
      </div>
      {children}
    </section>
  );
}
