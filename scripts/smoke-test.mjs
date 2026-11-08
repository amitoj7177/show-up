import { readFileSync } from "node:fs";
// Walks through the whole product using the real API, the way the app would.
// Run with: npm run smoke (uses http://localhost:3000)
// Or against the live site: BASE_URL=https://your-site.vercel.app npm run smoke
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) passed += 1;
  else failed += 1;
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${condition ? "" : `  ${JSON.stringify(detail)}`}`);
}

async function call(method, path, { token, body } = {}) {
  const response = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, headers: response.headers, json: await response.json().catch(() => null) };
}

const join = (goalText, extra = {}) =>
  call("POST", "/api/join", { body: { goalText, goalType: "recovery", checkInTime: "00:00", ...extra } });

// --- No database needed ---
const sample = await call("GET", "/api/today?demo=1&mood=furious");
check("demo sample works without signing in", sample.status === 200 && sample.json.source === "snapshot");
check("demo sample shows the mood asked for", sample.json.data.mascot.mood === "furious");
check("demo sample is labelled as demo", sample.json.data.isDemo === true);

const config = await call("GET", "/api/config");
check("config lists 8 messages", config.json.data.messages.length === 8);
check("config has pep talk lines", config.json.data.talk.motivation.length === 4);

const preflight = await fetch(`${BASE}/api/today`, { method: "OPTIONS" });
check("web apps on other addresses are allowed", preflight.headers.get("access-control-allow-origin") === "*");

// --- Bad input gets a friendly message ---
const noAuth = await call("GET", "/api/today");
check("no token gets a friendly 401", noAuth.status === 401 && typeof noAuth.json.error.message === "string");
check("too-short goal is rejected", (await join("hi")).status === 400);
check("bad time is rejected", (await join("Walk daily", { checkInTime: "25:00" })).status === 400);

// --- Safety ---
const weight = await join("Lose 20 pounds by Christmas");
check("weight goal is refused", weight.json.data.allowed === false);
check("refused goal explains why", typeof weight.json.data.refusalReason === "string");
check("refused goal has a Why panel", typeof weight.json.data.why.source === "string");

// --- Real pairing between two people ---
const tag = Date.now();
const a = await join(`Do my physio every morning ${tag}`);
check("first person joins and waits", a.status === 201 && a.json.data.today.status === "waiting");
check("first person gets a nickname", typeof a.json.data.today.me.nickname === "string");
const tokenA = a.json.data.token;

const b = await join(`Stretch my knee daily, my name is Sarah Johnson ${tag}`);
const tokenB = b.json.data.token;
check("second person gets paired right away", b.json.data.today.status === "paired", b.json.data.today.status);

const aNow = (await call("GET", "/api/today", { token: tokenA })).json.data;
check("first person sees the partner", aNow.status === "paired" && aNow.partner !== null);
check("a real name in a goal never reaches the partner", !JSON.stringify(aNow.partner).includes("Sarah"), aNow.partner);
check("streak starts at 0", aNow.pair.streak === 0);

// --- Check-ins update the other phone ---
await call("POST", "/api/checkin", { token: tokenA, body: { status: "done" } });
const bSees = (await call("GET", "/api/today", { token: tokenB })).json.data;
check("partner sees my check-in", bSees.partner.checkinToday === "done");
check("partner sees the real time I checked in", typeof bSees.partner.checkedInAt === "string");
check("partner shows as active now", bSees.partner.activeNow === true, bSees.partner);
const aSeen = (await call("GET", "/api/today", { token: tokenA })).json.data;
check("I see that my partner saw my check-in", typeof aSeen.today.seenByPartnerAt === "string", aSeen.today);
check("mascot stays calm on the day you join", bSees.mascot.angerLevel === 0, bSees.mascot);

const bDone = (await call("POST", "/api/checkin", { token: tokenB, body: { status: "done" } })).json.data;
check("both done raises the streak", bDone.pair.streak === 1, bDone.pair);
check("mascot is happy after checking in", bDone.mascot.mood === "happy", bDone.mascot);
check("bad check-in is rejected", (await call("POST", "/api/checkin", { token: tokenA, body: { status: "nope" } })).status === 400);

// --- The customizable character ---
const code = "h2-c5-s3-e1-o4-k8-a1";
const saved = (await call("POST", "/api/settings", { token: tokenA, body: { avatar: code } })).json.data;
check("saving a character works", saved.me.avatar === code, saved.me);
const bSeesAvatar = (await call("GET", "/api/today", { token: tokenB })).json.data;
check("partner sees my character", bSeesAvatar.partner.avatar === code, bSeesAvatar.partner);
check("partner's character never shows anger", ["waiting", "happy", "caring"].includes(bSeesAvatar.partner.mood));
const badAvatar = await call("POST", "/api/settings", { token: tokenA, body: { avatar: "h99-c0-s0-e0-o0-k0-a0" } });
check("a made-up character code is rejected", badAvatar.status === 400);
check("checking in earns points", typeof saved.me.points === "number" && saved.me.points >= 10, saved.me.points);
const lockedExtra = await call("POST", "/api/settings", { token: tokenA, body: { avatar: "h2-c5-s3-e1-o4-k8-a5" } });
check("an extra you haven't earned yet is refused", lockedExtra.status === 403, lockedExtra.status);
check("the week grid has 7 days", bSeesAvatar.pair.week.length === 7);

// --- Messages ---
const free = await call("POST", "/api/encourage", { token: tokenA, body: { messageId: "hey meet me at..." } });
check("free text is impossible", free.status === 400);
await call("POST", "/api/encourage", { token: tokenA, body: { messageId: "got-this" } });
const bMessages = (await call("GET", "/api/today", { token: tokenB })).json.data;
check("partner receives the message", bMessages.messagesReceived[0]?.text === "You've got this.");
const twice = await call("POST", "/api/encourage", { token: tokenA, body: { messageId: "proud" } });
check("only one message per day", twice.status === 409);

// --- Demo-only tools are locked for real people ---
check("real people can't skip days", (await call("POST", "/api/demo/skip-day", { token: tokenA })).status === 403);
check("new match is refused too soon", (await call("POST", "/api/rematch", { token: tokenA })).status === 409);

// --- Rough days, gentle mode, leaving and reporting ---
const rough = (await call("POST", "/api/checkin", { token: tokenB, body: { status: "rough" } })).json.data;
check("rough day makes your character sad, not angry", rough.mascot.mood === "sad" && rough.mascot.angerLevel === 0);

const left = (await call("POST", "/api/leave", { token: tokenA })).json.data;
check("leaving works", left.status === "left");
const stranded = (await call("GET", "/api/today", { token: tokenB })).json.data;
check("the person left behind is told", stranded.status === "waiting" && stranded.notice?.includes("moved on"), stranded.notice);

const c = await join(`Do my knee physio stretches ${tag}`);
const tokenC = c.json.data.token;
check("left-behind person gets a new partner", c.json.data.today.status === "paired");
const reported = await call("POST", "/api/report", { token: tokenC, body: { reason: "unsafe" } });
check("reporting ends the pairing", reported.json.data.status === "waiting");
const again = (await call("GET", "/api/today", { token: tokenC })).json.data;
check("reported people aren't paired together again", again.status === "waiting", again.status);
await call("POST", "/api/leave", { token: tokenB });
await call("POST", "/api/leave", { token: tokenC });

// --- Time travel with the labelled demo partner ---
const demo = await join(`Demo goal ${tag}`, { demo: true });
const tokenD = demo.json.data.token;
check("demo pairs instantly and is labelled", demo.json.data.today.status === "paired" && demo.json.data.today.isDemo === true);

await call("POST", "/api/demo/partner-checkin", { token: tokenD, body: { status: "done" } });
await call("POST", "/api/checkin", { token: tokenD, body: { status: "done" } });
let d = (await call("POST", "/api/demo/skip-day", { token: tokenD })).json.data;
check("demo streak carries over", d.pair.streak === 1, d.pair);
check("mascot gets annoyed once check-in time passes (it was midnight)", d.mascot.angerLevel >= 1, d.mascot);

await call("POST", "/api/demo/partner-checkin", { token: tokenD, body: { status: "done" } });
d = (await call("POST", "/api/demo/skip-day", { token: tokenD })).json.data;
check("missing a day resets the streak", d.pair.streak === 0, d.pair);
check("missing a day makes the mascot mad", d.mascot.mood === "mad", d.mascot);

d = (await call("POST", "/api/demo/skip-day", { token: tokenD })).json.data;
check("two silent days make the mascot furious", d.mascot.mood === "furious", d.mascot);
check("my partner hasn't gone silent yet, so no new match", d.pair.canOfferNewMatch === false, d.pair);

d = (await call("POST", "/api/checkin", { token: tokenD, body: { status: "rough" } })).json.data;
check("a rough day calms even a furious character", d.mascot.mood === "sad");

await call("POST", "/api/demo/skip-day", { token: tokenD });
await call("POST", "/api/demo/skip-day", { token: tokenD });
d = (await call("GET", "/api/today", { token: tokenD })).json.data;
check("a silent partner triggers the new-match offer", d.pair.canOfferNewMatch === true, d.pair);

const summary = (await call("GET", "/api/summary", { token: tokenD })).json.data;
check("weekly summary counts honestly", summary.me.done === 1 && summary.me.rough === 1, summary);

const gentle = (await call("POST", "/api/settings", { token: tokenD, body: { gentleMascot: true } })).json.data;
check("gentle mode stops the anger", gentle.mascot.angerLevel === 0, gentle.mascot);

const demoNew = (await call("POST", "/api/rematch", { token: tokenD })).json.data;
check("new match brings a new demo partner", demoNew.status === "paired" && demoNew.pair.dayNumber === 1, demoNew.pair);

// --- Accounts (needs Auth0 connected) ---
const email = `tester${tag}@example.com`;
const signup = await call("POST", "/api/auth/signup", { body: { email, password: "tulip harbor sunrise 42" } });
if (signup.status === 503) {
  console.log("SKIP  accounts: Auth0 isn't connected");
} else {
  check("sign-up works", signup.status === 201 && signup.json.data.hasPromise === false, signup.json);
  const session = signup.json.data.token;
  const noPromise = await call("GET", "/api/today", { token: session });
  check("a new account has no promise yet", noPromise.status === 409 && noPromise.json.error.code === "no_promise", noPromise.json);
  check("a character can be saved before a promise", (await call("POST", "/api/account", { token: session, body: { avatar: code } })).status === 200);
  await call("POST", "/api/account", { token: session, body: { firstName: "Tester", community: "HIL", adult: true } });
  check("short passwords are refused", (await call("POST", "/api/auth/signup", { body: { email: `x${email}`, password: "too short pw" } })).status === 400);
  check("wrong password is refused", (await call("POST", "/api/auth/login", { body: { email, password: "wrong harbor sunrise 42" } })).status === 401);
  const promise = await call("POST", "/api/join", { token: session, body: { goalText: `Stretch ${tag}`, goalType: "move", checkInTime: "09:00" } });
  check("an account can make a promise", promise.status === 201 && promise.json.data.token === session, promise.json);
  check("the saved character carries over", promise.json.data.today.me.avatar === code);
  check("the email is never sent back", !JSON.stringify(promise.json).includes(email));
  const again = await call("POST", "/api/auth/login", { body: { email, password: "tulip harbor sunrise 42" } });
  check("logging in again finds the promise", again.json.data.hasPromise === true && again.json.data.avatar === code, again.json);
  const secondDevice = await call("GET", "/api/today", { token: again.json.data.token });
  check("a second device sees the same promise", secondDevice.json.data.me.goal.text === `Stretch ${tag}`);
  check("forgot password answers the same way", (await call("POST", "/api/auth/forgot", { body: { email: "nobody@example.com" } })).status === 200);
  await call("POST", "/api/auth/logout", { token: again.json.data.token });
  check("logging out ends that session", (await call("GET", "/api/today", { token: again.json.data.token })).status === 401);
  check("the other device stays logged in", (await call("GET", "/api/today", { token: session })).status === 200);
  await call("POST", "/api/leave", { token: session });
}

// --- Real profiles, photo proof and Calgary meet-ups (needs Auth0 and Gemini) ---
const photo = `data:image/jpeg;base64,${readFileSync(new URL("./fixtures/test-photo.jpg", import.meta.url)).toString("base64")}`;
async function person(name, community, goal, why) {
  const made = await call("POST", "/api/auth/signup", { body: { email: `${name.toLowerCase()}${tag}@example.com`, password: "tulip harbor sunrise 42" } });
  if (made.status !== 201) return null;
  const token = made.json.data.token;
  const early = await call("POST", "/api/join", { token, body: { goalText: goal, goalType: "recovery", checkInTime: "07:00" } });
  check(`${name} can't make a promise before finishing a profile`, early.status === 409, early.json);
  const saved = await call("POST", "/api/account", { token, body: { firstName: name, community, adult: true } });
  check(`${name}'s profile is complete`, saved.json.data.profileComplete === true, saved.json);
  const joined = await call("POST", "/api/join", { token, body: { goalText: goal, goalType: "recovery", checkInTime: "07:00", whyItMatters: why } });
  return { token, joined };
}
const sam = await person("Sam", "HIL", `Do my knee physio stretches ${tag}`, "I want to hike with my family again.");
if (!sam) {
  console.log("SKIP  profiles and proof: Auth0 isn't connected");
} else {
  check("a last name with numbers is refused", (await call("POST", "/api/account", { token: sam.token, body: { firstName: "Sam123" } })).status === 400);
  check("a made-up community is refused", (await call("POST", "/api/account", { token: sam.token, body: { community: "NOPE" } })).status === 400);
  const ana = await person("Ana", "BRD", `Do my physio exercises daily ${tag}`, "Walking clears my head.");
  const anaView = ana.joined.json.data.today;
  check("people in the same part of Calgary are paired", anaView.status === "paired", anaView.status);
  check("partner shows a real first name", anaView.partner?.nickname === "Sam", anaView.partner);
  check("partner shows their Calgary community", anaView.partner?.communityName === "Hillhurst", anaView.partner);
  check("partner shows why it matters", typeof anaView.partner?.whyItMatters === "string" && anaView.partner.whyItMatters.length > 0);
  check("a real Calgary meet-up spot is suggested", typeof anaView.pair?.meetSpot?.name === "string" && anaView.pair.meetSpot.source.includes("Calgary"), anaView.pair?.meetSpot);
  check("the partner never sees an email", !JSON.stringify(anaView).includes("@example.com"));

  const proofCheckin = await call("POST", "/api/checkin", { token: sam.token, body: { status: "done", photo } });
  check("checking in with a photo works", proofCheckin.status === 200 && proofCheckin.json.data.today.proof?.photoId, proofCheckin.json);
  check("Gemini describes the photo", typeof proofCheckin.json.data.today.proof?.note === "string");
  const anaSees = (await call("GET", "/api/today", { token: ana.token })).json.data;
  const proofId = anaSees.partner.proof?.photoId;
  check("partner sees the proof photo", typeof proofId === "string");
  const image = await fetch(`${BASE}/api/photo?kind=proof&id=${proofId}`, { headers: { Authorization: `Bearer ${ana.token}` } });
  check("partner can load the photo", image.status === 200 && image.headers.get("content-type") === "image/jpeg");
  const outsider = await join(`Walk daily ${tag} outsider`);
  const blocked = await fetch(`${BASE}/api/photo?kind=proof&id=${proofId}`, { headers: { Authorization: `Bearer ${outsider.json.data.token}` } });
  check("a stranger can't load the photo", blocked.status === 404);
  check("a bad photo is refused", (await call("POST", "/api/checkin", { token: sam.token, body: { status: "done", photo: "data:image/png;base64,AAAA" } })).status === 400);
  const confirmed = await call("POST", "/api/confirm", { token: ana.token });
  check("partner can confirm the check-in", confirmed.status === 200 && confirmed.json.data.partner.proof?.confirmedAt);
  const samSees = (await call("GET", "/api/today", { token: sam.token })).json.data;
  check("I see my partner confirmed it", typeof samSees.today.proof?.confirmedAt === "string", samSees.today.proof);
  check("confirming twice is refused", (await call("POST", "/api/confirm", { token: ana.token })).status === 409);
  const deleted = await call("POST", "/api/account/delete", { token: sam.token });
  check("deleting an account works", deleted.status === 200);
  check("a deleted account can't log in to the app any more", (await call("GET", "/api/account", { token: sam.token })).status === 401);
  const anaAfter = (await call("GET", "/api/today", { token: ana.token })).json.data;
  check("the partner is sent to find someone new", anaAfter.status === "waiting", anaAfter.status);
  const goneImage = await fetch(`${BASE}/api/photo?kind=proof&id=${proofId}`, { headers: { Authorization: `Bearer ${ana.token}` } });
  check("the deleted person's photo is gone", goneImage.status === 404);
  for (const token of [ana.token, outsider.json.data.token]) await call("POST", "/api/leave", { token });
}

// --- Clinic groups (set GROUP_CODE and STAFF_KEY from npm run group:create) ---
if (process.env.GROUP_CODE && process.env.STAFF_KEY) {
  const g = (goal) => join(goal, { groupCode: process.env.GROUP_CODE.toLowerCase() });
  const outsider = await join(`Do my knee physio stretches ${tag} outside`);
  const first = await g(`Do my knee physio stretches ${tag} clinic one`);
  check("clinic members aren't paired with outsiders", first.json.data.today.status === "waiting", first.json.data.today.status);
  check("the clinic name is shown", first.json.data.today.me.group !== null);
  const second = await g(`Do my physio exercises ${tag} clinic two`);
  check("two clinic members are paired together", second.json.data.today.status === "paired");
  check("a wrong clinic code is refused", (await join("Walk daily", { groupCode: "NOPE00" })).status === 400);
  const few = await call("POST", "/api/clinic", { body: { staffKey: process.env.STAFF_KEY } });
  check("staff see no totals with under 5 people", few.status === 200 && few.json.data.enoughPeople === false, few.json);
  const extra = [];
  for (const n of [3, 4, 5]) extra.push(await g(`Do my physio exercises ${tag} clinic ${n}`));
  await call("POST", "/api/checkin", { token: second.json.data.token, body: { status: "done" } });
  const totals = await call("POST", "/api/clinic", { body: { staffKey: process.env.STAFF_KEY } });
  check("staff see totals once 5 people join", totals.json.data.enoughPeople === true && totals.json.data.week.doneDays >= 1, totals.json);
  check("staff never see names or goals", !JSON.stringify(totals.json).includes("physio") && !JSON.stringify(totals.json).includes("nickname"));
  check("a wrong staff key is refused", (await call("POST", "/api/clinic", { body: { staffKey: "wrong" } })).status === 401);
  for (const person of [outsider, first, second, ...extra]) await call("POST", "/api/leave", { token: person.json.data.token });
} else {
  console.log("SKIP  clinic groups: set GROUP_CODE and STAFF_KEY");
}

// --- Results ignore demo data ---
const stats = (await call("GET", "/api/stats")).json.data;
check("stats return numbers", Number.isInteger(stats.people) && Number.isInteger(stats.cameBackAfterDayOne));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
