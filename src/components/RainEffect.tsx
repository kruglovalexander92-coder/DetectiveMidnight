/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

interface Splash {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export default function RainEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    const drops: RainDrop[] = [];
    const splashes: Splash[] = [];
    const maxDrops = 60; // Moderate amount for performance and visual elegance

    // Initialize rain drops
    for (let i = 0; i < maxDrops; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        length: Math.random() * 15 + 10,
        speed: Math.random() * 12 + 15,
        opacity: Math.random() * 0.15 + 0.05
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw rain drops
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
      ctx.lineWidth = 1;

      drops.forEach((drop) => {
        ctx.beginPath();
        // Slight wind angle (slanted left to right: dx = 1.5)
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + 1.5, drop.y + drop.length);
        ctx.strokeStyle = `rgba(180, 180, 180, ${drop.opacity})`;
        ctx.stroke();

        // Update position
        drop.y += drop.speed;
        drop.x += 1.5;

        // Reset drop when hitting bottom or edges
        if (drop.y > height) {
          // Trigger splash at the bottom
          if (Math.random() > 0.4) {
            splashes.push({
              x: drop.x,
              y: height - 5,
              radius: 1,
              maxRadius: Math.random() * 4 + 2,
              opacity: drop.opacity * 1.5
            });
          }
          drop.y = -20;
          drop.x = Math.random() * width;
          drop.speed = Math.random() * 12 + 15;
        }

        if (drop.x > width) {
          drop.x = 0;
        }
      });

      // Draw splashey ripples
      splashes.forEach((splash, index) => {
        ctx.beginPath();
        ctx.ellipse(splash.x, splash.y, splash.radius, splash.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 180, 180, ${splash.opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        splash.radius += 0.3;
        splash.opacity -= 0.02;

        if (splash.opacity <= 0 || splash.radius >= splash.maxRadius) {
          splashes.splice(index, 1);
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
}
