import { z } from "zod";
import { codeSchema, responseSchema, tokenSchema } from "@/lib/domain";
import { db, hash, reply, body, failure, sameOrigin } from "@/lib/server";
type Context = { params: Promise<{ code: string }> };
export async function GET(_: Request, ctx: Context) {
  try {
    const code = codeSchema.parse((await ctx.params).code);
    const client = db();
    const { data, error } = await client.rpc("read_event", { p_code: code });
    if (error) throw error;
    return data
      ? reply(data)
      : reply({ error: "找不到此活動，請確認活動代碼。" }, 404);
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request, ctx: Context) {
  try {
    sameOrigin(req);
    const code = codeSchema.parse((await ctx.params).code);
    const raw = await body(req);
    const client = db();
    if (raw.action === "confirm") {
      const v = z
        .object({ token: tokenSchema, slotId: z.string().uuid() })
        .parse(raw);
      const { error } = await client.rpc("confirm_event", {
        p_code: code,
        p_hash: hash(v.token),
        p_slot: v.slotId,
      });
      if (error) return reply({ error: "管理憑證無效，或時段不存在。" }, 403);
      return reply({ ok: true });
    }
    if (raw.action === "load") {
      const token = tokenSchema.parse(raw.token);
      const { data, error } = await client.rpc("read_response", {
        p_code: code,
        p_hash: hash(token),
      });
      if (error || !data)
        return reply(
          { error: "修改連結無效，請使用提交時取得的完整連結。" },
          403,
        );
      return reply(data);
    }
    const v = responseSchema.parse(raw);
    const { error } = await client.rpc("save_response", {
      p_code: code,
      p_hash: hash(v.token),
      p_nickname: v.nickname,
      p_choices: v.choices,
      p_edit: v.edit,
    });
    if (error)
      return reply(
        { error: "無法儲存：活動已確認、憑證無效，或時段不屬於此活動。" },
        409,
      );
    return reply({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
