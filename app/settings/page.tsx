"use client";

import { useState, useEffect } from "react";
import { useGateway } from "../../context/GatewayContext";
import { type GatewayConfig } from "../../lib/gateway";

export default function SettingsPage() {
  const { config, status, statusError, setConfig, disconnect } = useGateway();

  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Populate form from current config
  useEffect(() => {
    if (config) {
      setUrl(config.url);
      setToken(config.token);
    }
  }, [config]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !token.trim()) return;

    const cfg: GatewayConfig = {
      url: url.trim().replace(/\/$/, ""),
      token: token.trim(),
    };
    setConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleDisconnect() {
    disconnect();
    setUrl("");
    setToken("");
  }

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    ok: { bg: "#F0FDF4", text: "#15803D", border: "#86EFAC" },
    error: { bg: "#FEF2F2", text: "#DC2626", border: "#FCA5A5" },
    checking: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
    unconfigured: { bg: "#F5F5F4", text: "#78716C", border: "#E7E5E4" },
  };
  const sc = statusColors[status] || statusColors.unconfigured;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
        <p className="text-stone-500 text-sm mt-1">
          Configure your OpenClaw Gateway connection
        </p>
      </div>

      {/* Connection status banner */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl border mb-8 text-sm"
        style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
      >
        <span className="text-base mt-0.5">
          {status === "ok" ? "✅" : status === "error" ? "❌" : status === "checking" ? "⏳" : "⚙️"}
        </span>
        <div>
          <div className="font-semibold">
            {status === "ok" && "Connected to Gateway"}
            {status === "error" && "Connection failed"}
            {status === "checking" && "Connecting…"}
            {status === "unconfigured" && "Not configured"}
          </div>
          {status === "ok" && config?.url && (
            <div className="text-xs mt-0.5 opacity-75 font-mono">{config.url}</div>
          )}
          {status === "error" && statusError && (
            <div className="text-xs mt-0.5 font-mono opacity-80">{statusError}</div>
          )}
          {status === "unconfigured" && (
            <div className="text-xs mt-0.5 opacity-75">
              Enter your Gateway URL and token below to get started.
            </div>
          )}
        </div>
      </div>

      {/* Config form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
        <h2 className="text-lg font-semibold text-stone-900">Gateway Connection</h2>

        {/* Gateway URL */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Gateway URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://91.98.128.6:18789"
            required
            className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
          <p className="text-xs text-stone-400 mt-1">
            The HTTP URL of your OpenClaw Gateway (e.g. <code className="font-mono">http://91.98.128.6:18789</code>)
          </p>
        </div>

        {/* Token */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Gateway Token
          </label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Your gateway auth token"
              required
              className="w-full px-3 py-2.5 pr-24 rounded-lg border border-stone-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
            >
              {showToken ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Find in <code className="font-mono">openclaw.json</code> → <code className="font-mono">gateway.auth.token</code>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#F97316" }}
          >
            {saved ? "✓ Saved!" : "Save & Connect"}
          </button>

          {config && (
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all"
            >
              Disconnect
            </button>
          )}
        </div>
      </form>

      {/* Help section */}
      <div className="mt-6 bg-stone-50 rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-3">How to find your credentials</h3>
        <ol className="text-sm text-stone-600 space-y-2 list-decimal list-inside">
          <li>
            SSH into your VPS and run:
            <code className="block mt-1 px-3 py-1.5 bg-stone-900 text-stone-100 rounded text-xs font-mono">
              cat ~/.openclaw/openclaw.json | python3 -c &quot;import sys,json; d=json.load(sys.stdin); print(d[&apos;gateway&apos;][&apos;auth&apos;][&apos;token&apos;])&quot;
            </code>
          </li>
          <li>
            Gateway URL is <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">http://YOUR_VPS_IP:18789</code>
          </li>
          <li>Credentials are stored in your browser&apos;s localStorage (never sent to third parties)</li>
        </ol>
      </div>
    </div>
  );
}
