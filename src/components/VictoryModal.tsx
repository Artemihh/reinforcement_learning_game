/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';
import { PuzzleState, RLAgent } from '../types/game';

interface VictoryModalProps {
  isOpen: boolean;
  onRestart: () => void;
  timeElapsed: number;
  aiAgent: RLAgent;
  puzzle: PuzzleState;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onRestart,
  timeElapsed,
  aiAgent,
  puzzle,
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(timeElapsed / 60);
  const seconds = Math.floor(timeElapsed % 60);
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const defaultLogs = [
    {
      past: 'Chrono-Spore planted & irrigated in 1962',
      future: 'Colossal Bio-Tendril Tree grown in 2024',
    },
    {
      past: 'Aqueduct sluice valve opened in 1962',
      future: 'Canal dried out & Chrono-Battery retrieved in 2024',
    },
    {
      past: 'Master keycard sealed in Time Capsule in 1962',
      future: 'Preserved key retrieved & Laser Grid disabled in 2024',
    },
    {
      past: 'Battery installed in Chrono-Vault Core',
      future: 'Reactor energized and temporal wormhole stabilized',
    },
    {
      past: 'Dual Resonance Plates held by Aiden & Nova',
      future: 'Goliath AI held Auxiliary Switch & unlocked Chrono-Gate',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none font-sans text-slate-100">
      <div className="relative w-full max-w-lg bg-[#0c1322] border-2 border-emerald-500/70 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Victory Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 mb-3 shadow-[0_0_24px_rgba(52,211,153,0.5)]">
          <Sparkles className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-wide mb-1">
          CHRONO-GATE HARMONIZED
        </h2>
        <p className="text-xs text-slate-400 font-mono mb-5">
          Temporal breach stabilized! Sector 1962 and Sector 2024 successfully synchronized.
        </p>

        {/* Stats Strip */}
        <div className="w-full grid grid-cols-2 gap-3 mb-5 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-slate-400 mb-0.5">Mission Duration</div>
            <div className="text-lg font-bold text-white tabular-nums">{formattedTime}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-slate-400 mb-0.5">Goliath AI Total Reward</div>
            <div className="text-lg font-bold text-emerald-400 tabular-nums">
              +{aiAgent.totalReward} Pts
            </div>
          </div>
        </div>

        {/* Cause & Effect Timeline Audit Log */}
        <div className="w-full text-left mb-6">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2">
            Timeline Causality Audit Log
          </h3>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 text-xs max-h-48 overflow-y-auto">
            {puzzle.causalityLog.length > 0
              ? puzzle.causalityLog.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-slate-300 leading-snug">
                      <span className="text-amber-300 font-medium">{entry.pastAction}</span>
                      <span className="text-slate-500 font-mono mx-1">→</span>
                      <span className="text-emerald-300">{entry.futureEffect}</span>
                    </div>
                  </div>
                ))
              : defaultLogs.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-slate-300 leading-snug">
                      <span className="text-amber-300 font-medium">{item.past}</span>
                      <span className="text-slate-500 font-mono mx-1">→</span>
                      <span className="text-emerald-300">{item.future}</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Play Again Button */}
        <button
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Play Again</span>
        </button>
      </div>
    </div>
  );
};
