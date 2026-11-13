'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

const frameSize = 180;
const frameCount = 75;
const columns = 10;

/** The logo, plus a poker chip that spins with scroll speed once the page scrolls. */
export function ChipLogo({ light }: { light: boolean }) {
  const logo = useRef<HTMLAnchorElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const link = logo.current!;
    const ctx = canvas.current!.getContext('2d');
    if (!ctx) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const sprite = new Image();
    let frame = 0;
    let velocity = 0;
    let lastY = scrollY;
    let raf = 0;
    let loaded = false;

    function draw() {
      const index = ((Math.floor(frame) % frameCount) + frameCount) % frameCount;
      ctx!.clearRect(0, 0, frameSize, frameSize);
      ctx!.drawImage(sprite, (index % columns) * frameSize, Math.floor(index / columns) * frameSize, frameSize, frameSize, 0, 0, frameSize, frameSize);
    }

    function animate() {
      frame += velocity;
      velocity *= 0.88;
      if (Math.abs(velocity) < 0.005) velocity = 0;
      draw();
      raf = velocity ? requestAnimationFrame(animate) : 0;
    }

    function onScroll() {
      const y = scrollY;
      velocity += (y - lastY) * 0.008;
      lastY = y;
      link.classList.toggle('chip-visible', loaded && y > 10);
      if (reducedMotion.matches) {
        cancelAnimationFrame(raf);
        frame = velocity = raf = 0;
        if (loaded) draw();
      } else if (loaded && velocity && !raf) {
        raf = requestAnimationFrame(animate);
      }
    }

    sprite.onload = () => { loaded = true; draw(); onScroll(); };
    sprite.src = '/assets/chip-frames.webp';
    addEventListener('scroll', onScroll, { passive: true });
    reducedMotion.addEventListener('change', onScroll);
    return () => {
      sprite.onload = null;
      cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll);
      reducedMotion.removeEventListener('change', onScroll);
    };
  }, []);

  return (
    <Link ref={logo} href="/" className="logo" aria-label="Bluechip home">
      <img
        className="header-logo-image"
        src={light ? '/assets/bluechip-logo-white.webp' : '/assets/bluechip-logo.webp'}
        alt="Bluechip Branding & Design"
      />
      <canvas ref={canvas} className="header-chip" width={frameSize} height={frameSize} aria-hidden="true" />
    </Link>
  );
}
