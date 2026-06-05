'use client';

import { useEffect } from 'react';

export default function CursorGlow() {
  useEffect(() => {
    // Create cursor elements
    const cursorGlow = document.createElement('div');
    cursorGlow.className = 'cursor-glow';
    document.body.appendChild(cursorGlow);

    const cursorTrail = document.createElement('div');
    cursorTrail.className = 'cursor-trail';
    document.body.appendChild(cursorTrail);

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      // Update main cursor position
      cursorGlow.style.transform = `translate(${x - 10}px, ${y - 10}px)`;
      
      // Update trail with slight delay
      cursorTrail.style.transform = `translate(${x - 4}px, ${y - 4}px)`;
    };

    // Handle mouse enter/leave
    const handleMouseEnter = () => {
      cursorGlow.style.opacity = '1';
      cursorTrail.style.opacity = '0.6';
    };

    const handleMouseLeave = () => {
      cursorGlow.style.opacity = '0';
      cursorTrail.style.opacity = '0';
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cursorGlow.remove();
      cursorTrail.remove();
    };
  }, []);

  return null;
}
