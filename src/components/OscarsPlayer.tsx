"use client";

import { useEffect, useRef, useState } from "react";

// Minimal type stubs for YouTube IFrame API
declare namespace YT {
  class Player {
    constructor(el: HTMLElement, opts: object);
    playVideo(): void;
    pauseVideo(): void;
    destroy(): void;
  }
  interface OnStateChangeEvent {
    data: number;
  }
  enum PlayerState {
    PLAYING = 1,
  }
}

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function OscarsPlayer() {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Load YT IFrame API once
    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    const init = () => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: "o_N2Trt-UaQ",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          list: "RDo_N2Trt-UaQ",
          listType: "playlist",
          loop: 1,
        },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: YT.OnStateChangeEvent) => {
            setPlaying(e.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    };

    if (window.YT?.Player) {
      init();
    } else {
      window.onYouTubeIframeAPIReady = init;
    }

    return () => {
      playerRef.current?.destroy();
    };
  }, []);

  const toggle = () => {
    if (!playerRef.current) return;
    if (playing) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  return (
    <>
      {/* Hidden YT player */}
      <div
        style={{ position: "fixed", left: "-9999px", top: "-9999px", width: 1, height: 1 }}
        aria-hidden="true"
      >
        <div ref={containerRef} />
      </div>

      {/* Play/pause button */}
      <button
        onClick={toggle}
        disabled={!ready}
        title={playing ? "Pause Oscars theme" : "Play Oscars theme"}
        aria-label={playing ? "Pause music" : "Play music"}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all
          disabled:opacity-40 disabled:cursor-not-allowed
          bg-cinema-800 border border-cinema-700/60 text-cinema-300
          hover:bg-cinema-700 hover:text-gold-400 hover:border-gold-600/40"
      >
        {playing ? (
          /* Pause icon */
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          /* Play icon */
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        <span className="hidden sm:inline">
          {playing ? "Pause" : "♪ Play"}
        </span>
      </button>
    </>
  );
}
