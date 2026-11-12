/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TimelineType = 'PAST' | 'FUTURE';

export type GameMode = 'SOLO' | 'COOP';

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type InventoryItem =
  | 'CHRONO_SPORE'
  | 'GOLDEN_KEYCARD'
  | 'CHRONO_BATTERY';

export interface Player {
  id: 'PAST_PLAYER' | 'FUTURE_PLAYER';
  timeline: TimelineType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  isClimbing: boolean;
  facing: 'left' | 'right';
  heldItem: InventoryItem | null;
  animationFrame: number;
  animTimer: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
}

export type AIAction =
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'IDLE'
  | 'JUMP'
  | 'JUMP_LEFT'
  | 'JUMP_RIGHT'
  | 'WAIT_AT_SWITCH';

export type VentPhase = 'VENT_OFF' | 'VENT_WARN' | 'VENT_ON';

export interface RLAgent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  timeline: TimelineType;
  isGrounded: boolean;
  facing: 'left' | 'right';
  currentAction: AIAction;
  decisionTimer: number;
  currentStateKey: string;
  totalReward: number;
  lastReward: number;
  recentRewards: { time: number; reward: number; reason: string }[];
  epsilon: number;
  alpha: number;
  gamma: number;
  eyeColor: string;
  lastStateKey: string | null;
  lastAction: AIAction | null;
  whistleFollowTimer: number;
  phase5NudgeTimer: number;
}

export interface CausalityLogEntry {
  id: string;
  timestamp: string;
  pastAction: string;
  futureEffect: string;
}

export interface PuzzleState {
  currentPhase: 1 | 2 | 3 | 4 | 5;

  // Phase 1: Spore and Tree
  sporePicked: boolean;
  sporePlanted: boolean;
  sluiceOpened: boolean;
  treeGrown: boolean;
  treeGrowthAnim: number; // 0 to 1

  // Phase 2: Canal & Battery
  canalDrainingAnim: number; // 0 to 1
  canalDrained: boolean;
  batteryPicked: boolean;

  // Phase 3: Capsule & Lasers
  keycardPicked: boolean;
  capsuleLoaded: boolean;
  capsuleOpened: boolean;
  lasersDisabled: boolean;
  laserFadeAnim: number; // 0 to 1

  // Phase 4: Vault Core
  batteryInstalled: boolean;
  reactorEnergized: boolean;

  // Phase 5: Synchronize
  pastPlateActive: boolean;
  futurePlateActive: boolean;
  aiSwitchActive: boolean;
  resonanceActive: boolean;
  gateOpened: boolean;
  gateOpenAnim: number; // 0 to 1

  // Audit list for victory screen
  causalityLog: CausalityLogEntry[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  life: number;
  timeline?: TimelineType | 'ALL';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  timeline: TimelineType | 'BOTH';
}

export interface KeyControls {
  // Past (Player 1)
  pastLeft: boolean;
  pastRight: boolean;
  pastUp: boolean;
  pastDown: boolean;
  pastInteract: boolean;
  pastWhistle: boolean;

  // Future (Player 2)
  futureLeft: boolean;
  futureRight: boolean;
  futureUp: boolean;
  futureDown: boolean;
  futureInteract: boolean;
  futureWhistle: boolean;
}

export interface MissionHint {
  phase: number;
  title: string;
  hint: string;
  activeTimeline: 'PAST' | 'FUTURE' | 'BOTH';
}
