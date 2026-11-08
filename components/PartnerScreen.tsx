"use client";

import { useEffect, useState } from "react";
import { WeekGrid } from "./WeekGrid";
import { api, getToken } from "@/lib/api";
import type { Act, Config, Summary, Today } from "@/lib/types";
import { presenceText } from "./Moments";
import { PartnerCard } from "./PartnerCard";
import { Card, PRIMARY_BUTTON, QUIET_BUTTON, SECONDARY_BUTTON } from "./Shared";

export function PartnerScreen({ today, config, act }: { today: Today; config: Config | null; act: Act }) {
  const { partner, pair } = today;
  const [reporting, setReporting] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const summaryDue = pair?.summaryDue ?? false;

  useEffect(() => {
    if (!summaryDue || today.isDemo) return;
    api<Summary>("/api/summary", { token: getToken() })
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [summaryDue, today.isDemo]);

  if (!partner || !pair) return null;

  const needsSupport = partner.overdue || partner.checkinToday === "rough" || partner.silentDays > 0;

  return (
    <div className="space-y-4">
      <section className="px-card space-y-3 p-4">
        <h1 className="sr-only">Your partner</h1>
        <PartnerCard partner={partner} />
        <p className="flex items-center gap-1.5 font-semibold">
          <span aria-hidden="true" className={`inline-block size-3 border border-line rounded-md ${partner.activeNow ? "bg-[#43a047]" : "bg-white"}`} />
          {presenceText(partner)}
        </p>
      </section>

      {today.pair && (
        <Card title="This week, together">
          <WeekGrid week={today.pair.week} />
        </Card>
      )}

      <Card title={needsSupport ? "Your partner could use a little support" : "Send some encouragement"}>
        {today.canSendMessage ? (
          <div className="grid gap-2">
            {(config?.messages ?? []).map((message) => (
              <button key={message.id} type="button" className={SECONDARY_BUTTON} onClick={() => act("/api/encourage", { messageId: message.id })}>
                {message.text}
              </button>
            ))}
          </div>
        ) : (
          <p className="font-semibold">Message sent. Thanks for showing up.</p>
        )}
        <p className="text-muted">One message a day. There's no chat, to keep everyone safe.</p>
      </Card>

      {(pair.canOfferNewMatch || pair.summaryDue) && (
        <Card title={pair.summaryDue ? "You finished a week" : "Your partner has gone quiet"}>
          {summary && (
            <dl className="grid grid-cols-2 gap-2">
              <div>
                <dt className="font-bold">You</dt>
                <dd>
                  {summary.me.done} done, {summary.me.rough} rough, {summary.me.silent} silent
                </dd>
              </div>
              <div>
                <dt className="font-bold">Your partner</dt>
                <dd>
                  {summary.partner.done} done, {summary.partner.rough} rough, {summary.partner.silent} silent
                </dd>
              </div>
            </dl>
          )}
          <p>{pair.summaryDue ? "Stay together, or meet someone new." : "It's not your fault. You can keep waiting, or get a new partner."}</p>
          <button type="button" className={PRIMARY_BUTTON} onClick={() => act("/api/rematch")}>
            Find me a new partner
          </button>
        </Card>
      )}

      <Card title="Leave or report">
        {confirmLeave ? (
          <div className="grid gap-2">
            <p className="font-semibold">Leave {partner.nickname}? They'll be matched with someone new.</p>
            <button type="button" className={PRIMARY_BUTTON} onClick={() => act("/api/leave")}>
              Yes, leave
            </button>
            <button type="button" className={QUIET_BUTTON} onClick={() => setConfirmLeave(false)}>
              Stay
            </button>
          </div>
        ) : reporting ? (
          <div className="grid gap-2">
            <p className="font-semibold">Why are you reporting them? This ends the pairing right away.</p>
            {(config?.reportReasons ?? []).map((reason) => (
              <button key={reason.id} type="button" className={SECONDARY_BUTTON} onClick={() => act("/api/report", { reason: reason.id })}>
                {reason.text}
              </button>
            ))}
            <button type="button" className={QUIET_BUTTON} onClick={() => setReporting(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="grid gap-2">
            <button type="button" className={SECONDARY_BUTTON} onClick={() => setConfirmLeave(true)}>
              Leave this partnership
            </button>
            <button type="button" className={SECONDARY_BUTTON} onClick={() => setReporting(true)}>
              Report my partner
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
