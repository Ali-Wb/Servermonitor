"use client";

import { Pencil, Trash2, Zap } from "lucide-react";

import { Sparkline } from "@/components/charts/Sparkline";
import type { HistoryPoint } from "@/lib/api";
import type { CustomWidget, Snapshot } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface CustomWidgetPanelProps {
  widget: CustomWidget;
  snapshot: Snapshot;
  history?: HistoryPoint[];
  isAdmin?: boolean;
  onEdit?: (widgetId: string) => void;
  onDelete?: (widgetId: string) => void;
}

type EvalStatus = "ok" | "missing" | "infinity" | "parse_error";

interface EvalResult {
  value: number;
  status: EvalStatus;
}

class Parser {
  private readonly src: string;
  private index = 0;
  private readonly snapshot: Snapshot;

  public constructor(source: string, snapshot: Snapshot) {
    this.src = source;
    this.snapshot = snapshot;
  }

  public parse(): EvalResult {
    try {
      const value = this.parseExpression();
      this.skipWhitespace();
      if (this.index !== this.src.length) throw new Error("Unexpected token");
      if (Number.isNaN(value)) return { value, status: "missing" };
      if (!Number.isFinite(value)) return { value, status: "infinity" };
      return { value, status: "ok" };
    } catch {
      return { value: Number.NaN, status: "parse_error" };
    }
  }

  private parseExpression(): number {
    let value = this.parseTerm();
    while (true) {
      this.skipWhitespace();
      const op = this.peek();
      if (op !== "+" && op !== "-") break;
      this.index += 1;
      const right = this.parseTerm();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }

  private parseTerm(): number {
    let value = this.parseFactor();
    while (true) {
      this.skipWhitespace();
      const op = this.peek();
      if (op !== "*" && op !== "/") break;
      this.index += 1;
      const right = this.parseFactor();
      if (op === "/" && right === 0) {
        return Number.NaN;
      }
      value = op === "*" ? value * right : value / right;
    }
    return value;
  }

  private parseFactor(): number {
    this.skipWhitespace();
    if (this.match("(")) {
      const value = this.parseExpression();
      this.consume(")");
      return value;
    }

    if (this.match("Math.min(")) {
      const left = this.parseExpression();
      this.consume(",");
      const right = this.parseExpression();
      this.consume(")");
      return Math.min(left, right);
    }

    if (this.match("Math.max(")) {
      const left = this.parseExpression();
      this.consume(",");
      const right = this.parseExpression();
      this.consume(")");
      return Math.max(left, right);
    }

    if (this.peek() === "-" || /[0-9]/.test(this.peek())) {
      return this.parseNumber();
    }

    return this.resolvePath();
  }

  private parseNumber(): number {
    const start = this.index;
    if (this.peek() === "-") this.index += 1;
    while (/[0-9]/.test(this.peek())) this.index += 1;
    if (this.peek() === ".") {
      this.index += 1;
      while (/[0-9]/.test(this.peek())) this.index += 1;
    }
    const raw = this.src.slice(start, this.index);
    const value = Number(raw);
    if (Number.isNaN(value)) throw new Error("Bad number");
    return value;
  }

  private resolvePath(): number {
    const tokenStart = this.index;
    while (this.index < this.src.length && /[A-Za-z0-9_\[\]\.]/.test(this.src[this.index])) {
      this.index += 1;
    }
    const path = this.src.slice(tokenStart, this.index);
    if (path.length === 0) throw new Error("Missing path");

    const normalized = path.replace(/\[(\d+)\]/g, ".$1");
    const segments = normalized.split(".").filter((segment) => segment.length > 0);

    let current: unknown = this.snapshot as unknown;
    for (const segment of segments) {
      if (current == null) return Number.NaN;
      if (Array.isArray(current)) {
        const index = Number(segment);
        if (!Number.isInteger(index) || index < 0 || index >= current.length) return Number.NaN;
        current = current[index];
        continue;
      }
      if (typeof current !== "object") return Number.NaN;
      current = (current as Record<string, unknown>)[segment];
    }

    if (typeof current !== "number") return Number.NaN;
    return current;
  }

  private skipWhitespace() {
    while (this.index < this.src.length && /\s/.test(this.src[this.index])) this.index += 1;
  }

  private peek(): string {
    return this.src[this.index] ?? "";
  }

  private match(text: string): boolean {
    this.skipWhitespace();
    if (this.src.slice(this.index, this.index + text.length) === text) {
      this.index += text.length;
      return true;
    }
    return false;
  }

  private consume(text: string) {
    this.skipWhitespace();
    if (!this.match(text)) throw new Error(`Expected ${text}`);
  }
}

function evaluateExpression(expression: string, snapshot: Snapshot): EvalResult {
  return new Parser(expression, snapshot).parse();
}

export function CustomWidgetPanel({ widget, snapshot, history = [], isAdmin = false, onEdit, onDelete }: CustomWidgetPanelProps) {
  const result = evaluateExpression(widget.expression, snapshot);
  const color = result.value >= widget.thresholdCrit ? "text-red-500" : result.value >= widget.thresholdWarn ? "text-amber-500" : widget.color;

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <h3 className="text-sm font-medium">{widget.title}</h3>
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Edit widget" className="rounded p-1 hover:bg-muted" onClick={() => onEdit?.(widget.id)}><Pencil className="h-4 w-4" /></button>
            <button type="button" aria-label="Delete widget" className="rounded p-1 hover:bg-muted" onClick={() => onDelete?.(widget.id)}><Trash2 className="h-4 w-4" /></button>
          </div>
        ) : null}
      </div>

      <div className={cn("font-mono text-3xl font-semibold", color)}>
        {result.status === "parse_error" ? <span className="text-red-500">ERR</span> : result.status === "infinity" ? "∞" : result.status === "missing" ? "—" : result.value.toFixed(2)}
        <span className="ml-2 text-sm text-muted-foreground">{widget.unit}</span>
      </div>

      <div className="mt-3">
        <Sparkline values={history.map((point) => point.value)} color={widget.color} />
      </div>
    </section>
  );
}
