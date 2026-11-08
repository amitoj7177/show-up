"use client";

import { useEffect, useRef } from "react";
import { AVATAR_H, AVATAR_W, drawAvatar } from "@/lib/avatar";
import type { MascotMood } from "@/lib/rules";

const MOTION: Partial<Record<MascotMood, string>> = {
  happy: "character-happy",
  proud: "character-happy",
  mad: "character-mad",
  furious: "character-furious",
};

export function PixelAvatar({
  code,
  mood,
  scale = 4,
  label,
  animate = false,
  wave = 0,
}: {
  code: string;
  mood: MascotMood;
  scale?: number;
  label?: string;
  animate?: boolean;
  wave?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (context) context.putImageData(new ImageData(new Uint8ClampedArray(drawAvatar(code, mood, wave)), AVATAR_W, AVATAR_H), 0, 0);
  }, [code, mood, wave]);

  return (
    <canvas
      ref={canvas}
      width={AVATAR_W}
      height={AVATAR_H}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`pixel block ${animate ? (MOTION[mood] ?? "") : ""}`}
      style={{ width: AVATAR_W * scale, height: AVATAR_H * scale }}
    />
  );
}
