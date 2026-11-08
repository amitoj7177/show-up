"use client";

import type { Today } from "@/lib/types";
import { PixelAvatar } from "./PixelAvatar";
import { PrivatePhoto } from "./Photos";

// Who your partner really is: photo, first name, Calgary community and why their goal matters.
export function PartnerCard({ partner }: { partner: NonNullable<Today["partner"]> }) {
  return (
    <div className="flex items-start gap-3">
      {partner.photoId ? (
        <PrivatePhoto kind="profile" id={partner.photoId} alt={`${partner.nickname}'s photo`} className="size-20 shrink-0 border border-line rounded-2xl" />
      ) : (
        <div className="shrink-0 border border-line rounded-2xl bg-[#ffc9dc]">
          <PixelAvatar code={partner.avatar} mood="caring" scale={2} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xl font-bold">{partner.nickname}</p>
        {partner.communityName && <p className="text-muted">{partner.communityName}, Calgary</p>}
        {partner.moveTag && <p className="mt-1 inline-block border border-line bg-[#e6f0ff] px-2 font-semibold">{partner.moveTag}</p>}
        <p className="font-medium">{partner.goal ?? partner.goalTypeLabel}</p>
        {partner.whyItMatters && <p className="mt-1 italic">&ldquo;{partner.whyItMatters}&rdquo;</p>}
      </div>
    </div>
  );
}
