"use client";

import { useEffect, useState, type ReactNode } from "react";

const SCREEN_W = 430;
const SCREEN_H = 932;
const BEZEL = 14;

export function PhoneFrame({ children }: { children: ReactNode }) {
  const [time, setTime] = useState("9:41");

  useEffect(() => {
    function fit() {
      const scale = Math.min(1, (window.innerHeight - 40) / (SCREEN_H + BEZEL * 2), (window.innerWidth - 40) / (SCREEN_W + BEZEL * 2));
      document.documentElement.style.setProperty("--phone-scale", String(scale));
    }
    function tick() {
      setTime(new Date().toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?[ap]\.?m\.?/i, ""));
    }
    fit();
    tick();
    const clock = setInterval(tick, 20_000);
    window.addEventListener("resize", fit);
    return () => {
      clearInterval(clock);
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div className="phone-stage">
      <div className="phone-device">
        <div className="phone-frame">
          <div className="phone-status" aria-hidden="true">
            <span className="phone-time">{time}</span>
            <span className="phone-island" />
            <span className="phone-icons">
              <svg viewBox="0 0 18 12" width="18" height="12">
                <rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" />
                <rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor" />
                <rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor" />
                <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" />
              </svg>
              <svg viewBox="0 0 16 12" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M1.5 4.5a9.5 9.5 0 0113 0M4 7.2a5.8 5.8 0 018 0" />
                <circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none" />
              </svg>
              <svg viewBox="0 0 27 13" width="27" height="13">
                <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity="0.4" />
                <rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor" />
                <rect x="24.5" y="4.5" width="2" height="4" rx="1" fill="currentColor" opacity="0.4" />
              </svg>
            </span>
          </div>
          <div id="phone-scroll" className="phone-scroll">
            {children}
          </div>
          <span className="phone-home" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

export function scrollPhoneToTop() {
  document.getElementById("phone-scroll")?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}
