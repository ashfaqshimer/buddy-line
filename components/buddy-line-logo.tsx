'use client';

import React from 'react';
import Image from 'next/image';

export interface BuddyLineLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showPing?: boolean;
  variant?: 'badge' | 'vector';
  alt?: string;
}

/**
 * Pure SVG Vector Badge of the Buddy Line Fist Bump Logo
 * Scalable vector representation of the official emblem with circular badge,
 * electric cyan and purple clashing fists, radiating starburst, and arched typography.
 */
export function FistBumpIcon({ className = 'size-full' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Buddy Line Official Vector Emblem"
    >
      <defs>
        <radialGradient id="vec-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#182030" />
          <stop offset="70%" stopColor="#121722" />
          <stop offset="100%" stopColor="#0b0e14" />
        </radialGradient>

        <linearGradient id="vec-ring-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="35%" stopColor="#60a5fa" />
          <stop offset="70%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        <linearGradient id="vec-fist-left" x1="0%" y1="30%" x2="100%" y2="70%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="vec-fist-left-hi" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="vec-fist-right" x1="100%" y1="30%" x2="0%" y2="70%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
        <linearGradient id="vec-fist-right-hi" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        <linearGradient id="vec-burst-top" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="vec-burst-bot" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        <filter id="vec-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <path id="badge-path-buddy" d="M 96 256 A 160 160 0 0 1 416 256" fill="none" />
        <path id="badge-path-line" d="M 416 256 A 160 160 0 0 1 96 256" fill="none" />
      </defs>

      {/* Outer Shadow & Dark Disc */}
      <circle cx="256" cy="256" r="248" fill="url(#vec-bg)" />

      {/* Outer Neon Border Ring */}
      <circle
        cx="256"
        cy="256"
        r="238"
        fill="none"
        stroke="url(#vec-ring-glow)"
        strokeWidth="16"
        strokeLinecap="round"
      />

      {/* Concentric Guide Ring */}
      <circle
        cx="256"
        cy="256"
        r="214"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeOpacity="0.35"
      />

      {/* Concentric Accent Arcs */}
      <path
        d="M 68 256 A 188 188 0 0 1 112 140"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <path
        d="M 68 256 A 188 188 0 0 0 112 372"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <path
        d="M 444 256 A 188 188 0 0 0 400 140"
        fill="none"
        stroke="#c084fc"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <path
        d="M 444 256 A 188 188 0 0 1 400 372"
        fill="none"
        stroke="#c084fc"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />

      {/* Arched Typography */}
      <text
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="900"
        fontSize="52"
        fill="#ffffff"
        letterSpacing="12"
      >
        <textPath href="#badge-path-buddy" startOffset="50%" textAnchor="middle">
          BUDDY
        </textPath>
      </text>

      <text
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="900"
        fontSize="52"
        fill="#ffffff"
        letterSpacing="14"
      >
        <textPath href="#badge-path-line" startOffset="50%" textAnchor="middle">
          LINE
        </textPath>
      </text>

      {/* Center Radiating Rays */}
      <g opacity="0.9">
        <path d="M 256 242 L 252 148 L 260 148 Z" fill="url(#vec-burst-top)" />
        <path d="M 256 242 L 230 156 L 237 153 Z" fill="#38bdf8" opacity="0.8" />
        <path d="M 256 242 L 282 156 L 275 153 Z" fill="#38bdf8" opacity="0.8" />
        <path d="M 256 242 L 208 174 L 214 169 Z" fill="#38bdf8" opacity="0.7" />
        <path d="M 256 242 L 304 174 L 298 169 Z" fill="#38bdf8" opacity="0.7" />

        <path d="M 256 258 L 252 352 L 260 352 Z" fill="url(#vec-burst-bot)" />
        <path d="M 256 258 L 230 344 L 237 347 Z" fill="#c084fc" opacity="0.8" />
        <path d="M 256 258 L 282 344 L 275 347 Z" fill="#c084fc" opacity="0.8" />
        <path d="M 256 258 L 208 326 L 214 331 Z" fill="#c084fc" opacity="0.7" />
        <path d="M 256 258 L 304 326 L 298 331 Z" fill="#c084fc" opacity="0.7" />
      </g>

      {/* Left Gamer Fist */}
      <g>
        <path
          d="M 120 285 L 175 265 L 180 295 L 130 320 Z"
          fill="#0369a1"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M 170 245 C 190 220 230 205 245 210 C 255 214 256 226 255 235 C 254 246 253 260 250 272 C 248 282 238 290 225 292 C 195 296 170 285 160 268 Z"
          fill="url(#vec-fist-left)"
          stroke="#0284c7"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M 235 215 C 248 214 254 220 253 228 C 251 234 242 237 232 236 Z"
          fill="url(#vec-fist-left-hi)"
        />
        <path
          d="M 238 234 C 252 233 256 240 255 248 C 253 254 245 257 235 256 Z"
          fill="url(#vec-fist-left-hi)"
        />
        <path
          d="M 235 254 C 248 253 252 260 250 268 C 248 274 240 276 230 275 Z"
          fill="url(#vec-fist-left-hi)"
        />
        <path
          d="M 226 273 C 238 272 242 278 240 284 C 238 289 230 291 222 290 Z"
          fill="#38bdf8"
        />
        <path
          d="M 188 235 C 205 230 224 235 228 245 C 230 254 220 260 205 258 C 192 256 182 248 188 235 Z"
          fill="url(#vec-fist-left-hi)"
          stroke="#0369a1"
          strokeWidth="2"
        />
      </g>

      {/* Right Gamer Fist */}
      <g>
        <path
          d="M 392 285 L 337 265 L 332 295 L 382 320 Z"
          fill="#6b21a8"
          stroke="#c084fc"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M 342 245 C 322 220 282 205 267 210 C 257 214 256 226 257 235 C 258 246 259 260 262 272 C 264 282 274 290 287 292 C 317 296 342 285 352 268 Z"
          fill="url(#vec-fist-right)"
          stroke="#7e22ce"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M 277 215 C 264 214 258 220 259 228 C 261 234 270 237 280 236 Z"
          fill="url(#vec-fist-right-hi)"
        />
        <path
          d="M 274 234 C 260 233 256 240 257 248 C 259 254 267 257 277 256 Z"
          fill="url(#vec-fist-right-hi)"
        />
        <path
          d="M 277 254 C 264 253 260 260 262 268 C 264 274 272 276 282 275 Z"
          fill="url(#vec-fist-right-hi)"
        />
        <path
          d="M 286 273 C 274 272 270 278 272 284 C 274 289 282 291 290 290 Z"
          fill="#c084fc"
        />
        <path
          d="M 324 235 C 307 230 288 235 284 245 C 282 254 292 260 307 258 C 320 256 330 248 324 235 Z"
          fill="url(#vec-fist-right-hi)"
          stroke="#581c87"
          strokeWidth="2"
        />
      </g>

      {/* Central Contact Impact Spark */}
      <g filter="url(#vec-glow)">
        <path
          d="M 256 230 L 260 247 L 275 250 L 260 253 L 256 270 L 252 253 L 237 250 L 252 247 Z"
          fill="#ffffff"
        />
        <circle cx="256" cy="250" r="3.5" fill="#ffffff" />
        <circle cx="256" cy="250" r="8" fill="#38bdf8" opacity="0.4" />
      </g>
    </svg>
  );
}

/**
 * BuddyLineLogo - Official Buddy Line Arcade Circular Logo Component.
 * Supports raster-precise SVG badge or pure vector rendering, responsive scaling,
 * neon hover glow, and live status ping.
 */
export function BuddyLineLogo({
  size = 'md',
  className = '',
  showPing = false,
  variant = 'badge',
  alt = 'Buddy Line Logo',
}: BuddyLineLogoProps) {
  const sizeMap = {
    xs: { outer: 'size-7', px: 28 },
    sm: { outer: 'size-9', px: 36 },
    md: { outer: 'size-11 sm:size-12', px: 48 },
    lg: { outer: 'size-14 sm:size-16', px: 64 },
    xl: { outer: 'size-20 sm:size-24', px: 96 },
    '2xl': { outer: 'size-28 sm:size-32', px: 128 },
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${sizeMap.outer} ${className}`}
    >
      {/* Main Circular Emblem */}
      <div className="relative size-full rounded-full overflow-hidden ring-1 ring-white/10">
        {variant === 'vector' ? (
          <FistBumpIcon className="size-full" />
        ) : (
          <Image
            src="/buddyline-logo.svg"
            alt={alt}
            width={sizeMap.px}
            height={sizeMap.px}
            className="size-full object-cover"
            priority={size === 'sm' || size === 'md' || size === 'lg'}
          />
        )}
      </div>

      {showPing && (
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-primary pointer-events-none" />
      )}
    </div>
  );
}
