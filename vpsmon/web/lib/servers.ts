import net from "node:net";
import tls from "node:tls";

import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

const ServerConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  host: z.string(),
  port: z.number().int().positive(),
  tls: z.boolean().default(false),
  ca: z.string().optional(),
  servername: z.string().optional(),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

const ServersSchema = z.array(ServerConfigSchema);

function loadServers(): ServerConfig[] {
  const fromEnv = process.env.VPSMON_SERVERS;
  if (fromEnv) {
    const parsed = ServersSchema.safeParse(JSON.parse(fromEnv));
    if (parsed.success) return parsed.data;
  }
  return [{ id: "local", name: "Localhost", host: "127.0.0.1", port: 7070, tls: false }];
}

export function getServers(): ServerConfig[] {
  return loadServers();
}

export function getServer(id: string): ServerConfig | undefined {
  return loadServers().find((s) => s.id === id);
}

export async function agentRequest(
  server: ServerConfig,
  payload: Record<string, unknown>,
  timeoutMs: number = 3000,
): Promise<unknown> {
  const reqPayload = payload.cmd === "history"
    ? { ...payload, maxPoints: 300 }
    : payload;

  const body = `${JSON.stringify(reqPayload)}\n`;

  return new Promise((resolve, reject) => {
    let response = "";
    const onData = (chunk: Buffer | string) => {
      response += chunk.toString("utf8");
      if (response.includes("\n")) {
        const line = response.split("\n")[0];
        try {
          resolve(JSON.parse(line));
        } catch (error) {
          Sentry.captureException(error, {
            tags: { scope: "agent_tcp", server: server.id, stage: "parse_response" },
            extra: { response: line.slice(0, 500) },
          });
          reject(error);
        }
        socket.destroy();
      }
    };

    const onError = (error: Error) => {
      Sentry.captureException(error, {
        tags: { scope: "agent_tcp", server: server.id, stage: "socket" },
        extra: { host: server.host, port: server.port, tls: server.tls, payload: reqPayload },
      });
      reject(error);
    };

    const socket = server.tls
      ? tls.connect({ host: server.host, port: server.port, rejectUnauthorized: false, servername: server.servername })
      : net.connect({ host: server.host, port: server.port });

    socket.setTimeout(timeoutMs, () => {
      Sentry.captureMessage("agent tcp timeout", {
        level: "warning",
        tags: { scope: "agent_tcp", server: server.id, stage: "timeout" },
        extra: { timeoutMs, host: server.host, port: server.port, tls: server.tls, payload: reqPayload },
      });
      socket.destroy(new Error("agent timeout"));
    });

    socket.once("connect", () => {
      socket.write(body);
    });
    socket.on("data", onData);
    socket.once("error", onError);
  });
}
