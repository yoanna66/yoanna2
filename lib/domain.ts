import { z } from "zod";
export const codeSchema = z.string().regex(/^[A-F0-9]{12}$/);
export const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const slotSchema = z
  .object({
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
  })
  .refine(
    (s) => Date.parse(s.end) > Date.parse(s.start),
    "結束時間必須晚於開始時間",
  );
export const createSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    organizer: z.string().trim().min(1).max(40),
    slots: z.array(slotSchema).min(1).max(40),
  })
  .refine(
    (v) =>
      new Set(v.slots.map((s) => s.start + "|" + s.end)).size ===
      v.slots.length,
    "候選時段不可重複",
  );
export const responseSchema = z.object({
  nickname: z.string().trim().min(1).max(40),
  choices: z.array(z.string().uuid()).max(40),
  token: tokenSchema,
  edit: z.boolean(),
});
export type Slot = { id: string; starts_at: string; ends_at: string };
export type Participant = { nickname: string; choices: string[] };
export type EventData = {
  id: string;
  code: string;
  title: string;
  organizer: string;
  final_slot_id: string | null;
  slots: Slot[];
  participants: Participant[];
};
export function tally(slots: Slot[], participants: Participant[]) {
  return slots.map((slot) => ({
    ...slot,
    count: participants.filter((p) => p.choices.includes(slot.id)).length,
  }));
}
export function formatSlot(s: Slot) {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const crossesDay =
    dateKey.format(new Date(s.starts_at)) !==
    dateKey.format(new Date(s.ends_at));
  return (
    new Intl.DateTimeFormat("zh-TW", options).format(new Date(s.starts_at)) +
    " — " +
    new Intl.DateTimeFormat(
      "zh-TW",
      crossesDay
        ? options
        : {
            timeZone: "Asia/Taipei",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          },
    ).format(new Date(s.ends_at))
  );
}
