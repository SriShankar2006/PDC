"use client";
import { useEffect, useRef, useState } from "react";

/*
  Each body (sun/moon) tracks: position string, opacity, and whether CSS
  transition is active. We toggle transition OFF before instant snaps so
  the body teleports invisibly, then toggle it ON for the animated sweep.

  Positions (SVG centered in viewport via flexbox on wrapper):
    OFF_LEFT  = bottom-left  corner
    CENTER    = viewport center
    OFF_RIGHT = bottom-right corner

  Initial state:
    Light mode → sun at CENTER (opacity 1), moon at OFF_RIGHT (opacity 0)
    Dark  mode → moon at CENTER (opacity 1), sun  at OFF_RIGHT (opacity 0)

  Light → Dark transition:
    1. [transition ON]  sun  moves CENTER   → OFF_RIGHT  (fades out)
    2. [transition OFF] moon snaps OFF_RIGHT → OFF_LEFT  (instant, invisible)
    3. [transition ON]  moon moves OFF_LEFT  → CENTER    (fades in)

  Dark → Light transition:
    1. [transition ON]  moon moves CENTER   → OFF_RIGHT  (fades out)
    2. [transition OFF] sun  snaps OFF_RIGHT → OFF_LEFT  (instant, invisible)
    3. [transition ON]  sun  moves OFF_LEFT  → CENTER    (fades in)
*/

const OFF_LEFT  = "translate(-46vw, 54vh)";
const CENTER    = "translate(0px, 0px)";
const OFF_RIGHT = "translate(46vw, 54vh)";
const SWEEP_MS  = 900;

type Body = {
  pos: string;
  opacity: number;
  animated: boolean;
};

const sunInitLight:  Body = { pos: CENTER,    opacity: 1, animated: false };
const sunInitDark:   Body = { pos: OFF_RIGHT, opacity: 0, animated: false };
const moonInitLight: Body = { pos: OFF_RIGHT, opacity: 0, animated: false };
const moonInitDark:  Body = { pos: CENTER,    opacity: 1, animated: false };

export default function CelestialBg() {
  const [sun,     setSun]     = useState<Body>(sunInitLight);
  const [moon,    setMoon]    = useState<Body>(moonInitLight);
  const [mounted, setMounted] = useState(false);

  const prevDark = useRef<boolean | null>(null);
  const busy     = useRef(false);
  const ids      = useRef<ReturnType<typeof setTimeout>[]>([]);

  function schedule(ms: number, fn: () => void) {
    ids.current.push(setTimeout(fn, ms));
  }

  function clearAll() {
    ids.current.forEach(clearTimeout);
    ids.current = [];
  }

  useEffect(() => {
    return () => clearAll();
  }, []);

  useEffect(() => {
    setMounted(true);

    const isDark = document.documentElement.classList.contains("dark");
    prevDark.current = isDark;

    // Place without animation
    setSun(isDark  ? sunInitDark  : sunInitLight);
    setMoon(isDark ? moonInitDark : moonInitLight);

    const observer = new MutationObserver(() => {
      const nowDark = document.documentElement.classList.contains("dark");
      if (prevDark.current === nowDark || busy.current) return;
      prevDark.current = nowDark;
      busy.current = true;
      clearAll();

      if (nowDark) {
        // ── Light → Dark ─────────────────────────────────────
        // 1. Sun sweeps to bottom-right (animated)
        setSun({ pos: OFF_RIGHT, opacity: 0, animated: true });

        // 2. Snap moon to bottom-left (no animation, invisible)
        schedule(50, () => setMoon({ pos: OFF_LEFT, opacity: 0, animated: false }));

        // 3. Moon rises to center (animated)
        schedule(SWEEP_MS * 0.5, () => setMoon({ pos: CENTER, opacity: 1, animated: true }));

        // 4. Unlock
        schedule(SWEEP_MS * 2.2, () => { busy.current = false; });

      } else {
        // ── Dark → Light ─────────────────────────────────────
        // 1. Moon sweeps to bottom-right (animated)
        setMoon({ pos: OFF_RIGHT, opacity: 0, animated: true });

        // 2. Snap sun to bottom-left (no animation, invisible)
        schedule(50, () => setSun({ pos: OFF_LEFT, opacity: 0, animated: false }));

        // 3. Sun rises to center (animated)
        schedule(SWEEP_MS * 0.5, () => setSun({ pos: CENTER, opacity: 1, animated: true }));

        // 4. Unlock
        schedule(SWEEP_MS * 2.2, () => { busy.current = false; });
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  function bodyStyle(b: Body): React.CSSProperties {
    return {
      position: "absolute",
      transform: b.pos,
      opacity: b.opacity,
      transition: b.animated
        ? `transform ${SWEEP_MS}ms cubic-bezier(0.45, 0, 0.55, 1), opacity ${Math.round(SWEEP_MS * 0.65)}ms ease`
        : "none",
      willChange: "transform, opacity",
    };
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {/* ── SUN ── */}
      <svg width="320" height="320" viewBox="0 0 320 320" style={bodyStyle(sun)}>
        <defs>
          <radialGradient id="kv-sunAmbient" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FFF9C4" stopOpacity="0.15" />
            <stop offset="55%"  stopColor="#FFD54F" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#FF8F00" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="kv-sunDisc" cx="46%" cy="44%" r="56%">
            <stop offset="0%"   stopColor="#FFEE58" stopOpacity="0.45" />
            <stop offset="65%"  stopColor="#FDD835" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F9A825" stopOpacity="0.08" />
          </radialGradient>
        </defs>
        <circle cx="160" cy="160" r="155" fill="url(#kv-sunAmbient)" />
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 22.5 * Math.PI) / 180;
          const inner = i % 2 === 0 ? 72 : 68;
          const outer = i % 2 === 0 ? 108 : 88;
          return (
            <line
              key={i}
              x1={160 + Math.cos(angle) * inner}
              y1={160 + Math.sin(angle) * inner}
              x2={160 + Math.cos(angle) * outer}
              y2={160 + Math.sin(angle) * outer}
              stroke="#FDD835"
              strokeWidth={i % 2 === 0 ? 3 : 1.5}
              strokeOpacity={i % 2 === 0 ? 0.28 : 0.14}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="160" cy="160" r="64" fill="url(#kv-sunDisc)" />
        <circle cx="160" cy="160" r="34" fill="#FFFDE7" fillOpacity="0.18" />
      </svg>

      {/* ── MOON ── */}
      <svg width="280" height="280" viewBox="0 0 280 280" style={bodyStyle(moon)}>
        <defs>
          <radialGradient id="kv-moonAmbient" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#90A4AE" stopOpacity="0.15" />
            <stop offset="60%"  stopColor="#607D8B" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#37474F" stopOpacity="0" />
          </radialGradient>
          <mask id="kv-crescent">
            <circle cx="140" cy="140" r="64" fill="white" />
            <circle cx="172" cy="128" r="54" fill="black" />
          </mask>
        </defs>
        <circle cx="140" cy="140" r="136" fill="url(#kv-moonAmbient)" />
        {[
          { x: 62,  y: 70,  r: 2.0, o: 0.35 },
          { x: 208, y: 58,  r: 1.5, o: 0.28 },
          { x: 228, y: 176, r: 2.2, o: 0.32 },
          { x: 48,  y: 196, r: 1.4, o: 0.24 },
          { x: 162, y: 228, r: 1.6, o: 0.28 },
          { x: 92,  y: 42,  r: 1.0, o: 0.18 },
          { x: 240, y: 118, r: 1.0, o: 0.18 },
        ].map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#CFD8DC" fillOpacity={s.o} />
        ))}
        <circle cx="140" cy="140" r="64" fill="#ECEFF1" fillOpacity="0.22" mask="url(#kv-crescent)" />
        <circle cx="140" cy="140" r="64" fill="none" stroke="#B0BEC5" strokeWidth="1" strokeOpacity="0.14" />
      </svg>
    </div>
  );
}
