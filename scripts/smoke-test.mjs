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

// --- Results ignore demo data ---
const stats = (await call("GET", "/api/stats")).json.data;
check("stats return numbers", Number.isInteger(stats.people) && Number.isInteger(stats.cameBackAfterDayOne));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
