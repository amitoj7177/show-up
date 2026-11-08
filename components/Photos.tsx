"use client";

import { useEffect, useRef, useState } from "react";
import { getToken } from "@/lib/api";

export async function shrinkPhoto(file: File): Promise<string> {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 720 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export function PrivatePhoto({ kind, id, alt, className = "" }: { kind: "profile" | "proof"; id: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    fetch(`/api/photo?kind=${kind}&id=${id}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (!blob || cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [kind, id]);

  if (!url) return <div role="img" aria-label={alt} className={`bg-line/20 ${className}`} />;
  return <img src={url} alt={alt} className={`object-cover ${className}`} />;
}

export function PhotoButton({ label, className, onPhoto, disabled }: { label: string; className: string; onPhoto: (dataUrl: string) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className} disabled={disabled} onClick={() => input.current?.click()}>
        {label}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onPhoto(await shrinkPhoto(file));
        }}
      />
    </>
  );
}
