import { findAccount, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { HttpError, route } from "@/lib/http";
import { canSeeOnBoard } from "@/lib/nearby";
import { findActivePair, partnerIdOf } from "@/lib/state";

// Sends one photo, but only to its owner and their current partner.
// Profile photos are also shown on the Nearby board, to other people who are looking.
// GET /api/photo?kind=profile&id=<account id>  or  GET /api/photo?kind=proof&id=<check-in id>
export const GET = route(async (request) => {
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind");
  const id = params.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(400, "bad_photo", "That photo couldn't be found.");

  const me = await findAccount(request);
  const user = await requireUser(request);
  const pair = await findActivePair(user.id);
  const allowedUsers = [user.id, ...(pair ? [partnerIdOf(pair, user.id)] : [])];

  let data: string | undefined;
  if (kind === "profile") {
    const [row] = await query<{ photo: string | null; user_id: string | null }>("SELECT photo, user_id FROM accounts WHERE id = $1", [id]);
    const allowed = id === me?.id || (row?.user_id && (allowedUsers.includes(row.user_id) || (await canSeeOnBoard(user, row.user_id))));
    if (row?.photo && allowed) data = row.photo;
  } else if (kind === "proof") {
    const [row] = await query<{ photo: string | null; user_id: string; pair_id: string }>("SELECT photo, user_id, pair_id FROM checkins WHERE id = $1", [id]);
    if (row?.photo && allowedUsers.includes(row.user_id) && (row.user_id === user.id || row.pair_id === pair?.id)) data = row.photo;
  }
  if (!data) throw new HttpError(404, "no_photo", "That photo couldn't be found.");

  return new Response(Buffer.from(data, "base64"), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=300" },
  });
});
