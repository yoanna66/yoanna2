import { randomBytes } from "node:crypto";
import { createSchema } from "@/lib/domain";
import { db, hash, reply, body, failure, sameOrigin } from "@/lib/server";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const input = createSchema.parse(await body(req));
    const code = randomBytes(6).toString("hex").toUpperCase(),
      token = randomBytes(32).toString("hex");
    const { error } = await db().rpc("create_event", {
      p_code: code,
      p_title: input.title,
      p_organizer: input.organizer,
      p_hash: hash(token),
      p_slots: input.slots,
    });
    if (error) throw error;
    return reply({ code, token }, 201);
  } catch (e) {
    return failure(e);
  }
}
