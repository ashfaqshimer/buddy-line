'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileCode,
  FileText,
  Palette,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { bundleGameSource } from '@/lib/game-bundler';
import { uploadGame } from '@/app/game-actions';
import { GameRecord } from '@/lib/games-db';

interface GameUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameUploaded: (game: GameRecord) => void;
  currentUser?: {
    id: string;
    name?: string;
    username?: string;
    image?: string | null;
  } | null;
}

const EMOJI_ICONS = ['🚀', '👾', '🕹️', '🏎️', '⚡', '🍕', '🎯', '🛸', '🐱', '🏆', '💎', '🐉'];

export function GameUploaderModal({
  isOpen,
  onClose,
  onGameUploaded,
  currentUser,
}: GameUploaderModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎮');

  // File states (filename, raw text content)
  const [htmlFile, setHtmlFile] = useState<{ name: string; size: string; content: string } | null>(null);
  const [cssFile, setCssFile] = useState<{ name: string; size: string; content: string } | null>(null);
  const [jsFile, setJsFile] = useState<{ name: string; size: string; content: string } | null>(null);

  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Hidden file input refs
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const cssInputRef = useRef<HTMLInputElement>(null);
  const jsInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const readFileContent = (
    file: File,
    setter: (val: { name: string; size: string; content: string }) => void
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setter({
        name: file.name,
        size: formatFileSize(file.size),
        content,
      });
      setErrorMessage('');
    };
    reader.onerror = () => {
      setErrorMessage(`Failed to read file ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (
    e: React.DragEvent<HTMLDivElement>,
    type: 'html' | 'css' | 'js'
  ) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (type === 'html') readFileContent(file, setHtmlFile);
      if (type === 'css') readFileContent(file, setCssFile);
      if (type === 'js') readFileContent(file, setJsFile);
    }
  };

  const handlePublish = async () => {
    setErrorMessage('');
    if (!title.trim()) {
      setErrorMessage('Please give your game a cool title! (e.g. Astro Jump)');
      return;
    }
    if (!htmlFile || !htmlFile.content.trim()) {
      setErrorMessage('Please upload the main HTML file for your game!');
      return;
    }

    setIsSubmitting(true);

    try {
      const authorId = currentUser?.id || 'guest';
      const authorUsername = currentUser?.username || currentUser?.name || 'KidGamer';
      const authorAvatar = currentUser?.image || '👾';

      const res = await uploadGame({
        title,
        description: description || 'A fun custom game built for Buddy Line!',
        icon: selectedIcon,
        htmlContent: htmlFile.content,
        cssContent: cssFile?.content || '',
        jsContent: jsFile?.content || '',
        authorId,
        authorUsername,
        authorAvatar,
      });

      if (!res.success || !res.game) {
        setErrorMessage(res.error || 'Failed to publish game.');
        setIsSubmitting(false);
        return;
      }

      // Celebrate with confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore if blocked
      }

      onGameUploaded(res.game);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Something went wrong while publishing.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bundledSource = htmlFile
    ? bundleGameSource(htmlFile.content, cssFile?.content, jsFile?.content)
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-white/10 bg-[#0d111d] shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-xl shadow-lg shadow-orange-500/20">
              🕹️
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Game Creator Studio</h2>
              <p className="text-xs text-slate-400">
                Upload your game code and share it with everyone on Buddy Line!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-500/10 border border-rose-500/25 p-3.5 text-xs text-rose-300">
              <AlertCircle className="size-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Game Title & Icon Picker */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Game Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is your game called? (e.g. Space Runner)"
                maxLength={40}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base font-bold text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Game Badge
              </label>
              <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                {EMOJI_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedIcon(emoji)}
                    className={`size-10 rounded-xl text-lg flex items-center justify-center border transition ${
                      selectedIcon === emoji
                        ? 'border-cyan-400 bg-cyan-400/20 scale-105 shadow-md shadow-cyan-500/30'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              How To Play / Description <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Press Spacebar to jump and dodge asteroids!"
              maxLength={120}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          {/* 2. Visual 3-Slot Uploader Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Add Your Game Source Code Files
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="size-3 text-cyan-400" />
                HTML is the only file required!
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SLOT 1: HTML (REQUIRED) */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop(e, 'html')}
                className={`relative flex flex-col justify-between rounded-2xl border-2 border-dashed p-4 transition ${
                  htmlFile
                    ? 'border-emerald-500/40 bg-emerald-500/[0.05]'
                    : 'border-orange-500/40 bg-orange-500/[0.03] hover:border-orange-400 hover:bg-orange-500/[0.06]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-400">
                      Step 1 • Required
                    </span>
                    <FileCode className="size-4 text-orange-400" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Main HTML File</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Your game&apos;s HTML layout and structure (.html).
                  </p>
                </div>

                <div className="mt-4">
                  {htmlFile ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate text-xs font-semibold text-emerald-300">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span className="truncate">{htmlFile.name}</span>
                        </div>
                        <span className="text-[10px] text-emerald-400/80">{htmlFile.size}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHtmlFile(null)}
                        className="mt-1 text-[10px] text-slate-400 hover:text-rose-400 underline transition"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => htmlInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500/15 border border-orange-500/30 py-2.5 text-xs font-bold text-orange-300 hover:bg-orange-500/25 transition"
                    >
                      <Upload className="size-3.5" />
                      <span>Choose .html file</span>
                    </button>
                  )}
                  <input
                    ref={htmlInputRef}
                    type="file"
                    accept=".html,.htm"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) readFileContent(e.target.files[0], setHtmlFile);
                    }}
                  />
                </div>
              </div>

              {/* SLOT 2: CSS (OPTIONAL) */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop(e, 'css')}
                className={`relative flex flex-col justify-between rounded-2xl border-2 border-dashed p-4 transition ${
                  cssFile
                    ? 'border-emerald-500/40 bg-emerald-500/[0.05]'
                    : 'border-cyan-500/40 bg-cyan-500/[0.03] hover:border-cyan-400 hover:bg-cyan-500/[0.06]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-400">
                      Step 2 • Optional
                    </span>
                    <Palette className="size-4 text-cyan-400" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Styles CSS File</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Colors & style sheets (.css). Leave blank if in HTML!
                  </p>
                </div>

                <div className="mt-4">
                  {cssFile ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate text-xs font-semibold text-emerald-300">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span className="truncate">{cssFile.name}</span>
                        </div>
                        <span className="text-[10px] text-emerald-400/80">{cssFile.size}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCssFile(null)}
                        className="mt-1 text-[10px] text-slate-400 hover:text-rose-400 underline transition"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => cssInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition"
                    >
                      <Upload className="size-3.5" />
                      <span>Choose .css file</span>
                    </button>
                  )}
                  <input
                    ref={cssInputRef}
                    type="file"
                    accept=".css"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) readFileContent(e.target.files[0], setCssFile);
                    }}
                  />
                </div>
              </div>

              {/* SLOT 3: JS (OPTIONAL) */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop(e, 'js')}
                className={`relative flex flex-col justify-between rounded-2xl border-2 border-dashed p-4 transition ${
                  jsFile
                    ? 'border-emerald-500/40 bg-emerald-500/[0.05]'
                    : 'border-yellow-500/40 bg-yellow-500/[0.03] hover:border-yellow-400 hover:bg-yellow-500/[0.06]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-md bg-yellow-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-yellow-400">
                      Step 3 • Optional
                    </span>
                    <FileText className="size-4 text-yellow-400" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Game Logic JS File</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Game script code (.js). Leave blank if in HTML!
                  </p>
                </div>

                <div className="mt-4">
                  {jsFile ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate text-xs font-semibold text-emerald-300">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span className="truncate">{jsFile.name}</span>
                        </div>
                        <span className="text-[10px] text-emerald-400/80">{jsFile.size}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setJsFile(null)}
                        className="mt-1 text-[10px] text-slate-400 hover:text-rose-400 underline transition"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => jsInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-500/15 border border-yellow-500/30 py-2.5 text-xs font-bold text-yellow-300 hover:bg-yellow-500/25 transition"
                    >
                      <Upload className="size-3.5" />
                      <span>Choose .js file</span>
                    </button>
                  )}
                  <input
                    ref={jsInputRef}
                    type="file"
                    accept=".js,.javascript"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) readFileContent(e.target.files[0], setJsFile);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Live Test Drive Section */}
          {htmlFile && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Live Test Sandbox
                  </span>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-400">
                    Playable Before Uploading
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:underline"
                >
                  <Eye className="size-3.5" />
                  <span>{previewMode ? 'Hide Test Window' : 'Test Play Now 🕹️'}</span>
                </button>
              </div>

              {previewMode && (
                <div className="overflow-hidden rounded-xl border border-white/15 bg-black">
                  <iframe
                    title="Live Test Sandbox"
                    sandbox="allow-scripts allow-modals allow-pointer-lock"
                    srcDoc={bundledSource}
                    className="w-full h-80 border-0"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/10 bg-[#0a0e18] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!htmlFile || isSubmitting}
            onClick={handlePublish}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-6 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-300 hover:to-cyan-400 transition transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin text-base">⚙️</span>
                <span>Publishing Game...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Publish Game to Community Arcade 🚀</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
