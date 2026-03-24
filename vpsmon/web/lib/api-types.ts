export interface AgentResponse<T> {
  ok: boolean;
  ts: number;
  data: T;
  error?: string;
}
