/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode, InventoryItem, MissionHint, PuzzleState, RLAgent, TimelineType } from '../types/game';
import { Volume2, VolumeX, Pause, Cpu, CheckCircle2, Circle, Radiation, Biohazard, Lightbulb } from 'lucide-react';

interface GameHUDProps {
  gameMode: GameMode;
  activeFocus: TimelineType;
  pastHeldItem: InventoryItem | null;
  futureHeldItem: InventoryItem | null;
  puzzle: PuzzleState;
  aiAgent: RLAgent;
  currentHint: MissionHint;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenPause: () => void;
  onToggleAIBrain: () => void;
  onOpenHints: () => void;
  onSwapFocus: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameMode,
  activeFocus,
  pastHeldItem,
  futureHeldItem,
  puzzle,
  aiAgent,
  currentHint,
  isMuted,
  onToggleMute,
  onOpenPause,
  onToggleAIBrain,
  onOpenHints,
  onSwapFocus,
}) => {
  const objectives = [
    { title: '1. Spore & Tree', done: puzzle.treeGrown },
    { title: '2. Canal & Battery', done: puzzle.batteryPicked || puzzle.batteryInstalled },
    { title: '3. Capsule & Lasers', done: puzzle.lasersDisabled },
    { title: '4. Vault Core', done: puzzle.reactorEnergized },
    { title: '5. Gateway Harmonized', done: puzzle.gateOpened },
  ];
  const completedCount = objectives.filter((o) => o.done).length;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 font-sans text-stone-200">
      {/* Top Header Bar */}
      <div className="w-full flex items-start justify-between gap-4">
        {/* Left Cluster: Past Bunker Lab Operative (Aiden) */}
        <div className="flex flex-col gap-1 bg-[#140b08]/90 border-2 border-amber-900/80 rounded-lg p-2.5 backdrop-blur-sm pointer-events-auto shadow-2xl">
          <div className="flex items-center gap-2">
            <Radiation className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-black text-amber-400 font-mono tracking-wider">
              1962 CHRONO-BUNKER · AIDEN
            </span>
            {gameMode === 'SOLO' && (
              <button
                onClick={onSwapFocus}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  activeFocus === 'PAST'
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {activeFocus === 'PAST' ? 'Active Focus [Tab]' : 'Click to Focus'}
              </button>
            )}
          </div>
          <div className="text-[11px] text-stone-400 flex items-center gap-1.5 font-mono">
            <span>Inventory:</span>
            <span className="text-amber-200 font-bold">
              {pastHeldItem ? pastHeldItem.replace(/_/g, ' ') : 'Empty Hands'}
            </span>
          </div>
        </div>

        {/* Center Cluster: 5-Phase Temporal Cause & Effect Matrix */}
        <div className="bg-[#0b1017]/95 border-2 border-stone-800 rounded-lg px-4 py-2 flex flex-col items-center shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-3 text-xs mb-1 font-mono">
            <span className="font-bold text-stone-200 uppercase tracking-wide">
              Temporal Causality Chain
            </span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {completedCount} / 5 Phases Complete
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[10px] text-stone-400 font-mono">
            {objectives.map((obj, i) => (
              <div key={i} className="flex items-center gap-1">
                {obj.done ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Circle className="w-3 h-3 text-stone-600" />
                )}
                <span className={obj.done ? 'text-stone-300 line-through opacity-70' : 'text-stone-300'}>
                  {obj.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Cluster: Future Meltdown Ruins & Goliath Sentinel AI */}
        <div className="flex items-start gap-2">
          {/* Future Player Info (Nova) */}
          <div className="flex flex-col gap-1 bg-[#06180f]/90 border-2 border-emerald-900/80 rounded-lg p-2.5 backdrop-blur-sm pointer-events-auto shadow-2xl">
            <div className="flex items-center gap-2">
              <Biohazard className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-black text-emerald-400 font-mono tracking-wider">
                2024 MUTAGEN RUINS · NOVA
              </span>
              {gameMode === 'SOLO' && (
                <button
                  onClick={onSwapFocus}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    activeFocus === 'FUTURE'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {activeFocus === 'FUTURE' ? 'Active Focus [Tab]' : 'Click to Focus'}
                </button>
              )}
            </div>
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5 font-mono">
              <span>Inventory:</span>
              <span className="text-emerald-200 font-bold">
                {futureHeldItem ? futureHeldItem.replace(/_/g, ' ') : 'Empty Hands'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 bg-[#0f141c]/90 border-2 border-stone-800 rounded-lg p-1.5 pointer-events-auto">
            {/* Field Guide / Hint System Button */}
            <button
              onClick={onOpenHints}
              title="Open Mission Field Guide & Walkthrough (Key: H)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-amber-950/80 hover:bg-amber-900/80 border border-amber-600/50 text-amber-300 text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Guide</span>
              <span className="text-[10px] opacity-70">[H]</span>
            </button>

            {/* AI Goliath Brain */}
            <button
              onClick={onToggleAIBrain}
              title="Open Goliath AI Sentinel RL Brain & Telemetry (Key: B)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-600/50 text-emerald-300 text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Goliath</span>
              <span className="text-[10px] opacity-70">[B]</span>
            </button>

            <button
              onClick={onToggleMute}
              title="Toggle Audio (Key: M)"
              className="p-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              onClick={onOpenPause}
              title="Pause Game (Key: Esc)"
              className="p-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Center Dynamic Mission Directive Ticker with Live Coordinates */}
      <div className="w-full flex justify-center pointer-events-auto">
        <div className="max-w-2xl w-full bg-[#10151f]/95 border-2 border-amber-500/70 rounded-xl px-4 py-2 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 shrink-0">
            <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-[11px] font-mono font-black text-amber-400 uppercase tracking-wider">
              PHASE {currentHint.phase}/5:
            </span>
          </div>
          <div className="text-xs text-stone-100 font-bold truncate">
            {currentHint.hint}
          </div>
          <button
            onClick={onOpenHints}
            className="shrink-0 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-mono font-black tracking-wide transition-colors cursor-pointer"
          >
            Guide [H]
          </button>
        </div>
      </div>

      {/* Bottom Contextual Controls & AI Sentiment Readout */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono text-stone-400 px-3 py-1.5 bg-[#090b10]/85 rounded-lg border border-stone-800 pointer-events-auto shadow-lg">
        <div className="flex items-center gap-3">
          <span><strong className="text-amber-400">Past (Aiden):</strong> WASD Move/Climb · E Interact · Q Whistle</span>
          <span className="text-stone-600">·</span>
          <span><strong className="text-emerald-400">Future (Nova):</strong> Arrows Move/Climb · Enter Interact · . Whistle</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Goliath Visor:</span>
          <span
            className="w-2.5 h-2.5 rounded-full inline-block border border-black shadow-[0_0_8px_currentColor]"
            style={{ backgroundColor: aiAgent.eyeColor, color: aiAgent.eyeColor }}
          />
          <span className="text-stone-200 font-bold">{aiAgent.currentAction.replace(/_/g, ' ')}</span>
          <span className="text-stone-500 tabular-nums font-mono">Reward: {aiAgent.totalReward} Pts</span>
        </div>
      </div>
    </div>
  );
};
