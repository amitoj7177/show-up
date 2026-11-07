import { findAccount, hashToken, newToken, profileComplete, tokenFrom } from "@/lib/auth";
import { DEFAULT_AVATAR, isAvatarCode } from "@/lib/avatar";
import { query, type UserRow } from "@/lib/db";
import { checkGoal } from "@/lib/gemini";
import { findCommunity } from "@/lib/calgary";
import { findGroupByCode } from "@/lib/groups";
import { checkWhy } from "@/lib/moderation";
import { HttpError, ok, readBody, route } from "@/lib/http";
import { pairWithDemoPartner, tryMatch } from "@/lib/matching";
import { GOAL_TYPES, makeNickname, SUPPORT_LINKS, type GoalType } from "@/lib/rules";
import { buildToday } from "@/lib/state";

// Make a promise. Nothing is saved unless the goal passes the safety check.
export const POST = route(async (request) => {
  const body = await readBody(request);
  const account = await findAccount(request);
  const goalText = typeof body.goalText === "string" ? body.goalText.trim() : "";
  const checkInTime = typeof body.checkInTime === "string" ? body.checkInTime : "";
  const goalType = (GOAL_TYPES as readonly string[]).includes(body.goalType as string)
    ? (body.goalType as GoalType)
    : "other";

  if (goalText.length < 3 || goalText.length > 200) {
    throw new HttpError(400, "bad_goal", "Please write your goal in 3 to 200 characters.");
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(checkInTime)) {
    throw new HttpError(400, "bad_time", "Please pick a check-in time.");
  }

  // An optional clinic or campus code. A wrong code is an error, so nobody joins the wrong group by mistake.
  const groupCode = typeof body.groupCode === "string" ? body.groupCode.trim().toUpperCase() : "";
  const group = groupCode ? await findGroupByCode(groupCode) : undefined;
  if (groupCode && !group) {
    throw new HttpError(400, "bad_code", "We don't recognize that code. Check it with your clinic, or leave it empty.");
  }

  if (account && !profileComplete(account)) {
    throw new HttpError(409, "profile_needed", "Please finish your profile first: your first name, Calgary community, and confirming you're 18 or older.");
  }
  const whyText = typeof body.whyItMatters === "string" ? body.whyItMatters.trim() : "";
  if (whyText.length > 140) throw new HttpError(400, "why_too_long", "Please keep why it matters to 140 characters.");
  const whyItMatters = whyText ? await checkWhy(whyText) : null;

  const check = await checkGoal(goalText, goalType);
  if (!check.allowed) {
    return ok({
      allowed: false,
      refusalReason: check.refusalReason,
      showSupportLinks: check.showSupportLinks,
      support: SUPPORT_LINKS,
      why: check.why,
    });
  }

  // People with an account keep their login. Demo people get a token of their own.
  const token = account ? (tokenFrom(request) as string) : newToken();
  const isDemo = body.demo === true;
  const avatar = isAvatarCode(body.avatar) ? body.avatar : (account?.avatar ?? DEFAULT_AVATAR);
  const [user] = await query<UserRow>(
    `INSERT INTO users (token_hash, nickname, goal_text, short_goal, goal_type, check_in_time, why, is_demo, avatar, group_id, why_it_matters, area)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [
      hashToken(account ? newToken() : token),
      makeNickname(),
      goalText,
      check.shortGoal,
      check.goalType,
      checkInTime,
      check.why,
      isDemo,
      avatar,
      group?.id ?? null,
      whyItMatters,
      findCommunity(account?.community)?.area ?? null,
    ],
  );
  if (account) await query("UPDATE accounts SET user_id = $2 WHERE id = $1", [account.id, user.id]);

  if (isDemo) {
    await pairWithDemoPartner(user);
  } else {
    await tryMatch(user.id);
  }

  const [fresh] = await query<UserRow>("SELECT * FROM users WHERE id = $1", [user.id]);
  return ok({ allowed: true, token, today: await buildToday(fresh) }, "live", 201);
});
