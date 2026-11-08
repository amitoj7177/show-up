"use client";

import { useEffect, useRef, useState } from "react";
import { wantsLessMotion } from "@/lib/reading";
import { AVATAR_H, AVATAR_W, drawAvatar } from "@/lib/avatar";
import type { MascotMood } from "@/lib/rules";

const SCENE_W = 64;
const SCENE_H = 62;

function oval(context: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, colour: string) {
  context.fillStyle = colour;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const a = (x + 0.5 - cx) / rx;
      const b = (y + 0.5 - cy) / ry;
      if (a * a + b * b <= 1) context.fillRect(x, y, 1, 1);
    }
  }
}

function box(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, colour: string) {
  context.fillStyle = colour;
  context.fillRect(x, y, w, h);
}

export function PixelScene({ code, mood, label, bubble }: { code: string; mood: MascotMood; label: string; bubble?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(1);

  useEffect(() => {
    if (wantsLessMotion()) return;
    const timer = setInterval(() => setFrame((current) => (current === 1 ? 2 : 1)), 520);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    box(context, 0, 0, SCENE_W, SCENE_H, "#bfe6ff");
    oval(context, 14, 10, 6, 2.4, "#fff");
    oval(context, 18, 8.6, 4, 2.2, "#fff");
    oval(context, 49, 17, 7, 2.6, "#fff");
    oval(context, 53, 15.6, 4, 2.2, "#fff");
    oval(context, 10, 66, 28, 18, "#8fd37f");
    oval(context, 54, 68, 30, 18, "#79c46b");
    box(context, 0, 57, 64, 5, "#6bb85e");
    box(context, 0, 57, 64, 1, "#8fd37f");
    box(context, 5, 42, 3, 16, "#8d5a2b");
    box(context, 5, 42, 1, 16, "#a8743b");
    oval(context, 6.5, 38, 6, 7.2, "#2e9c4a");
    oval(context, 5, 36, 3.4, 3.6, "#5fc36f");
    oval(context, 8.5, 40, 3.2, 3.2, "#237a3a");
    for (const [x, y, colour] of [[12, 59, "#e53935"], [56, 59, "#ffd54f"], [58, 60, "#ec407a"], [10, 60, "#ffd54f"]] as const) {
      box(context, x, y, 1, 1, colour);
    }
    const character = document.createElement("canvas");
    character.width = AVATAR_W;
    character.height = AVATAR_H;
    character.getContext("2d")?.putImageData(new ImageData(new Uint8ClampedArray(drawAvatar(code, mood, frame)), AVATAR_W, AVATAR_H), 0, 0);
    context.drawImage(character, 15, 8);
  }, [code, mood, frame]);

  return (
    <div className="relative border-b border-line bg-[#bfe6ff]">
      <canvas ref={canvas} width={SCENE_W} height={SCENE_H} role="img" aria-label={label} className="pixel block h-auto w-full" />
      {bubble && (
        <p aria-hidden="true" className="absolute top-[8%] left-[58%] border border-line rounded-2xl bg-white px-2.5 py-1.5 text-xl font-bold leading-none">
          {bubble}
        </p>
      )}
    </div>
  );
}
