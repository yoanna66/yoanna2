"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { EventData } from "@/lib/domain";
export async function api(path: string, body?: unknown) {
  const r = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "連線失敗，請稍後再試");
  return data;
}
export function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
}
export function useEvent(code: string) {
  const [data, setData] = useState<EventData | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api(`/api/events/${code}`)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [code]);
  return { data, setData, error };
}
export function Copy({
  value,
  label = "複製連結",
}: {
  value: string;
  label?: string;
}) {
  const [message, setMessage] = useState("");
  return (
    <>
      <div className="copy-row">
        <input
          aria-label={label}
          value={value}
          readOnly
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          className="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setMessage("已複製");
            } catch {
              setMessage("請選取欄位中的完整連結並手動複製");
            }
          }}
        >
          {label}
        </button>
      </div>
      <small role="status">{message}</small>
    </>
  );
}
export function EventHeader({
  data,
  active,
}: {
  data: EventData;
  active: string;
}) {
  return (
    <>
      <Link href="/" className="back">
        ← 返回首頁
      </Link>
      <div className="page-heading">
        <div className="eyebrow">TIME TOGETHER · {data.code}</div>
        <h1>{data.title}</h1>
        <p>{data.organizer} 發起 · 所有時間皆為台灣時間（UTC+8）</p>
      </div>
      <div className="tabs">
        {[
          ["invite", "邀請朋友"],
          ["respond", "填寫時間"],
          ["results", "統計結果"],
        ].map(([path, label]) => (
          <Link
            key={path}
            className={active === path ? "active" : ""}
            href={`/events/${data.code}/${path}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </>
  );
}
export function LoadState({ error }: { error: string }) {
  return (
    <div className="page">
      <div className={error ? "error" : "loading"} role="status">
        {error || "正在載入活動…"}
      </div>
      {error && (
        <>
          <button className="secondary" onClick={() => location.reload()}>
            重新載入
          </button>{" "}
          <Link href="/">返回首頁</Link>
        </>
      )}
    </div>
  );
}
