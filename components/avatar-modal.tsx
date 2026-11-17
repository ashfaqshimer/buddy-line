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
  Sparkles,
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

  const tabClass = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
      active ? 'bg-teal-400/15 text-teal-300 border border-teal-400/25' : 'text-zinc-400 hover:text-white border border-transparent'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={() => !busy && onClose()}
    >
      <div
        className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-white/[0.08] bg-surface p-6 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-modal-title"
      >
        <button
          onClick={onClose}
          disabled={busy}
          className="absolute right-4 top-4 rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-400/20 text-teal-400">
            <Smile className="size-5" />
          </div>
          <div>
            <h3 id="avatar-modal-title" className="font-semibold text-white text-base">
              Change Avatar
            </h3>
            <p className="text-xs text-zinc-400">Pick an icon or upload your own picture.</p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex justify-center mb-5">
          <UserAvatar
            avatar={previewAvatar || DEFAULT_AVATAR}
            name={displayName}
            className="size-24 rounded-xl bg-teal-400 text-5xl font-semibold text-white ring-2 ring-teal-400/30"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-background p-1 mb-4">
          <button type="button" onClick={() => setTab('icons')} className={tabClass(tab === 'icons')} disabled={busy}>
            <Smile className="size-3.5" />
            Icons
          </button>
          <button type="button" onClick={() => setTab('upload')} className={tabClass(tab === 'upload')} disabled={busy}>
            <ImagePlus className="size-3.5" />
            Upload Image
          </button>
        </div>

        {tab === 'icons' ? (
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-4">
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
                  className={`aspect-square flex items-center justify-center rounded-xl text-xl transition active:scale-90 ${
                    active
                      ? 'bg-teal-400/20 ring-2 ring-teal-400'
                      : 'bg-background hover:bg-white/[0.06]'
                  }`}
                >
                  {icon}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mb-4">
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
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/[0.1] bg-background px-4 py-6 text-center cursor-pointer hover:border-teal-400/40 transition"
            >
              {processing ? (
                <Loader2 className="size-6 text-teal-400 animate-spin" />
              ) : (
                <Upload className="size-6 text-teal-400" />
              )}
              <div className="text-xs font-bold text-white">
                {pendingFile ? 'Choose a different image' : 'Click or drop an image here'}
              </div>
              <div className="text-[10px] text-zinc-400">
                PNG, JPG, WEBP or GIF up to 10MB. We&apos;ll crop it to a square.
              </div>
            </div>
            {pendingFile && (
              <button
                type="button"
                onClick={clearPendingFile}
                disabled={busy}
                className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-rose-300 transition"
              >
                <Trash2 className="size-3" />
                Discard selected image
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/8 p-3 text-xs text-rose-300">
            <AlertCircle className="size-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/8 p-3 text-xs text-teal-300">
            <CheckCircle2 className="size-4 shrink-0 text-teal-400" />
            <span>Avatar updated!</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !hasChange || success}
            className="flex items-center gap-2 rounded-lg bg-teal-400 px-4 py-2 text-xs font-bold text-zinc-950 transition active:scale-95 disabled:opacity-50"
          >
            {saving || isUploading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>{isUploading ? 'Uploading...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                <span>Save Avatar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
