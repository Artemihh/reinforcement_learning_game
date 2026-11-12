/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RLAgent } from '../types/game';
import { AI_ACTIONS, applyHumanFeedback, QLearningEngine } from '../ai/reinforcementLearning';
import { X, ThumbsUp, ThumbsDown, RotateCcw, Brain, Award, Download, Upload, Copy, Check } from 'lucide-react';

interface AIBrainInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  aiAgent: RLAgent;
  qEngine: QLearningEngine;
}

export const AIBrainInspector: React.FC<AIBrainInspectorProps> = ({
  isOpen,
  onClose,
  aiAgent,
  qEngine,
}) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [showJsonIO, setShowJsonIO] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [ioStatus, setIoStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const qTableSnapshot = qEngine.getQTableSnapshot();

  const handlePraise = () => {
    applyHumanFeedback(aiAgent, qEngine, 'REWARD');
  };

  const handleScold = () => {
    applyHumanFeedback(aiAgent, qEngine, 'PENALTY');
  };

  const handleReset = () => {
    qEngine.resetKnowledge();
    aiAgent.totalReward = 0;
    aiAgent.recentRewards = [];
    setIoStatus('Reset to pre-seeded default policy.');
  };

  const handleOpenExport = () => {
    setJsonText(qEngine.exportQTableJSON());
    setShowJsonIO(true);
    setCopySuccess(false);
    setIoStatus('Current Q-Table exported to JSON.');
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleImportJSON = () => {
    const success = qEngine.importQTableJSON(jsonText);
    if (success) {
      setIoStatus('Q-Table successfully imported from JSON!');
      setTimeout(() => setShowJsonIO(false), 1200);
    } else {
      setIoStatus('Error: Invalid JSON structure. Check syntax.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none font-sans text-slate-100">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#090e17] border-2 border-emerald-800/80 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0d131f] border-b border-emerald-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide">
                GOLIATH AI SENTINEL // TABULAR Q-LEARNING BRAIN
              </h2>
              <p className="text-xs text-stone-400 font-mono">
                Bellman Optimization &amp; Real-Time Action Values (Priority-Ordered State Discretization)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="text-slate-400 mb-1 flex items-center justify-between">
                <span>Exploration (ε)</span>
                <span className="text-[10px] text-indigo-400">ε-greedy</span>
              </div>
              <div className="text-lg font-bold text-indigo-300 tabular-nums">
                {qEngine.epsilon.toFixed(3)}
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="text-slate-400 mb-1 flex items-center justify-between">
                <span>Learning Rate (α)</span>
                <span className="text-[10px] text-teal-400">α = 0.1</span>
              </div>
              <div className="text-lg font-bold text-teal-300 tabular-nums">
                {qEngine.alpha.toFixed(2)}
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="text-slate-400 mb-1 flex items-center justify-between">
                <span>Discount Factor (γ)</span>
                <span className="text-[10px] text-cyan-400">γ = 0.9</span>
              </div>
              <div className="text-lg font-bold text-cyan-300 tabular-nums">
                {qEngine.gamma.toFixed(2)}
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="text-slate-400 mb-1 flex items-center justify-between">
                <span>Total Reward</span>
                <Award className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div
                className={`text-lg font-bold tabular-nums ${
                  aiAgent.totalReward >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {aiAgent.totalReward > 0 ? `+${aiAgent.totalReward}` : aiAgent.totalReward}
              </div>
            </div>
          </div>

          {/* Human-in-the-Loop Feedback Row */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-0.5">Human Feedback Training (HITL)</h3>
              <p className="text-xs text-slate-400">
                Praise (+25) or correct (-25) Goliath to shape policy towards holding the Auxiliary Switch and responding to whistles.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePraise}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Praise (+25)</span>
              </button>
              <button
                onClick={handleScold}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Correct (-25)</span>
              </button>
              <button
                onClick={handleReset}
                title="Reset to default pre-seeded policy"
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Policy</span>
              </button>
              <button
                onClick={handleOpenExport}
                title="Export or Import Q-Table JSON"
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-mono transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* JSON Export / Import Drawer */}
          {showJsonIO && (
            <div className="p-4 bg-slate-950 border border-indigo-800/80 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300">Q-Table JSON Import / Export:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJSON}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
                  >
                    {copySuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copySuccess ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={handleImportJSON}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 rounded cursor-pointer font-bold"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Apply Import</span>
                  </button>
                  <button
                    onClick={() => setShowJsonIO(false)}
                    className="p-1 hover:text-white text-slate-400 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={6}
                className="w-full bg-[#070b12] border border-slate-800 rounded p-2 text-slate-300 text-[11px] focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="Paste Q-Table JSON here and click 'Apply Import'..."
              />
              {ioStatus && <div className="text-[11px] text-amber-300">{ioStatus}</div>}
            </div>
          )}

          {/* Live Heatmap Q-Table Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Live Heatmap Q-Table Matrix [State × Action Values]
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Active State: <span className="text-emerald-400 font-bold">{aiAgent.currentStateKey}</span>
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    <th className="p-2.5 font-semibold text-slate-300">Discretized State Key</th>
                    {AI_ACTIONS.map((action) => (
                      <th key={action} className="p-2 text-center text-[10px] whitespace-nowrap">
                        {action.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {qTableSnapshot.map(({ state, actions }) => {
                    // Find max action
                    let maxVal = -Infinity;
                    AI_ACTIONS.forEach((a) => {
                      const v = actions[a] ?? 0;
                      if (v > maxVal) maxVal = v;
                    });

                    const isActiveRow = state === aiAgent.currentStateKey;

                    return (
                      <tr
                        key={state}
                        className={isActiveRow ? 'bg-emerald-950/30 text-emerald-200 ring-1 ring-emerald-500/50' : 'hover:bg-slate-900/30'}
                      >
                        <td className="p-2.5 font-medium whitespace-nowrap text-slate-300 flex items-center gap-1.5">
                          {isActiveRow && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                          )}
                          <span>{state}</span>
                        </td>
                        {AI_ACTIONS.map((action) => {
                          const val = actions[action] ?? 0;
                          const isMax = val === maxVal && val > 0;
                          return (
                            <td
                              key={action}
                              className={`p-2 text-center tabular-nums ${
                                isMax
                                  ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-500/40'
                                  : val < 0
                                  ? 'text-red-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {val.toFixed(1)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Training Events Log */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2">
              Recent Reinforcement Updates
            </h3>
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg divide-y divide-slate-800/60 max-h-36 overflow-y-auto text-xs font-mono">
              {aiAgent.recentRewards.length === 0 ? (
                <div className="p-3 text-slate-500 text-center">
                  Goliath policy initialized. Guide him toward the Auxiliary Switch or use whistle [Q / .] to trigger rewards!
                </div>
              ) : (
                aiAgent.recentRewards.map((evt, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <span className="text-slate-300">{evt.reason}</span>
                    <span
                      className={`font-bold tabular-nums ${
                        evt.reward >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {evt.reward >= 0 ? `+${evt.reward}` : evt.reward}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
