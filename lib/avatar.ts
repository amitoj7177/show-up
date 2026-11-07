// The team's pixel character, moved here from avatar.py so it can be drawn in the app.
// A character is saved as a short code like "h2-c5-s3-e1-o4-k8-a1", one number per choice.
// Same grid, same colours, same moods as the original script.
import type { MascotMood } from "./rules";

export const AVATAR_W = 34;
export const AVATAR_H = 52;
const OX = 1;
const OY = 2;
const K = "#2d2540";
const SK = ["#ffe3cc", "#f6cfa6", "#e5ad7e", "#c88a58", "#93603a", "#5e3b24"];
const HC = ["#2a2230", "#5a3a1a", "#8d5a2b", "#d9a441", "#ecd28a", "#c0392b", "#9aa0a6", "#7e57ff", "#e84393", "#1fbfae"];
const OC = ["#3f6fd8", "#e53935", "#43a047", "#fb8c00", "#8e44ad", "#2b2d3a", "#f5f5f5", "#00acc1", "#ffd54f", "#ec407a"];
const IC = ["#5b3a29", "#2e6fba", "#2f8f5b", "#8a6a2e", "#6b7280", "#8e44ad"];

// The soft background colour behind each mood.
export const MOOD_BACKGROUND: Record<MascotMood, string> = {
  waiting: "#dfe6f1",
  happy: "#ffe58a",
  proud: "#ffd54f",
  caring: "#ffc9dc",
  sad: "#cfe0f5",
  annoyed: "#ffd9a8",
  mad: "#ffb8a8",
  furious: "#ff9a8f",
};

export type AvatarChoice = { hair: number; hc: number; skin: number; eyes: number; outfit: number; oc: number; acc: number };
export type ChoiceKey = keyof AvatarChoice;

export const DEFAULT_AVATAR = "h0-c0-s1-e0-o1-k0-a0";

// Each choice in the customize menu. The names are also what screen readers announce.
export const CHOICES: { key: ChoiceKey; letter: string; title: string; kind: "tile" | "swatch"; options: { name: string; colour?: string }[] }[] = [
  { key: "hair", letter: "h", title: "Hair", kind: "tile", options: ["Crop", "Long", "Curly", "Bun", "Buzz"].map((name) => ({ name })) },
  {
    key: "hc",
    letter: "c",
    title: "Hair colour",
    kind: "swatch",
    options: ["Black", "Dark brown", "Brown", "Golden", "Blonde", "Red", "Grey", "Violet", "Pink", "Teal"].map((name, i) => ({ name, colour: HC[i] })),
  },
  {
    key: "skin",
    letter: "s",
    title: "Skin",
    kind: "swatch",
    options: ["Tone 1", "Tone 2", "Tone 3", "Tone 4", "Tone 5", "Tone 6"].map((name, i) => ({ name, colour: SK[i] })),
  },
  {
    key: "eyes",
    letter: "e",
    title: "Eyes",
    kind: "swatch",
    options: ["Brown", "Blue", "Green", "Hazel", "Grey", "Violet"].map((name, i) => ({ name, colour: IC[i] })),
  },
  { key: "outfit", letter: "o", title: "Outfit", kind: "tile", options: ["Tee", "Hoodie", "Jacket", "Jersey", "Dress"].map((name) => ({ name })) },
  {
    key: "oc",
    letter: "k",
    title: "Outfit colour",
    kind: "swatch",
    options: ["Blue", "Red", "Green", "Orange", "Purple", "Charcoal", "White", "Cyan", "Yellow", "Pink"].map((name, i) => ({ name, colour: OC[i] })),
  },
  { key: "acc", letter: "a", title: "Extras", kind: "tile", options: ["None", "Glasses", "Shades", "Headphones", "Scarf", "Cap"].map((name) => ({ name })) },
];

export function parseAvatar(code: string): AvatarChoice {
  const choice: AvatarChoice = { hair: 0, hc: 0, skin: 1, eyes: 0, outfit: 1, oc: 0, acc: 0 };
  for (const { key, letter, options } of CHOICES) {
    const found = code.match(new RegExp(`${letter}(\\d+)`));
    if (found) choice[key] = Number(found[1]) % options.length;
  }
  return choice;
}

export function encodeAvatar(choice: AvatarChoice): string {
  return CHOICES.map(({ key, letter }) => `${letter}${choice[key]}`).join("-");
}

export function randomAvatar(random: () => number = Math.random): string {
  const choice = parseAvatar(DEFAULT_AVATAR);
  for (const { key, options } of CHOICES) choice[key] = Math.floor(random() * options.length);
  return encodeAvatar(choice);
}

// The backend only accepts codes that could really have come from the menu.
export function isAvatarCode(code: unknown): code is string {
  if (typeof code !== "string" || !/^h\d+-c\d+-s\d+-e\d+-o\d+-k\d+-a\d+$/.test(code)) return false;
  return CHOICES.every(({ letter, options }) => Number(code.match(new RegExp(`${letter}(\\d+)`))?.[1]) < options.length);
}

// --- Drawing -------------------------------------------------------------

type Colour = string | [number, number, number];
type Pixels = Uint8ClampedArray;

let px: Pixels = new Uint8ClampedArray(0);
let offsetX = 0;
let offsetY = 0;
let alpha = 1;

function blank(): Pixels {
  return new Uint8ClampedArray(AVATAR_W * AVATAR_H * 4);
}

function rgb(colour: Colour): [number, number, number] {
  if (typeof colour !== "string") return colour;
  const hex = colour.replace("#", "");
  const full = hex.length === 3 ? [...hex].map((ch) => ch + ch).join("") : hex;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function shade(colour: Colour, factor: number): [number, number, number] {
  const [r, g, b] = rgb(colour);
  const adjust = (value: number) => Math.max(0, Math.min(255, Math.trunc(value * factor + 0.5)));
  return [adjust(r), adjust(g), adjust(b)];
}

function put(xIn: number, yIn: number, colour: Colour) {
  const x = xIn + offsetX;
  const y = yIn + offsetY;
  if (!(x >= 0 && x < AVATAR_W && y >= 0 && y < AVATAR_H)) return;
  const [r, g, b] = rgb(colour);
  const i = (y * AVATAR_W + x) * 4;
  const da = px[i + 3] / 255;
  const oa = alpha + da * (1 - alpha);
  if (oa <= 0) return;
  px[i] = Math.trunc((r * alpha + px[i] * da * (1 - alpha)) / oa + 0.5);
  px[i + 1] = Math.trunc((g * alpha + px[i + 1] * da * (1 - alpha)) / oa + 0.5);
  px[i + 2] = Math.trunc((b * alpha + px[i + 2] * da * (1 - alpha)) / oa + 0.5);
  px[i + 3] = Math.trunc(oa * 255 + 0.5);
}

const P = put;

function R(x: number, y: number, w: number, h: number, colour: Colour) {
  for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) put(x + i, y + j, colour);
}

function inEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  const a = (x + 0.5 - cx) / rx;
  const b = (y + 0.5 - cy) / ry;
  return a * a + b * b <= 1;
}

type Fill = (x: number, y: number) => Colour | null;

function EF(cx: number, cy: number, rx: number, ry: number, fill: Fill, skip?: (x: number, y: number) => boolean) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      if (inEllipse(x, y, cx, cy, rx, ry) && !(skip && skip(x, y))) {
        const colour = fill(x, y);
        if (colour) put(x, y, colour);
      }
    }
  }
}

function E(cx: number, cy: number, rx: number, ry: number, colour: Colour) {
  EF(cx, cy, rx, ry, () => colour);
}

function highlight(colour: Colour, cx: number, cy: number, rx: number, ry: number): Fill {
  const hi = shade(colour, 1.45);
  const lo = shade(colour, 0.7);
  return (x, y) => {
    const light = -((x + 0.5 - cx) / rx) * 0.55 - ((y + 0.5 - cy) / ry) * 0.6;
    return light > 0.52 ? hi : light < -0.42 ? lo : colour;
  };
}

function hairCap(cx: number, cy: number, rx: number, ry: number, colour: Colour, wx: number, wy: number, wrx: number, wry: number) {
  EF(cx, cy, rx, ry, highlight(colour, cx, cy, rx, ry), (x, y) => inEllipse(x, y, wx, wy, wrx, wry));
}

function pattern(x: number, y: number, rows: string[], colour: Colour) {
  rows.forEach((row, j) => [...row].forEach((ch, i) => ch === "x" && P(x + i, y + j, colour)));
}

function legs(s: AvatarChoice, skin: string, sk2: Colour, oc: string, o2: Colour) {
  const J = "#3d5a8a";
  const Jd = "#2f4770";
  const Jh = "#5273ad";
  const ln = oc === "#f5f5f5" ? "#9aa0a6" : "#f5f5f5";
  if (s.outfit === 4) {
    R(12, 42, 3, 3, skin); R(17, 42, 3, 3, skin);
    R(14, 42, 1, 3, sk2); R(19, 42, 1, 3, sk2);
  } else if (s.outfit === 3) {
    R(12, 42, 3, 3, skin); R(17, 42, 3, 3, skin);
    R(14, 42, 1, 3, sk2); R(19, 42, 1, 3, sk2);
    R(10, 39, 12, 3, o2); R(15, 41, 2, 1, shade(oc, 0.5));
    R(10, 39, 1, 3, ln); R(21, 39, 1, 3, ln);
  } else {
    R(10, 39, 12, 1, "#7a5a3a"); P(16, 39, "#ffd54f");
    R(11, 40, 10, 2, J); R(11, 42, 4, 3, J); R(17, 42, 4, 3, J);
    R(14, 42, 1, 3, Jd); R(20, 40, 1, 5, Jd);
    R(11, 40, 1, 5, Jh); R(17, 42, 1, 3, Jh);
    R(11, 44, 4, 1, Jd); R(17, 44, 4, 1, Jd);
  }
  R(10, 45, 6, 2, "#f5f5f5"); R(16, 45, 6, 2, "#f5f5f5");
  R(10, 46, 6, 1, oc); R(16, 46, 6, 1, oc);
  R(10, 47, 6, 1, "#aeb4bf"); R(16, 47, 6, 1, "#aeb4bf");
  for (const x of [12, 13, 18, 19]) P(x, 45, "#aeb4bf");
}

function torso(s: AvatarChoice, skin: string, sk2: Colour, oc: string, o2: Colour, o3: Colour) {
  const ln = oc === "#f5f5f5" ? "#9aa0a6" : "#f5f5f5";
  const longSleeves = s.outfit === 1 || s.outfit === 2;
  R(12, 29, 8, 1, oc); R(10, 30, 12, 9, oc);
  R(8, 30, 2, 1, oc); R(22, 30, 2, 1, oc);
  if (longSleeves) {
    R(7, 31, 3, 7, oc); R(22, 31, 3, 7, oc);
    R(7, 37, 3, 1, o2); R(22, 37, 3, 1, o2);
  } else {
    R(7, 31, 3, 4, oc); R(22, 31, 3, 4, oc);
    R(7, 34, 3, 1, o2); R(22, 34, 3, 1, o2);
    R(7, 35, 3, 3, skin); R(22, 35, 3, 3, skin);
    R(9, 35, 1, 3, sk2); R(24, 35, 1, 3, sk2);
  }
  R(21, 30, 1, 9, o2); R(24, 31, 1, 4, o2);
  R(10, 31, 1, 5, o3); R(7, 32, 1, 2, o3); R(10, 38, 12, 1, o2);
  const o = s.outfit;
  if (o === 4) {
    R(10, 36, 12, 2, oc); R(9, 38, 14, 2, oc); R(8, 40, 16, 2, oc);
    R(8, 42, 16, 1, o2); R(10, 35, 12, 1, shade(oc, 0.65));
    P(16, 35, "#f5f5f5"); P(15, 35, "#f5f5f5");
    for (const x of [11, 14, 17, 20]) R(x, 38, 1, 4, o2);
    R(21, 36, 1, 2, o2); R(22, 38, 1, 4, o2);
    for (const [x, y] of [[12, 39], [16, 40], [20, 39], [13, 41], [18, 41]]) P(x, y, ln);
    R(13, 29, 6, 1, skin); R(14, 30, 4, 1, skin);
  }
  if (o === 0) {
    R(13, 29, 6, 1, o2); P(14, 29, sk2); P(17, 29, sk2);
    const print = oc === "#ffd54f" || oc === "#f5f5f5" ? "#ec407a" : "#ffd54f";
    pattern(14, 32, ["..x..", "xxxxx", ".xxx.", ".x.x."], print);
  }
  if (o === 1) {
    R(12, 35, 8, 3, shade(oc, 0.9)); R(12, 35, 8, 1, o2);
    R(12, 35, 1, 3, o2); R(19, 35, 1, 3, o2);
    R(14, 30, 1, 5, ln); R(17, 30, 1, 5, ln);
    P(14, 35, "#cfd3da"); P(17, 35, "#cfd3da");
  }
  if (o === 2) {
    R(14, 29, 4, 10, "#f5f5f5"); R(17, 32, 1, 6, "#d9dde5");
    R(12, 29, 3, 2, o2); R(17, 29, 3, 2, o2);
    R(13, 31, 1, 8, o2); R(18, 31, 1, 8, o2);
    R(11, 35, 2, 1, o2); R(19, 35, 2, 1, o2);
    R(7, 35, 3, 1, ln); R(22, 35, 3, 1, ln);
  }
  if (o === 3) {
    R(13, 29, 6, 1, sk2); R(14, 30, 4, 1, skin); R(15, 31, 2, 1, skin);
    for (const [x, y] of [[12, 29], [13, 30], [14, 31], [19, 29], [18, 30], [17, 31]]) R(x, y, 1, 1, ln);
    R(7, 33, 3, 1, ln); R(22, 33, 3, 1, ln);
    pattern(14, 32, ["xxxxx", "....x", "...x.", "..x..", ".x...", ".x...", ".x..."], ln);
  }
}

function face(s: AvatarChoice, m: MascotMood) {
  const skin = SK[s.skin];
  const ic = IC[s.eyes];
  const bc = shade(HC[s.hc], 0.72);
  const mc = "#b04a4f";
  const dr = "#5a1f2d";

  const eyeOpen = (ex: number, look: number) => {
    R(ex, 17, 4, 1, K); R(ex, 18, 4, 4, "#fff"); R(ex, 18, 4, 1, "#dfe6f1");
    R(ex + 1 + look, 18, 2, 4, ic); R(ex + 1 + look, 19, 2, 2, K);
    P(ex + 1 + look, 19, "#fff");
  };
  const eyeBig = (ex: number) => {
    R(ex, 17, 4, 1, K); R(ex, 18, 4, 4, ic); R(ex + 1, 19, 2, 2, K);
    P(ex + 1, 19, "#fff"); P(ex + 2, 21, "#fff");
  };
  const eyeArc = (ex: number) => {
    P(ex, 20, K); R(ex + 1, 19, 2, 1, K); P(ex + 3, 20, K);
  };
  const eyeHalf = (ex: number) => {
    R(ex, 18, 4, 1, K); R(ex, 19, 4, 2, "#fff");
    R(ex + 1, 19, 2, 2, ic); R(ex + 1, 20, 2, 1, K);
  };
  const eyeGlare = (ex: number) => {
    R(ex, 17, 4, 2, K); R(ex, 19, 4, 3, "#fff"); R(ex + 1, 19, 2, 3, ic);
    R(ex + 1, 20, 2, 2, K); P(ex + 1, 20, "#fff");
  };
  const eyeTiny = (ex: number) => {
    R(ex, 17, 4, 2, K); R(ex, 19, 4, 3, "#fff"); R(ex + 1, 20, 2, 1, K);
  };
  const brow = (points: number[][]) => {
    for (const [x, y] of points) {
      P(x, y, bc);
      P(31 - x, y, bc);
    }
  };

  alpha = m === "happy" || m === "proud" || m === "caring" ? 0.8 : m === "furious" ? 0 : 0.35;
  R(9, 22, 3, 1, "#f4a3a8"); R(20, 22, 3, 1, "#f4a3a8");
  alpha = 1;
  R(15, 22, 2, 1, shade(skin, 0.8));

  if (m === "waiting") {
    eyeOpen(10, 1); eyeOpen(18, 1); P(9, 17, K); P(22, 17, K);
    brow([[10, 15], [11, 15], [12, 15], [13, 15]]);
    R(15, 24, 2, 1, mc);
  }
  if (m === "happy") {
    eyeArc(10); eyeArc(18);
    brow([[10, 15], [11, 14], [12, 14], [13, 14]]);
    R(13, 24, 6, 1, dr); R(14, 25, 4, 1, dr);
    R(14, 24, 4, 1, "#fff"); R(15, 25, 2, 1, "#ee7b8b");
  }
  if (m === "proud") {
    eyeArc(10); eyeArc(18);
    brow([[10, 14], [11, 13], [12, 13], [13, 14]]);
    R(14, 24, 4, 1, mc); P(13, 23, mc); P(18, 23, mc);
  }
  if (m === "caring") {
    eyeBig(10); eyeBig(18); P(9, 17, K); P(22, 17, K);
    brow([[10, 16], [11, 15], [12, 15], [13, 14]]);
    R(14, 24, 4, 1, mc); P(13, 23, mc); P(18, 23, mc);
  }
  if (m === "annoyed") {
    eyeHalf(10); eyeHalf(18);
    brow([[10, 16], [11, 16], [12, 16], [13, 16]]);
    R(14, 25, 4, 1, mc); P(18, 24, mc);
  }
  if (m === "mad") {
    eyeGlare(10); eyeGlare(18);
    brow([[10, 14], [11, 14], [11, 15], [12, 15], [12, 16], [13, 16]]);
    R(14, 25, 4, 1, mc); P(13, 26, mc); P(18, 26, mc);
  }
  if (m === "sad") {
    eyeBig(10); eyeBig(18);
    brow([[10, 16], [11, 16], [12, 15], [13, 14]]);
    P(11, 22, "#7ec8ff"); P(11, 23, "#7ec8ff"); P(20, 22, "#7ec8ff");
    R(14, 25, 4, 1, mc); P(13, 26, mc); P(18, 26, mc);
  }
  if (m === "furious") {
    eyeTiny(10); eyeTiny(18);
    brow([[9, 13], [10, 13], [10, 14], [11, 14], [11, 15], [12, 15], [12, 16], [13, 16]]);
    R(13, 24, 6, 2, dr); R(14, 26, 4, 1, dr);
    R(14, 24, 4, 1, "#fff"); R(15, 26, 2, 1, "#e0707f");
  }
}

function drawHair(s: AvatarChoice) {
  const colour = HC[s.hc];
  const h = s.hair;
  if (h === 0 || h === 3) {
    hairCap(16, 13, 9.9, 9.7, colour, 16, 19.6, 7.8, 7.3);
    R(9, 12, 15, 1, colour); R(9, 13, 9, 1, colour);
  }
  if (h === 3) {
    EF(16, 3.6, 3.8, 3.4, highlight(colour, 16, 3.6, 3.8, 3.4));
    R(13, 6, 6, 1, "#ec407a"); R(13, 7, 6, 1, shade("#ec407a", 0.75));
  }
  if (h === 1) {
    hairCap(16, 13, 9.9, 9.7, colour, 16, 19.6, 7.8, 7.3);
    R(9, 12, 6, 1, colour); R(17, 12, 6, 1, colour);
    R(9, 13, 3, 1, colour); R(20, 13, 3, 1, colour);
    R(7, 14, 2, 14, colour); R(23, 14, 2, 14, colour);
  }
  if (h === 2) {
    hairCap(16, 12, 12.2, 10.8, colour, 16, 19.8, 7.5, 7.1);
    for (const [bx, by] of [[6, 9], [5.5, 14], [6.5, 19], [26, 9], [26.5, 14], [25.5, 19], [9, 4.5], [13, 2.5], [19, 2.5], [23, 4.5], [16, 1.8]]) {
      EF(bx, by, 1.9, 1.9, highlight(colour, bx, by, 1.9, 1.9));
    }
  }
  if (h === 4) {
    alpha = 0.9;
    hairCap(16, 13.3, 8.6, 8.5, colour, 16, 19.4, 7.8, 7.4);
    alpha = 1;
  }
}

function drawAll(s: AvatarChoice, m: MascotMood, wave: number) {
  const skin = SK[s.skin];
  const sk2 = shade(skin, 0.86);
  const sk3 = shade(skin, 0.72);
  const oc = OC[s.oc];
  const o2 = shade(oc, 0.78);
  const o3 = shade(oc, 1.22);
  const hc = HC[s.hc];
  if (s.hair === 1) EF(16, 21, 11.2, 13, highlight(hc, 16, 21, 11.2, 13));
  legs(s, skin, sk2, oc, o2);
  torso(s, skin, sk2, oc, o2, o3);
  if (wave) {
    // Rub out the arm on the right, so it can be drawn raised instead.
    for (let y = 31; y < 38; y += 1) for (let x = 22; x < 25; x += 1) px.fill(0, ((y + offsetY) * AVATAR_W + x + offsetX) * 4, ((y + offsetY) * AVATAR_W + x + offsetX) * 4 + 4);
  }
  E(8.5, 38.4, 1.7, 1.7, skin);
  if (!wave) E(23.5, 38.4, 1.7, 1.7, skin);
  if (wave) {
    const forearm = s.outfit === 1 || s.outfit === 2 ? oc : skin;
    R(23, 29, 2, 2, oc);
    if (wave === 1) {
      R(25, 27, 2, 2, oc); R(26, 25, 2, 2, forearm); E(27.2, 24, 1.9, 1.9, skin);
    } else {
      R(25, 28, 2, 2, oc); R(27, 26, 2, 2, forearm); E(28.4, 25, 1.9, 1.9, skin);
    }
  }
  if (s.outfit === 1) E(16, 29.2, 6.8, 2.4, o2);
  R(14, 26, 4, 3, sk2); R(14, 26, 4, 1, sk3);
  E(7.2, 18.6, 1.7, 2.3, skin); E(24.8, 18.6, 1.7, 2.3, skin);
  E(16, 17, 8.6, 9.6, sk2); E(15.8, 16.7, 8.1, 9.1, skin);
  if (m === "furious") {
    alpha = 0.38;
    E(16, 17, 8.6, 9.6, "#e53935");
    alpha = 1;
  }
  face(s, m);
  drawHair(s);
  const a = s.acc;
  if (a === 1) {
    const frame = "#2d2540";
    alpha = 0.22;
    R(10, 17, 4, 5, "#cfe8ff"); R(18, 17, 4, 5, "#cfe8ff");
    alpha = 1;
    R(10, 16, 4, 1, frame); R(10, 22, 4, 1, frame); R(9, 17, 1, 5, frame);
    R(14, 17, 1, 5, frame); R(18, 16, 4, 1, frame); R(18, 22, 4, 1, frame);
    R(17, 17, 1, 5, frame); R(22, 17, 1, 5, frame); R(15, 18, 2, 1, frame);
    R(8, 18, 1, 1, frame); R(23, 18, 1, 1, frame);
  }
  if (a === 2) {
    const dark = "#1f1b2e";
    R(9, 17, 6, 5, dark); R(17, 17, 6, 5, dark); R(9, 16, 14, 1, dark);
    R(15, 17, 2, 1, dark); R(8, 17, 1, 1, dark); R(23, 17, 1, 1, dark);
    for (const x of [10, 11, 18, 19]) P(x, 18, "#8fa0ff");
  }
  if (a === 3) {
    for (let y = 3; y < 18; y += 1) {
      for (let x = 3; x < 29; x += 1) {
        if (inEllipse(x, y, 16, 13, 10.9, 10.9) && !inEllipse(x, y, 16, 13, 9.4, 9.4)) P(x, y, "#3a3a4a");
      }
    }
    const cup = "#ff5a5f";
    R(4, 14, 4, 8, cup); R(24, 14, 4, 8, cup);
    R(5, 15, 1, 6, shade(cup, 1.3)); R(26, 15, 1, 6, shade(cup, 1.3));
    R(7, 15, 1, 6, shade(cup, 0.75)); R(24, 15, 1, 6, shade(cup, 0.75));
  }
  if (a === 4) {
    const scarf = "#ffd54f";
    const stripe = "#fb8c00";
    R(10, 28, 12, 3, scarf); R(10, 29, 12, 1, stripe); R(10, 30, 12, 1, shade(scarf, 0.82));
    R(18, 31, 3, 6, scarf); R(18, 33, 3, 1, stripe); R(18, 35, 3, 1, stripe);
    R(20, 31, 1, 6, shade(scarf, 0.82));
  }
  if (a === 5) {
    const capFill = highlight(oc, 16, 8.5, 10, 6.5);
    EF(16, 8.5, 10, 6.5, (x, y) => (y <= 11 ? capFill(x, y) : null));
    EF(16, 12, 11.4, 1.7, () => o2);
    R(10, 11, 6, 1, shade(oc, 1.15));
    for (let q = 3; q < 11; q += 1) P(16, q, o2);
    P(16, 2, o2);
  }
}

function effects(m: MascotMood) {
  const spark = (x: number, y: number, colour: string) => {
    P(x, y, "#fff"); P(x - 1, y, colour); P(x + 1, y, colour);
    P(x, y - 1, colour); P(x, y + 1, colour);
  };
  const cloud = (x: number, y: number) => {
    const edge = "#c3cbd9";
    R(x + 1, y, 4, 1, edge); R(x, y + 1, 6, 2, edge); R(x + 1, y + 3, 4, 1, edge);
    R(x + 1, y + 1, 4, 2, "#f4f6fa");
  };
  if (m === "waiting") for (const x of [24, 27, 30]) R(x, 7, 2, 2, "#8a94a6");
  if (m === "happy") {
    spark(27, 6, "#ffd54f"); spark(4, 10, "#ffd54f");
  }
  if (m === "proud") {
    spark(27, 6, "#ffd54f");
    for (const [x, y] of [[27, 4], [27, 8], [25, 6], [29, 6]]) P(x, y, "#ffd54f");
    spark(4, 9, "#ffd54f"); spark(29, 14, "#ffd54f");
  }
  if (m === "caring") {
    pattern(24, 3, [".x.x.", "xxxxx", ".xxx.", "..x.."], "#ff5d8f");
    pattern(3, 8, ["x.x", "xxx", ".x."], "#ff8fb3");
  }
  if (m === "mad") for (const [x, y] of [[25, 8], [27, 8], [26, 9], [25, 10], [27, 10]]) P(x, y, "#e53935");
  if (m === "furious") {
    cloud(0, 9); cloud(26, 9);
  }
  if (m === "sad") {
    cloud(25, 3);
    P(26, 8, "#4aa8ff"); P(28, 9, "#4aa8ff"); P(27, 11, "#4aa8ff");
  }
}

// Lays one layer on top of another, the standard way images are stacked.
function stack(under: Pixels, over: Pixels): Pixels {
  const result = blank();
  for (let i = 0; i < result.length; i += 4) {
    const oa = over[i + 3] / 255;
    const ua = under[i + 3] / 255;
    const a = oa + ua * (1 - oa);
    if (a <= 0) continue;
    for (let c = 0; c < 3; c += 1) result[i + c] = Math.round((over[i + c] * oa + under[i + c] * ua * (1 - oa)) / a);
    result[i + 3] = Math.round(a * 255);
  }
  return result;
}

// Returns the character as raw pixels: 34 wide, 52 tall, with an outline and a shadow.
// Wave is 0 for standing still, or 1 and 2 for the two frames of a raised arm.
export function drawAvatar(code: string, mood: MascotMood, wave = 0): Pixels {
  const choice = parseAvatar(code);

  px = blank();
  offsetX = OX;
  offsetY = OY;
  alpha = 1;
  drawAll(choice, mood, wave);
  const body = px;

  const solid = (x: number, y: number) => x >= 0 && x < AVATAR_W && y >= 0 && y < AVATAR_H && body[(y * AVATAR_W + x) * 4 + 3] >= 128;
  const outlined = body.slice();
  for (let y = 0; y < AVATAR_H; y += 1) {
    for (let x = 0; x < AVATAR_W; x += 1) {
      if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) {
        outlined.set([45, 37, 64, 255], (y * AVATAR_W + x) * 4);
      }
    }
  }

  px = blank();
  offsetX = 0;
  offsetY = 0;
  alpha = 0.16;
  E(17, 50.3, 9.5, 1.7, [0, 0, 0]);
  alpha = 1;
  px = stack(px, outlined);
  offsetX = OX;
  offsetY = OY;
  effects(mood);
  return px;
}
