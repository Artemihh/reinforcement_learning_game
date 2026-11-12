/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIAction, RLAgent, Vector2D, VentPhase } from '../types/game';
import { OBJECT_LOCS } from '../game/constants';
import { sound } from '../audio/synth';

export const AI_ACTIONS: AIAction[] = [
  'MOVE_LEFT',
  'MOVE_RIGHT',
  'IDLE',
  'JUMP',
  'JUMP_LEFT',
  'JUMP_RIGHT',
  'WAIT_AT_SWITCH',
];

export interface QTableState {
  [stateKey: string]: { [action in AIAction]?: number };
}

export class QLearningEngine {
  private qTable: QTableState = {};
  public alpha: number = 0.1; // Default learning rate as specified
  public gamma: number = 0.9; // Default discount factor as specified
  public epsilon: number = 0.3; // Starts at 0.3
  public minEpsilon: number = 0.05; // Minimum 0.05
  public epsilonDecay: number = 0.999; // Decays 0.999 per step

  constructor() {
    this.seedDefaultPolicy();
  }

  /**
   * Pre-seed a robust, competent initial Q-table so Goliath is never braindead or soft-locked.
   * Priority:
   * 1. If hazard vent is active (VENT_ON), flee immediately!
   * 2. If near switch, move onto it and WAIT_AT_SWITCH.
   * 3. If summoned by whistle, follow the player.
   * 4. Patrol safely otherwise.
   */
  public seedDefaultPolicy() {
    this.qTable = {};

    const seeds: { state: string; best: AIAction; bonus: number }[] = [
      // 1. HAZARD ALERT STATES
      { state: 'HAZARD_ALERT_HZ_LEFT_VENT_ON', best: 'MOVE_RIGHT', bonus: 35 },
      { state: 'HAZARD_ALERT_HZ_LEFT_VENT_WARN', best: 'MOVE_RIGHT', bonus: 20 },
      { state: 'HAZARD_ALERT_HZ_RIGHT_VENT_ON', best: 'MOVE_LEFT', bonus: 35 },
      { state: 'HAZARD_ALERT_HZ_RIGHT_VENT_WARN', best: 'MOVE_LEFT', bonus: 20 },
      { state: 'HAZARD_ALERT_HZ_LEFT_VENT_OFF', best: 'MOVE_RIGHT', bonus: 10 },
      { state: 'HAZARD_ALERT_HZ_RIGHT_VENT_OFF', best: 'MOVE_LEFT', bonus: 10 },

      // 2. NEAR SWITCH STATES (within 300px)
      { state: 'NEAR_SWITCH_ON_SWITCH', best: 'WAIT_AT_SWITCH', bonus: 50 },
      { state: 'NEAR_SWITCH_SW_LEFT', best: 'MOVE_LEFT', bonus: 30 },
      { state: 'NEAR_SWITCH_SW_RIGHT', best: 'MOVE_RIGHT', bonus: 30 },

      // 3. NEAR PLAYER / WHISTLE STATES (within 300px)
      { state: 'NEAR_PLAYER_PL_LEFT', best: 'MOVE_LEFT', bonus: 22 },
      { state: 'NEAR_PLAYER_PL_RIGHT', best: 'MOVE_RIGHT', bonus: 22 },

      // 4. SAFE PATROL STATES
      { state: 'SAFE_PATROL_DIR_L', best: 'MOVE_LEFT', bonus: 12 },
      { state: 'SAFE_PATROL_DIR_R', best: 'MOVE_RIGHT', bonus: 12 },
    ];

    seeds.forEach(({ state, best, bonus }) => {
      this.qTable[state] = {};
      AI_ACTIONS.forEach((act) => {
        this.qTable[state][act] = act === best ? bonus : 0;
      });
    });

    this.epsilon = 0.3;
  }

  public getQValues(stateKey: string): Record<AIAction, number> {
    if (!this.qTable[stateKey]) {
      this.qTable[stateKey] = {};
      AI_ACTIONS.forEach((act) => {
        this.qTable[stateKey][act] = 0;
      });
    }
    const res: Record<string, number> = {};
    AI_ACTIONS.forEach((act) => {
      res[act] = this.qTable[stateKey][act] ?? 0;
    });
    return res as Record<AIAction, number>;
  }

  public getQTableSnapshot(): { state: string; actions: Record<string, number> }[] {
    return Object.entries(this.qTable).map(([state, actMap]) => ({
      state,
      actions: { ...actMap },
    }));
  }

  public exportQTableJSON(): string {
    return JSON.stringify(this.qTable, null, 2);
  }

  public importQTableJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === 'object' && parsed !== null) {
        this.qTable = parsed;
        return true;
      }
    } catch {
      // Invalid JSON format
    }
    return false;
  }

  public chooseAction(stateKey: string, allowExplore: boolean = true): { action: AIAction; explored: boolean } {
    const qValues = this.getQValues(stateKey);

    // Epsilon-greedy action selection
    if (allowExplore && Math.random() < this.epsilon) {
      const randomAction = AI_ACTIONS[Math.floor(Math.random() * AI_ACTIONS.length)];
      return { action: randomAction, explored: true };
    }

    let bestAction = AI_ACTIONS[0];
    let maxQ = -Infinity;

    AI_ACTIONS.forEach((act) => {
      const q = qValues[act] ?? 0;
      if (q > maxQ) {
        maxQ = q;
        bestAction = act;
      }
    });

    return { action: bestAction, explored: false };
  }

  public update(
    prevStateKey: string,
    action: AIAction,
    reward: number,
    nextStateKey: string
  ) {
    const currentQ = this.getQValues(prevStateKey)[action] ?? 0;
    const nextQValues = this.getQValues(nextStateKey);

    let maxNextQ = -Infinity;
    AI_ACTIONS.forEach((act) => {
      const q = nextQValues[act] ?? 0;
      if (q > maxNextQ) {
        maxNextQ = q;
      }
    });
    if (maxNextQ === -Infinity) maxNextQ = 0;

    // Standard Bellman equation: Q(s,a) <- Q(s,a) + alpha * (r + gamma * max_a' Q(s',a') - Q(s,a))
    const newQ = currentQ + this.alpha * (reward + this.gamma * maxNextQ - currentQ);
    if (!this.qTable[prevStateKey]) {
      this.qTable[prevStateKey] = {};
    }
    this.qTable[prevStateKey][action] = Number(newQ.toFixed(2));

    // Epsilon decay
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
  }

  public resetKnowledge() {
    this.seedDefaultPolicy();
  }
}

/**
 * Discretizes the continuous environment state with strict priority order:
 * 1. HAZARD_ALERT (within 96px of arc vent) + VENT_PHASE
 * 2. NEAR_SWITCH (within 300px)
 * 3. NEAR_PLAYER (within 300px of Nova or whistle triggered)
 * 4. SAFE_PATROL (fallback)
 */
export function discretizeState(
  ai: RLAgent,
  playerPos: Vector2D,
  ventPhase: VentPhase,
  whistleActive: boolean
): string {
  const switchX = OBJECT_LOCS.auxiliarySwitch.x + OBJECT_LOCS.auxiliarySwitch.w / 2;
  const switchY = OBJECT_LOCS.auxiliarySwitch.y;
  const hazardX = OBJECT_LOCS.hazardEmitter.x + OBJECT_LOCS.hazardEmitter.w / 2;
  const hazardY = OBJECT_LOCS.hazardEmitter.y;

  const distToHazard = Math.hypot(hazardX - (ai.x + ai.width / 2), hazardY - (ai.y + ai.height / 2));
  const distToSwitch = Math.hypot(switchX - (ai.x + ai.width / 2), switchY - (ai.y + ai.height / 2));
  const distToPlayer = Math.hypot(playerPos.x - ai.x, playerPos.y - ai.y);

  // 1. HAZARD_ALERT: Within 96px of arc vent
  if (distToHazard <= 96) {
    const dir = hazardX < ai.x + ai.width / 2 ? 'HZ_LEFT' : 'HZ_RIGHT';
    return `HAZARD_ALERT_${dir}_${ventPhase}`;
  }

  // 2. NEAR_SWITCH: Within 300px
  if (distToSwitch <= 300) {
    if (distToSwitch <= 36) {
      return 'NEAR_SWITCH_ON_SWITCH';
    }
    const dir = switchX < ai.x + ai.width / 2 ? 'SW_LEFT' : 'SW_RIGHT';
    return `NEAR_SWITCH_${dir}`;
  }

  // 3. NEAR_PLAYER: Within 300px of Nova or triggered by whistle
  if (whistleActive || distToPlayer <= 300) {
    const dir = playerPos.x < ai.x + ai.width / 2 ? 'PL_LEFT' : 'PL_RIGHT';
    return `NEAR_PLAYER_${dir}`;
  }

  // 4. SAFE_PATROL: Default
  return ai.facing === 'left' ? 'SAFE_PATROL_DIR_L' : 'SAFE_PATROL_DIR_R';
}

/**
 * Applies immediate human-in-the-loop reward or penalty to the last (state, action) pair
 */
export function applyHumanFeedback(
  agent: RLAgent,
  engine: QLearningEngine,
  type: 'REWARD' | 'PENALTY'
) {
  const rewardVal = type === 'REWARD' ? 25 : -25;
  const reason = type === 'REWARD' ? 'Human Praise (+25)' : 'Human Correction (-25)';

  const stateKey = agent.lastStateKey ?? agent.currentStateKey;
  const action = agent.lastAction ?? agent.currentAction;

  engine.update(stateKey, action, rewardVal, agent.currentStateKey);

  agent.totalReward += rewardVal;
  agent.lastReward = rewardVal;
  agent.recentRewards.unshift({
    time: Date.now(),
    reward: rewardVal,
    reason,
  });
  if (agent.recentRewards.length > 8) {
    agent.recentRewards.pop();
  }

  if (type === 'REWARD') {
    agent.eyeColor = '#10b981'; // Green
    sound.playAiChirp(true);
  } else {
    agent.eyeColor = '#ef4444'; // Red
    sound.playAiChirp(false);
  }
}
