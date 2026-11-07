import { hashToken, newToken } from "@/lib/auth";
import { DEFAULT_AVATAR, isAvatarCode } from "@/lib/avatar";
import { query, type UserRow } from "@/lib/db";
import { checkGoal } from "@/lib/gemini";
import { HttpError, ok, readBody, route } from "@/lib/http";
import { pairWithDemoPartner, tryMatch } from "@/lib/matching";
import { GOAL_TYPES, makeNickname, SUPPORT_LINKS, type GoalType } from "@/lib/rules";
import { buildToday } from "@/lib/state";

// Screen 1: make a promise. Nothing is saved unless the goal passes the safety check.
export const POST = route(async (request) => {
  const body = await readBody(request);
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

  const token = newToken();
  const isDemo = body.demo === true;
  const [user] = await query<UserRow>(
    `INSERT INTO users (token_hash, nickname, goal_text, short_goal, goal_type, check_in_time, why, is_demo, avatar)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      hashToken(token),
      makeNickname(),
      goalText,
      check.shortGoal,
      check.goalType,
      checkInTime,
      check.why,
      isDemo,
      isAvatarCode(body.avatar) ? body.avatar : DEFAULT_AVATAR,
    ],
  );

  if (isDemo) {
    await pairWithDemoPartner(user);
  } else {
    await tryMatch(user.id);
  }

  const [fresh] = await query<UserRow>("SELECT * FROM users WHERE id = $1", [user.id]);
  return ok({ allowed: true, token, today: await buildToday(fresh) }, "live", 201);
});
