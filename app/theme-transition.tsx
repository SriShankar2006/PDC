'use client';

import { useEffect } from 'react';

export default function ThemeTransition() {
  useEffect(() => {
    // Create canvas for theme transition effects
    const canvas = document.createElement('canvas');
    canvas.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:9998',
      'opacity:0',
      'transition:opacity 0.3s ease',
    ].join(';');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    type TransitionParticle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      decay: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
    };

    const particles: TransitionParticle[] = [];
    let rafId: number | null = null;
    let isAnimating = false;

    // Elegant particle burst from center
    function createThemeTransition(isDarkMode: boolean) {
      particles.length = 0; // Clear existing particles
      
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // Color schemes
      const lightColors = [
        '#5b54e8', // Brand purple
        '#7c73ff', // Light purple
        '#a78bfa', // Lavender
        '#60a5fa', // Blue
        '#f472b6', // Pink
        '#fbbf24', // Amber (sun)
        '#fef3c7', // Light yellow
      ];
      
      const darkColors = [
        '#6c63ff', // Dark mode brand
        '#7c73ff', // Purple
        '#a78bfa', // Lavender
        '#818cf8', // Indigo
        '#c084fc', // Purple
        '#4f46e5', // Deep indigo
        '#312e81', // Dark purple
      ];
      
      const colors = isDarkMode ? darkColors : lightColors;
      
      // Create expanding ring waves
      for (let ring = 0; ring < 3; ring++) {
        const particlesInRing = 40 - ring * 8;
        const delay = ring * 50;
        
        setTimeout(() => {
          for (let i = 0; i < particlesInRing; i++) {
            const angle = (Math.PI * 2 * i) / particlesInRing;
            const speed = 4 + Math.random() * 6 + ring * 2;
            const radius = 2 + Math.random() * 4;
            
            particles.push({
              x: centerX,
              y: centerY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: radius,
              alpha: 0.8 + Math.random() * 0.2,
              decay: 0.015 + Math.random() * 0.01,
              color: colors[Math.floor(Math.random() * colors.length)],
              rotation: Math.random() * Math.PI * 2,
              rotationSpeed: (Math.random() - 0.5) * 0.2,
            });
          }
        }, delay);
      }
      
      // Add sparkle particles
      for (let i = 0; i < 60; i++) {
        setTimeout(() => {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 8;
          
          particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 1 + Math.random() * 2,
            alpha: 1,
            decay: 0.02 + Math.random() * 0.015,
            color: isDarkMode ? '#ffffff' : '#fef3c7',
            rotation: 0,
            rotationSpeed: 0,
          });
        }, Math.random() * 100);
      }
      
      // Radial gradient flash
      createRadialFlash(centerX, centerY, isDarkMode);
      
      // Start animation
      if (!isAnimating) {
        isAnimating = true;
        canvas.style.opacity = '1';
        animate();
      }
    }

    function createRadialFlash(x: number, y: number, isDarkMode: boolean) {
      let flashAlpha = 0.3;
      const flashInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw radial gradient
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 600);
        gradient.addColorStop(0, isDarkMode 
          ? `rgba(108, 99, 255, ${flashAlpha})` 
          : `rgba(251, 191, 36, ${flashAlpha})`
        );
        gradient.addColorStop(0.5, isDarkMode 
          ? `rgba(124, 115, 255, ${flashAlpha * 0.5})` 
          : `rgba(254, 243, 199, ${flashAlpha * 0.5})`
        );
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        flashAlpha -= 0.015;
        
        if (flashAlpha <= 0) {
          clearInterval(flashInterval);
        }
      }, 16);
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.alpha -= p.decay;
        p.radius *= 0.996;
        p.rotation += p.rotationSpeed;

        if (p.alpha <= 0 || p.radius < 0.3) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fill();
        
        ctx.restore();
      }

      if (particles.length > 0) {
        rafId = requestAnimationFrame(animate);
      } else {
        isAnimating = false;
        canvas.style.opacity = '0';
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    }

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          createThemeTransition(isDark);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      canvas.remove();
    };
  }, []);

  return null;
}
