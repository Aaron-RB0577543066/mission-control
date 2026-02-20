import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import { GatewayProvider } from "../context/GatewayContext";

export const metadata: Metadata = {
  title: "OpenClaw Mission Control",
  description: "Agent orchestration dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind via CDN — no local build required */}
        <script src="https://cdn.tailwindcss.com" async></script>
      </head>
      <body className="flex h-screen overflow-hidden" style={{ background: "#FAF9F6" }}>
        <GatewayProvider>
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </GatewayProvider>
      </body>
    </html>
  );
}
