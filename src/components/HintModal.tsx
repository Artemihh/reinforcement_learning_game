/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Lightbulb, CheckCircle2, Circle, Radio, ShieldAlert } from 'lucide-react';
import { MissionHint, PuzzleState, RLAgent } from '../types/game';

interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzle: PuzzleState;
  currentHint: MissionHint;
  aiAgent: RLAgent;
}

export const HintModal: React.FC<HintModalProps> = ({
  isOpen,
  onClose,
  puzzle,
  currentHint,
}) => {
  if (!isOpen) return null;

  const missionSteps = [
    {
      num: 1,
      title: 'Spore & Tree Growth (Past & Future)',
      desc: 'With Aiden (Past), pick up the green Chrono-Spore at the Specimen Altar (x=160) [E], plant it in the Loam Bed (x=416) [E], climb the sluice ladder (x=576), and press [E] on the Sluice Valve (x=580) to irrigate the soil and drain the canal. The colossal Bio-Tendril Tree grows in the Future!',
      done: puzzle.treeGrown,
      timeline: 'PAST',
    },
    {
      num: 2,
      title: 'Extract Irradiated Chrono-Battery (Future)',
      desc: 'With the canal drained, switch to Nova (Future) [Tab], drop down into the dry canal bed (x=740), and press [Enter] to pick up the glowing Chrono-Battery.',
      done: puzzle.batteryPicked || puzzle.batteryInstalled,
      timeline: 'FUTURE',
    },
    {
      num: 3,
      title: 'Time Capsule & Laser Grid Override (Both)',
      desc: 'Aiden climbs the bronze terrace ladder (x=224), takes the Golden Keycard from the Security Desk (x=190) [E], and seals it in the Time Capsule safe (x=320) [E]. In the Future, Nova climbs the grown Bio-Tendril Tree (x=420), retrieves the preserved Keycard from the capsule (x=320) [Enter], and interacts with the Security Console (x=480) [Enter] to disable the lethal red Laser Grid.',
      done: puzzle.lasersDisabled,
      timeline: 'BOTH',
    },
    {
      num: 4,
      title: 'Install Chrono-Battery in Vault Core (Future)',
      desc: 'With lasers disabled, walk Nova right along the upper terrace to the Chrono-Vault Core terminal (x=580) and press [Enter] to install the Chrono-Battery, powering up the Chrono-Gate reactor!',
      done: puzzle.reactorEnergized,
      timeline: 'FUTURE',
    },
    {
      num: 5,
      title: 'Triple-Resonance Gateway Synchronization',
      desc: 'Climb the East Ladder (x=992): Aiden stands on the Past Resonance Plate (x=1040), Nova stands on the Future Resonance Plate (x=1040), and Goliath AI stands on the Sub-Level Auxiliary Switch (x=1240). When all three nodes are green, the Chrono-Gate (x=1180) opens. Step through to win!',
      done: puzzle.gateOpened,
      timeline: 'CO-OP',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none font-sans text-stone-100">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0c121d] border-2 border-amber-600/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#141b26] border-b border-amber-700/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide">
                MISSION FIELD GUIDE // 5-PHASE LEVEL WALKTHROUGH
              </h2>
              <p className="text-xs text-stone-400 font-mono">
                Temporal Causality Protocols &amp; Exact Coordinates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Active Directive Banner */}
          <div className="p-4 rounded-xl bg-amber-950/40 border-2 border-amber-500/50 flex items-start gap-3">
            <Radio className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider mb-0.5">
                Current Operational Objective (Phase {currentHint.phase} of 5)
              </div>
              <div className="text-sm font-bold text-white leading-snug">
                {currentHint.hint}
              </div>
            </div>
          </div>

          {/* Step-by-Step Flow List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider font-mono">
              Complete 5-Phase Causality Chain
            </h3>

            {missionSteps.map((s) => {
              const isCurrent = s.num === currentHint.phase;
              return (
                <div
                  key={s.num}
                  className={`p-3.5 rounded-xl border transition-all ${
                    s.done
                      ? 'bg-[#0d1611] border-emerald-800/60 opacity-80'
                      : isCurrent
                      ? 'bg-[#181a24] border-amber-500/80 shadow-lg ring-1 ring-amber-500/30'
                      : 'bg-[#0e131d] border-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {s.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className={`w-4 h-4 ${isCurrent ? 'text-amber-400' : 'text-stone-600'}`} />
                      )}
                      <span
                        className={`text-xs font-bold ${
                          s.done ? 'text-emerald-300 line-through' : isCurrent ? 'text-amber-300' : 'text-stone-300'
                        }`}
                      >
                        Phase {s.num}: {s.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        s.timeline === 'PAST'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                          : s.timeline === 'FUTURE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                      }`}
                    >
                      {s.timeline}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed pl-6">{s.desc}</p>
                </div>
              );
            })}
          </div>

          {/* AI Companion Tactical Advice */}
          <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 text-xs">
            <div className="flex items-center gap-2 font-mono font-bold text-emerald-400 mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>GOLIATH SENTINEL AI GUIDANCE TIPS</span>
            </div>
            <p className="text-stone-300 leading-relaxed">
              In Phase 5, Goliath must stand on the auxiliary switch at x=1240. Goliath is pre-seeded to avoid electric vents and navigate toward switches. If he strays, whistle (<strong className="text-amber-400">Q</strong> in Past or <strong className="text-emerald-400">.</strong> in Future) to call him, or open AI Brain (<strong className="text-cyan-400">B</strong>) to praise switch holding (+25). If switch is unheld for 90 seconds, Goliath automatically receives a gentle guidance nudge!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#101622] border-t border-stone-800 flex items-center justify-between text-xs font-mono text-stone-400">
          <span>Press [H] or Esc to close guide</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-colors cursor-pointer"
          >
            Understood!
          </button>
        </div>
      </div>
    </div>
  );
};
