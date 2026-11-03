"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  EventHeader,
  LoadState,
  Copy,
  useEvent,
  api,
  randomToken,
} from "./shared";
import { formatSlot, tally } from "@/lib/domain";
export function Invite({ code }: { code: string }) {
  const { data, error } = useEvent(code);
  const [origin, setOrigin] = useState(""),
    [token, setToken] = useState("");
  useEffect(() => {
    setOrigin(location.origin);
    setToken(new URLSearchParams(location.hash.slice(1)).get("admin") || "");
  }, []);
  if (!data) return <LoadState error={error} />;
  const invite = `${origin}/events/${code}/respond`;
  return (
    <div className="page">
      <EventHeader data={data} active="invite" />
      <section className="panel">
        <h2>好時間，從分享開始</h2>
        <p className="muted">
          將 QR Code 或邀請連結傳給朋友，不用註冊即可填寫。
        </p>
        <div className="share-grid">
          <div className="qr">
            {origin && (
              <QRCodeSVG
                value={invite}
                size={155}
                level="M"
                title="活動邀請 QR Code"
              />
            )}
          </div>
          <div>
            <span className="muted">活動代碼</span>
            <div className="code">{code}</div>
            <Copy value={invite} />
            <Link className="primary" href={`/events/${code}/respond`}>
              先填寫我的時間 →
            </Link>
          </div>
        </div>
      </section>
      {token && (
        <section className="panel">
          <h2>只屬於發起人的管理連結</h2>
          <div className="notice">
            請立即複製並保存。此連結能確認最終時間，請勿傳送到公開群組。遺失後無法找回。
          </div>
          <Copy
            label="複製管理連結"
            value={`${origin}/events/${code}/results#admin=${token}`}
          />
          <Link
            className="secondary"
            href={`/events/${code}/results#admin=${token}`}
          >
            前往管理及統計 →
          </Link>
        </section>
      )}
      <p className="muted">
        知道活動代碼的人可查看暱稱及時間選擇，請勿輸入敏感資料。
      </p>
    </div>
  );
}
export function Respond({ code }: { code: string }) {
  const { data, error } = useEvent(code);
  const [nickname, setNickname] = useState(""),
    [choices, setChoices] = useState<string[]>([]),
    [token, setToken] = useState(""),
    [edit, setEdit] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [saved, setSaved] = useState(""),
    [loadingEdit, setLoadingEdit] = useState(false),
    [editError, setEditError] = useState(false);
  useEffect(() => {
    let active = true;
    const explicit = new URLSearchParams(location.hash.slice(1)).get("edit");
    let remembered: string | null = null;
    try {
      remembered = localStorage.getItem(`ju-time:response:${code}`);
    } catch {
      /* Private browsing can disable storage. */
    }
    const t = explicit || remembered;
    setSaved("");
    setMessage("");
    setEditError(false);
    setNickname("");
    setChoices([]);
    setEdit(!!t);
    setToken(t || randomToken());
    setLoadingEdit(!!t);
    if (t) {
      api(`/api/events/${code}`, { action: "load", token: t })
        .then((d) => {
          if (!active) return;
          setNickname(d.nickname);
          setChoices(d.choices);
          try {
            localStorage.setItem(`ju-time:response:${code}`, t);
          } catch {
            /* The private link remains available. */
          }
        })
        .catch((e) => {
          if (!active) return;
          setMessage(e.message);
          setEditError(true);
        })
        .finally(() => {
          if (active) setLoadingEdit(false);
        });
    }
    return () => {
      active = false;
    };
  }, [code]);
  if (!data) return <LoadState error={error} />;
  return (
    <div className="page">
      <EventHeader data={data} active="respond" />
      {data.final_slot_id && (
        <div className="notice success">
          活動已確認：
          {formatSlot(data.slots.find((s) => s.id === data.final_slot_id)!)}
          。目前已停止收集及修改答案。
        </div>
      )}
      {saved ? (
        <section className="panel">
          <h2>你的時間，收到了！</h2>
          <p className="muted">
            此瀏覽器會嘗試記住你的答案憑證，返回「填寫時間」即可修改原紀錄。請仍保存下方修改連結，供其他裝置或清除瀏覽資料後使用。共用電腦請使用無痕視窗。
          </p>
          <Copy label="複製修改連結" value={saved} />
          <div className="actions">
            <Link className="primary" href={`/events/${code}/results`}>
              查看統計結果 →
            </Link>
            <button className="secondary" onClick={() => setSaved("")}>
              修改我的答案
            </button>
          </div>
        </section>
      ) : (
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            try {
              await api(`/api/events/${code}`, {
                nickname,
                choices,
                token,
                edit,
              });
              const url = `${location.origin}/events/${code}/respond#edit=${token}`;
              history.replaceState(null, "", url);
              try {
                localStorage.setItem(`ju-time:response:${code}`, token);
              } catch {
                /* Always offer the private link if storage is unavailable. */
              }
              setEdit(true);
              setSaved(url);
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>{edit ? "更新你的時間" : "你什麼時候有空？"}</h2>
          <label className="field">
            你的暱稱
            <input
              required
              maxLength={40}
              value={nickname}
              disabled={loadingEdit || editError}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="讓大家知道你是誰"
            />
          </label>
          <p className="muted">
            勾選所有可以參加的時段。若都無法參加，可不勾選直接提交。
          </p>
          {data.slots.map((s) => (
            <label className="choice" key={s.id}>
              <input
                type="checkbox"
                disabled={!!data.final_slot_id || loadingEdit || editError}
                checked={choices.includes(s.id)}
                onChange={(e) =>
                  setChoices(
                    e.target.checked
                      ? [...choices, s.id]
                      : choices.filter((id) => id !== s.id),
                  )
                }
              />
              {formatSlot(s)}
            </label>
          ))}
          <div className="notice">
            免登入無法完全防止重複填寫。已提交過的朋友，請使用原本的修改連結；暱稱相同不代表同一人。你的暱稱與選擇會顯示在活動統計中。
          </div>
          {message && (
            <div className="error" role="alert">
              {message}
            </div>
          )}
          <button
            className="primary"
            disabled={
              busy || loadingEdit || editError || !token || !!data.final_slot_id
            }
          >
            {loadingEdit
              ? "載入原有答案…"
              : busy
                ? "儲存中…"
                : edit
                  ? "更新原有答案"
                  : "提交我的時間"}
          </button>
        </form>
      )}
    </div>
  );
}
export function Results({ code }: { code: string }) {
  const { data, setData, error } = useEvent(code);
  const [token, setToken] = useState(""),
    [selected, setSelected] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setToken(new URLSearchParams(location.hash.slice(1)).get("admin") || "");
  }, []);
  if (!data) return <LoadState error={error} />;
  const rows = tally(data.slots, data.participants),
    total = data.participants.length,
    max = Math.max(0, ...rows.map((r) => r.count)),
    best = rows.filter((r) => r.count === max && max > 0);
  return (
    <div className="page wide">
      <EventHeader data={data} active="results" />
      {data.final_slot_id && (
        <div className="notice success">
          <strong>相聚時間已確認</strong>
          <br />
          {formatSlot(data.slots.find((s) => s.id === data.final_slot_id)!)}
        </div>
      )}
      <div className="stats">
        <div className="stat">
          <strong>{total}</strong>
          <span>參與者紀錄</span>
        </div>
        <div className="stat">
          <strong>{data.slots.length}</strong>
          <span>候選時段</span>
        </div>
        <div className="stat">
          <strong>
            {max}
            <small className="muted"> 人</small>
          </strong>
          <span>最佳時段可參加人數</span>
        </div>
      </div>
      <section className="panel" style={{ marginTop: 20 }}>
        <h2>找到大家的時間交集</h2>
        {!total && (
          <p className="empty">還沒有人填寫。分享邀請，讓大家一起找時間！</p>
        )}
        {total > 0 && max === 0 && (
          <div className="notice">
            目前大家都無法參加候選時段，尚無最佳共同時段。
          </div>
        )}
        {best.length > 0 && (
          <div className="notice">
            {max === total
              ? "找到所有人都能參加的時段！"
              : `目前最多 ${max} / ${total} 人可參加，尚未有全員共同時段。`}
            {best.length > 1 && ` 共有 ${best.length} 個時段並列最佳。`}
          </div>
        )}
        {rows.map((s) => (
          <div className="result-row" key={s.id}>
            <div className="result-top">
              <span>
                {formatSlot(s)}
                {s.count === max && max > 0 && (
                  <span className="badge">最佳時段</span>
                )}
              </span>
              <strong>
                {s.count} / {total} 人
              </strong>
            </div>
            <div className="bar">
              <span
                style={{ width: `${total ? (s.count / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
        <div className="actions">
          <button
            className="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMessage("");
              try {
                setData(await api(`/api/events/${code}`));
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            更新統計
          </button>
          <Link className="secondary" href={`/events/${code}/invite`}>
            邀請更多朋友
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2>誰已經填寫了？</h2>
        <div className="participants">
          {data.participants.map((p, i) => (
            <span className="person" key={i}>
              {p.nickname} · {p.choices.length} 個時段
            </span>
          ))}
          {!total && <p className="muted">等待第一位朋友加入。</p>}
        </div>
        <p className="muted">
          紀錄數不代表不重複人數；免登入無法驗證填寫者身分。
        </p>
      </section>
      {token && !data.final_slot_id && (
        <section className="panel">
          <h2>發起人：確認最終時間</h2>
          <p className="muted">
            確認後將停止收集及修改答案，且無法更改。請先與參與者確認。
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                !window.confirm(
                  "確定此時段為最終時間？確認後無法更改，並停止接受答案。",
                )
              )
                return;
              setBusy(true);
              setMessage("");
              try {
                await api(`/api/events/${code}`, {
                  action: "confirm",
                  token,
                  slotId: selected,
                });
                setData(await api(`/api/events/${code}`));
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {data.slots.map((s) => (
              <label className="choice" key={s.id}>
                <input
                  type="radio"
                  name="final"
                  required
                  value={s.id}
                  checked={selected === s.id}
                  onChange={() => setSelected(s.id)}
                />
                {formatSlot(s)}
              </label>
            ))}
            <button className="primary" disabled={busy || !selected}>
              確認最終活動時間
            </button>
          </form>
        </section>
      )}
      {message && (
        <div role="alert" className="error">
          {message}
        </div>
      )}
      <p className="muted">
        統計來自 Supabase 儲存的答案。需要最新資料時，請點選「更新統計」。
      </p>
    </div>
  );
}
