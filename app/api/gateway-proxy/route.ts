/**
 * Server-side proxy: receives JSON-RPC method + params from client,
 * calls the Gateway via WebSocket, returns the result.
 * 
 * This avoids CORS/origin issues since the WebSocket call is made server-side.
 */
import { NextResponse } from "next/server";
import { WebSocket } from "ws";
import { randomUUID } from "crypto";

const DEFAULT_TIMEOUT_MS = 15000;

interface GatewayRequest {
  method: string;
  params?: unknown;
}

interface ConnectFrame {
  kind: "connect";
  token: string;
  instanceId: string;
  clientName: string;
  version?: string;
  protocol?: number;
  mode?: string;
}

interface RequestFrame {
  kind: "request";
  id: string;
  method: string;
  params: unknown;
}

type Frame = ConnectFrame | RequestFrame;

function buildWsUrl(httpUrl: string): string {
  // Convert http:// → ws://, https:// → wss://
  return httpUrl
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://");
}

async function callGatewayWs(opts: {
  wsUrl: string;
  token: string;
  method: string;
  params: unknown;
  timeoutMs?: number;
}): Promise<unknown> {
  const { wsUrl, token, method, params, timeoutMs = DEFAULT_TIMEOUT_MS } = opts;
  const instanceId = randomUUID();
  const requestId = randomUUID();

  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        ws.terminate();
        reject(new Error(`Gateway timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    const ws = new WebSocket(wsUrl, {
      maxPayload: 10 * 1024 * 1024,
      rejectUnauthorized: false, // allow self-signed for dev
    });

    function settle(fn: () => void) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      ws.terminate();
      fn();
    }

    ws.on("error", (err) => {
      settle(() => reject(new Error(`WebSocket error: ${err.message}`)));
    });

    ws.on("close", (code, reason) => {
      if (!settled) {
        settle(() => reject(new Error(`WebSocket closed: code=${code} reason=${reason}`)));
      }
    });

    ws.on("open", () => {
      // Send connect frame
      const connectFrame: Frame = {
        kind: "connect",
        token,
        instanceId,
        clientName: "mission-control",
        version: "0.2.0",
        protocol: 1,
        mode: "operator",
      };
      ws.send(JSON.stringify(connectFrame));
    });

    ws.on("message", (data) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }

      const kind = msg.kind as string;

      if (kind === "hello") {
        if (msg.ok === false) {
          settle(() => reject(new Error(`Auth failed: ${msg.error || "unauthorized"}`)));
          return;
        }
        // Connected! Now send the RPC request
        const reqFrame: RequestFrame = {
          kind: "request",
          id: requestId,
          method,
          params: params ?? {},
        };
        ws.send(JSON.stringify(reqFrame));
        return;
      }

      if (kind === "response" && msg.id === requestId) {
        if (msg.ok) {
          settle(() => resolve(msg.result));
        } else {
          const err = msg.error as { message?: string } | undefined;
          settle(() => reject(new Error(err?.message || "Gateway RPC error")));
        }
        return;
      }

      // Ignore events and other frames
    });
  });
}

export async function POST(req: Request) {
  const gatewayUrl = req.headers.get("X-Gateway-URL") || "";
  const gatewayToken = req.headers.get("X-Gateway-Token") || "";

  if (!gatewayUrl || !gatewayToken) {
    return NextResponse.json(
      { error: { message: "Missing X-Gateway-URL or X-Gateway-Token headers" } },
      { status: 400 }
    );
  }

  let body: GatewayRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const { method, params } = body;
  if (!method) {
    return NextResponse.json(
      { error: { message: "Missing 'method' in request body" } },
      { status: 400 }
    );
  }

  try {
    const wsUrl = buildWsUrl(gatewayUrl);
    const result = await callGatewayWs({
      wsUrl,
      token: gatewayToken,
      method,
      params: params ?? {},
    });
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: { message } },
      { status: 502 }
    );
  }
}
