'use client';
import { useEffect, useRef, useCallback } from 'react';

export default function CursorGlow() {
  const dotRef   = useRef<HTMLDivElement>(null);
  const ringRef  = useRef<HTMLDivElement>(null);
  const glowRef  = useRef<HTMLDivElement>(null);

  // Smooth ring tracking
  const mouse = useRef({ x: -200, y: -200 });
  const ring  = useRef({ x: -200, y: -200 });
  const raf   = useRef<number>(0);

  const spawnTrail = useCallback((x: number, y: number) => {
    const p = document.createElement('div');
    p.className = 'cursor-trail-particle';
    p.style.left = `${x}px`;
    p.style.top  = `${y}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 500);
  }, []);

  useEffect(() => {
    const dot  = dotRef.current;
    const ringEl = ringRef.current;
    const glow = glowRef.current;
    if (!dot || !ringEl || !glow) return;

    let trailTimer = 0;

    function onMouseMove(e: MouseEvent) {
      const { clientX: x, clientY: y } = e;
      mouse.current = { x, y };

      // Snap dot immediately
      dot!.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      glow!.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;

      // Spawn trail every 60ms while moving
      const now = Date.now();
      if (now - trailTimer > 60) {
        spawnTrail(x, y);
        trailTimer = now;
      }

      // Detect element type for cursor state
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, [role="button"], select, label');
      const isText = target.closest('input, textarea');

      document.body.classList.toggle('cursor-hover', !!isInteractive && !isText);
      document.body.classList.toggle('cursor-text',  !!isText);
    }

    function onMouseDown() {
      document.body.classList.add('cursor-click');
    }

    function onMouseUp() {
      document.body.classList.remove('cursor-click');
    }

    function onMouseLeave() {
      dot!.style.opacity  = '0';
      ringEl!.style.opacity = '0';
      glow!.style.opacity = '0';
    }

    function onMouseEnter() {
      dot!.style.opacity  = '1';
      ringEl!.style.opacity = '1';
      glow!.style.opacity = '1';
    }

    function tick() {
      // Lerp ring towards mouse
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      ringEl!.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);

    document.addEventListener('mousemove',  onMouseMove);
    document.addEventListener('mousedown',  onMouseDown);
    document.addEventListener('mouseup',    onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      cancelAnimationFrame(raf.current);
      document.removeEventListener('mousemove',  onMouseMove);
      document.removeEventListener('mousedown',  onMouseDown);
      document.removeEventListener('mouseup',    onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.body.classList.remove('cursor-hover', 'cursor-text', 'cursor-click');
    };
  }, [spawnTrail]);

  return (
    <>
      {/* Ambient glow that follows slowly */}
      <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
      {/* Lagging outer ring */}
      <div ref={ringRef} className="cursor-ring"  aria-hidden="true" />
      {/* Snappy inner dot */}
      <div ref={dotRef}  className="cursor-dot"   aria-hidden="true" />
    </>
  );
}
