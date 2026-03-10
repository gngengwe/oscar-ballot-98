"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const IMAGES = [
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-0r98uohlvweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-4x68johlvweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-6qfodd4ovweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-86wa5ohlvweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-9fr3ce4ovweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-e76cqf4ovweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-fkzzqd4ovweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-ijyr0f4ovweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-kh5r8hhlvweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-kq7e5f4ovweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-lcaswihlvweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-oair8phlvweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-ov4qtlhlvweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-pd027ohlvweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-ppwc6phlvweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-roko6e4ovweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-s5ddhohlvweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-txqk2e4ovweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-u2vovihlvweg1.webp",
  "/nominees/the-nominees-for-the-98th-academy-awards-v0-vtc9knhlvweg1.webp",
];

const INTERVAL_MS = 4000;
// 1/3 of 1080×1350
const W = 360;
const H = 450;

export default function NomineeCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % IMAGES.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + IMAGES.length) % IMAGES.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <div className="flex justify-center">
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ width: W, height: H }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Images */}
        {IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          >
            <Image
              src={src}
              alt={`98th Academy Awards nominees slide ${i + 1}`}
              fill
              className="object-cover"
              priority={i === 0}
              sizes="360px"
            />
          </div>
        ))}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-950/70 via-transparent to-cinema-950/20 z-10 pointer-events-none" />

        {/* Prev / Next buttons */}
        <button
          onClick={prev}
          aria-label="Previous image"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-cinema-900/70 border border-cinema-700/50 text-cinema-200 hover:bg-cinema-800 transition-colors flex items-center justify-center"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={next}
          aria-label="Next image"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-cinema-900/70 border border-cinema-700/50 text-cinema-200 hover:bg-cinema-800 transition-colors flex items-center justify-center"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{
                backgroundColor: i === current ? "rgb(234 179 8 / 0.9)" : "rgb(255 255 255 / 0.3)",
                transform: i === current ? "scale(1.4)" : "scale(1)",
              }}
            />
          ))}
        </div>

        {/* Label */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
          <span className="text-xs font-medium tracking-widest uppercase text-cinema-300/80">
            98th Academy Awards Nominees
          </span>
        </div>
      </div>
    </div>
  );
}
