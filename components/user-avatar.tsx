'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { DEFAULT_AVATAR, isImageAvatar, isTextAvatar } from '@/lib/avatars';

interface UserAvatarProps {
  /** The stored avatar value (emoji or image URL). */
  avatar?: string | null;
  /** Used for alt text and the initials fallback. */
  name?: string | null;
  /** Container classes: size, rounding, background, font size for emoji, etc. */
  className?: string;
  /** Render as an inline element (for avatars inside text runs). */
  inline?: boolean;
}

/**
 * Renders a user avatar that may be an emoji icon or an uploaded image URL.
 * Falls back to initials (or the default icon) when the value is missing or the image fails to load.
 */
export function UserAvatar({ avatar, name, className, inline = false }: UserAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const Tag = inline ? 'span' : 'div';

  if (isImageAvatar(avatar) && failedSrc !== avatar) {
    return (
      <Tag className={cn('inline-flex items-center justify-center overflow-hidden shrink-0', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar}
          alt={name ? `${name}'s avatar` : 'Avatar'}
          className="size-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(avatar)}
        />
      </Tag>
    );
  }

  const content = isTextAvatar(avatar)
    ? avatar
    : name
      ? name.slice(0, 2).toUpperCase()
      : DEFAULT_AVATAR;

  return (
    <Tag className={cn('inline-flex items-center justify-center shrink-0 leading-none', className)}>
      {content}
    </Tag>
  );
}
