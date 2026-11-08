import { profileComplete, requireAccount } from "@/lib/auth";
import { isAvatarCode } from "@/lib/avatar";
import { findCommunity } from "@/lib/calgary";
import { query } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";
import { checkProfilePhoto, cleanFirstName, photoData } from "@/lib/moderation";
import { requireUnlocked } from "@/lib/state";

type Profile = { avatar: string; first_name: string | null; community: string | null; adult: boolean; has_photo: boolean; user_id: string | null; id: string };

async function describe(accountId: string) {
  const [account] = await query<Profile>(
    "SELECT id, avatar, first_name, community, adult, photo IS NOT NULL AS has_photo, user_id FROM accounts WHERE id = $1",
    [accountId],
  );
  return {
    avatar: account.avatar,
    firstName: account.first_name,
    community: account.community,
    communityName: findCommunity(account.community)?.name ?? null,
    hasPhoto: account.has_photo,
    photoId: account.has_photo ? account.id : null,
    adult: account.adult,
    hasPromise: Boolean(account.user_id),
    profileComplete: Boolean(account.first_name && account.community && account.adult),
  };
}

// Your profile: character, first name, photo, community, and whether you have a promise yet.
export const GET = route(async (request) => {
  const account = await requireAccount(request);
  return ok(await describe(account.id));
});

// Save any part of your profile. Photos are checked by Gemini before anyone can see them.
export const POST = route(async (request) => {
  const account = await requireAccount(request);
  const body = await readBody(request);

  if (body.avatar !== undefined) {
    if (!isAvatarCode(body.avatar)) throw new HttpError(400, "bad_avatar", "We couldn't save that character.");
    await requireUnlocked(body.avatar, account.avatar, account.user_id);
    await query("UPDATE accounts SET avatar = $2 WHERE id = $1", [account.id, body.avatar]);
    if (account.user_id) await query("UPDATE users SET avatar = $2 WHERE id = $1", [account.user_id, body.avatar]);
  }
  if (body.firstName !== undefined) {
    await query("UPDATE accounts SET first_name = $2 WHERE id = $1", [account.id, cleanFirstName(body.firstName)]);
  }
  if (body.community !== undefined) {
    const community = findCommunity(String(body.community));
    if (!community) throw new HttpError(400, "bad_community", "Please choose your Calgary community from the list.");
    await query("UPDATE accounts SET community = $2 WHERE id = $1", [account.id, community.code]);
    if (account.user_id) await query("UPDATE users SET area = $2 WHERE id = $1", [account.user_id, community.area]);
  }
  if (body.adult !== undefined) {
    if (body.adult !== true) throw new HttpError(400, "must_be_adult", "Promise Pals is for people 18 and older.");
    await query("UPDATE accounts SET adult = true WHERE id = $1", [account.id]);
  }
  if (body.photo === null) {
    await query("UPDATE accounts SET photo = NULL WHERE id = $1", [account.id]);
  } else if (body.photo !== undefined) {
    const data = photoData(body.photo);
    await checkProfilePhoto(data);
    await query("UPDATE accounts SET photo = $2 WHERE id = $1", [account.id, data]);
  }

  const profile = await describe(account.id);
  return ok({ ...profile, profileComplete: profileComplete({ ...account, first_name: profile.firstName, community: profile.community, adult: profile.adult }) });
});
