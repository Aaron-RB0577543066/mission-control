"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { type GatewayConfig, loadGatewayConfig, saveGatewayConfig, clearGatewayConfig, gatewayFetch } from "../lib/gateway";

type GatewayStatus = "unconfigured" | "checking" | "ok" | "error";

type GatewayContextValue = {
  config: GatewayConfig | null;
  status: GatewayStatus;
  statusError: string;
  setConfig: (cfg: GatewayConfig) => void;
  disconnect: () => void;
  call: (method: string, params?: unknown) => Promise<unknown>;
};

const GatewayContext = createContext<GatewayContextValue>({
  config: null,
  status: "unconfigured",
  statusError: "",
  setConfig: () => {},
  disconnect: () => {},
  call: async () => null,
});

export function GatewayProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<GatewayConfig | null>(null);
  const [status, setStatus] = useState<GatewayStatus>("unconfigured");
  const [statusError, setStatusError] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const cfg = loadGatewayConfig();
    if (cfg) {
      setConfigState(cfg);
    }
  }, []);

  // Auto-check when config changes
  useEffect(() => {
    if (!config) {
      setStatus("unconfigured");
      return;
    }
    setStatus("checking");
    setStatusError("");
    gatewayFetch("health", {}, config)
      .then(() => setStatus("ok"))
      .catch((err: Error) => {
        setStatus("error");
        setStatusError(err.message);
      });
  }, [config]);

  const setConfig = useCallback((cfg: GatewayConfig) => {
    saveGatewayConfig(cfg);
    setConfigState(cfg);
  }, []);

  const disconnect = useCallback(() => {
    clearGatewayConfig();
    setConfigState(null);
    setStatus("unconfigured");
    setStatusError("");
  }, []);

  const call = useCallback(async (method: string, params?: unknown) => {
    return gatewayFetch(method, params ?? {}, config);
  }, [config]);

  return (
    <GatewayContext.Provider value={{ config, status, statusError, setConfig, disconnect, call }}>
      {children}
    </GatewayContext.Provider>
  );
}

export function useGateway() {
  return useContext(GatewayContext);
}
