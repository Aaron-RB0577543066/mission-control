/**
 * Server-side proxy: receives JSON-RPC method + params from client,
 * calls the Gateway via WebSocket, returns the result.
 *
 * Protocol notes (reverse-engineered from openclaw-control-ui):
 *   - All frames use `type` field (not `kind`)
 *   - Request frame:  { type: "req", id: string, method: string, params: unknown }
 *   - Response frame: { type: "res", id: string, ok: boolean, payload: unknown, error?: { message: string } }
 *   - Event frame:    { type: "event", event: string, payload: unknown }
 *   - Connect is sent as a regular "req" with method="connect" and a structured params object
 *   - Server sends a connect.challenge event first (with a nonce); resend connect with same id + nonce
 *   - client.id must be "openclaw-control-ui" (a known constant the gateway validates)
 *   - client.mode must be "webchat" (a known constant the gateway validates)
 *   - Origin header must be set to the gateway's own origin (e.g. http://localhost:18789)
 */
import { NextResponse } from "next/server";
import { WebSocket } from "ws";
import { randomUUID } from "crypto";

const DEFAULT_TIMEOUT_MS = 15000;

interface GatewayRequest {
  method: string;
  params?: unknown;
}

/** Outgoing request frame */
interface ReqFrame {
  type: "req";
  id: string;
  method: string;
  params: unknown;
}

/** Incoming response frame */
interface ResFrame {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { message?: string; code?: string };
}

/** Incoming event frame */
interface EventFrame {
  type: "event";
  event: string;
  payload?: unknown;
  seq?: number;
}

type IncomingFrame = ResFrame | EventFrame | { type: string };

/** Build the connect params (protocol v3 format, matching openclaw-control-ui) */
function buildConnectParams(opts: {
  token: string | undefined;
  password: string | undefined;
  instanceId: string;
  nonce?: string;
}) {
  const auth =
    opts.token || opts.password
      ? { token: opts.token, password: opts.password }
      : undefined;

  return {
    minProtocol: 3,
    maxProtocol: 3,
    client: {
      // Must match known constants validated by the gateway
      id: "openclaw-control-ui",
      version: "1.0.0",
      platform: "server",
      mode: "webchat",
      instanceId: opts.instanceId,
    },
    role: "operator",
    scopes: ["operator.admin", "operator.approvals", "operator.pairing"],
    caps: [],
    auth,
    userAgent: "mission-control/1.0.0",
    locale: "en",
    // Include nonce if we received a connect.challenge
    ...(opts.nonce ? { nonce: opts.nonce } : {}),
  };
}

/** Derive the gateway HTTP origin from a ws(s):// URL */
function wsUrlToOrigin(wsUrl: string): string {
  return wsUrl
    .replace(/^wss:\/\//, "https://")
    .replace(/^ws:\/\//, "http://")
    // strip any path
    .replace(/(https?:\/\/[^/]+).*/, "$1");
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
  // Connect request id stays the same across challenge/resend
  const connectReqId = randomUUID();

  // The gateway validates the Origin header; use the gateway's own origin
  const origin = wsUrlToOrigin(wsUrl);

  return new Promise((resolve, reject) => {
    let settled = false;
    let connectResponseReceived = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        ws.terminate();
        reject(new Error(`Gateway timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    const ws = new WebSocket(wsUrl, {
      maxPayload: 10 * 1024 * 1024,
      rejectUnauthorized: false,
      headers: {
        Origin: origin,
      },
    });

    function settle(fn: () => void) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      ws.terminate();
      fn();
    }

    function sendConnect(nonce?: string) {
      const frame: ReqFrame = {
        type: "req",
        id: connectReqId,
        method: "connect",
        params: buildConnectParams({
          token,
          password: undefined,
          instanceId,
          nonce,
        }),
      };
      ws.send(JSON.stringify(frame));
    }

    function sendRequest() {
      const frame: ReqFrame = {
        type: "req",
        id: requestId,
        method,
        params: params ?? {},
      };
      ws.send(JSON.stringify(frame));
    }

    ws.on("error", (err) => {
      settle(() => reject(new Error(`WebSocket error: ${err.message}`)));
    });

    ws.on("close", (code, reason) => {
      if (!settled) {
        settle(() =>
          reject(
            new Error(`WebSocket closed: code=${code} reason=${reason}`)
          )
        );
      }
    });

    ws.on("open", () => {
      // Send connect request immediately on open (challenge may follow)
      sendConnect();
    });

    ws.on("message", (data) => {
      let msg: IncomingFrame;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }

      // Handle events
      if (msg.type === "event") {
        const ev = msg as EventFrame;

        // connect.challenge: gateway wants us to re-send connect with a nonce.
        // The nonce is only used for device crypto-signing; without device
        // signing (which we don't do server-side), we simply resend the same
        // connect frame with the same id. The gateway accepts token auth.
        if (ev.event === "connect.challenge") {
          sendConnect();
          return;
        }
        // Ignore other events
        return;
      }

      // Handle responses
      if (msg.type === "res") {
        const res = msg as ResFrame;

        // Connect response — only handle the first successful one.
        // (After a challenge/resend the gateway may send a second error
        //  response for the duplicate connect; ignore it once we're connected.)
        if (res.id === connectReqId && !connectResponseReceived) {
          if (!res.ok) {
            settle(() =>
              reject(
                new Error(
                  `Auth failed: ${res.error?.message || "unauthorized"}`
                )
              )
            );
            return;
          }
          // Successfully authenticated — send the actual RPC request.
          connectResponseReceived = true;
          sendRequest();
          return;
        }

        // RPC response
        if (res.id === requestId) {
          if (res.ok) {
            settle(() => resolve(res.payload));
          } else {
            settle(() =>
              reject(new Error(res.error?.message || "Gateway RPC error"))
            );
          }
          return;
        }
      }
    });
  });
}

export async function POST(req: Request) {
  const gatewayUrl = req.headers.get("X-Gateway-URL") || "";
  const gatewayToken = req.headers.get("X-Gateway-Token") || "";

  if (!gatewayUrl || !gatewayToken) {
    return NextResponse.json(
      {
        error: {
          message: "Missing X-Gateway-URL or X-Gateway-Token headers",
        },
      },
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

  // Convert http(s):// → ws(s)://
  const wsUrl = gatewayUrl
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://");

  try {
    const result = await callGatewayWs({
      wsUrl,
      token: gatewayToken,
      method,
      params: params ?? {},
    });
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: { message } }, { status: 502 });
  }
}
