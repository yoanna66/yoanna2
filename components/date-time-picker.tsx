"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
const pad = (n: number) => String(n).padStart(2, "0");
export function DateTimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [date = "", time = ""] = value.split("T");
  const [hour = "", minute = ""] = time.split(":");
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const first = new Date(month.year, month.month, 1).getDay();
  const days = new Date(month.year, month.month + 1, 0).getDate();
  function move(delta: number) {
    const d = new Date(month.year, month.month + delta, 1);
    setMonth({ year: d.getFullYear(), month: d.getMonth() });
  }
  return (
    <div className="datetime-picker" ref={root}>
      <span className="datetime-label">{label}</span>
      <div className="datetime-fields">
        <input
          aria-label={`${label}日期`}
          type="text"
          inputMode="numeric"
          placeholder="YYYY-MM-DD"
          pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
          required
          value={date}
          onChange={(e) => onChange(`${e.target.value}T${time}`)}
        />
        <button
          ref={trigger}
          className="calendar-trigger"
          type="button"
          aria-label={`選擇${label}日期`}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(date))
              setMonth({
                year: Number(date.slice(0, 4)),
                month: Number(date.slice(5, 7)) - 1,
              });
            setOpen(!open);
          }}
        >
          <CalendarDays size={18} />
        </button>
        <div
          className="time-fields"
          role="group"
          aria-label={`${label}時刻（24 小時制）`}
        >
          <select
            aria-label={`${label}小時`}
            required
            value={hour}
            onChange={(e) =>
              onChange(`${date}T${e.target.value}:${minute || "00"}`)
            }
          >
            <option value="" disabled>
              時
            </option>
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={pad(i)}>
                {pad(i)}
              </option>
            ))}
          </select>
          <span aria-hidden="true">:</span>
          <select
            aria-label={`${label}分鐘`}
            required
            value={minute}
            onChange={(e) =>
              onChange(`${date}T${hour || "00"}:${e.target.value}`)
            }
          >
            <option value="" disabled>
              分
            </option>
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={pad(i)}>
                {pad(i)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {open && (
        <div
          className="calendar-popover"
          id={id}
          role="dialog"
          aria-label={`${label}月曆`}
        >
          <div className="calendar-toolbar">
            <button
              type="button"
              className="icon-button"
              aria-label="上一個月"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <strong aria-live="polite">
              {month.year} 年 {month.month + 1} 月
            </strong>
            <button
              type="button"
              className="icon-button"
              aria-label="下一個月"
              onClick={() => move(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="date-grid">
            {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
              <span className="weekday" key={d}>
                {d}
              </span>
            ))}
            {Array.from({ length: first }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const day = i + 1,
                key = `${month.year}-${pad(month.month + 1)}-${pad(day)}`;
              return (
                <button
                  type="button"
                  className={date === key ? "selected-date" : ""}
                  aria-label={key}
                  aria-pressed={date === key}
                  key={key}
                  onClick={() => {
                    onChange(`${key}T${time}`);
                    setOpen(false);
                    trigger.current?.focus();
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="muted">點選日期，或在欄位輸入 YYYY-MM-DD</p>
        </div>
      )}
    </div>
  );
}
