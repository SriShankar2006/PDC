'use client';

import { useEffect } from 'react';

export default function CursorGlow() {
  useEffect(() => {
    // ── Single glass ring ──
    const cursor = document.createElement('div');
    cursor.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:20px',
      'height:20px',
      'border-radius:50%',
      'pointer-events:none',
      'z-index:9999',
      'transform:translate(-999px,-999px)',
      'background:rgba(255,255,255,0.07)',
      'backdrop-filter:blur(4px)',
      '-webkit-backdrop-filter:blur(4px)',
      'border:1px solid rgba(255,255,255,0.35)',
      'box-shadow:0 0 10px rgba(139,92,246,0.5),0 0 22px rgba(139,92,246,0.2),inset 0 1px 0 rgba(255,255,255,0.3)',
      'transition:width 0.25s cubic-bezier(0.34,1.56,0.64,1),height 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.2s ease,opacity 0.3s ease',
      'will-change:transform',
    ].join(';');
    document.body.appendChild(cursor);

    // ── Canvas for tail ──
    const canvas = document.createElement('canvas');
    canvas.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:9998',
    ].join(';');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const MAX_TAIL = 22;
    const tail: { x: number; y: number }[] = [];
    let mouseX = -999, mouseY = -999;
    let rafId: number;
    let isHover = false;
    let isMoving = false;
    let stopTimer: ReturnType<typeof setTimeout>;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.transform = `translate(${mouseX - 10}px,${mouseY - 10}px)`;

      isMoving = true;
      clearTimeout(stopTimer);

      tail.unshift({ x: mouseX, y: mouseY });
      if (tail.length > MAX_TAIL) tail.pop();

      // Instantly clear tail when mouse stops
      stopTimer = setTimeout(() => {
        isMoving = false;
        tail.length = 0;
      }, 0);
    };

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isMoving && tail.length > 1) {
        for (let i = 1; i < tail.length; i++) {
          const t = i / tail.length;
          const alpha = (1 - t) * 0.55;
          const radius = (1 - t) * 6.5 + 0.8;

          ctx.beginPath();
          ctx.arc(tail[i].x, tail[i].y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139,92,246,${alpha})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = `rgba(139,92,246,${alpha * 0.8})`;
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(animate);
    }
    animate();

    // ── Hover: only ring effect, no blur on text ──
    const interactables = 'a,button,input,textarea,select,[role="button"],label';

    const handleMouseOver = (e: MouseEvent) => {
      if ((e.target as Element)?.closest(interactables) && !isHover) {
        isHover = true;
        cursor.style.width = '28px';
        cursor.style.height = '28px';
        cursor.style.boxShadow = [
          '0 0 18px rgba(139,92,246,0.75)',
          '0 0 38px rgba(139,92,246,0.3)',
          'inset 0 1px 0 rgba(255,255,255,0.4)',
        ].join(',');
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      if ((e.target as Element)?.closest(interactables) && isHover) {
        isHover = false;
        cursor.style.width = '20px';
        cursor.style.height = '20px';
        cursor.style.boxShadow = [
          '0 0 10px rgba(139,92,246,0.5)',
          '0 0 22px rgba(139,92,246,0.2)',
          'inset 0 1px 0 rgba(255,255,255,0.3)',
        ].join(',');
      }
    };

    const handleMouseLeave = () => {
      cursor.style.opacity = '0';
      isMoving = false;
      tail.length = 0;
    };
    const handleMouseEnter = () => { cursor.style.opacity = '1'; };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(stopTimer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cursor.remove();
      canvas.remove();
    };
  }, []);

  return null;
}
