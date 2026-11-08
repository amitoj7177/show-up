"use client";

import { useRef, useState } from "react";
import { api, ApiError, getToken } from "@/lib/api";
import type { NearbyPerson } from "@/lib/nearby";
import type { MascotMood } from "@/lib/rules";
import type { Act, Today } from "@/lib/types";
import { PixelAvatar } from "./PixelAvatar";
import { PartnerCard } from "./PartnerCard";
import { PrivatePhoto } from "./Photos";
import { Card, ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, SECONDARY_BUTTON, TitleBar } from "./Shared";

// "7:42 AM", in Calgary time.
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", timeZone: "America/Edmonton" });
}

// "Active now", or "Last active 2 hours ago", from when they really last opened the app.
export function presenceText(partner: NonNullable<Today["partner"]>): string {
  if (partner.activeNow) return "Active now";
  if (!partner.lastActiveAt) return "";
  const minutes = Math.max(1, Math.round((Date.now() - new Date(partner.lastActiveAt).getTime()) / 60_000));
  if (minutes < 60) return `Last active ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last active ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `Last active ${days} day${days === 1 ? "" : "s"} ago`;
}

// Picks a random line, never the same one twice in a row.
export function useLinePicker() {
  const last = useRef<Record<string, number>>({});
  return (key: string, lines: string[] | undefined): string => {
    if (!lines?.length) return "";
    let index = 0;
    do {
      index = Math.floor(Math.random() * lines.length);
    } while (lines.length > 1 && index === last.current[key]);
    last.current[key] = index;
    return lines[index];
  };
}

function Character({ code, mood, name, label, className = "" }: { code: string; mood: MascotMood; name: string; label: string; className?: string }) {
  return (
    <figure className={`text-center ${className}`}>
      <PixelAvatar code={code} mood={mood} scale={4} label={label} />
      <figcaption className="mt-1 text-lg font-semibold break-all">{name}</figcaption>
    </figure>
  );
}

// While we look for a partner. Real people get the Nearby board; without a profile, it's a simple wait.
export function FindingScreen({ today, act, onCancel }: { today: Today; act: Act; onCancel: () => void }) {
  if (!today.nearby) return <BlindWait today={today} onCancel={onCancel} />;
  const { people, requests } = today.nearby;
  return (
    <div className="space-y-4">
      <div aria-live="polite" className="space-y-4">
        {requests.map((request) => (
          <div key={request.requestId} className="px-card overflow-hidden">
            <TitleBar title={`${request.from.firstName} wants to team up`} />
            <div className="space-y-3 p-5">
              <NearbyCard person={request.from} />
              <button type="button" className={PRIMARY_BUTTON} onClick={() => act("/api/team-up/answer", { requestId: request.requestId, accept: true })}>
                Team up with {request.from.firstName}
              </button>
              <button type="button" className={QUIET_BUTTON} onClick={() => act("/api/team-up/answer", { requestId: request.requestId, accept: false })}>
                Not now
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-card overflow-hidden">
        <TitleBar title="Find a partner" />
        <div className="space-y-4 p-5">
          <h1 className="text-2xl font-bold leading-tight">People near you, looking now</h1>
          <p>Pick someone to keep each other going. They see your request straight away.</p>
          {today.notice && <ErrorNote message={today.notice} />}
          {people.length === 0 ? (
            <p className="text-muted">Nobody near you is looking right now. Invite someone you know below, or check back soon.</p>
          ) : (
            <ul className="space-y-3">
              {people.map((person) => (
                <li key={person.userId} className="space-y-3 border border-line rounded-2xl bg-white p-3">
                  <NearbyCard person={person} />
                  {person.askedByMe ? (
                    <p className="font-semibold" role="status">
                      {"\u2713"} Asked. Waiting for {person.firstName} to answer.
                    </p>
                  ) : (
                    <button type="button" className={PRIMARY_BUTTON} onClick={() => act("/api/team-up", { userId: person.userId })}>
                      Ask {person.firstName} to team up
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted">While you&apos;re looking, other people looking can see your first name, photo, community and goal.</p>
        </div>
      </div>

      <InviteCard />
      <button type="button" className={QUIET_BUTTON} onClick={onCancel}>
        Stop looking
      </button>
    </div>
  );
}

// One person on the board: who they are, how far, and what they're working on.
function NearbyCard({ person }: { person: NearbyPerson }) {
  const distance = person.km === null ? "" : person.km < 1 ? " \u00b7 under 1 km away" : ` \u00b7 ${Math.round(person.km)} km away`;
  return (
    <div className="flex items-start gap-3">
      {person.photoId ? (
        <PrivatePhoto kind="profile" id={person.photoId} alt={`${person.firstName}'s photo`} className="size-16 shrink-0 border border-line rounded-2xl" />
      ) : (
        <div className="shrink-0 border border-line rounded-2xl bg-[#bfe6ff]">
          <PixelAvatar code={person.avatar} mood="happy" scale={2} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xl font-bold">
          {person.firstName}
          {person.activeNow && <span className="ml-2 text-base font-semibold text-[#1d7a46]">{"\u25cf"} Active now</span>}
        </p>
        {person.communityName && (
          <p className="text-muted">
            {person.communityName}
            {distance}
          </p>
        )}
        {person.moveTag && <p className="my-1 inline-block border border-line bg-[#e6f0ff] px-2 font-semibold">{person.moveTag}</p>}
        <p className="font-medium">{person.goal}</p>
        {person.whyItMatters && <p className="mt-1 italic">&ldquo;{person.whyItMatters}&rdquo;</p>}
      </div>
    </div>
  );
}

// "Invite someone you know": a link that pairs them with you as soon as they make their promise.
function InviteCard() {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function invite() {
    setError("");
    try {
      const made = (await api<{ link: string }>("/api/invite", { post: true, token: getToken() })).link;
      setLink(made);
      const text = "Want to keep each other going? Make a health promise with me on Promise Pals.";
      if (navigator.share) await navigator.share({ title: "Promise Pals", text, url: made }).catch(() => undefined);
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Something went wrong. Please try again.");
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  return (
    <Card title="Invite someone you know">
      <p>A friend, neighbour or family member. When they make their promise through your link, you&apos;re paired straight away.</p>
      {error && <ErrorNote message={error} />}
      {link ? (
        <>
          <p className="px-input break-all select-all">{link}</p>
          <button type="button" className={SECONDARY_BUTTON} onClick={copy}>
            {copied ? "Copied \u2713" : "Copy invite link"}
          </button>
        </>
      ) : (
        <button type="button" className={SECONDARY_BUTTON} onClick={invite}>
          Invite someone
        </button>
      )}
    </Card>
  );
}

// No profile (tests, old links): you, a mystery box, and automatic matching.
function BlindWait({ today, onCancel }: { today: Today; onCancel: () => void }) {
  return (
    <div className="px-card overflow-hidden">
      <TitleBar title="Find a partner" />
      <div className="flex min-h-72 items-end justify-evenly border-b border-line bg-[#bfe6ff] px-2 pt-14">
        <Character code={today.me.avatar} mood="waiting" name="You" label={today.mascot.screenReaderText} />
        <div aria-hidden="true" className="font-bold mb-9 flex h-52 w-34 items-center justify-center border-2 border-dashed border-line rounded-3xl text-4xl">
          ?
        </div>
      </div>
      <div className="space-y-4 p-5 text-center">
        <h1 aria-live="polite" className="text-2xl font-bold leading-tight">
          Looking<span className="typing-dots">...</span>
        </h1>
        <p>Hang tight while we find someone to cheer you on.</p>
        {today.notice && <ErrorNote message={today.notice} />}
        <p className="text-muted">
          You&apos;re {today.me.nickname}. We look for someone with a similar goal first.
        </p>
        <button type="button" className={QUIET_BUTTON} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// The moment you're matched: both characters slide in.
export function PartnerFoundScreen({ today, line, onContinue }: { today: Today; line: string; onContinue: () => void }) {
  if (!today.partner) return null;
  return (
    <div className="px-card overflow-hidden">
      <TitleBar title="Partner found!" />
      <div className="flex min-h-72 items-end justify-evenly border-b border-line bg-[#bfe6ff] px-2 pt-14">
        <Character className="slide-in-left" code={today.me.avatar} mood="happy" name="You" label="Your character, looking happy." />
        <Character
          className="slide-in-right"
          code={today.partner.avatar}
          mood="caring"
          name={today.partner.nickname}
          label="Your new partner's character, with little hearts."
        />
      </div>
      <div className="space-y-4 p-5 text-center">
        <div role="status">
          <h1 className="pop-in text-2xl font-bold leading-tight">You&apos;re a team!</h1>
        </div>
        <p>{line}</p>
        <div className="text-left">
          <PartnerCard partner={today.partner} />
        </div>
        <button type="button" className={PRIMARY_BUTTON} onClick={onContinue}>
          Go to Today
        </button>
      </div>
    </div>
  );
}
