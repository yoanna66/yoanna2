import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
export function db() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("CONFIG");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function reply(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function body(req: Request) {
  if (Number(req.headers.get("content-length") || 0) > 20000)
    throw new Error("INPUT");
  const text = await req.text();
  if (text.length > 20000) throw new Error("INPUT");
  return JSON.parse(text);
}
export function failure(e: unknown) {
  const message = e instanceof Error ? e.message : "";
  return reply(
    {
      error:
        message === "CONFIG"
          ? "尚未設定 Supabase，請依 README 完成環境設定。"
          : "操作未完成，請檢查輸入或稍後重試。",
    },
    message === "CONFIG" ? 503 : 400,
  );
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) throw new Error("ORIGIN");
}
