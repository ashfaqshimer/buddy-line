'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Wand2,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Trash2,
  Rocket,
} from 'lucide-react';
import { GiJoystick } from 'react-icons/gi';
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
  background: #0d0d0f;
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
  background: radial-gradient(circle at center, #1e2638 0%, #0a0a0c 100%);
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
          colors: ['#38bdf8', '#818cf8', '#c084fc', '#ffffff'],
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

  type CodeFile = { name: string; size: string; content: string } | null;

  /** One drop/choose slot for a code file. */
  const fileSlot = (opts: {
    type: 'html' | 'css' | 'js';
    title: string;
    hint: string;
    accept: string;
    required?: boolean;
    dot: string;
    file: CodeFile;
    clear: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    setFile: (val: { name: string; size: string; content: string }) => void;
  }) => (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleFileDrop(e, opts.type)}
      className={`flex flex-col justify-between rounded-2xl border-2 border-dashed p-4 transition ${
        opts.file ? 'border-success/40 bg-success/[0.05]' : 'border-border-strong bg-surface-sunken/60 hover:border-primary/50'
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold text-foreground">
            <span className={`size-2.5 rounded-full ${opts.dot}`} aria-hidden />
            {opts.title}
          </span>
          <span className={`tag ${opts.required ? 'tag-play' : 'tag-muted'}`}>{opts.required ? 'Required' : 'Optional'}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{opts.hint}</p>
      </div>

      <div className="mt-4">
        {opts.file ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-success/10 px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="truncate">{opts.file.name}</span>
              <span className="shrink-0 font-normal text-emerald-300/70">{opts.file.size}</span>
            </span>
            <button
              type="button"
              onClick={opts.clear}
              className="icon-btn size-7 hover:!text-rose-300"
              aria-label={`Remove ${opts.file.name}`}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => opts.inputRef.current?.click()} className="btn btn-secondary btn-sm w-full">
            <Upload className="size-3.5" />
            <span>Choose {opts.accept.split(',')[0]} file</span>
          </button>
        )}
        <input
          ref={opts.inputRef}
          type="file"
          accept={opts.accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) readFileContent(e.target.files[0], opts.setFile);
          }}
        />
      </div>
    </div>
  );

  const stepHeading = (n: number, title: string, aside?: React.ReactNode) => (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2.5 text-sm font-bold text-foreground">
        <span className="font-display flex size-6 items-center justify-center rounded-full bg-[image:var(--brand-gradient)] text-[11px] font-bold text-[#0b0820]">
          {n}
        </span>
        {title}
      </h3>
      {aside}
    </div>
  );

  return (
    <div className="scrim p-0 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="uploader-title"
        className="panel flex h-[100dvh] max-w-4xl flex-col overflow-hidden rounded-none pb-[env(safe-area-inset-bottom,0px)] sm:h-auto sm:max-h-[92dvh] sm:rounded-[var(--radius-xl)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 id="uploader-title" className="font-display truncate text-lg font-bold text-foreground sm:text-xl">
              Upload a game
            </h2>
            <p className="truncate text-sm text-muted-foreground">Add your files, test-play them, then publish.</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={loadStarterTemplate}
              className="btn btn-secondary btn-sm"
              title="Fill the form with a small example game"
            >
              <Wand2 className="size-3.5" />
              <span className="hidden sm:inline">Use starter template</span>
              <span className="sm:hidden">Template</span>
            </button>
            <button onClick={onClose} className="icon-btn" aria-label="Close uploader">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-8 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {errorMessage && (
            <div className="alert alert-error">
              <AlertCircle className="mt-px size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Details */}
          <section>
            {stepHeading(1, 'Details')}
            <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="game-title">
                    Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="game-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Astro Jump"
                    maxLength={40}
                    className="field font-semibold"
                  />
                </div>

                <div>
                  <label className="field-label flex items-baseline justify-between" htmlFor="game-description">
                    <span>How to play</span>
                    <span className="text-xs font-normal text-subtle-foreground">{description.length}/120</span>
                  </label>
                  <textarea
                    id="game-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Arrow keys to move, Space to jump. Dodge the asteroids!"
                    maxLength={120}
                    rows={3}
                    className="field resize-none"
                  />
                  <p className="mt-1.5 text-xs text-subtle-foreground">Shown on your game’s card and while people play.</p>
                </div>

                <div>
                  <span className="field-label flex items-center gap-2">
                    Badge icon <span className="text-2xl leading-none">{selectedIcon}</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {EMOJI_CATEGORIES.flatMap((c) => c.emojis).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedIcon(emoji)}
                        aria-label={`Use ${emoji} as badge icon`}
                        aria-pressed={selectedIcon === emoji}
                        className={`flex size-9 items-center justify-center rounded-xl text-lg transition active:scale-90 ${
                          selectedIcon === emoji ? 'bg-primary/15 ring-2 ring-primary' : 'bg-surface-sunken ring-1 ring-border hover:ring-border-strong'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-subtle-foreground">Appears on your cover when there’s no cover image.</p>
                </div>
              </div>

              {/* Cover image */}
              <div className="rounded-2xl border border-border bg-surface-sunken/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ImageIcon className="size-4 text-primary" />
                    Cover image
                  </span>
                  <span className="text-xs text-subtle-foreground">Optional</span>
                </div>

                {thumbnailUrl ? (
                  <div className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black/40 ring-1 ring-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailUrl}
                      alt="Cover preview"
                      className="size-full object-cover"
                      onError={() => {
                        setErrorMessage('Could not load image from the provided thumbnail URL');
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailUrl('');
                        setUrlInput('');
                        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
                      }}
                      className="btn btn-sm absolute right-2 top-2 bg-black/70 text-white backdrop-blur hover:bg-rose-600"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="segmented mb-3" role="tablist" aria-label="Cover image source">
                      <button type="button" role="tab" aria-selected={thumbnailTab === 'upload'} onClick={() => setThumbnailTab('upload')} className="!min-h-8 !text-xs">
                        <Upload className="size-3.5" />
                        Upload
                      </button>
                      <button type="button" role="tab" aria-selected={thumbnailTab === 'url'} onClick={() => setThumbnailTab('url')} className="!min-h-8 !text-xs">
                        <LinkIcon className="size-3.5" />
                        Link
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
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') thumbnailInputRef.current?.click();
                        }}
                        className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border-strong text-center transition hover:border-primary/50 hover:bg-primary/[0.04]"
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
                          <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <Loader2 className="size-4 animate-spin" />
                            Uploading…
                          </span>
                        ) : (
                          <>
                            <Upload className="size-5 text-primary" />
                            <span className="text-sm font-semibold text-foreground">Choose an image</span>
                            <span className="text-xs text-subtle-foreground">PNG, JPG or WebP, up to 4MB</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => {
                            setUrlInput(e.target.value);
                            setThumbnailUrl(e.target.value.trim());
                          }}
                          placeholder="https://…"
                          aria-label="Cover image URL"
                          className="field"
                        />
                        <span className="mt-1.5 block text-xs text-subtle-foreground">Paste a direct link to an image.</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

          {/* 2. Code files */}
          <section>
            {stepHeading(
              2,
              'Code files',
              <span className="flex items-center gap-1 text-xs text-subtle-foreground">
                <HelpCircle className="size-3.5" />
                Only the HTML file is required
              </span>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {fileSlot({
                type: 'html',
                title: 'HTML',
                hint: 'Your page: markup, canvas and any inline code.',
                accept: '.html,.htm',
                required: true,
                dot: 'bg-orange-400',
                file: htmlFile,
                clear: () => setHtmlFile(null),
                inputRef: htmlInputRef,
                setFile: setHtmlFile,
              })}
              {fileSlot({
                type: 'css',
                title: 'CSS',
                hint: 'Styles, if they live in their own file.',
                accept: '.css',
                dot: 'bg-sky-400',
                file: cssFile,
                clear: () => setCssFile(null),
                inputRef: cssInputRef,
                setFile: setCssFile,
              })}
              {fileSlot({
                type: 'js',
                title: 'JavaScript',
                hint: 'Game logic, if it lives in its own file.',
                accept: '.js,.javascript',
                dot: 'bg-yellow-300',
                file: jsFile,
                clear: () => setJsFile(null),
                inputRef: jsInputRef,
                setFile: setJsFile,
              })}
            </div>
          </section>

          {/* 3. Test play */}
          <section>
            {stepHeading(
              3,
              'Test play',
              htmlFile ? (
                <button type="button" onClick={() => setPreviewMode(!previewMode)} className="btn btn-secondary btn-sm">
                  <Eye className="size-3.5" />
                  <span>{previewMode ? 'Hide preview' : 'Play preview'}</span>
                </button>
              ) : null
            )}
            {!htmlFile ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-subtle-foreground">
                Add an HTML file to try your game here before publishing.
              </p>
            ) : previewMode ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-black">
                <iframe
                  title="Game preview"
                  sandbox="allow-scripts allow-modals allow-pointer-lock"
                  srcDoc={bundledSource}
                  className="aspect-video max-h-[60vh] w-full border-0"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-sunken/60 px-4 py-8 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <GiJoystick className="size-5" />
                </span>
                Play your game in the same sandbox players will use
              </button>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3.5 sm:px-6">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button type="button" disabled={!htmlFile || isSubmitting} onClick={handlePublish} className="btn btn-brand btn-lg">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
            <span>{isSubmitting ? 'Publishing…' : 'Publish game'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
