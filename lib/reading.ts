// Easy reading settings: a plain font, bigger text, stronger contrast and less motion.
// Saved on this device only (they're a personal preference, not account data), and applied to <html>
// as data attributes that globals.css reads.

export const READING_OPTIONS = [
  { key: "font", value: "plain", label: "Plain font", hint: "Swap the pixel font for an easy-to-read one." },
  { key: "text", value: "large", label: "Bigger text", hint: "Makes all the words larger." },
  { key: "contrast", value: "high", label: "Stronger contrast", hint: "Darker text and plain white backgrounds." },
  { key: "motion", value: "reduced", label: "Less motion", hint: "Stops animations and moving characters." },
] as const;

export type ReadingKey = (typeof READING_OPTIONS)[number]["key"];
export type ReadingSettings = Partial<Record<ReadingKey, string>>;

const STORAGE_KEY = "reading";

export function loadReading(): ReadingSettings {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveReading(settings: ReadingSettings): void {
  applyReading(settings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private browsing: the setting still works until the page closes.
  }
}

export function applyReading(settings: ReadingSettings): void {
  for (const { key } of READING_OPTIONS) {
    if (settings[key]) document.documentElement.dataset[key] = settings[key];
    else delete document.documentElement.dataset[key];
  }
}

// Runs before the page draws, so there's no flash of the pixel font for someone who turned it off.
export const APPLY_BEFORE_PAINT = `try{var s=JSON.parse(localStorage.getItem("${STORAGE_KEY}")||"{}");for(var k in s){if(s[k])document.documentElement.dataset[k]=s[k]}}catch(e){}`;

// True if the device asks for less motion, or the person turned on "Less motion" here.
export function wantsLessMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced";
}
