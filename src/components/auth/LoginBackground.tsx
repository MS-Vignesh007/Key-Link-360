import React, { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulseOffset: number;
  color: string;
}

interface SparkleParticle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
}

const PARTICLE_COLORS = [
  "rgba(0, 240, 255, ",
  "rgba(99, 102, 241, ",
  "rgba(56, 189, 248, ",
  "rgba(168, 85, 247, ",
  "rgba(255, 255, 255, "
];

export function LoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const targetParallax = useRef({ x: 0, y: 0 });
  const currentParallax = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Generate ambient background floating particles
    const particleCount = Math.min(60, Math.max(30, Math.floor((width * height) / 25000)));
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4 - 0.1, // slight upward drift
      alpha: Math.random() * 0.5 + 0.2,
      baseAlpha: Math.random() * 0.4 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulseOffset: Math.random() * Math.PI * 2,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
    }));

    const sparkles: SparkleParticle[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate smooth parallax targets
      const normX = (e.clientX / width) - 0.5;
      const normY = (e.clientY / height) - 0.5;
      targetParallax.current = {
        x: -normX * 35,
        y: -normY * 35
      };

      // Spawn 1-2 interactive cursor trail particles
      if (sparkles.length < 80) {
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 1.5 + 0.5;
          sparkles.push({
            x: e.clientX + (Math.random() - 0.5) * 10,
            y: e.clientY + (Math.random() - 0.5) * 10,
            radius: Math.random() * 2.5 + 1,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 0.9,
            decay: Math.random() * 0.025 + 0.015,
            color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
          });
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let tick = 0;
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Smooth lerp for parallax
      currentParallax.current.x += (targetParallax.current.x - currentParallax.current.x) * 0.06;
      currentParallax.current.y += (targetParallax.current.y - currentParallax.current.y) * 0.06;

      // Update state for DOM sphere layer if difference is noticeable
      if (
        Math.abs(currentParallax.current.x - parallaxOffset.x) > 0.1 ||
        Math.abs(currentParallax.current.y - parallaxOffset.y) > 0.1
      ) {
        setParallaxOffset({
          x: currentParallax.current.x,
          y: currentParallax.current.y
        });
      }

      // Draw & update ambient particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around canvas edges
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Twinkle effect
        const currentAlpha = p.baseAlpha + Math.sin(tick * p.pulseSpeed + p.pulseOffset) * 0.2;
        const clampedAlpha = Math.max(0.05, Math.min(0.85, currentAlpha));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${clampedAlpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `${p.color}0.8)`;
        ctx.fill();
      }

      // Draw & update interactive sparkle particles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${s.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `${s.color}1)`;
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="login-bg-root" aria-hidden="true">
      {/* Dynamic Parallax Floating Spheres Layer */}
      <div
        className="login-sphere-layer"
        style={{
          transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`
        }}
      >
        <div className="gradient-sphere gradient-sphere--1" />
        <div className="gradient-sphere gradient-sphere--2" />
        <div className="gradient-sphere gradient-sphere--3" />
      </div>

      {/* Center Ambient Radial Pulse */}
      <div className="login-center-glow" />

      {/* Tech Grid Pattern */}
      <div className="login-grid-overlay" />

      {/* Subtle Noise Texture */}
      <div className="login-noise-overlay" />

      {/* Interactive Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
}

export default LoginBackground;