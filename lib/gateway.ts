/**
 * Gateway credentials management.
 * Stored in localStorage on the client, passed to API proxy routes via headers.
 */

export type GatewayConfig = {
  url: string;    // e.g. http://91.98.128.6:18789
  token: string;  // gateway auth token
};

const URL_KEY = "mc_gateway_url";
const TOKEN_KEY = "mc_gateway_token";

export function loadGatewayConfig(): GatewayConfig | null {
  if (typeof window === "undefined") return null;
  const url = localStorage.getItem(URL_KEY) || "";
  const token = localStorage.getItem(TOKEN_KEY) || "";
  if (!url || !token) return null;
  return { url, token };
}

export function saveGatewayConfig(config: GatewayConfig): void {
  localStorage.setItem(URL_KEY, config.url);
  localStorage.setItem(TOKEN_KEY, config.token);
}

export function clearGatewayConfig(): void {
  localStorage.removeItem(URL_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Make an API call via the local Next.js proxy.
 * The proxy forwards to the Gateway WebSocket RPC.
 */
export async function gatewayFetch(
  method: string,
  params: unknown = {},
  config?: GatewayConfig | null
): Promise<unknown> {
  const cfg = config ?? loadGatewayConfig();
  if (!cfg) {
    throw new Error("Gateway not configured. Please set URL and token in Settings.");
  }

  const res = await fetch("/api/gateway-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-URL": cfg.url,
      "X-Gateway-Token": cfg.token,
    },
    body: JSON.stringify({ method, params }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Proxy error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || "Gateway error");
  }
  return data.result;
}
