"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { api } from "@/components/shared";
export default function Create() {
  const [slots, setSlots] = useState([{ start: "", end: "" }]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="page">
      <Link href="/" className="back">
        ← 返回首頁
      </Link>
      <div className="page-heading">
        <span className="eyebrow">A LITTLE PLAN, A GREAT TIME</span>
        <h1>讓下一次相聚，開始吧。</h1>
        <p>選幾個可能的時間，把剩下的交給大家。</p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const form = new FormData(e.currentTarget);
          try {
            if (slots.some((s) => !s.start || !s.end || s.end <= s.start))
              throw new Error("每個時段的結束時間都必須晚於開始時間。");
            if (
              new Set(slots.map((s) => s.start + "|" + s.end)).size !==
              slots.length
            )
              throw new Error("候選時段不可重複，請移除重複的時段。");
            const data = await api("/api/events", {
              title: form.get("title"),
              organizer: form.get("organizer"),
              slots: slots.map((s) => ({
                start: s.start + ":00+08:00",
                end: s.end + ":00+08:00",
              })),
            });
            location.assign(`/events/${data.code}/invite#admin=${data.token}`);
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <section className="panel">
          <h2>01　活動基本資料</h2>
          <label className="field">
            活動名稱
            <input
              name="title"
              required
              maxLength={80}
              placeholder="例如：好久不見的週末聚餐"
            />
          </label>
          <label className="field">
            發起人暱稱
            <input
              name="organizer"
              required
              maxLength={40}
              placeholder="大家怎麼稱呼你？"
            />
          </label>
        </section>
        <section className="panel">
          <h2>02　候選日期與時間</h2>
          <p className="muted">
            使用台灣時間（Asia/Taipei）。最多 40 個時段，可跨日。
          </p>
          {slots.map((s, i) => (
            <div className="slot-input" key={i}>
              {(["start", "end"] as const).map((key) => (
                <label key={key}>
                  {key === "start" ? "開始時間" : "結束時間"}
                  <input
                    type="datetime-local"
                    aria-label={`時段 ${i + 1} ${key === "start" ? "開始" : "結束"}時間`}
                    required
                    value={s[key]}
                    onChange={(e) =>
                      setSlots(
                        slots.map((x, j) =>
                          j === i ? { ...x, [key]: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
              ))}
              <button
                type="button"
                className="icon-button"
                aria-label={`移除時段 ${i + 1}`}
                disabled={slots.length === 1}
                onClick={() => setSlots(slots.filter((_, j) => j !== i))}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="secondary"
            disabled={slots.length >= 40}
            onClick={() => setSlots([...slots, { start: "", end: "" }])}
          >
            <Plus size={16} />
            新增候選時段
          </button>
        </section>
        <div className="notice">
          建立後會產生專屬管理連結，請妥善保存。只有持有管理憑證的人才能確認最終時間。
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "建立中…" : "建立活動，邀請朋友"}
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
