'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Smile,
  ImagePlus,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';
import { updateCurrentUserAvatarAction } from '@/app/user-actions';
import { PRESET_AVATARS, DEFAULT_AVATAR, isImageAvatar } from '@/lib/avatars';
import { UserAvatar } from './user-avatar';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string | null;
  displayName?: string;
  onAvatarUpdated?: (avatar: string) => void;
}

const AVATAR_SIZE = 256;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

/** Center-crop an image file to a square and downscale it to AVATAR_SIZE px. */
async function prepareAvatarFile(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('That file could not be read as an image.'));
      el.src = objectUrl;
    });

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const out = Math.min(AVATAR_SIZE, side);

    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not process this image.');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
    if (!blob) throw new Error('Your browser could not process this image.');
    const ext = blob.type === 'image/webp' ? 'webp' : 'png';
    return new File([blob], `avatar.${ext}`, { type: blob.type });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function AvatarModal(props: AvatarModalProps) {
  // Mount the body only while open so its state resets on every open
  if (!props.isOpen) return null;
  return <AvatarModalBody {...props} />;
}

function AvatarModalBody({
  onClose,
  currentAvatar,
  displayName,
  onAvatarUpdated,
}: AvatarModalProps) {
  const [tab, setTab] = useState<'icons' | 'upload'>(isImageAvatar(currentAvatar) ? 'upload' : 'icons');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing('avatarUploader');

  // Release preview object URLs
  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const busy = processing || saving || isUploading;
  const previewAvatar =
    tab === 'upload'
      ? pendingPreview || (isImageAvatar(currentAvatar) ? currentAvatar : null)
      : selectedIcon || (!isImageAvatar(currentAvatar) ? currentAvatar : null);
  const hasChange = tab === 'upload' ? !!pendingFile : !!selectedIcon && selectedIcon !== currentAvatar;

  const handleFileSelected = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, WEBP, GIF...).');
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError('That image is too large. Please choose one under 10MB.');
      return;
    }
    setProcessing(true);
    try {
      const prepared = await prepareAvatarFile(file);
      setPendingFile(prepared);
      setPendingPreview(URL.createObjectURL(prepared));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process that image.');
    } finally {
      setProcessing(false);
    }
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    setPendingPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!hasChange) return;
    setError(null);
    setSaving(true);
    try {
      let value: string | undefined;
      if (tab === 'upload' && pendingFile) {
        const res = await startUpload([pendingFile]);
        value = res?.[0]?.serverData?.url || res?.[0]?.ufsUrl;
        if (!value) throw new Error('Upload failed. Please try again.');
      } else if (tab === 'icons' && selectedIcon) {
        value = selectedIcon;
      }
      if (!value) return;

      const result = await updateCurrentUserAvatarAction(value);
      if (!result.success || !result.avatar) {
        setError(result.error || 'Could not update avatar.');
        return;
      }
      setSuccess(true);
      onAvatarUpdated?.(result.avatar);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A network error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="scrim" onClick={() => !busy && onClose()}>
      <div
        className="panel max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-modal-title"
      >
        <button onClick={onClose} disabled={busy} className="icon-btn absolute right-3 top-3" aria-label="Close">
          <X className="size-5" />
        </button>

        <h3 id="avatar-modal-title" className="font-display text-lg font-bold text-foreground">
          Change avatar
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">Pick an icon or upload your own picture.</p>

        {/* Preview */}
        <div className="my-6 flex justify-center">
          <div className="rounded-full bg-[image:var(--brand-gradient)] p-[3px] shadow-[0_12px_40px_-12px_rgba(129,140,248,0.8)]">
            <UserAvatar
              avatar={previewAvatar || DEFAULT_AVATAR}
              name={displayName}
              className="size-24 rounded-full bg-surface-raised text-5xl font-semibold text-foreground ring-4 ring-surface"
            />
          </div>
        </div>

        <div className="segmented mb-4" role="tablist" aria-label="Avatar type">
          <button type="button" role="tab" aria-selected={tab === 'icons'} onClick={() => setTab('icons')} disabled={busy}>
            <Smile className="size-4" />
            Icons
          </button>
          <button type="button" role="tab" aria-selected={tab === 'upload'} onClick={() => setTab('upload')} disabled={busy}>
            <ImagePlus className="size-4" />
            Upload image
          </button>
        </div>

        {tab === 'icons' ? (
          <div className="mb-5 grid grid-cols-6 gap-2 sm:grid-cols-8">
            {PRESET_AVATARS.map((icon) => {
              const active = (selectedIcon || currentAvatar) === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  disabled={busy}
                  aria-label={`Use ${icon} as avatar`}
                  aria-pressed={active}
                  className={`flex aspect-square items-center justify-center rounded-xl text-xl transition active:scale-90 ${
                    active ? 'bg-social/20 ring-2 ring-social' : 'bg-surface-sunken ring-1 ring-border hover:ring-border-strong'
                  }`}
                >
                  {icon}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mb-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelected(f);
              }}
            />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f && !busy) handleFileSelected(f);
              }}
              onClick={() => !busy && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !busy) fileInputRef.current?.click();
              }}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong bg-surface-sunken px-4 py-8 text-center transition hover:border-primary/50 hover:bg-primary/[0.04]"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/12 text-primary">
                {processing ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
              </span>
              <div className="text-sm font-semibold text-foreground">
                {pendingFile ? 'Choose a different image' : 'Click or drop an image'}
              </div>
              <div className="text-xs text-subtle-foreground">
                PNG, JPG, WEBP or GIF up to 10MB. We&apos;ll crop it to a square.
              </div>
            </div>
            {pendingFile && (
              <button type="button" onClick={clearPendingFile} disabled={busy} className="btn btn-ghost btn-sm mt-2 hover:!text-rose-300">
                <Trash2 className="size-3.5" />
                Discard selected image
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle className="mt-px size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-4">
            <CheckCircle2 className="mt-px size-4 shrink-0" />
            <span>Avatar updated.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={busy || !hasChange || success} className="btn btn-primary">
            {(saving || isUploading) && <Loader2 className="size-4 animate-spin" />}
            <span>{isUploading ? 'Uploading…' : saving ? 'Saving…' : 'Save avatar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
