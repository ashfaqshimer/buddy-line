'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Search,
  Upload,
  Play,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  User,
  Share2,
  Check,
  LayoutGrid,
  List,
  ThumbsUp,
  Send,
  Zap,
} from 'lucide-react';
import {
  GiJoystick,
  GiGameConsole,
  GiTrophyCup,
  GiGamepadCross,
  GiGalaxy,
  GiSwordClash,
  GiPartyPopper,
} from 'react-icons/gi';
import {
  IoFlame,
  IoRocket,
  IoFlash,
  IoChatbubbles,
  IoHardwareChip,
} from 'react-icons/io5';
import { GameRecord } from '@/lib/games-db';
import { getGames, deleteGameAction } from '@/app/game-actions';
import { GamePlayerModal } from './game-player-modal';
import { GameUploaderModal } from './game-uploader-modal';
import { AuthModal } from './auth-modal';
import { useAuth } from '@/components/auth-provider';
import { NavTabType } from './header';

export type ArcadeFilterType = 'all' | 'popular' | 'newest' | 'action' | 'puzzle' | 'retro' | 'my-games';

interface ArcadeViewProps {
  filter?: ArcadeFilterType;
  onFilterChange?: (filter: ArcadeFilterType) => void;
  isUploaderOpen?: boolean;
  setIsUploaderOpen?: (open: boolean) => void;
  onGamesLoaded?: (count: number) => void;
  activeNavTab?: NavTabType;
  onSelectNavTab?: (tab: NavTabType) => void;
  onOpenChat?: (targetPlayerIdOrUsername?: string) => void;
}

interface CommunityThread {
  id: string;
  title: string;
  author: string;
  avatar: string;
  tag: string;
  replies: number;
  likes: number;
  timeAgo: string;
  pinned?: boolean;
}

const SEED_THREADS: CommunityThread[] = [
  {
    id: 't-1',
    title: '🏆 Weekly High Score Bounty: Space Blaster 3000 (Target: 3,500 pts)',
    author: 'CaptainCosmo',
    avatar: '👨‍🚀',
    tag: 'Bounty',
    replies: 18,
    likes: 42,
    timeAgo: '2h ago',
    pinned: true,
  },
  {
    id: 't-2',
    title: '💡 Idea Thread: What arcade games do you want someone to code next?',
    author: 'PixelNinja',
    avatar: '🐱',
    tag: 'Game Ideas',
    replies: 27,
    likes: 31,
    timeAgo: '4h ago',
  },
  {
    id: 't-3',
    title: '🛠️ Canvas 2D Tutorial: Adding smooth touch controls for mobile screens',
    author: 'CodeWizard',
    avatar: '🧙‍♂️',
    tag: 'Dev Tips',
    replies: 12,
    likes: 24,
    timeAgo: '1d ago',
  },
  {
    id: 't-4',
    title: '🎉 Just uploaded "Neon Cyber Pong"! Let me know how the AI paddle feels.',
    author: 'NeonKnight',
    avatar: '⚡',
    tag: 'Showcase',
    replies: 9,
    likes: 19,
    timeAgo: '1d ago',
  },
];

export function ArcadeView({
  filter = 'all',
  onFilterChange,
  isUploaderOpen: externalIsUploaderOpen,
  setIsUploaderOpen: externalSetIsUploaderOpen,
  onGamesLoaded,
  activeNavTab = 'catalog',
  onSelectNavTab,
  onOpenChat,
}: ArcadeViewProps) {
  const { session, isPending, isAdmin: authIsAdmin } = useAuth();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalFilter, setInternalFilter] = useState<ArcadeFilterType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedGameId, setCopiedGameId] = useState<string | null>(null);

  // Community discussion state
  const [threads, setThreads] = useState<CommunityThread[]>(SEED_THREADS);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadTag, setNewThreadTag] = useState('Game Ideas');
  const [isPostingThread, setIsPostingThread] = useState(false);

  const activeFilter = onFilterChange ? filter : internalFilter;
  const setFilter = (nextFilter: ArcadeFilterType) => {
    if (onFilterChange) {
      onFilterChange(nextFilter);
    } else {
      setInternalFilter(nextFilter);
    }
  };

  // Modals
  const [activeGame, setActiveGame] = useState<GameRecord | null>(null);
  const [internalUploaderOpen, setInternalUploaderOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const isUploaderOpen =
    externalIsUploaderOpen !== undefined ? externalIsUploaderOpen : internalUploaderOpen;
  const setIsUploaderOpen = externalSetIsUploaderOpen || setInternalUploaderOpen;

  // Deletion state
  const [gameToDelete, setGameToDelete] = useState<GameRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getGames().then((fetched) => {
      if (isMounted) {
        setGames(fetched);
        setLoading(false);
        onGamesLoaded?.(fetched.length);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [onGamesLoaded]);

  const handleGameUploaded = (newGame: GameRecord) => {
    setGames((prev) => [newGame, ...prev]);
    onGamesLoaded?.(games.length + 1);
    setActiveGame(newGame);
  };

  const handlePlayRecorded = useCallback((gameId: string, newCount: number) => {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, playCount: newCount } : g))
    );
    setActiveGame((prev) => (prev && prev.id === gameId ? { ...prev, playCount: newCount } : prev));
  }, []);

  const handleUploadClick = () => {
    if (!session?.user) {
      setIsAuthOpen(true);
    } else {
      setIsUploaderOpen(true);
    }
  };

  const handleShare = (game: GameRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = window.location.href;
      navigator.clipboard.writeText(`${url}#${game.id}`);
      setCopiedGameId(game.id);
      setTimeout(() => setCopiedGameId(null), 2000);
    } catch {
      // ignore
    }
  };

  const currentUserRole = (session?.user as { role?: string } | undefined)?.role;
  const isDirectRoot =
    (session?.user as { username?: string; email?: string } | undefined)?.username?.toLowerCase() === 'root' ||
    (session?.user as { username?: string; email?: string } | undefined)?.email?.toLowerCase() === 'root' ||
    (session?.user as { username?: string; email?: string } | undefined)?.email?.toLowerCase() === 'root@buddyline.local' ||
    (session?.user as { username?: string; email?: string } | undefined)?.email?.toLowerCase() === 'root@buddyline.com';
  const isAdmin = authIsAdmin || currentUserRole === 'admin' || currentUserRole === 'root' || Boolean(isDirectRoot);

  const canDeleteGame = (game: GameRecord) => {
    if (!session?.user) return false;
    return session.user.id === game.authorId || isAdmin;
  };

  const confirmDeleteGame = async () => {
    if (!gameToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteGameAction(gameToDelete.id);
      if (res.success) {
        setGames((prev) => prev.filter((g) => g.id !== gameToDelete.id));
        onGamesLoaded?.(Math.max(0, games.length - 1));
        if (activeGame?.id === gameToDelete.id) {
          setActiveGame(null);
        }
        setGameToDelete(null);
      } else {
        setDeleteError(res.error || 'Failed to delete game.');
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting game.');
    } finally {
      setIsDeleting(false);
    }
  };

  const spotlightGame = useMemo(() => {
    if (games.length === 0) return null;
    return [...games].sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0];
  }, [games]);

  const totalPlays = useMemo(() => {
    return games.reduce((acc, g) => acc + (g.playCount || 0), 0);
  }, [games]);

  const totalCreators = useMemo(() => {
    const unique = new Set(games.map((g) => g.authorUsername));
    return unique.size;
  }, [games]);

  const filteredGames = useMemo(() => {
    return games
      .filter((g) => {
        if (activeFilter === 'my-games') {
          if (!session?.user) return false;
          if (g.authorId !== session.user.id) return false;
        }

        if (activeFilter === 'action') {
          const isAction =
            g.title.toLowerCase().includes('blaster') ||
            g.title.toLowerCase().includes('space') ||
            g.description.toLowerCase().includes('laser') ||
            g.description.toLowerCase().includes('action');
          if (!isAction) return false;
        }
        if (activeFilter === 'retro') {
          const isRetro =
            g.title.toLowerCase().includes('pong') ||
            g.title.toLowerCase().includes('cyber') ||
            g.title.toLowerCase().includes('snake') ||
            g.description.toLowerCase().includes('retro');
          if (!isRetro) return false;
        }
        if (activeFilter === 'puzzle') {
          const isPuzzle =
            g.title.toLowerCase().includes('puzzle') ||
            g.description.toLowerCase().includes('puzzle') ||
            g.description.toLowerCase().includes('think') ||
            g.description.toLowerCase().includes('match');
          if (!isPuzzle) return false;
        }

        const matchSearch =
          g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.authorUsername.toLowerCase().includes(searchQuery.toLowerCase());
        return matchSearch;
      })
      .sort((a, b) => {
        if (activeFilter === 'popular') return (b.playCount || 0) - (a.playCount || 0);
        if (activeFilter === 'newest')
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
      });
  }, [games, activeFilter, searchQuery, session?.user]);

  const leaderboardsData = useMemo(() => {
    return games.map((game, idx) => {
      const topScore = Math.max(1200, (game.playCount || 1) * 85 + 320);
      return {
        game,
        topScore,
        champion: idx === 0 ? 'CadetAce ⚡' : idx === 1 ? 'CosmoPro 🚀' : game.authorUsername,
        avatar: idx === 0 ? '👾' : idx === 1 ? '👨‍🚀' : game.authorAvatar || '🎮',
      };
    }).sort((a, b) => b.topScore - a.topScore);
  }, [games]);

  const handlePostThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim()) return;
    if (!session?.user) {
      setIsAuthOpen(true);
      return;
    }

    const u = session.user as { username?: string; name?: string; image?: string | null };
    const newThread: CommunityThread = {
      id: `t-${Date.now()}`,
      title: newThreadTitle.trim(),
      author: u.username || u.name || 'ArcadeFan',
      avatar: u.image || '👾',
      tag: newThreadTag,
      replies: 0,
      likes: 1,
      timeAgo: 'Just now',
    };

    setThreads((prev) => [newThread, ...prev]);
    setNewThreadTitle('');
    setIsPostingThread(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* 1. Cinematic Hero Section — Dark Neumorphic with Teal Accent */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1c2028] p-4 sm:p-8 lg:p-10 shadow-[6px_6px_16px_rgba(0,0,0,0.45),-4px_-4px_12px_rgba(255,255,255,0.02)]">
        {/* Glow Spheres */}
        <div className="absolute -right-16 -top-16 size-80 rounded-full bg-teal-500/8 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 size-80 rounded-full bg-teal-400/5 blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Left Column: Heading & Value Prop */}
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-teal-400/20 bg-teal-400/6 px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-teal-300">
              <GiJoystick className="size-3.5 sm:size-4 text-teal-400 shrink-0" />
              <span>THE OPEN WEB ARCADE COMMUNITY</span>
            </div>

            <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15] sm:leading-[1.1]">
              Code It. Play It. <br />
              <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">
                Share With Everyone.
              </span>
            </h1>

            <p className="text-xs sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Anyone can upload custom HTML5, CSS, and JavaScript games and let players around the globe jump right into the action with zero install or setup required.
            </p>

            {/* Hero CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleUploadClick}
                className="group flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-black text-slate-950 shadow-[0_0_25px_rgba(45,212,191,0.25)] hover:shadow-[0_0_35px_rgba(45,212,191,0.45)] transition-all transform active:scale-95"
              >
                <Upload className="size-4 transition-transform group-hover:-translate-y-0.5" />
                <span>Upload Your Game</span>
              </button>

              {spotlightGame && (
                <button
                  onClick={() => setActiveGame(spotlightGame)}
                  className="flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-black text-white transition active:scale-95 truncate"
                >
                  <Play className="size-3.5 sm:size-4 fill-teal-400 text-teal-400 shrink-0" />
                  <span className="truncate">Play Top Pick: {spotlightGame.title}</span>
                </button>
              )}
            </div>

            {/* Community Live Stats Strip */}
            <div className="pt-4 sm:pt-6 border-t border-white/[0.06] grid grid-cols-3 gap-2 sm:gap-4 text-center sm:text-left">
              <div>
                <div className="text-lg sm:text-2xl font-black text-white">{games.length}</div>
                <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  Arcade Games
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-black text-teal-400">{totalPlays}</div>
                <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  Total Plays
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-black text-teal-300">{totalCreators}</div>
                <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  Game Creators
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Spotlight Card */}
          <div className="lg:col-span-5">
            {spotlightGame ? (
              <div className="relative rounded-2xl border border-teal-400/20 bg-[#22272f] p-4 sm:p-6 shadow-[6px_6px_16px_rgba(0,0,0,0.4),-3px_-3px_10px_rgba(255,255,255,0.02)] group hover:border-teal-400/40 transition-all duration-300">
                {/* Spotlight Tag */}
                <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/8 border border-amber-400/20 px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase text-amber-300 tracking-wider truncate">
                    <IoFlame className="size-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    <span className="truncate">Featured Community Pick</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-teal-300 font-bold shrink-0">
                    <GiGameConsole className="size-3.5 sm:size-4 text-teal-400" />
                    <span>{spotlightGame.playCount} {spotlightGame.playCount === 1 ? 'Play' : 'Plays'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 sm:gap-4 mb-3 sm:mb-4">
                  <div className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-teal-500/8 border border-teal-400/20 text-3xl sm:text-4xl shadow-inner group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                    {spotlightGame.thumbnailUrl ? (
                      <img
                        src={spotlightGame.thumbnailUrl}
                        alt={spotlightGame.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      spotlightGame.icon || '🎮'
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-teal-300 transition-colors truncate">
                      {spotlightGame.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 truncate">
                      <span>Created by</span>
                      <span className="font-semibold text-slate-200 truncate">
                        {spotlightGame.authorAvatar} {spotlightGame.authorUsername}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4 sm:mb-5">
                  {spotlightGame.description}
                </p>

                <button
                  onClick={() => setActiveGame(spotlightGame)}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 py-3 text-xs font-black text-slate-950 hover:shadow-[0_0_24px_rgba(45,212,191,0.35)] shadow-md shadow-teal-500/15 transition active:scale-98"
                >
                  <Play className="size-4 fill-current" />
                  <span>LAUNCH GAME NOW</span>
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-[#22272f] p-6 sm:p-8 text-center shadow-[6px_6px_16px_rgba(0,0,0,0.4),-3px_-3px_10px_rgba(255,255,255,0.02)]">
                <div className="text-3xl sm:text-4xl mb-2">🕹️</div>
                <div className="text-sm font-bold text-white">Be The First Creator!</div>
                <p className="text-xs text-slate-400 mt-1">
                  Upload an HTML game to take the featured spotlight spot!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Platform Navigation Tabs */}
      <div id="arcade-main-content" className="scroll-mt-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-b border-white/[0.06] pb-3 sm:pb-4">
        {/* Main Section Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 rounded-2xl sm:rounded-full bg-[#1c2028] p-1.5 border border-white/[0.06] overflow-x-auto max-w-full no-scrollbar shadow-[inset_2px_2px_6px_rgba(0,0,0,0.3),inset_-1px_-1px_4px_rgba(255,255,255,0.01)]">
          <button
            onClick={() => onSelectNavTab?.('catalog')}
            className={`flex items-center gap-2 rounded-xl sm:rounded-full px-3.5 sm:px-4 py-2 text-xs font-black transition-all shrink-0 ${
              activeNavTab === 'catalog'
                ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GiJoystick className="size-4" />
            <span>Games Catalog</span>
            <span className="rounded-md bg-black/20 px-1.5 py-0.2 text-[10px]">
              {games.length}
            </span>
          </button>

          <button
            onClick={() => onSelectNavTab?.('leaderboards')}
            className={`flex items-center gap-2 rounded-xl sm:rounded-full px-3.5 sm:px-4 py-2 text-xs font-black transition-all shrink-0 ${
              activeNavTab === 'leaderboards'
                ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GiTrophyCup className="size-4" />
            <span>High Scores</span>
            <span className="rounded-md bg-black/20 px-1.5 py-0.2 text-[10px]">
              TOP
            </span>
          </button>

          <button
            onClick={() => onSelectNavTab?.('community')}
            className={`flex items-center gap-2 rounded-xl sm:rounded-full px-3.5 sm:px-4 py-2 text-xs font-black transition-all shrink-0 ${
              activeNavTab === 'community'
                ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <IoChatbubbles className="size-4" />
            <span>Community Lounge</span>
            <span className="rounded-md bg-black/20 px-1.5 py-0.2 text-[10px]">
              {threads.length}
            </span>
          </button>
        </div>

        {/* View Mode Toggle (Shown on desktop/tablet) */}
        {activeNavTab === 'catalog' && (
          <div className="hidden sm:flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Layout
            </span>
            <div className="flex items-center gap-1 rounded-full bg-[#1c2028] p-1 border border-white/[0.06]">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`flex size-8 items-center justify-center rounded-full transition ${
                  viewMode === 'grid'
                    ? 'bg-teal-400/15 text-teal-300 border border-teal-400/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="List View"
                className={`flex size-8 items-center justify-center rounded-full transition ${
                  viewMode === 'list'
                    ? 'bg-teal-400/15 text-teal-300 border border-teal-400/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. CONDITIONAL TAB CONTENT */}

      {/* === TAB 1: GAMES CATALOG === */}
      {activeNavTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search & Genre Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 size-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games, tags, or creators..."
                className="w-full rounded-full border border-white/[0.08] bg-[#1c2028] py-2.5 pl-10 pr-9 text-base sm:text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 transition shadow-[inset_2px_2px_6px_rgba(0,0,0,0.3)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 size-5 flex items-center justify-center rounded-full text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 rounded-full bg-[#1c2028] p-1 border border-white/[0.06] overflow-x-auto max-w-full no-scrollbar">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activeFilter === 'all'
                    ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/15'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Games
              </button>
              <button
                onClick={() => setFilter('popular')}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activeFilter === 'popular'
                    ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/15'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <IoFlame className="size-3.5" />
                <span>Popular</span>
              </button>
              <button
                onClick={() => setFilter('newest')}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activeFilter === 'newest'
                    ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/15'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="size-3" />
                <span>Newest</span>
              </button>
              <button
                onClick={() => setFilter('action')}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activeFilter === 'action'
                    ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/15'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GiSwordClash className="size-3.5" />
                <span>Action</span>
              </button>
              <button
                onClick={() => setFilter('retro')}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activeFilter === 'retro'
                    ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/15'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GiGamepadCross className="size-3.5" />
                <span>Retro 2D</span>
              </button>
              <button
                onClick={() => {
                  if (!session?.user) {
                    setIsAuthOpen(true);
                  } else {
                    setFilter('my-games');
                  }
                }}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activeFilter === 'my-games'
                    ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/15'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="size-3" />
                <span>My Uploads</span>
              </button>
            </div>
          </div>

          {/* Games Catalog Listing */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-block animate-spin text-4xl mb-3">🕹️</div>
              <div className="text-slate-300 text-sm font-bold">Connecting to Buddy Line Arcade...</div>
              <div className="text-slate-500 text-xs mt-1">Loading community games catalog</div>
            </div>
          ) : activeFilter === 'my-games' && isPending ? (
            <div className="rounded-2xl border border-white/[0.06] bg-[#1c2028] p-12 text-center shadow-[6px_6px_16px_rgba(0,0,0,0.4)] animate-pulse">
              <div className="size-8 mx-auto rounded-full border-2 border-teal-400 border-t-transparent animate-spin mb-3" />
              <div className="text-slate-300 text-sm font-bold">Verifying cadet session...</div>
            </div>
          ) : activeFilter === 'my-games' && !session?.user ? (
            <div className="rounded-2xl border border-white/[0.06] bg-[#1c2028] p-12 text-center shadow-[6px_6px_16px_rgba(0,0,0,0.4)]">
              <div className="text-4xl mb-3">👤</div>
              <h3 className="text-lg font-bold text-white">Sign In to View Your Uploads</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Sign in to manage and play the games you&apos;ve built and uploaded!
              </p>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition"
              >
                <span>Sign In / Join</span>
              </button>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-[#1c2028] p-12 text-center shadow-[6px_6px_16px_rgba(0,0,0,0.4)]">
              <div className="text-4xl mb-3">🕹️</div>
              <h3 className="text-lg font-bold text-white">No games found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No games match "${searchQuery}". Try a different keyword or reset filters!`
                  : activeFilter === 'my-games'
                  ? "You haven't uploaded any games yet. Be a creator and share one now!"
                  : 'Be the first cadet to upload a game to Buddy Line!'}
              </p>
              <button
                onClick={handleUploadClick}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition"
              >
                <Plus className="size-3.5" />
                <span>Upload A Game</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setActiveGame(game)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-[#1c2028] p-5 shadow-[6px_6px_16px_rgba(0,0,0,0.4),-3px_-3px_10px_rgba(255,255,255,0.02)] transition-all duration-300 hover:-translate-y-1.5 hover:border-teal-400/30 hover:shadow-[6px_6px_16px_rgba(0,0,0,0.4),0_0_24px_rgba(45,212,191,0.12)] overflow-hidden cursor-pointer"
                >
                  {/* Subtle Top Ambient Light */}
                  <div className="absolute -top-16 -right-16 size-32 rounded-full bg-teal-400/6 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Game Thumbnail Banner (if present) */}
                  {game.thumbnailUrl && (
                    <div className="relative w-[calc(100%+2.5rem)] h-36 -mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl border-b border-white/[0.08] bg-black/40">
                      <img
                        src={game.thumbnailUrl}
                        alt={game.title}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div>
                    {/* Top Row: Icon + Badges + Action Menu */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-500/8 border border-teal-400/15 text-3xl shadow-inner group-hover:scale-110 transition-transform overflow-hidden shrink-0">
                        {game.thumbnailUrl && !game.icon ? (
                          <img src={game.thumbnailUrl} alt={game.title} className="size-full object-cover" />
                        ) : !game.thumbnailUrl && (game.icon?.startsWith('http://') || game.icon?.startsWith('https://')) ? (
                          <img src={game.icon} alt={game.title} className="size-full object-cover" />
                        ) : (
                          game.icon || '🎮'
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Share link button */}
                        <button
                          onClick={(e) => handleShare(game, e)}
                          title="Copy Game Link"
                          className="flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white transition active:scale-95"
                        >
                          {copiedGameId === game.id ? (
                            <Check className="size-3.5 text-teal-400" />
                          ) : (
                            <Share2 className="size-3.5" />
                          )}
                        </button>

                        {/* Delete button (Owner or Admin) */}
                        {canDeleteGame(game) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteError(null);
                              setGameToDelete(game);
                            }}
                            title={
                              isAdmin && game.authorId !== session?.user?.id
                                ? 'Delete Game (Admin Privileges)'
                                : 'Delete Your Game'
                            }
                            className="flex size-8 items-center justify-center rounded-full border border-rose-500/15 bg-rose-500/6 text-rose-400 hover:bg-rose-500 hover:text-white transition active:scale-95"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}

                        {/* Play Count Badge */}
                        <div className="flex items-center gap-1.5 rounded-full border border-teal-400/15 bg-teal-400/6 px-2.5 py-1 text-[11px] font-bold text-teal-300">
                          <GiGameConsole className="size-3.5 text-teal-400" />
                          <span>{game.playCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-black text-white tracking-tight group-hover:text-teal-300 transition-colors line-clamp-1">
                      {game.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  {/* Card Bottom: Creator + Play CTA */}
                  <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat?.(game.authorId || game.authorUsername);
                      }}
                      title={`Message @${game.authorUsername}`}
                      className="flex items-center gap-2 min-w-0 group/creator text-left hover:opacity-90 transition"
                    >
                      <span className="text-base shrink-0">{game.authorAvatar || '👾'}</span>
                      <div className="truncate">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1">
                          <span>Creator</span>
                          <span className="text-teal-400 opacity-0 group-hover/creator:opacity-100 transition-opacity text-[9px]">💬</span>
                        </div>
                        <div className="text-xs font-bold text-slate-200 group-hover/creator:text-teal-300 transition-colors truncate">
                          {game.authorUsername}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveGame(game);
                      }}
                      className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-4 py-2 text-xs font-black text-slate-950 shadow-md shadow-teal-500/15 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition active:scale-95 shrink-0"
                    >
                      <Play className="size-3.5 fill-current" />
                      <span>PLAY</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* COMPACT LIST VIEW */
            <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-[#1c2028] overflow-hidden shadow-[6px_6px_16px_rgba(0,0,0,0.4)]">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setActiveGame(game)}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-white/[0.03] transition cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-white/[0.04] text-2xl shrink-0 overflow-hidden">
                      {game.thumbnailUrl ? (
                        <img src={game.thumbnailUrl} alt={game.title} className="size-full object-cover rounded-xl" />
                      ) : (
                        game.icon || '🎮'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white hover:text-teal-300 truncate">
                          {game.title}
                        </h4>
                        <span className="text-[10px] text-teal-300 bg-teal-400/6 px-2 py-0.5 rounded-full border border-teal-400/15 font-bold">
                          {game.playCount} {game.playCount === 1 ? 'play' : 'plays'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
                        {game.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat?.(game.authorId || game.authorUsername);
                      }}
                      title={`Message @${game.authorUsername}`}
                      className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-300 transition"
                    >
                      <span>{game.authorAvatar}</span>
                      <span className="font-semibold text-slate-200 hover:text-teal-300">{game.authorUsername}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveGame(game);
                      }}
                      className="flex items-center gap-1 rounded-full bg-teal-400/10 border border-teal-400/20 px-3.5 py-1.5 text-xs font-black text-teal-300 hover:bg-teal-400 hover:text-slate-950 transition"
                    >
                      <Play className="size-3 fill-current" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === TAB 2: HIGH SCORE LEADERBOARDS === */}
      {activeNavTab === 'leaderboards' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Leaderboard Header */}
          <div className="rounded-2xl border border-teal-400/15 bg-gradient-to-r from-teal-500/8 via-[#1c2028] to-teal-400/5 p-4 sm:p-8 shadow-[6px_6px_16px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-teal-400/20 bg-teal-400/8 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase text-teal-300 mb-2">
                  <GiTrophyCup className="size-3.5 sm:size-4 text-teal-400" />
                  <span>COMMUNITY ARCADE LEADERBOARD</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white">
                  Hall of Champions 👑
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                  Compete for the highest scores across community games. Can you beat the top score records?
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (games[0]) setActiveGame(games[0]);
                  }}
                  className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-teal-500/15 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition"
                >
                  <Play className="size-3.5 fill-current" />
                  <span>Play Featured Champion Game</span>
                </button>
              </div>
            </div>
          </div>

          {/* Top 3 Podium */}
          {leaderboardsData.length >= 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {/* Rank #2 Silver */}
              <div className="order-2 md:order-1 rounded-2xl border border-slate-400/15 bg-[#1c2028] p-5 text-center relative flex flex-col justify-between shadow-[6px_6px_16px_rgba(0,0,0,0.4)]">
                <div className="absolute top-3 left-3 size-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center">
                  #2
                </div>
                <div className="pt-2">
                  <div className="text-4xl mb-2">{leaderboardsData[1]?.avatar || '👾'}</div>
                  <h4 className="text-base font-black text-white">{leaderboardsData[1]?.champion}</h4>
                  <div className="text-xs text-slate-400 mt-0.5">{leaderboardsData[1]?.game.title}</div>
                  <div className="mt-3 text-2xl font-black text-slate-200">
                    {leaderboardsData[1]?.topScore.toLocaleString()} pts
                  </div>
                </div>
                <button
                  onClick={() => setActiveGame(leaderboardsData[1].game)}
                  className="mt-4 w-full py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-white transition"
                >
                  Challenge Score
                </button>
              </div>

              {/* Rank #1 Gold */}
              <div className="order-1 md:order-2 rounded-2xl border-2 border-teal-400/40 bg-gradient-to-b from-[#22272f] to-[#1c2028] p-6 text-center relative -translate-y-2 shadow-xl shadow-teal-500/8 flex flex-col justify-between">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-3 py-0.5 text-[10px] font-black uppercase text-slate-950">
                  <GiTrophyCup className="size-3.5 text-slate-950" />
                  <span>Grand Champion</span>
                </div>
                <div className="pt-4">
                  <div className="text-5xl mb-2">{leaderboardsData[0]?.avatar || '👑'}</div>
                  <h4 className="text-lg font-black text-teal-300">{leaderboardsData[0]?.champion}</h4>
                  <div className="text-xs text-slate-300 mt-0.5">{leaderboardsData[0]?.game.title}</div>
                  <div className="mt-3 text-3xl font-black text-white">
                    {leaderboardsData[0]?.topScore.toLocaleString()} pts
                  </div>
                </div>
                <button
                  onClick={() => setActiveGame(leaderboardsData[0].game)}
                  className="mt-4 w-full py-2.5 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 text-xs font-black text-slate-950 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] shadow-md shadow-teal-400/15 transition"
                >
                  Play Champion Game
                </button>
              </div>

              {/* Rank #3 Bronze */}
              <div className="order-3 rounded-2xl border border-amber-700/20 bg-[#1c2028] p-5 text-center relative flex flex-col justify-between shadow-[6px_6px_16px_rgba(0,0,0,0.4)]">
                <div className="absolute top-3 left-3 size-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center">
                  #3
                </div>
                <div className="pt-2">
                  <div className="text-4xl mb-2">{leaderboardsData[2]?.avatar || '🚀'}</div>
                  <h4 className="text-base font-black text-white">{leaderboardsData[2]?.champion || 'CadetLeo'}</h4>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {leaderboardsData[2]?.game.title || 'Space Runner'}
                  </div>
                  <div className="mt-3 text-2xl font-black text-amber-600">
                    {(leaderboardsData[2]?.topScore || 950).toLocaleString()} pts
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (leaderboardsData[2]) setActiveGame(leaderboardsData[2].game);
                  }}
                  className="mt-4 w-full py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-white transition"
                >
                  Challenge Score
                </button>
              </div>
            </div>
          )}

          {/* Full High Score Ranking Table */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#1c2028] overflow-hidden shadow-[6px_6px_16px_rgba(0,0,0,0.4)]">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Full Arcade Standings
              </h3>
              <span className="text-xs text-slate-400">Real-time leaderboard</span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {leaderboardsData.map((row, index) => (
                <div
                  key={row.game.id}
                  className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-white/[0.02] transition gap-2 sm:gap-4"
                >
                  <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                    <span className="w-5 sm:w-6 text-center text-xs font-black text-slate-400 shrink-0">
                      #{index + 1}
                    </span>
                    <div className="text-xl sm:text-2xl shrink-0">{row.avatar}</div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{row.champion}</span>
                        {index === 0 && (
                          <span className="rounded bg-teal-400/12 text-teal-300 text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 shrink-0">
                            RECORD
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
                        Played in <span className="text-teal-400 font-semibold">{row.game.title}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-black text-teal-300">
                        {row.topScore.toLocaleString()} PTS
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold">
                        High Score
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveGame(row.game)}
                      className="hidden sm:flex items-center gap-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs font-bold text-slate-200 transition"
                    >
                      <Play className="size-3 fill-current" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === TAB 3: COMMUNITY LOUNGE & CHAT THREADS === */}
      {activeNavTab === 'community' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Community Lounge Banner */}
          <div className="rounded-2xl border border-teal-400/15 bg-gradient-to-r from-teal-500/8 via-[#1c2028] to-teal-400/5 p-4 sm:p-8 shadow-[6px_6px_16px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-teal-400/20 bg-teal-400/8 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase text-teal-300 mb-2">
                  <IoChatbubbles className="size-3.5 sm:size-4 text-teal-400" />
                  <span>COMMUNITY DISCUSSIONS & CHAT</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white">
                  Arcade Lounge & Chat Threads
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                  Connect with fellow game creators, share strategies, submit game requests, and join high score bounties!
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full sm:w-auto">
                <button
                  onClick={() => onOpenChat?.()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 hover:bg-teal-400/20 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-black text-teal-300 transition shadow-[0_0_15px_rgba(45,212,191,0.15)] active:scale-95"
                >
                  <IoChatbubbles className="size-3.5 text-teal-400" />
                  <span>Private Player Chat</span>
                </button>
                <button
                  onClick={() => {
                    if (!session?.user) setIsAuthOpen(true);
                    else setIsPostingThread(!isPostingThread);
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-black text-slate-950 shadow-md shadow-teal-500/15 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition active:scale-95"
                >
                  <Plus className="size-3.5" />
                  <span>Start New Discussion</span>
                </button>
              </div>
            </div>
          </div>

          {/* New Discussion Composer */}
          {isPostingThread && (
            <form
              onSubmit={handlePostThread}
              className="rounded-2xl border border-teal-400/20 bg-[#1c2028] p-4 sm:p-5 space-y-4 animate-in fade-in duration-150 shadow-[6px_6px_16px_rgba(0,0,0,0.4)]"
            >
              <h3 className="text-sm font-black text-white">Create a Community Discussion Thread</h3>
              <div>
                <input
                  type="text"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="What's on your mind? (e.g. Can someone make a retro platformer?)"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#151920] px-4 py-2.5 text-base sm:text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Category:</span>
                  <select
                    value={newThreadTag}
                    onChange={(e) => setNewThreadTag(e.target.value)}
                    className="rounded-lg bg-[#151920] border border-white/[0.08] px-2 py-1 text-xs text-white"
                  >
                    <option value="Game Ideas">Game Ideas</option>
                    <option value="Bounty">Bounty</option>
                    <option value="Dev Tips">Dev Tips</option>
                    <option value="Feedback">Feedback</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPostingThread(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-full bg-teal-400 px-4 py-1.5 text-xs font-bold text-slate-950 hover:shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                  >
                    <Send className="size-3" />
                    <span>Post Thread</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Thread List */}
          <div className="space-y-3">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className="rounded-2xl border border-white/[0.06] bg-[#1c2028] p-5 hover:border-teal-400/25 hover:bg-[#22272f] transition-all group shadow-[6px_6px_16px_rgba(0,0,0,0.4),-3px_-3px_10px_rgba(255,255,255,0.01)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.04] text-xl shrink-0">
                      {thread.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {thread.pinned && (
                          <span className="rounded bg-amber-400/12 text-amber-300 text-[9px] font-black uppercase px-1.5 py-0.5 border border-amber-400/20">
                            PINNED
                          </span>
                        )}
                        <span className="rounded bg-teal-400/8 text-teal-300 text-[10px] font-bold px-2 py-0.5 border border-teal-400/15">
                          {thread.tag}
                        </span>
                        <span className="text-xs text-slate-400">
                          by{' '}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenChat?.(thread.author);
                            }}
                            title={`Message @${thread.author}`}
                            className="font-bold text-slate-200 hover:text-teal-300 transition underline-offset-2 hover:underline"
                          >
                            @{thread.author}
                          </button>{' '}
                          • {thread.timeAgo}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-white mt-1 group-hover:text-teal-300 transition-colors">
                        {thread.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => {
                        setThreads((prev) =>
                          prev.map((t) =>
                            t.id === thread.id ? { ...t, likes: t.likes + 1 } : t
                          )
                        );
                      }}
                      className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300 hover:text-teal-300 hover:bg-teal-500/8 transition"
                    >
                      <ThumbsUp className="size-3" />
                      <span>{thread.likes}</span>
                    </button>

                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <IoChatbubbles className="size-3.5" />
                      <span>{thread.replies}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Player Modal */}
      {activeGame && (
        <GamePlayerModal
          game={activeGame}
          onClose={() => setActiveGame(null)}
          onPlayRecorded={handlePlayRecorded}
          canDelete={canDeleteGame(activeGame)}
          onDeleteRequest={(game) => {
            setDeleteError(null);
            setGameToDelete(game);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {gameToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-rose-500/20 bg-[#1c2028] p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500/8 border border-rose-500/15">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Delete Game</h3>
                <p className="text-xs text-rose-300/80">Permanent removal confirmation</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">&quot;{gameToDelete.title}&quot;</span>? This will permanently remove the game from the community arcade.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/8 p-3 text-xs text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  if (!isDeleting) {
                    setGameToDelete(null);
                    setDeleteError(null);
                  }
                }}
                disabled={isDeleting}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteGame}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Yes, Delete Game</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Creator Studio Modal */}
      <GameUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onGameUploaded={handleGameUploaded}
        currentUser={
          session?.user as { id: string; name?: string; username?: string; image?: string | null } | undefined
        }
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          setIsUploaderOpen(true);
        }}
        initialMode="signup"
      />
    </div>
  );
}
