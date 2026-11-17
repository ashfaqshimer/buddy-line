'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Play,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Link2,
  Check,
  LayoutGrid,
  List,
  X,
  Flame,
  FileCode2,
  Gamepad2,
  ShieldCheck,
} from 'lucide-react';
import { GameRecord } from '@/lib/games-db';
import { getCoverTone } from '@/lib/game-colors';
import { UserAvatar } from './user-avatar';
import { GameCover } from './game-cover';
import { getGames, deleteGameAction } from '@/app/game-actions';
import { GamePlayerModal } from './game-player-modal';
import { GameUploaderModal } from './game-uploader-modal';
import { AuthModal } from './auth-modal';
import { useAuth } from '@/components/auth-provider';

export type ArcadeFilterType = 'all' | 'popular' | 'newest' | 'my-games';

interface ArcadeViewProps {
  filter?: ArcadeFilterType;
  onFilterChange?: (filter: ArcadeFilterType) => void;
  isUploaderOpen?: boolean;
  setIsUploaderOpen?: (open: boolean) => void;
  onGamesLoaded?: (count: number) => void;
  onOpenChat?: (targetPlayerIdOrUsername?: string) => void;
}

const playsLabel = (count: number) => `${count.toLocaleString()} ${count === 1 ? 'play' : 'plays'}`;

export function ArcadeView({
  filter = 'all',
  onFilterChange,
  isUploaderOpen: externalIsUploaderOpen,
  setIsUploaderOpen: externalSetIsUploaderOpen,
  onGamesLoaded,
  onOpenChat,
}: ArcadeViewProps) {
  const { session, isPending, isAdmin: authIsAdmin } = useAuth();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalFilter, setInternalFilter] = useState<ArcadeFilterType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedGameId, setCopiedGameId] = useState<string | null>(null);

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
        // Shared links look like /#<gameId>: open that game straight away.
        const sharedId = decodeURIComponent(window.location.hash.slice(1));
        const shared = sharedId ? fetched.find((g) => g.id === sharedId) : undefined;
        if (shared) setActiveGame(shared);
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
      const url = window.location.href.split('#')[0];
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
  const displayName =
    (session?.user as { username?: string; name?: string } | undefined)?.username || session?.user?.name;

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

  const filterTabs: { id: ArcadeFilterType; label: string }[] = [
    { id: 'all', label: 'All games' },
    { id: 'popular', label: 'Most played' },
    { id: 'newest', label: 'Newest' },
    { id: 'my-games', label: 'My uploads' },
  ];

  const stats = [
    { value: games.length, label: games.length === 1 ? 'game' : 'games' },
    { value: totalPlays, label: totalPlays === 1 ? 'play' : 'plays' },
    { value: totalCreators, label: totalCreators === 1 ? 'creator' : 'creators' },
  ];

  const spotlightTone = spotlightGame ? getCoverTone(spotlightGame.id) : null;

  /** Small "made by" button that opens a chat with the game's creator. */
  const creatorButton = (game: GameRecord, avatarSize = 'size-6 text-xs') => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onOpenChat?.(game.authorId || game.authorUsername);
      }}
      title={`Message ${game.authorUsername}`}
      className="group/creator inline-flex min-w-0 items-center gap-2 rounded-full text-left transition"
    >
      <UserAvatar
        inline
        avatar={game.authorAvatar}
        name={game.authorUsername}
        className={`${avatarSize} rounded-full bg-surface-raised ring-1 ring-border`}
      />
      <span className="truncate text-[13px] font-medium text-muted-foreground transition group-hover/creator:text-social">
        {game.authorUsername}
      </span>
    </button>
  );

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. Intro */}
      <section className="anim-rise flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="eyebrow">
            {displayName ? `Welcome back, ${displayName}` : 'The community web arcade'}
          </p>
          <h1 className="font-display mt-3 text-balance text-[32px] font-extrabold leading-[1.08] text-foreground sm:text-5xl lg:text-[56px]">
            Play games made by <span className="text-gradient">your buddies</span>.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Browser games built with HTML, CSS and JavaScript by people in the community. Nothing to install.
            Made one yourself? Upload it and anyone can play.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => document.getElementById('arcade-main-content')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn btn-primary btn-lg"
            >
              <Gamepad2 className="size-[18px]" />
              <span>Browse games</span>
            </button>
            <button onClick={handleUploadClick} className="btn btn-secondary btn-lg">
              <Plus className="size-[18px]" />
              <span>Upload yours</span>
            </button>
          </div>
        </div>

        <dl className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
          {stats.map((s) => (
            <div key={s.label} className="card min-w-[92px] px-4 py-3 sm:min-w-[112px] sm:px-5 sm:py-4">
              <dd className="font-display text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                {loading ? '–' : s.value.toLocaleString()}
              </dd>
              <dt className="mt-0.5 text-xs font-medium text-muted-foreground">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* 2. Featured: most-played game */}
      {loading ? (
        <div className="h-[420px] animate-pulse rounded-[28px] border border-border bg-surface sm:h-[380px]" aria-label="Loading featured game" />
      ) : spotlightGame && spotlightTone ? (
        <section
          aria-label="Most played game"
          className="anim-rise relative overflow-hidden rounded-[28px] border border-border"
          style={{
            background: `radial-gradient(90% 140% at 100% 0%, ${spotlightTone.hi}66, transparent 60%), linear-gradient(135deg, ${spotlightTone.base} 0%, var(--surface) 70%)`,
          }}
        >
          <div className="grid items-center gap-6 p-3 sm:p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:p-8">
            <div className="order-2 min-w-0 px-2 pb-3 sm:px-2 lg:order-1 lg:pb-0">
              <span className="tag bg-white/10 text-foreground backdrop-blur">
                <Flame className="size-3.5 text-orange-300" />
                Most played
              </span>
              <h2 className="font-display mt-4 text-balance text-[28px] font-extrabold leading-[1.08] text-foreground sm:text-4xl lg:text-[44px]">
                {spotlightGame.title}
              </h2>
              {spotlightGame.description && (
                <p className="mt-3 line-clamp-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                  {spotlightGame.description}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                {creatorButton(spotlightGame, 'size-7 text-sm')}
                <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground tabular-nums">
                  <Play className="size-3 fill-current" />
                  {playsLabel(spotlightGame.playCount)}
                </span>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <button onClick={() => setActiveGame(spotlightGame)} className="btn btn-primary btn-lg">
                  <Play className="size-4 fill-current" />
                  <span>Play now</span>
                </button>
                <button
                  onClick={(e) => handleShare(spotlightGame, e)}
                  className="btn btn-secondary btn-lg"
                  aria-label={`Copy link to ${spotlightGame.title}`}
                >
                  {copiedGameId === spotlightGame.id ? <Check className="size-4 text-primary" /> : <Link2 className="size-4" />}
                  <span>{copiedGameId === spotlightGame.id ? 'Link copied' : 'Copy link'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveGame(spotlightGame)}
              aria-label={`Play ${spotlightGame.title}`}
              className="group order-1 block w-full rounded-2xl lg:order-2"
            >
              <GameCover
                game={spotlightGame}
                size="lg"
                className="rounded-2xl shadow-[0_30px_60px_-25px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-[1.015]"
              >
                <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition duration-200 group-hover:opacity-100">
                  <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_40px_rgba(56,189,248,0.6)]">
                    <Play className="ml-1 size-7 fill-current" />
                  </span>
                </span>
              </GameCover>
            </button>
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-border-strong px-6 py-16 text-center">
          <span className="text-4xl" aria-hidden>🕹️</span>
          <h2 className="font-display mt-4 text-xl font-bold text-foreground">The arcade is empty</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Upload the first game and it will be featured right here.</p>
          <button onClick={handleUploadClick} className="btn btn-brand mt-6">
            <Plus className="size-4" />
            <span>Upload a game</span>
          </button>
        </section>
      )}

      {/* 3. Catalog */}
      <section id="arcade-main-content" className="scroll-mt-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display flex items-baseline gap-2.5 text-2xl font-bold text-foreground">
            Arcade
            {!loading && <span className="font-sans text-sm font-medium text-subtle-foreground tabular-nums">{games.length}</span>}
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games or creators"
                aria-label="Search games or creators"
                className="field !rounded-full pl-10 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-subtle-foreground hover:bg-white/10 hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="segmented hidden shrink-0 sm:flex" role="group" aria-label="Layout">
              <button onClick={() => setViewMode('grid')} title="Grid view" aria-label="Grid view" aria-pressed={viewMode === 'grid'} className="!px-2.5">
                <LayoutGrid className="size-4" />
              </button>
              <button onClick={() => setViewMode('list')} title="List view" aria-label="List view" aria-pressed={viewMode === 'list'} className="!px-2.5">
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div role="tablist" aria-label="Filter games" className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeFilter === tab.id}
              onClick={() => {
                if (tab.id === 'my-games' && !session?.user) {
                  setIsAuthOpen(true);
                } else {
                  setFilter(tab.id);
                }
              }}
              className="chip"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading games">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-[20px] border border-border bg-surface p-2">
                  <div className="aspect-video w-full rounded-xl bg-surface-raised" />
                  <div className="space-y-2 px-2 pb-2 pt-3">
                    <div className="h-4 w-2/3 rounded-full bg-surface-raised" />
                    <div className="h-3 w-1/3 rounded-full bg-surface-raised" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeFilter === 'my-games' && isPending ? (
            <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Checking your session…</span>
            </div>
          ) : activeFilter === 'my-games' && !session?.user ? (
            <div className="rounded-[24px] border border-dashed border-border-strong px-6 py-16 text-center">
              <h3 className="font-display text-lg font-bold text-foreground">Sign in to see your uploads</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Games you upload are listed here so you can play, share or remove them.
              </p>
              <button onClick={() => setIsAuthOpen(true)} className="btn btn-secondary mt-6">
                Sign in
              </button>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border-strong px-6 py-16 text-center">
              <span className="text-3xl" aria-hidden>{searchQuery ? '🔍' : '🎮'}</span>
              <h3 className="font-display mt-3 text-lg font-bold text-foreground">No games found</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {searchQuery
                  ? `Nothing matches "${searchQuery}". Try another title or creator.`
                  : activeFilter === 'my-games'
                  ? "You haven't uploaded a game yet."
                  : 'No one has uploaded a game yet.'}
              </p>
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="btn btn-secondary mt-6">
                  Clear search
                </button>
              ) : (
                <button onClick={handleUploadClick} className="btn btn-brand mt-6">
                  <Plus className="size-4" />
                  <span>Upload a game</span>
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {filteredGames.map((game, index) => (
                <article
                  key={game.id}
                  className="game-card anim-rise group min-w-0"
                  style={{ '--glow': getCoverTone(game.id).glow, animationDelay: `${Math.min(index, 12) * 35}ms` } as React.CSSProperties}
                >
                  <div className="relative">
                    <button onClick={() => setActiveGame(game)} aria-label={`Play ${game.title}`} className="block w-full rounded-xl">
                      <GameCover game={game}>
                        <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition duration-200 group-hover:opacity-100">
                          <span className="flex size-12 scale-90 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(56,189,248,0.6)] transition duration-200 group-hover:scale-100">
                            <Play className="ml-0.5 size-5 fill-current" />
                          </span>
                        </span>
                      </GameCover>
                    </button>

                    {/* Cover actions: always visible on touch, on hover/focus otherwise */}
                    <div className="absolute right-2 top-2 flex gap-1.5 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                      <button
                        onClick={(e) => handleShare(game, e)}
                        title="Copy game link"
                        aria-label={`Copy link to ${game.title}`}
                        className="flex size-8 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-sm transition hover:bg-black/80 hover:text-white"
                      >
                        {copiedGameId === game.id ? <Check className="size-3.5 text-primary" /> : <Link2 className="size-3.5" />}
                      </button>
                      {canDeleteGame(game) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteError(null);
                            setGameToDelete(game);
                          }}
                          title={isAdmin && game.authorId !== session?.user?.id ? 'Delete game (admin)' : 'Delete your game'}
                          aria-label={`Delete ${game.title}`}
                          className="flex size-8 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-sm transition hover:bg-rose-600 hover:text-white"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="px-2 pb-1.5 pt-3">
                    <h3 className="truncate text-[15px] font-bold text-foreground">
                      <button onClick={() => setActiveGame(game)} className="max-w-full truncate text-left">
                        {game.title}
                      </button>
                    </h3>
                    {game.description && (
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{game.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-3">
                      {creatorButton(game)}
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-subtle-foreground tabular-nums" title={playsLabel(game.playCount)}>
                        <Play className="size-2.5 fill-current" />
                        {game.playCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-2 pr-3 transition hover:border-border-strong sm:gap-4"
                >
                  <button onClick={() => setActiveGame(game)} aria-label={`Play ${game.title}`} className="w-24 shrink-0 rounded-xl sm:w-32">
                    <GameCover game={game} size="sm" className="rounded-xl" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => setActiveGame(game)} className="block max-w-full truncate text-left text-sm font-bold text-foreground">
                      {game.title}
                    </button>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{game.description}</p>
                    <div className="mt-1.5 md:hidden">{creatorButton(game, 'size-5 text-[10px]')}</div>
                  </div>
                  <div className="hidden w-40 shrink-0 md:block">{creatorButton(game)}</div>
                  <span className="hidden w-24 shrink-0 text-right text-xs text-subtle-foreground tabular-nums sm:block">
                    {playsLabel(game.playCount)}
                  </span>
                  <button onClick={() => setActiveGame(game)} className="btn btn-primary btn-sm shrink-0" aria-label={`Play ${game.title}`}>
                    <Play className="size-3 fill-current" />
                    <span className="hidden sm:inline">Play</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Creator call-to-action */}
      <section
        className="relative overflow-hidden rounded-[28px] border border-border p-6 sm:p-10"
        style={{
          background:
            'radial-gradient(70% 120% at 0% 100%, rgba(56,189,248,0.16), transparent 60%), radial-gradient(70% 120% at 100% 0%, rgba(168,85,247,0.2), transparent 60%), var(--surface)',
        }}
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
          <div>
            <p className="eyebrow">For creators</p>
            <h2 className="font-display mt-3 text-balance text-2xl font-extrabold leading-tight text-foreground sm:text-[34px]">
              Made a game? Put it in the arcade.
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Upload your files, test-play them right in the uploader, and publish. Your buddies can play it straight away.
            </p>
            <button onClick={handleUploadClick} className="btn btn-brand btn-lg mt-6">
              <Plus className="size-[18px] stroke-[2.5]" />
              <span>Upload a game</span>
            </button>
          </div>

          <ul className="grid gap-3">
            {[
              {
                icon: FileCode2,
                title: 'Plain HTML, CSS and JavaScript',
                body: 'A single HTML file is enough. No build step and no server needed.',
                tint: 'text-sky-300 bg-sky-400/10',
              },
              {
                icon: Gamepad2,
                title: 'Playable on phones',
                body: 'Touch players get an on-screen gamepad that sends arrow keys, Space, Enter and Shift.',
                tint: 'text-violet-300 bg-violet-400/10',
              },
              {
                icon: ShieldCheck,
                title: 'Sandboxed for everyone',
                body: 'Every game runs in an isolated frame, away from players’ accounts.',
                tint: 'text-emerald-300 bg-emerald-400/10',
              },
            ].map(({ icon: Icon, title, body, tint }) => (
              <li key={title} className="flex gap-4 rounded-2xl border border-border bg-background/40 p-4">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{title}</h3>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

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
        <div className="scrim z-[60]">
          <div role="alertdialog" aria-labelledby="delete-game-title" className="panel max-w-md p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-400">
                <AlertTriangle className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 id="delete-game-title" className="font-display text-lg font-bold text-foreground">Delete this game?</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{gameToDelete.title}</span> will be removed from the arcade for everyone. This can&apos;t be undone.
                </p>
              </div>
            </div>

            {deleteError && <div className="alert alert-error mt-4">{deleteError}</div>}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  if (!isDeleting) {
                    setGameToDelete(null);
                    setDeleteError(null);
                  }
                }}
                disabled={isDeleting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={confirmDeleteGame} disabled={isDeleting} className="btn btn-danger">
                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                <span>{isDeleting ? 'Deleting…' : 'Delete game'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <GameUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onGameUploaded={handleGameUploaded}
        currentUser={
          session?.user as { id: string; name?: string; username?: string; image?: string | null } | undefined
        }
      />

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
