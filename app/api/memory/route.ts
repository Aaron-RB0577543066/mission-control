import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = "/home/node/.openclaw/workspace";

const FILES = ["SOUL.md", "MEMORY.md", "AGENTS.md", "IDENTITY.md", "AGENTS_ROSTER.md"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (file) {
    // Single file
    const safe = path.basename(file);
    if (!FILES.includes(safe)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    try {
      const content = fs.readFileSync(path.join(WORKSPACE, safe), "utf-8");
      return NextResponse.json({ file: safe, content });
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }

  // List available files
  const available = FILES.filter((f) => {
    try {
      fs.accessSync(path.join(WORKSPACE, f));
      return true;
    } catch {
      return false;
    }
  });

  return NextResponse.json({ files: available });
}
