/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode } from '../types/game';
import { Users, User, Volume2, VolumeX, Radio, ShieldAlert } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (mode: GameMode) => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  gameMode,
  setGameMode,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-8 bg-[#06070a] select-none overflow-hidden font-sans text-slate-100">
      {/* Background Graphic-Novel Dieselpunk Art from User Reference Asset */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/assets/aistudio/image_ebff4bd0.png"
          alt="Dieselpunk Bunker Art"
          className="w-full h-full object-cover opacity-35 filter contrast-125 brightness-90"
          referrerPolicy="no-referrer"
        />
        {/* Dark Vignette & Split-Lighting Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-[#06070a]/70 to-[#06070a]/90" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-amber-950/40 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-emerald-950/40 to-transparent pointer-events-none" />
        {/* Comic Halftone Dot Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />
      </div>

      {/* Top Header bar */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span className="font-mono text-amber-400 font-bold tracking-wider uppercase">
            CHRONAL BREACH PROTOCOL · SECTOR 62 / 24
          </span>
        </div>
        <button
          onClick={onToggleMute}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/90 border border-stone-700 hover:border-amber-500/50 text-slate-300 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isMuted ? 'Audio Muted' : 'Sound Synthesizer Active'}</span>
        </button>
      </div>

      {/* Centerpiece Hero Title Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl my-auto">
        {/* Comic-Book Inked Bespoke SVG Lockup */}
        <div className="w-full max-w-lg mb-2">
          <svg viewBox="0 0 520 90" className="w-full h-auto drop-shadow-[0_8px_30px_rgba(34,197,94,0.3)]">
            <defs>
              <linearGradient id="dieselGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="45%" stopColor="#fbbf24" />
                <stop offset="55%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            {/* Ink Drop Shadow */}
            <text
              x="262"
              y="58"
              textAnchor="middle"
              fill="#06070a"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              fontWeight="900"
              fontSize="52"
              letterSpacing="0.08em"
            >
              CHRONOSHIFT
            </text>
            {/* Gradient Foreground Title */}
            <text
              x="260"
              y="56"
              textAnchor="middle"
              fill="url(#dieselGrad)"
              stroke="#06070a"
              strokeWidth="2.5"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              fontWeight="900"
              fontSize="52"
              letterSpacing="0.08em"
            >
              CHRONOSHIFT
            </text>
            <text
              x="260"
              y="82"
              textAnchor="middle"
              fill="#e2e8f0"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="700"
              fontSize="12"
              letterSpacing="0.28em"
            >
              SUBTERRANEAN TEMPORAL LABYRINTH
            </text>
          </svg>
        </div>

        <p className="text-sm text-stone-300 font-normal leading-relaxed max-w-lg mb-7">
          Two eras connected by a temporal breach. Manipulate the 1962 research bunker in the Past to alter the irradiated mutagenic ruins of the Future—guided by an adaptive bio-mechanical Goliath sentinel.
        </p>

        {/* Tactical Mode Selector */}
        <div className="flex items-center gap-3 p-1.5 bg-stone-900/90 border-2 border-stone-800 rounded-xl mb-6 shadow-2xl">
          <button
            onClick={() => setGameMode('SOLO')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              gameMode === 'SOLO'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 border border-amber-400 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Solo Operative (Tab to swap)</span>
          </button>
          <button
            onClick={() => setGameMode('COOP')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              gameMode === 'COOP'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-stone-950 border border-emerald-400 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2-Player Synchronized Co-Op</span>
          </button>
        </div>

        {/* Start Game CTA */}
        <button
          onClick={() => onStartGame(gameMode)}
          className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-stone-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 hover:brightness-110 active:scale-98 transition-all border-2 border-stone-950 shadow-[0_0_28px_rgba(34,197,94,0.35)] cursor-pointer"
        >
          <Radio className="w-4 h-4 text-stone-950 animate-pulse" />
          <span>Enter Chronal Breach</span>
          <span className="text-[10px] font-mono opacity-80 pl-1 font-bold">↵ ENTER</span>
        </button>
      </div>

      {/* Comic Ink Bottom Control Hints Strip */}
      <div className="relative z-10 w-full max-w-3xl flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-stone-400 border-t border-stone-800/90 pt-4">
        <span><strong className="text-amber-400">Past Operative:</strong> WASD Move · E Action · Q Whistle</span>
        <span className="text-stone-600">·</span>
        <span><strong className="text-emerald-400">Future Scavenger:</strong> Arrows Move · Enter Action · . Whistle</span>
        <span className="text-stone-600">·</span>
        <span><strong className="text-cyan-400">AI Goliath Brain:</strong> B Key · Esc Pause</span>
      </div>
    </div>
  );
};
