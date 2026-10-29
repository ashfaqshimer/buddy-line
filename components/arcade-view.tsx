'use client';

import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Sparkles,
  Search,
  Upload,
  Play,
  Trophy,
  Flame,
  Clock,
  Plus,
} from 'lucide-react';
import { GameRecord } from '@/lib/games-db';
import { getGames } from '@/app/game-actions';
import { GamePlayerModal } from './game-player-modal';
import { GameUploaderModal } from './game-uploader-modal';
import { AuthModal } from './auth-modal';
import { useSession } from '@/lib/auth-client';

export function ArcadeView() {
  const { data: session } = useSession();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'popular' | 'newest'>('all');

  // Modals
  const [activeGame, setActiveGame] = useState<GameRecord | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getGames().then((fetched) => {
      if (isMounted) {
        setGames(fetched);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGameUploaded = (newGame: GameRecord) => {
    setGames((prev) => [newGame, ...prev]);
    setActiveGame(newGame); // Immediately let the kid play their newly uploaded game!
  };

  const handlePlayRecorded = (gameId: string, newCount: number) => {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, playCount: newCount } : g))
    );
  };

  const handleUploadClick = () => {
    if (!session?.user) {
      setIsAuthOpen(true);
    } else {
      setIsUploaderOpen(true);
    }
  };

  // Filter & Search
  const filteredGames = games
    .filter((g) => {
      const matchSearch =
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.authorUsername.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    })
    .sort((a, b) => {
      if (filter === 'popular') return b.playCount - a.playCount;
      if (filter === 'newest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Arcade Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/60 via-[#0c1020] to-[#080b14] p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-10 -top-10 size-60 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-10 size-60 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300 mb-3">
              <Sparkles className="size-3.5" />
              <span>COMMUNITY ARCADE HUB</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Play & Build Games!
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Anyone can code an HTML game and share it with the world. Jump into the community creations or upload your own game in seconds!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleUploadClick}
              className="group flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25 hover:from-cyan-300 hover:to-blue-400 transition transform active:scale-95"
            >
              <Upload className="size-4.5 transition group-hover:-translate-y-0.5" />
              <span>Upload Your Game 🚀</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-6 pt-6 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
              <Gamepad2 className="size-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{games.length} Games</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Playable Now</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-400/10 text-purple-400">
              <Trophy className="size-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">
                {games.reduce((acc, g) => acc + (g.playCount || 0), 0)} Plays
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Community Runs</div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">HTML + CSS + JS</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Zero Setup Needed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games or creators..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/[0.04] p-1 border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setFilter('popular')}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              filter === 'popular'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="size-3" />
            <span>Most Played</span>
          </button>
          <button
            onClick={() => setFilter('newest')}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              filter === 'newest'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="size-3" />
            <span>Newest</span>
          </button>
        </div>
      </div>

      {/* Game Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin text-3xl mb-3">🛸</div>
          <div className="text-slate-400 text-sm font-medium">Loading Community Arcade...</div>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <div className="text-4xl mb-3">🕹️</div>
          <h3 className="text-lg font-bold text-white">No games found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No games match "${searchQuery}". Try a different keyword!`
              : 'Be the very first player to upload a cool game to Buddy Line!'}
          </p>
          <button
            onClick={handleUploadClick}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition"
          >
            <Plus className="size-3.5" />
            <span>Upload A Game</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0d111d] p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-cyan-500/10 hover:shadow-2xl overflow-hidden"
            >
              {/* Subtle top glow */}
              <div className="absolute -top-12 -right-12 size-24 rounded-full bg-cyan-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                {/* Card Top: Icon & Play Count */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/10 border border-cyan-400/30 text-3xl shadow-inner group-hover:scale-110 transition-transform">
                    {game.icon || '🎮'}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
                    <Gamepad2 className="size-3 text-cyan-400" />
                    <span>{game.playCount} plays</span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-black text-white tracking-tight group-hover:text-cyan-300 transition-colors line-clamp-1">
                  {game.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {game.description}
                </p>
              </div>

              {/* Card Footer: Creator info + Play Button */}
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{game.authorAvatar || '👾'}</span>
                  <div className="truncate">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Creator
                    </div>
                    <div className="text-xs font-bold text-slate-200 truncate">
                      {game.authorUsername}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveGame(game)}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-400/15 border border-cyan-400/30 px-3.5 py-2 text-xs font-black text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition active:scale-95 shrink-0"
                >
                  <Play className="size-3.5 fill-current" />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Game Player Modal */}
      {activeGame && (
        <GamePlayerModal
          game={activeGame}
          onClose={() => setActiveGame(null)}
          onPlayRecorded={handlePlayRecorded}
        />
      )}

      {/* Game Uploader Modal */}
      <GameUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onGameUploaded={handleGameUploaded}
        currentUser={session?.user as { id: string; name?: string; username?: string; image?: string | null } | undefined}
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
