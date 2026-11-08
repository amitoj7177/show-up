"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { wantsLessMotion } from "@/lib/reading";

function prefersLessMotion(): boolean {
  return wantsLessMotion();
}

function scroller(): HTMLElement | Window {
  const phone = document.getElementById("phone-scroll");
  return phone && phone.scrollHeight > phone.clientHeight ? phone : window;
}

export function useScrollY(): number {
  const [y, setY] = useState(0);
  useEffect(() => {
    if (prefersLessMotion()) return;
    let frame = 0;
    const read = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = scroller();
        setY(target instanceof Window ? window.scrollY : target.scrollTop);
      });
    };
    const phone = document.getElementById("phone-scroll");
    window.addEventListener("scroll", read, { passive: true });
    phone?.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    read();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", read);
      phone?.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);
  return y;
}

function viewBottom(): number {
  const target = scroller();
  return target instanceof Window ? window.innerHeight : target.getBoundingClientRect().bottom;
}

function useSeen<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (prefersLessMotion() || !ref.current) {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, seen };
}

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const scrollY = useScrollY();
  useEffect(() => {
    if (seen || !ref.current) return;
    if (prefersLessMotion() || ref.current.getBoundingClientRect().top < viewBottom() - 40) setSeen(true);
  }, [scrollY, seen]);
  return (
    <div ref={ref} className={`reveal ${seen ? "is-seen" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function CountUp({ text, className = "" }: { text: string; className?: string }) {
  const { ref, seen } = useSeen<HTMLParagraphElement>(0.5);
  const match = text.match(/^(\D*)(\d+)(.*)$/);
  const [shown, setShown] = useState(match ? 0 : null);

  useEffect(() => {
    if (!seen || !match) return;
    if (prefersLessMotion()) {
      setShown(Number(match[2]));
      return;
    }
    const target = Number(match[2]);
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / 1200);
      setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // Only when it first scrolls into view.
  }, [seen]);

  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{match ? `${match[1]}${shown ?? 0}${match[3]}` : text}</span>
    </p>
  );
}

export function useSectionProgress<T extends HTMLElement>(scrollY: number) {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const target = scroller();
    const viewTop = target instanceof Window ? 0 : target.getBoundingClientRect().top;
    const viewHeight = target instanceof Window ? window.innerHeight : target.clientHeight;

    const scale = target instanceof Window ? 1 : target.getBoundingClientRect().height / target.clientHeight || 1;
    const travelled = (viewTop - element.getBoundingClientRect().top) / scale;
    const distance = element.offsetHeight - viewHeight;
    setProgress(distance > 0 ? Math.min(1, Math.max(0, travelled / distance)) : 0);
  }, [scrollY]);
  return { ref, progress };
}
