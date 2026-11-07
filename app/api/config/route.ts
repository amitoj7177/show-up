import { ok, route } from "@/lib/http";
import {
  GOAL_TYPE_LABELS,
  GOAL_TYPES,
  MASCOT_MOODS,
  MESSAGES,
  NOT_MEDICAL_CARE,
  PRIVACY_LINE,
  REPORT_REASONS,
  SUPPORT_LINKS,
  TALK,
} from "@/lib/rules";
import { SOURCES } from "@/lib/sources";

// All the fixed lists the app shows, so the wording lives in one place.
export const GET = route(async () =>
  ok({
    goalTypes: GOAL_TYPES.map((id) => ({ id, label: GOAL_TYPE_LABELS[id] })),
    messages: MESSAGES,
    talk: TALK,
    reportReasons: REPORT_REASONS,
    mascotMoods: MASCOT_MOODS,
    support: SUPPORT_LINKS,
    notMedicalCare: NOT_MEDICAL_CARE,
    privacyLine: PRIVACY_LINE,
    sources: SOURCES,
  }),
);
