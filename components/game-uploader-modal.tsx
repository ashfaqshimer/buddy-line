'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileCode,
  FileText,
  Palette,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Wand2,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Trash2,
} from 'lucide-react';
import { GiJoystick, GiSparkles } from 'react-icons/gi';
import confetti from 'canvas-confetti';
import { bundleGameSource } from '@/lib/game-bundler';
import { uploadGame } from '@/app/game-actions';
import { GameRecord } from '@/lib/games-db';
import { useUploadThing } from '@/lib/uploadthing';

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

const EMOJI_CATEGORIES = [
  { label: 'Gaming', emojis: ['🎮', '🕹️', '👾', '🎯', '🎲', '🏆'] },
  { label: 'Sci-Fi', emojis: ['🚀', '🛸', '⚡', '🤖', '🌌', '🌠'] },
  { label: 'Action', emojis: ['🏎️', '⚔️', '🛡️', '💣', '🔥', '🥊'] },
  { label: 'Fun', emojis: ['🍕', '🐱', '🦄', '💎', '⭐', '🎈'] },
];

const STARTER_TEMPLATE = {
  title: 'Cosmic Gem Hunter',
  description: 'Use your mouse or touch to collect falling cosmic gems before time runs out!',
  icon: '💎',
  html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Gem Hunter</title>
</head>
<body>
  <div id="hud">
    <div>GEMS: <span id="score">0</span></div>
    <div>TIME: <span id="time">30</span>s</div>
  </div>
  <canvas id="canvas" width="600" height="400"></canvas>
  <div id="game-over">
    <h2>TIME'S UP!</h2>
    <p>You collected <span id="final-score">0</span> gems!</p>
    <button onclick="startGame()">PLAY AGAIN</button>
  </div>
</body>
</html>`,
  css: `body {
  margin: 0;
  background: #151920;
  color: #fff;
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  overflow: hidden;
  user-select: none;
}
#hud {
  display: flex;
  justify-content: space-between;
  width: 600px;
  max-width: 95vw;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #2dd4bf;
  margin-bottom: 8px;
}
canvas {
  background: radial-gradient(circle at center, #1e2638 0%, #111419 100%);
  border: 2px solid #2dd4bf;
  border-radius: 16px;
  box-shadow: 0 0 30px rgba(45, 212, 191, 0.25);
  max-width: 95vw;
  cursor: crosshair;
}
#game-over {
  display: none;
  position: absolute;
  background: rgba(28, 32, 40, 0.95);
  border: 2px solid #2dd4bf;
  padding: 24px 40px;
  border-radius: 16px;
  text-align: center;
}
button {
  background: #2dd4bf;
  color: #0f172a;
  border: none;
  padding: 10px 20px;
  font-weight: bold;
  border-radius: 9999px;
  cursor: pointer;
}`,
  js: `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let score = 0;
let timeLeft = 30;
let gems = [];
let isPlaying = true;

const basket = { x: 300, y: 360, size: 40 };

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  basket.x = e.clientX - rect.left - basket.size / 2;
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  basket.x = e.touches[0].clientX - rect.left - basket.size / 2;
});

function spawnGem() {
  if (!isPlaying) return;
  gems.push({
    x: Math.random() * (canvas.width - 24),
    y: -20,
    speed: 2 + Math.random() * 3,
    color: ['#2dd4bf', '#38bdf8', '#818cf8', '#f472b6'][Math.floor(Math.random() * 4)]
  });
}
setInterval(spawnGem, 500);

const timer = setInterval(() => {
  if (!isPlaying) return;
  timeLeft--;
  document.getElementById('time').innerText = timeLeft;
  if (timeLeft <= 0) {
    isPlaying = false;
    document.getElementById('final-score').innerText = score;
    document.getElementById('game-over').style.display = 'block';
  }
}, 1000);

function update() {
  if (!isPlaying) return;
  for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i];
    g.y += g.speed;
    if (g.y + 16 > basket.y && g.x + 16 > basket.x && g.x < basket.x + basket.size) {
      score += 10;
      document.getElementById('score').innerText = score;
      gems.splice(i, 1);
    } else if (g.y > canvas.height + 20) {
      gems.splice(i, 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Basket
  ctx.fillStyle = '#2dd4bf';
  ctx.fillRect(basket.x, basket.y, basket.size, 10);

  // Gems
  gems.forEach(g => {
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(() => {
    update();
    draw();
  });
}

function startGame() {
  score = 0;
  timeLeft = 30;
  gems = [];
  isPlaying = true;
  document.getElementById('score').innerText = 0;
  document.getElementById('time').innerText = 30;
  document.getElementById('game-over').style.display = 'none';
}

draw();`,
};

export function GameUploaderModal({
  isOpen,
  onClose,
  onGameUploaded,
  currentUser,
}: GameUploaderModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎮');

  // Thumbnail state (UploadThing or Direct Image URL)
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailTab, setThumbnailTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading: isUploadingThumbnail } = useUploadThing(
    'gameThumbnailUploader',
    {
      onClientUploadComplete: (res) => {
        if (res && res[0]) {
          const url = (res[0] as { ufsUrl?: string; url?: string }).ufsUrl || res[0].url;
          if (url) {
            setThumbnailUrl(url);
            setErrorMessage('');
          }
        }
      },
      onUploadError: (error: Error) => {
        setErrorMessage(
          `Thumbnail upload failed: ${error.message}. You can also paste an image URL directly.`
        );
      },
    }
  );

  const handleThumbnailFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (.png, .jpg, .webp, .gif).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage(
        `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 4 MB.`
      );
      return;
    }
    setErrorMessage('');
    startUpload([file]);
  };

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
    // 10MB individual file size limit
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(`File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      return;
    }

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

  const loadStarterTemplate = () => {
    setTitle(STARTER_TEMPLATE.title);
    setDescription(STARTER_TEMPLATE.description);
    setSelectedIcon(STARTER_TEMPLATE.icon);
    setThumbnailUrl('');
    setUrlInput('');
    setHtmlFile({
      name: 'index.html',
      size: `${(STARTER_TEMPLATE.html.length / 1024).toFixed(1)} KB`,
      content: STARTER_TEMPLATE.html,
    });
    setCssFile({
      name: 'styles.css',
      size: `${(STARTER_TEMPLATE.css.length / 1024).toFixed(1)} KB`,
      content: STARTER_TEMPLATE.css,
    });
    setJsFile({
      name: 'game.js',
      size: `${(STARTER_TEMPLATE.js.length / 1024).toFixed(1)} KB`,
      content: STARTER_TEMPLATE.js,
    });
    setErrorMessage('');
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
        thumbnailUrl: thumbnailUrl.trim() || null,
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

      // Confetti celebration
      try {
        confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      onGameUploaded(res.game);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Something went wrong while publishing.';
      if (msg.includes('Body exceeded') || msg.includes('413') || msg.includes('too large')) {
        setErrorMessage('Your game code exceeds the maximum payload size (10 MB). Please optimize images or assets.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const bundledSource = htmlFile
    ? bundleGameSource(htmlFile.content, cssFile?.content, jsFile?.content)
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-white/[0.08] bg-[#1c2028] shadow-[6px_6px_20px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4 bg-[#181c24]">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-400 to-teal-600 text-slate-950 shadow-lg shadow-teal-500/25">
              <GiJoystick className="size-6 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">Game Creator Studio</h2>
                <span className="rounded-full bg-teal-400/10 border border-teal-400/20 px-2 py-0.5 text-[10px] font-bold text-teal-400">
                  HTML5 Sandboxed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload your code files and publish your game to the community in seconds!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadStarterTemplate}
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-teal-400/20 bg-teal-400/8 px-3.5 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-400/15 transition"
              title="Autofill with starter game template"
            >
              <Wand2 className="size-3.5" />
              <span>Load Starter Template</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white transition"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-500/8 border border-rose-500/20 p-3.5 text-xs text-rose-300">
              <AlertCircle className="size-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Game Title & Icon Picker */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Game Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Astro Jump, Cyber Runner, Neon Dodge..."
                  maxLength={40}
                  className="w-full rounded-2xl border border-white/[0.08] bg-[#151920] px-4 py-3 text-base font-bold text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.3)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  How To Play / Description <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Press Spacebar to jump and dodge asteroids! Arrow keys to move."
                  maxLength={120}
                  className="w-full rounded-2xl border border-white/[0.08] bg-[#151920] px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.3)]"
                />
              </div>
            </div>

            {/* Thumbnail & Icon Picker */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#151920] p-4 shadow-[inset_1px_1px_4px_rgba(0,0,0,0.25)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-teal-400" />
                    Game Thumbnail
                  </span>
                  {thumbnailUrl ? (
                    <span className="text-[10px] bg-teal-400/10 text-teal-300 font-bold px-1.5 py-0.5 rounded-full border border-teal-400/20">
                      Active
                    </span>
                  ) : (
                    <span className="text-xl" title="Fallback emoji badge">{selectedIcon}</span>
                  )}
                </div>

                {/* If thumbnail is active, show preview */}
                {thumbnailUrl ? (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-teal-500/30 bg-black/40 group mb-3">
                    <img
                      src={thumbnailUrl}
                      alt="Game Thumbnail Preview"
                      className="size-full object-cover"
                      onError={() => {
                        setErrorMessage('Could not load image from the provided thumbnail URL');
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailUrl('');
                          setUrlInput('');
                          if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/90 text-white text-xs font-bold hover:bg-rose-600 transition"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    {/* Mode Toggle Tabs */}
                    <div className="flex rounded-lg bg-white/[0.04] p-0.5 mb-2 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setThumbnailTab('upload')}
                        className={`flex-1 py-1 rounded-md transition flex items-center justify-center gap-1 ${
                          thumbnailTab === 'upload'
                            ? 'bg-teal-500/20 text-teal-300 shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Upload className="size-3" />
                        <span>Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbnailTab('url')}
                        className={`flex-1 py-1 rounded-md transition flex items-center justify-center gap-1 ${
                          thumbnailTab === 'url'
                            ? 'bg-teal-500/20 text-teal-300 shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <LinkIcon className="size-3" />
                        <span>Image URL</span>
                      </button>
                    </div>

                    {thumbnailTab === 'upload' ? (
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files?.[0]) handleThumbnailFileSelected(e.dataTransfer.files[0]);
                        }}
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-teal-500/30 bg-teal-500/[0.03] hover:bg-teal-500/[0.08] hover:border-teal-400/60 transition cursor-pointer text-center min-h-[84px]"
                      >
                        <input
                          ref={thumbnailInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleThumbnailFileSelected(e.target.files[0]);
                          }}
                        />
                        {isUploadingThumbnail ? (
                          <div className="flex items-center gap-2 text-teal-400 text-xs py-2 font-semibold">
                            <Loader2 className="size-4 animate-spin" />
                            <span>Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="size-4 text-teal-400 mb-1" />
                            <span className="text-[11px] font-bold text-white">Choose Image</span>
                            <span className="text-[9px] text-slate-400">PNG, JPG, WebP (max 4MB)</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => {
                            setUrlInput(e.target.value);
                            setThumbnailUrl(e.target.value.trim());
                          }}
                          placeholder="https://... (Cloudinary, Imgur, etc.)"
                          className="w-full rounded-xl border border-white/[0.08] bg-[#111419] px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                        />
                        <span className="text-[9px] text-slate-500 block">Paste direct image URL</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Emoji badge fallback */}
              <div className="pt-2 border-t border-white/[0.04]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Badge Icon
                  </span>
                  <span className="text-sm">{selectedIcon}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {EMOJI_CATEGORIES.flatMap((c) => c.emojis).slice(0, 12).map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedIcon(emoji)}
                      className={`size-7 rounded-lg text-sm flex items-center justify-center border transition ${
                        selectedIcon === emoji
                          ? 'border-teal-400 bg-teal-400/20 scale-105 shadow-sm'
                          : 'border-white/[0.04] bg-white/[0.02] hover:border-white/15'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Visual 3-Slot Code Assets Dropper */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Code Files (HTML, CSS, JS)
              </span>
              <span className="text-[11px] text-teal-400 flex items-center gap-1 font-semibold">
                <HelpCircle className="size-3" />
                HTML file is all that is required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SLOT 1: HTML (REQUIRED) */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop(e, 'html')}
                className={`relative flex flex-col justify-between rounded-2xl border-2 border-dashed p-4 transition ${
                  htmlFile
                    ? 'border-teal-500/40 bg-teal-500/[0.04]'
                    : 'border-teal-500/25 bg-teal-500/[0.02] hover:border-teal-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-md bg-teal-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-teal-400">
                      Step 1 • Required
                    </span>
                    <FileCode className="size-4 text-teal-400" />
                  </div>
                  <h4 className="font-bold text-white text-sm">HTML File (.html)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Main structure, canvas, and layout.
                  </p>
                </div>

                <div className="mt-4">
                  {htmlFile ? (
                    <div className="rounded-xl border border-teal-500/25 bg-teal-500/8 p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate text-xs font-semibold text-teal-300">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span className="truncate">{htmlFile.name}</span>
                        </div>
                        <span className="text-[10px] text-teal-400/80">{htmlFile.size}</span>
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
                      className="w-full flex items-center justify-center gap-2 rounded-full bg-teal-500/10 border border-teal-500/25 py-2.5 text-xs font-bold text-teal-300 hover:bg-teal-500/20 transition"
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
                    ? 'border-teal-500/40 bg-teal-500/[0.04]'
                    : 'border-white/[0.1] bg-white/[0.02] hover:border-teal-400/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-black uppercase text-slate-300">
                      Step 2 • Optional
                    </span>
                    <Palette className="size-4 text-teal-400" />
                  </div>
                  <h4 className="font-bold text-white text-sm">CSS Stylesheet (.css)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Colors, styles, or leave empty if in HTML.
                  </p>
                </div>

                <div className="mt-4">
                  {cssFile ? (
                    <div className="rounded-xl border border-teal-500/25 bg-teal-500/8 p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate text-xs font-semibold text-teal-300">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span className="truncate">{cssFile.name}</span>
                        </div>
                        <span className="text-[10px] text-teal-400/80">{cssFile.size}</span>
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
                      className="w-full flex items-center justify-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] py-2.5 text-xs font-bold text-slate-300 hover:bg-white/[0.08] transition"
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
                    ? 'border-teal-500/40 bg-teal-500/[0.04]'
                    : 'border-white/[0.1] bg-white/[0.02] hover:border-teal-400/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-black uppercase text-slate-300">
                      Step 3 • Optional
                    </span>
                    <FileText className="size-4 text-teal-400" />
                  </div>
                  <h4 className="font-bold text-white text-sm">JavaScript Logic (.js)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Game script, or leave empty if in HTML.
                  </p>
                </div>

                <div className="mt-4">
                  {jsFile ? (
                    <div className="rounded-xl border border-teal-500/25 bg-teal-500/8 p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate text-xs font-semibold text-teal-300">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span className="truncate">{jsFile.name}</span>
                        </div>
                        <span className="text-[10px] text-teal-400/80">{jsFile.size}</span>
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
                      className="w-full flex items-center justify-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] py-2.5 text-xs font-bold text-slate-300 hover:bg-white/[0.08] transition"
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

          {/* 3. Live Test Sandbox Preview */}
          {htmlFile && (
            <div className="rounded-2xl border border-teal-400/15 bg-[#151920] p-4 shadow-[inset_1px_1px_4px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                    Live Sandbox Test Window
                  </span>
                  <span className="rounded-full bg-teal-400/10 px-2 py-0.5 text-[10px] text-teal-400 font-semibold">
                    Test Play Before Publishing
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:underline"
                >
                  <Eye className="size-3.5" />
                  <span>{previewMode ? 'Hide Test Window' : 'Test Play Now 🕹️'}</span>
                </button>
              </div>

              {previewMode && (
                <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-black">
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

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#181c24] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!htmlFile || isSubmitting}
            onClick={handlePublish}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-6 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20 hover:shadow-[0_0_24px_rgba(45,212,191,0.35)] transition transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin text-base">⚙️</span>
                <span>Publishing to Arcade...</span>
              </>
            ) : (
              <>
                <GiSparkles className="size-4" />
                <span>Publish Game to Community Arcade 🚀</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
