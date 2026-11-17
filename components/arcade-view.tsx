'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Upload,
  Play,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Share2,
  Check,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import { GameRecord } from '@/lib/games-db';
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
    { id: 'all', label: 'All' },
    { id: 'popular', label: 'Popular' },
    { id: 'newest', label: 'Newest' },
    { id: 'my-games', label: 'My uploads' },
  ];

  const playsLabel = (count: number) => `${count} ${count === 1 ? 'play' : 'plays'}`;

  return (
    <div className="space-y-14 sm:space-y-20 animate-in fade-in duration-300">
      {/* 1. Hero: headline + most-played game */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-10 lg:gap-14 items-end pt-4 sm:pt-10">
        <div className="min-w-0">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle-foreground">
            Community web arcade
          </p>
          <h1 className="display-wide text-balance text-[40px] sm:text-[56px] lg:text-[64px] font-extrabold leading-[0.95] text-foreground">
            Code it. Play it. Share it.
          </h1>
          <p className="mt-5 max-w-[42ch] text-[15px] leading-relaxed text-muted-foreground">
            Upload a game written in HTML, CSS and JavaScript. Anyone can play it in the browser, with nothing to install.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={handleUploadClick}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-teal-300 active:scale-[0.98]"
            >
              <Upload className="size-4" />
              <span>Upload a game</span>
            </button>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-5 font-mono text-xs text-muted-foreground tabular-nums">
            <div className="flex items-baseline gap-2">
              <dd className="text-base font-medium text-foreground">{games.length}</dd>
              <dt>{games.length === 1 ? 'game' : 'games'}</dt>
            </div>
            <div className="flex items-baseline gap-2">
              <dd className="text-base font-medium text-foreground">{totalPlays}</dd>
              <dt>{totalPlays === 1 ? 'play' : 'plays'}</dt>
            </div>
            <div className="flex items-baseline gap-2">
              <dd className="text-base font-medium text-foreground">{totalCreators}</dd>
              <dt>{totalCreators === 1 ? 'creator' : 'creators'}</dt>
            </div>
          </dl>
        </div>

        {spotlightGame ? (
          <div className="min-w-0 space-y-4">
            <button
              onClick={() => setActiveGame(spotlightGame)}
              aria-label={`Play ${spotlightGame.title}`}
              className="group block w-full rounded-lg text-left"
            >
              <GameCover
                game={spotlightGame}
                label="Most played"
                size="lg"
                className="transition-transform duration-200 group-hover:-translate-y-0.5"
              />
            </button>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-foreground">{spotlightGame.title}</h2>
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                  {spotlightGame.authorUsername} · {playsLabel(spotlightGame.playCount)}
                </p>
              </div>
              <button
                onClick={() => setActiveGame(spotlightGame)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-teal-300 active:scale-[0.98]"
              >
                <Play className="size-3.5 fill-current" />
                <span>Play</span>
              </button>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-dashed border-border-strong p-6 text-center">
              <p className="text-sm font-medium text-foreground">No games yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Upload the first one and it will show up here.</p>
            </div>
          )
        )}
      </section>

      {/* 2. Catalog */}
      <section id="arcade-main-content" className="scroll-mt-24 space-y-8">
        <div className="flex flex-col-reverse gap-3 border-b border-border sm:flex-row sm:items-end sm:justify-between">
          <div role="tablist" aria-label="Filter games" className="-mb-px flex gap-6 overflow-x-auto no-scrollbar">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    if (tab.id === 'my-games' && !session?.user) {
                      setIsAuthOpen(true);
                    } else {
                      setFilter(tab.id);
                    }
                  }}
                  className={`flex items-baseline gap-1.5 whitespace-nowrap border-b-2 py-3 text-sm transition ${
                    isActive
                      ? 'border-foreground font-medium text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'all' && (
                    <span className="font-mono text-[11px] text-subtle-foreground tabular-nums">{games.length}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pb-2.5 sm:pt-0">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games or creators"
                aria-label="Search games or creators"
                className="h-10 sm:h-9 w-full rounded-lg border border-border bg-surface-sunken pl-9 pr-8 text-base sm:text-sm text-foreground placeholder:text-subtle-foreground transition focus:border-border-strong focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-subtle-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center rounded-lg border border-border p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={`flex size-8 items-center justify-center rounded-md transition ${
                  viewMode === 'grid' ? 'bg-white/[0.08] text-foreground' : 'text-subtle-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="List view"
                aria-pressed={viewMode === 'list'}
                className={`flex size-8 items-center justify-center rounded-md transition ${
                  viewMode === 'list' ? 'bg-white/[0.08] text-foreground' : 'text-subtle-foreground hover:text-foreground'
                }`}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading games">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-video w-full rounded-lg bg-surface" />
                <div className="h-4 w-2/3 rounded bg-surface" />
                <div className="h-3 w-1/3 rounded bg-surface" />
              </div>
            ))}
          </div>
        ) : activeFilter === 'my-games' && isPending ? (
          <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>Checking your session…</span>
          </div>
        ) : activeFilter === 'my-games' && !session?.user ? (
          <div className="rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
            <h3 className="text-base font-semibold text-foreground">Sign in to see your uploads</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Games you upload are listed here so you can play, share or remove them.
            </p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/[0.05]"
            >
              Sign in
            </button>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
            <h3 className="text-base font-semibold text-foreground">No games found</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {searchQuery
                ? `Nothing matches "${searchQuery}". Try another title or creator.`
                : activeFilter === 'my-games'
                ? "You haven't uploaded a game yet."
                : 'No one has uploaded a game yet.'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleUploadClick}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-teal-300"
              >
                <Plus className="size-4" />
                <span>Upload a game</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGames.map((game) => (
              <article key={game.id} className="group min-w-0">
                <div className="relative">
                  <button
                    onClick={() => setActiveGame(game)}
                    aria-label={`Play ${game.title}`}
                    className="block w-full rounded-lg"
                  >
                    <GameCover game={game} className="transition-transform duration-200 group-hover:-translate-y-0.5">
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition duration-200 group-hover:opacity-100">
                        <span className="flex size-12 scale-90 items-center justify-center rounded-full bg-primary text-primary-foreground transition duration-200 group-hover:scale-100">
                          <Play className="ml-0.5 size-5 fill-current" />
                        </span>
                      </span>
                    </GameCover>
                  </button>

                  {/* Cover actions: always visible on touch, on hover/focus otherwise */}
                  <div className="absolute right-2.5 top-2.5 flex gap-1.5 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                    <button
                      onClick={(e) => handleShare(game, e)}
                      title="Copy game link"
                      aria-label={`Copy link to ${game.title}`}
                      className="flex size-8 items-center justify-center rounded-md bg-black/60 text-white/85 backdrop-blur-sm transition hover:bg-black/80 hover:text-white"
                    >
                      {copiedGameId === game.id ? <Check className="size-3.5 text-teal-300" /> : <Share2 className="size-3.5" />}
                    </button>
                    {canDeleteGame(game) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteError(null);
                          setGameToDelete(game);
                        }}
                        title={
                          isAdmin && game.authorId !== session?.user?.id
                            ? 'Delete game (admin)'
                            : 'Delete your game'
                        }
                        aria-label={`Delete ${game.title}`}
                        className="flex size-8 items-center justify-center rounded-md bg-black/60 text-white/85 backdrop-blur-sm transition hover:bg-rose-600 hover:text-white"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 min-w-0">
                  <h3 className="truncate text-[15px] font-semibold text-foreground">
                    <button onClick={() => setActiveGame(game)} className="text-left underline-offset-4 hover:underline">
                      {game.title}
                    </button>
                  </h3>
                  <p className="mt-1 flex min-w-0 items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <button
                      onClick={() => onOpenChat?.(game.authorId || game.authorUsername)}
                      title={`Message @${game.authorUsername}`}
                      className="inline-flex min-w-0 items-center gap-1.5 transition hover:text-foreground"
                    >
                      <UserAvatar inline avatar={game.authorAvatar} name={game.authorUsername} className="size-4 rounded-full text-[10px]" />
                      <span className="truncate">{game.authorUsername}</span>
                    </button>
                    <span aria-hidden className="text-subtle-foreground">·</span>
                    <span className="shrink-0 tabular-nums">{playsLabel(game.playCount)}</span>
                  </p>
                  {game.description && (
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{game.description}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="divide-y divide-border border-y border-border">
            {filteredGames.map((game) => (
              <div key={game.id} className="group flex items-center gap-4 py-3">
                <button
                  onClick={() => setActiveGame(game)}
                  aria-label={`Play ${game.title}`}
                  className="w-24 shrink-0 rounded-md sm:w-28"
                >
                  <GameCover game={game} size="sm" className="rounded-md" />
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => setActiveGame(game)}
                    className="block max-w-full truncate text-left text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                  >
                    {game.title}
                  </button>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{game.description}</p>
                </div>
                <button
                  onClick={() => onOpenChat?.(game.authorId || game.authorUsername)}
                  title={`Message @${game.authorUsername}`}
                  className="hidden w-36 shrink-0 items-center gap-1.5 truncate font-mono text-xs text-muted-foreground transition hover:text-foreground md:flex"
                >
                  <UserAvatar inline avatar={game.authorAvatar} name={game.authorUsername} className="size-4 rounded-full text-[10px]" />
                  <span className="truncate">{game.authorUsername}</span>
                </button>
                <span className="hidden w-20 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums sm:block">
                  {playsLabel(game.playCount)}
                </span>
                <button
                  onClick={() => setActiveGame(game)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Play className="size-3 fill-current" />
                  <span>Play</span>
                </button>
              </div>
            ))}
          </div>
        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div role="alertdialog" aria-labelledby="delete-game-title" className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl shadow-black/50">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                <AlertTriangle className="size-4" />
              </div>
              <div className="min-w-0">
                <h3 id="delete-game-title" className="text-base font-semibold text-foreground">Delete this game?</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">{gameToDelete.title}</span> will be removed from the arcade for everyone. This can&apos;t be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  if (!isDeleting) {
                    setGameToDelete(null);
                    setDeleteError(null);
                  }
                }}
                disabled={isDeleting}
                className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/[0.05] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteGame}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Delete game</span>
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
