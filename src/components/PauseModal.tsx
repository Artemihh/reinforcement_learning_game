/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Keyboard, RefreshCw } from 'lucide-react';
import { GameMode } from '../types/game';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestartPhase: () => void;
  onRestartLevel: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  gameMode: GameMode;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestartPhase,
  onRestartLevel,
  isMuted,
  onToggleMute,
  gameMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none font-sans text-slate-100">
      <div className="relative w-full max-w-md bg-[#0d1322] border-2 border-stone-700/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-xl font-bold tracking-wide text-white mb-1">Timeline Suspended</h2>
        <p className="text-xs text-slate-400 font-mono mb-6">
          MODE: {gameMode === 'SOLO' ? 'Solo Explorer (Tab to swap)' : '2-Player Synchronized Co-Op'}
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 mb-6">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Resume Exploration</span>
          </button>

          <button
            onClick={onRestartPhase}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/40 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>Restart Current Phase</span>
          </button>

          <button
            onClick={onRestartLevel}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Entire Mission</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Unmute Sound' : 'Mute Sound'}</span>
          </button>
        </div>

        {/* Quick Controls Card */}
        <div className="w-full bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 text-left text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-1.5 text-slate-400 mb-2 font-sans font-semibold">
            <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Controls Guide</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-400">
            <div><span className="text-amber-400 font-bold">Past (Aiden):</span> WASD Move/Climb · E Interact · Q Whistle</div>
            <div><span className="text-emerald-400 font-bold">Future (Nova):</span> Arrows Move/Climb · Enter Interact · . Whistle</div>
            <div><span className="text-cyan-400 font-bold">AI Brain Inspector:</span> Press B</div>
            <div><span className="text-yellow-400 font-bold">Mission Guide:</span> Press H</div>
            {gameMode === 'SOLO' && <div><span className="text-teal-400 font-bold">Swap Character:</span> Press Tab</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
