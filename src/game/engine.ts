/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AI_JUMP_VELOCITY,
  AI_SPEED,
  CLIMB_SPEED,
  COYOTE_TIME,
  GRAVITY,
  INIT_AI,
  INIT_FUTURE_PLAYER,
  INIT_PAST_PLAYER,
  JUMP_BUFFER_TIME,
  JUMP_VELOCITY,
  MAP_COLS,
  MAP_ROWS,
  OBJECT_LOCS,
  PLAYER_SPEED,
  TILE_SIZE,
  VENT_CYCLE_TIME,
  VENT_ON_END,
  VENT_ON_START,
  VENT_WARN_START,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants';
import {
  FloatingText,
  GameMode,
  KeyControls,
  MissionHint,
  Particle,
  Player,
  PuzzleState,
  Rect,
  RLAgent,
  TimelineType,
  Vector2D,
  VentPhase,
} from '../types/game';
import {
  checkHorizontalCollision,
  checkLadderOverlap,
  checkVerticalCollision,
  createBaseMap,
} from './mapData';
import { discretizeState, QLearningEngine } from '../ai/reinforcementLearning';
import { sound } from '../audio/synth';

export class GameEngine {
  public baseGrid: number[][];
  public pastPlayer: Player;
  public futurePlayer: Player;
  public aiAgent: RLAgent;
  public qEngine: QLearningEngine;
  public puzzle: PuzzleState;
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public cameraPast: Vector2D = { x: 200, y: 500 };
  public cameraFuture: Vector2D = { x: 200, y: 500 };

  public gameMode: GameMode = 'SOLO';
  public activeTimelineFocus: TimelineType = 'PAST';

  public time: number = 0;
  public ventCycleTimer: number = 0;
  public currentVentPhase: VentPhase = 'VENT_OFF';
  public get hazardPulseActive(): boolean {
    return this.currentVentPhase === 'VENT_ON';
  }
  public activeWhistle: { active: boolean; x: number; y: number; timeline: TimelineType; timer: number } | null = null;
  public shakeTimer: number = 0;
  public onVictory?: () => void;

  constructor() {
    this.baseGrid = createBaseMap();
    this.qEngine = new QLearningEngine();
    this.pastPlayer = this.createInitialPlayer('PAST_PLAYER', 'PAST', INIT_PAST_PLAYER.x, INIT_PAST_PLAYER.y);
    this.futurePlayer = this.createInitialPlayer('FUTURE_PLAYER', 'FUTURE', INIT_FUTURE_PLAYER.x, INIT_FUTURE_PLAYER.y);
    this.aiAgent = this.createInitialAI();
    this.puzzle = this.createInitialPuzzle();
  }

  public resetLevel() {
    this.pastPlayer = this.createInitialPlayer('PAST_PLAYER', 'PAST', INIT_PAST_PLAYER.x, INIT_PAST_PLAYER.y);
    this.futurePlayer = this.createInitialPlayer('FUTURE_PLAYER', 'FUTURE', INIT_FUTURE_PLAYER.x, INIT_FUTURE_PLAYER.y);
    this.aiAgent = this.createInitialAI();
    this.puzzle = this.createInitialPuzzle();
    this.particles = [];
    this.floatingTexts = [];
    this.ventCycleTimer = 0;
    this.currentVentPhase = 'VENT_OFF';
    this.activeWhistle = null;
    this.time = 0;
    this.shakeTimer = 0;
  }

  /**
   * Resets only the current phase to prevent soft-locks
   */
  public restartCurrentPhase() {
    const phase = this.puzzle.currentPhase;
    if (phase === 1) {
      this.pastPlayer.heldItem = null;
      this.puzzle.sporePicked = false;
      this.puzzle.sporePlanted = false;
      this.puzzle.sluiceOpened = false;
      this.puzzle.treeGrown = false;
      this.puzzle.treeGrowthAnim = 0;
      this.addFloatingText('Phase 1 Restarted', this.pastPlayer.x, this.pastPlayer.y - 20, '#f59e0b', 'PAST');
    } else if (phase === 2) {
      this.futurePlayer.heldItem = null;
      this.puzzle.batteryPicked = false;
      this.addFloatingText('Phase 2 Restarted', this.futurePlayer.x, this.futurePlayer.y - 20, '#06b6d4', 'FUTURE');
    } else if (phase === 3) {
      this.pastPlayer.heldItem = null;
      this.futurePlayer.heldItem = null;
      this.puzzle.keycardPicked = false;
      this.puzzle.capsuleLoaded = false;
      this.puzzle.capsuleOpened = false;
      this.puzzle.lasersDisabled = false;
      this.puzzle.laserFadeAnim = 0;
      this.addFloatingText('Phase 3 Restarted', this.futurePlayer.x, this.futurePlayer.y - 20, '#f59e0b', 'BOTH');
    } else if (phase === 4) {
      this.puzzle.batteryInstalled = false;
      this.puzzle.reactorEnergized = false;
      this.addFloatingText('Phase 4 Restarted', this.futurePlayer.x, this.futurePlayer.y - 20, '#06b6d4', 'FUTURE');
    } else {
      this.puzzle.pastPlateActive = false;
      this.puzzle.futurePlateActive = false;
      this.puzzle.aiSwitchActive = false;
      this.puzzle.resonanceActive = false;
      this.puzzle.gateOpened = false;
      this.addFloatingText('Phase 5 Restarted', this.futurePlayer.x, this.futurePlayer.y - 20, '#22c55e', 'BOTH');
    }
  }

  private createInitialPlayer(id: 'PAST_PLAYER' | 'FUTURE_PLAYER', timeline: TimelineType, x: number, y: number): Player {
    return {
      id,
      timeline,
      name: id === 'PAST_PLAYER' ? 'Aiden' : 'Nova',
      x,
      y,
      vx: 0,
      vy: 0,
      width: 26,
      height: 32,
      isGrounded: false,
      isClimbing: false,
      facing: 'right',
      heldItem: null,
      animationFrame: 0,
      animTimer: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
    };
  }

  private createInitialAI(): RLAgent {
    return {
      x: INIT_AI.x,
      y: INIT_AI.y,
      vx: 0,
      vy: 0,
      width: 28,
      height: 32,
      timeline: 'FUTURE',
      isGrounded: false,
      facing: 'left',
      currentAction: 'MOVE_LEFT',
      decisionTimer: 0,
      currentStateKey: 'SAFE_PATROL_DIR_L',
      totalReward: 0,
      lastReward: 0,
      recentRewards: [],
      epsilon: 0.3,
      alpha: 0.1,
      gamma: 0.9,
      eyeColor: '#06b6d4',
      lastStateKey: null,
      lastAction: null,
      whistleFollowTimer: 0,
      phase5NudgeTimer: 0,
    };
  }

  private createInitialPuzzle(): PuzzleState {
    return {
      currentPhase: 1,
      sporePicked: false,
      sporePlanted: false,
      sluiceOpened: false,
      treeGrown: false,
      treeGrowthAnim: 0,
      canalDrainingAnim: 0,
      canalDrained: false,
      batteryPicked: false,
      keycardPicked: false,
      capsuleLoaded: false,
      capsuleOpened: false,
      lasersDisabled: false,
      laserFadeAnim: 0,
      batteryInstalled: false,
      reactorEnergized: false,
      pastPlateActive: false,
      futurePlateActive: false,
      aiSwitchActive: false,
      resonanceActive: false,
      gateOpened: false,
      gateOpenAnim: 0,
      causalityLog: [],
    };
  }

  public getCurrentMissionHint(): MissionHint {
    const p = this.puzzle;

    // Phase 1: Spore & Tree
    if (!p.treeGrown) {
      if (!p.sporePlanted) {
        if (this.pastPlayer.heldItem === 'CHRONO_SPORE') {
          return {
            phase: 1,
            title: 'Plant the Chrono-Spore',
            hint: 'PAST: Carry the Chrono-Spore right to the soil bed [x=416] and press [E] to plant.',
            activeTimeline: 'PAST',
          };
        }
        return {
          phase: 1,
          title: 'Extract Specimen Spore',
          hint: 'PAST: Walk Aiden left to the Specimen Altar [x=160] and press [E] to take the Chrono-Spore.',
          activeTimeline: 'PAST',
        };
      }
      return {
        phase: 1,
        title: 'Irrigate the Soil',
        hint: 'PAST: Climb the sluice ladder [x=576] and press [E] on the valve wheel [x=580] to irrigate the soil & drain the canal!',
        activeTimeline: 'PAST',
      };
    }

    // Phase 2: Canal & Battery
    if (!p.batteryPicked && !p.batteryInstalled) {
      return {
        phase: 2,
        title: 'Extract Chrono-Battery',
        hint: 'FUTURE: The canal is dry! Swap to Nova [Tab], drop into the canal bed [x=740], and press [Enter] to pick up the Chrono-Battery.',
        activeTimeline: 'FUTURE',
      };
    }

    // Phase 3: Capsule & Lasers
    if (!p.lasersDisabled) {
      if (!p.capsuleLoaded) {
        if (this.pastPlayer.heldItem === 'GOLDEN_KEYCARD') {
          return {
            phase: 3,
            title: 'Seal Master Keycard',
            hint: 'PAST: Carry the Golden Keycard right to the Time Capsule safe [x=320] and press [E] to seal it.',
            activeTimeline: 'PAST',
          };
        }
        return {
          phase: 3,
          title: 'Retrieve Golden Keycard',
          hint: 'PAST: Climb the terrace ladder [x=224], grab the Golden Keycard on the desk [x=190] [E], then seal in capsule [x=320].',
          activeTimeline: 'PAST',
        };
      }

      if (!p.capsuleOpened) {
        return {
          phase: 3,
          title: 'Retrieve Keycard from Capsule',
          hint: 'FUTURE: Climb the colossal Bio-Tendril Tree [x=420], walk left to the Time Capsule [x=320], and press [Enter] to retrieve the preserved Keycard.',
          activeTimeline: 'FUTURE',
        };
      }

      return {
        phase: 3,
        title: 'Override Laser Grid',
        hint: 'FUTURE: Walk right on the upper terrace to the Security Console [x=480] and press [Enter] to shut down the red Laser Grid.',
        activeTimeline: 'FUTURE',
      };
    }

    // Phase 4: Vault Core Activation
    if (!p.reactorEnergized) {
      return {
        phase: 4,
        title: 'Energize Chrono-Vault Core',
        hint: 'FUTURE: Walk Nova right past the offline lasers to the Vault Terminal [x=580] and press [Enter] to install the Battery and energize the Gateway!',
        activeTimeline: 'FUTURE',
      };
    }

    // Phase 5: Triple-Resonance Gateway Synchronization
    const pastOn = p.pastPlateActive;
    const futOn = p.futurePlateActive;
    const aiOn = p.aiSwitchActive;

    if (!pastOn || !futOn || !aiOn) {
      const missing: string[] = [];
      if (!pastOn) missing.push('Aiden on Past Plate [x=1040]');
      if (!futOn) missing.push('Nova on Future Plate [x=1040]');
      if (!aiOn) missing.push('Goliath on Auxiliary Switch [x=1240]');
      return {
        phase: 5,
        title: 'Synchronize 3-Node Resonance',
        hint: `GATEWAY: Need ${missing.join(' · ')}! (Whistle [Q] or [.] to call Goliath, or praise him in [B]).`,
        activeTimeline: 'BOTH',
      };
    }

    return {
      phase: 5,
      title: 'Portal Synchronized!',
      hint: 'CHRONO-GATE IS OPEN! Step through the swirling green portal at [x=1180] to achieve victory!',
      activeTimeline: 'BOTH',
    };
  }

  public update(dt: number, controls: KeyControls) {
    const clampedDt = Math.min(dt, 0.05);
    this.time += clampedDt;

    if (this.shakeTimer > 0) {
      this.shakeTimer -= clampedDt;
    }

    // Whistle beacon decay
    if (this.activeWhistle) {
      this.activeWhistle.timer -= clampedDt;
      if (this.activeWhistle.timer <= 0) {
        this.activeWhistle = null;
      }
    }

    // Hazard Arc Vent Cycle (5s loop: 0-2.8s OFF, 2.8-3.6s WARN, 3.6-4.8s ON)
    this.ventCycleTimer = (this.ventCycleTimer + clampedDt) % VENT_CYCLE_TIME;
    if (this.ventCycleTimer >= VENT_ON_START && this.ventCycleTimer < VENT_ON_END) {
      this.currentVentPhase = 'VENT_ON';
    } else if (this.ventCycleTimer >= VENT_WARN_START && this.ventCycleTimer < VENT_ON_START) {
      this.currentVentPhase = 'VENT_WARN';
    } else {
      this.currentVentPhase = 'VENT_OFF';
    }

    // Animation progress transitions
    if (this.puzzle.treeGrown && this.puzzle.treeGrowthAnim < 1.0) {
      this.puzzle.treeGrowthAnim = Math.min(1.0, this.puzzle.treeGrowthAnim + clampedDt * 1.5);
    }
    if (this.puzzle.sluiceOpened && this.puzzle.canalDrainingAnim < 1.0) {
      this.puzzle.canalDrainingAnim = Math.min(1.0, this.puzzle.canalDrainingAnim + clampedDt * 1.0);
    }
    if (this.puzzle.lasersDisabled && this.puzzle.laserFadeAnim < 1.0) {
      this.puzzle.laserFadeAnim = Math.min(1.0, this.puzzle.laserFadeAnim + clampedDt * 2.0);
    }
    if (this.puzzle.gateOpened && this.puzzle.gateOpenAnim < 1.0) {
      this.puzzle.gateOpenAnim = Math.min(1.0, this.puzzle.gateOpenAnim + clampedDt * 1.2);
    }

    // Update Players physics
    this.updatePlayerPhysics(this.pastPlayer, clampedDt, controls, 'PAST');
    this.updatePlayerPhysics(this.futurePlayer, clampedDt, controls, 'FUTURE');

    // Update Goliath AI agent
    this.updateAIPhysics(clampedDt);

    // Update Puzzle triggers and state machine
    this.updatePuzzleTriggers(clampedDt);

    // Smooth camera lerping
    this.updateCameras(clampedDt);

    // Particles & Floating text update
    this.updateParticles(clampedDt);
    this.updateFloatingTexts(clampedDt);
  }

  private updatePlayerPhysics(player: Player, dt: number, controls: KeyControls, timeline: TimelineType) {
    const isPast = timeline === 'PAST';

    let moveLeft = false;
    let moveRight = false;
    let moveUp = false;
    let moveDown = false;

    if (this.gameMode === 'COOP') {
      if (isPast) {
        moveLeft = controls.pastLeft;
        moveRight = controls.pastRight;
        moveUp = controls.pastUp;
        moveDown = controls.pastDown;
      } else {
        moveLeft = controls.futureLeft;
        moveRight = controls.futureRight;
        moveUp = controls.futureUp;
        moveDown = controls.futureDown;
      }
    } else {
      // SOLO MODE: Either WASD OR Arrow keys control whichever character is currently active!
      // Inactive character stays stationary and firmly latched on plates.
      if (this.activeTimelineFocus === timeline) {
        moveLeft = controls.pastLeft || controls.futureLeft;
        moveRight = controls.pastRight || controls.futureRight;
        moveUp = controls.pastUp || controls.futureUp;
        moveDown = controls.pastDown || controls.futureDown;
      } else {
        moveLeft = false;
        moveRight = false;
        moveUp = false;
        moveDown = false;
      }
    }

    // Check if player's hitbox overlaps an active ladder or vine volume
    const onLadder = checkLadderOverlap(
      { x: player.x, y: player.y, w: player.width, h: player.height },
      timeline,
      this.puzzle
    );

    // Engage or disengage climbing
    if (onLadder) {
      if (moveUp || moveDown) {
        player.isClimbing = true;
      }
    } else {
      player.isClimbing = false;
    }

    // Horizontal Movement
    if (moveLeft) {
      player.vx = -PLAYER_SPEED;
      player.facing = 'left';
    } else if (moveRight) {
      player.vx = PLAYER_SPEED;
      player.facing = 'right';
    } else {
      player.vx *= 0.65;
      if (Math.abs(player.vx) < 5) player.vx = 0;
    }

    // Vertical Movement / Climbing
    if (player.isClimbing) {
      if (moveUp) {
        player.vy = -CLIMB_SPEED;
      } else if (moveDown) {
        player.vy = CLIMB_SPEED;
      } else {
        player.vy = 0;
      }

      // Allow jumping off a ladder
      if (player.jumpBufferTimer > 0) {
        player.isClimbing = false;
        player.vy = JUMP_VELOCITY;
        player.isGrounded = false;
        player.jumpBufferTimer = 0;
        sound.playJump();
        this.spawnPuffParticles(player.x + player.width / 2, player.y + player.height, timeline);
      }
    } else {
      // Normal Gravity
      player.vy += GRAVITY * dt;

      // Coyote time & Jump Buffering
      if (player.isGrounded) {
        player.coyoteTimer = COYOTE_TIME;
      } else {
        player.coyoteTimer -= dt;
      }

      if (moveUp) {
        player.jumpBufferTimer = JUMP_BUFFER_TIME;
      } else {
        player.jumpBufferTimer -= dt;
      }

      if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
        player.vy = JUMP_VELOCITY;
        player.isGrounded = false;
        player.coyoteTimer = 0;
        player.jumpBufferTimer = 0;
        sound.playJump();
        this.spawnPuffParticles(player.x + player.width / 2, player.y + player.height, timeline);
      }
    }

    // 1. Horizontal Motion & Collision Check
    const nextX = player.x + player.vx * dt;
    const hResult = checkHorizontalCollision(
      { x: nextX, y: player.y, w: player.width, h: player.height },
      this.baseGrid
    );

    // Laser barrier in Future blocks horizontal movement if active
    const hitsLaser =
      timeline === 'FUTURE' &&
      !this.puzzle.lasersDisabled &&
      this.rectOverlap(
        { x: nextX, y: player.y, w: player.width, h: player.height },
        OBJECT_LOCS.laserBarrier
      );

    if (!hResult.hit && !hitsLaser) {
      player.x = nextX;
    } else {
      player.vx = 0;
    }

    // 2. Vertical Motion & Ground Snapping
    if (player.isClimbing) {
      player.y += player.vy * dt;
      player.isGrounded = false;
    } else {
      const nextY = player.y + player.vy * dt;
      const vResult = checkVerticalCollision(
        player.y,
        nextY,
        { x: player.x, y: player.y, w: player.width, h: player.height },
        player.vy,
        moveDown,
        this.baseGrid
      );

      if (vResult.hitGround) {
        player.y = vResult.groundY; // Snap firmly to ground/catwalk surface
        if (!player.isGrounded && player.vy > 250) {
          sound.playLand();
          this.shakeTimer = 0.15;
        }
        player.isGrounded = true;
        player.vy = 0;
      } else if (vResult.hitCeiling) {
        player.y = vResult.ceilingY;
        player.vy = 0;
      } else {
        player.y = nextY;
        player.isGrounded = false;
      }
    }

    // World Boundary Clamping
    player.x = Math.max(32, Math.min(MAP_COLS * TILE_SIZE - 64, player.x));
    player.y = Math.max(32, Math.min(MAP_ROWS * TILE_SIZE - 64, player.y));
  }

  private updateAIPhysics(dt: number) {
    const ai = this.aiAgent;

    if (ai.whistleFollowTimer > 0) {
      ai.whistleFollowTimer -= dt;
    }

    // Phase 5 Guided Fallback: if auxiliary switch has not been held for 90s, gently guide Goliath
    if (this.puzzle.currentPhase === 5 && !this.puzzle.aiSwitchActive) {
      ai.phase5NudgeTimer += dt;
      if (ai.phase5NudgeTimer >= 90) {
        // Guided fallback nudge
        const switchX = OBJECT_LOCS.auxiliarySwitch.x + OBJECT_LOCS.auxiliarySwitch.w / 2;
        if (Math.abs(ai.x - switchX) > 20) {
          ai.currentAction = ai.x < switchX ? 'MOVE_RIGHT' : 'MOVE_LEFT';
        } else {
          ai.currentAction = 'WAIT_AT_SWITCH';
        }
      }
    } else {
      ai.phase5NudgeTimer = 0;
    }

    // Discretize state
    const playerPos = { x: this.futurePlayer.x, y: this.futurePlayer.y };
    const whistleActive = ai.whistleFollowTimer > 0;
    const stateKey = discretizeState(ai, playerPos, this.currentVentPhase, whistleActive);
    ai.currentStateKey = stateKey;

    // Decision tick every ~0.25s
    ai.decisionTimer += dt;
    if (ai.decisionTimer >= 0.25) {
      ai.decisionTimer = 0;

      // Choose next action via Q-learning policy
      const { action, explored } = this.qEngine.chooseAction(stateKey, true);

      // Cache previous state & action for Bellman and human feedback
      ai.lastStateKey = stateKey;
      ai.lastAction = action;
      ai.currentAction = action;

      let immediateReward = 0;
      let reason = '';

      // Check Hazard Vent arc contact
      const inHazard =
        this.currentVentPhase === 'VENT_ON' &&
        Math.hypot(
          ai.x + ai.width / 2 - (OBJECT_LOCS.hazardEmitter.x + OBJECT_LOCS.hazardEmitter.w / 2),
          ai.y + ai.height / 2 - OBJECT_LOCS.hazardEmitter.y
        ) < 64;

      if (inHazard) {
        immediateReward = -35;
        reason = 'Hazard Arc Shock (-35)';
        ai.eyeColor = '#ef4444'; // Red
        sound.playAiChirp(false);
        this.spawnPuffParticles(ai.x + ai.width / 2, ai.y + ai.height / 2, 'FUTURE', '#ef4444');
      }

      // Check Auxiliary Switch contact (+50 reward)
      const onSwitch = this.rectOverlap(
        { x: ai.x, y: ai.y, w: ai.width, h: ai.height },
        OBJECT_LOCS.auxiliarySwitch
      );
      if (onSwitch) {
        immediateReward = 50;
        reason = 'Holding Auxiliary Switch (+50)';
        ai.eyeColor = '#10b981'; // Green
        if (!this.puzzle.aiSwitchActive) {
          sound.playAiChirp(true);
          this.addFloatingText('+50 Holding Switch!', ai.x, ai.y - 16, '#10b981', 'FUTURE');
        }
      }

      // Whistle convergence (+20 reward)
      if (whistleActive && Math.hypot(ai.x - playerPos.x, ai.y - playerPos.y) < 90) {
        immediateReward = 20;
        reason = 'Whistle Escort Converged (+20)';
        ai.eyeColor = '#06b6d4'; // Cyan
      }

      // Execute Bellman Update
      if (immediateReward !== 0) {
        this.qEngine.update(stateKey, action, immediateReward, stateKey);
        ai.totalReward += immediateReward;
        ai.lastReward = immediateReward;
        ai.recentRewards.unshift({
          time: Date.now(),
          reward: immediateReward,
          reason,
        });
        if (ai.recentRewards.length > 8) ai.recentRewards.pop();
      }

      // Visor color setting
      if (explored) {
        ai.eyeColor = '#a855f7'; // Purple (exploratory action)
      } else if (onSwitch) {
        ai.eyeColor = '#10b981'; // Green (holding switch)
      } else if (whistleActive) {
        ai.eyeColor = '#06b6d4'; // Cyan (escorting / following whistle)
      } else if (this.currentVentPhase !== 'VENT_OFF' && stateKey.startsWith('HAZARD_ALERT')) {
        ai.eyeColor = '#ef4444'; // Red (hazard alert)
      } else {
        ai.eyeColor = '#06b6d4'; // Cyan default
      }
    }

    // Execute physical motion for the 7 actions
    switch (ai.currentAction) {
      case 'MOVE_LEFT':
        ai.vx = -AI_SPEED;
        ai.facing = 'left';
        break;
      case 'MOVE_RIGHT':
        ai.vx = AI_SPEED;
        ai.facing = 'right';
        break;
      case 'JUMP':
        if (ai.isGrounded) {
          ai.vy = AI_JUMP_VELOCITY;
          ai.isGrounded = false;
        }
        break;
      case 'JUMP_LEFT':
        ai.vx = -AI_SPEED;
        ai.facing = 'left';
        if (ai.isGrounded) {
          ai.vy = AI_JUMP_VELOCITY;
          ai.isGrounded = false;
        }
        break;
      case 'JUMP_RIGHT':
        ai.vx = AI_SPEED;
        ai.facing = 'right';
        if (ai.isGrounded) {
          ai.vy = AI_JUMP_VELOCITY;
          ai.isGrounded = false;
        }
        break;
      case 'WAIT_AT_SWITCH':
      case 'IDLE':
      default:
        ai.vx *= 0.6;
        break;
    }

    // AI Gravity & Vertical motion
    ai.vy += GRAVITY * dt;

    // AI Horizontal motion & collision
    const nextX = ai.x + ai.vx * dt;
    const hResult = checkHorizontalCollision(
      { x: nextX, y: ai.y, w: ai.width, h: ai.height },
      this.baseGrid
    );
    if (!hResult.hit) {
      ai.x = nextX;
    } else {
      ai.vx = 0;
    }

    // AI Vertical motion & ground snapping
    const nextY = ai.y + ai.vy * dt;
    const vResult = checkVerticalCollision(
      ai.y,
      nextY,
      { x: ai.x, y: ai.y, w: ai.width, h: ai.height },
      ai.vy,
      false,
      this.baseGrid
    );

    if (vResult.hitGround) {
      ai.y = vResult.groundY;
      ai.isGrounded = true;
      ai.vy = 0;
    } else if (vResult.hitCeiling) {
      ai.y = vResult.ceilingY;
      ai.vy = 0;
    } else {
      ai.y = nextY;
      ai.isGrounded = false;
    }

    ai.x = Math.max(32, Math.min(MAP_COLS * TILE_SIZE - 64, ai.x));
    ai.y = Math.max(32, Math.min(MAP_ROWS * TILE_SIZE - 64, ai.y));
  }

  public isNear(p: Player, obj: Rect, margin = 56): boolean {
    const pCenterX = p.x + p.width / 2;
    const pCenterY = p.y + p.height / 2;
    const objCenterX = obj.x + obj.w / 2;
    const objCenterY = obj.y + obj.h / 2;
    return (
      Math.abs(pCenterX - objCenterX) <= obj.w / 2 + p.width / 2 + margin &&
      Math.abs(pCenterY - objCenterY) <= obj.h / 2 + p.height / 2 + margin
    );
  }

  public getPastInteractPrompt(): string | null {
    const p = this.pastPlayer;
    if (!this.puzzle.sporePicked && !p.heldItem && this.isNear(p, OBJECT_LOCS.seedPickup)) {
      return '[E] Pick up Chrono-Spore';
    }
    if (p.heldItem === 'CHRONO_SPORE' && this.isNear(p, OBJECT_LOCS.soilBed)) {
      return '[E] Plant Chrono-Spore in Loam';
    }
    if (!this.puzzle.sporePlanted && !p.heldItem && this.isNear(p, OBJECT_LOCS.soilBed)) {
      return 'Loam Bed (Needs Spore from Altar)';
    }
    if (this.isNear(p, OBJECT_LOCS.sluiceValve)) {
      return this.puzzle.sluiceOpened ? 'Sluice Valve Opened (Irrigating)' : '[E] Open Sluice Valve';
    }
    if (!this.puzzle.capsuleLoaded && p.heldItem !== 'GOLDEN_KEYCARD' && this.isNear(p, OBJECT_LOCS.keycardPedestal)) {
      return '[E] Pick up Golden Master Keycard';
    }
    if (this.isNear(p, OBJECT_LOCS.timeCapsule)) {
      return this.puzzle.capsuleLoaded ? 'Time Capsule Sealed' : '[E] Seal Master Keycard in Time Capsule';
    }
    return null;
  }

  public getFutureInteractPrompt(): string | null {
    const p = this.futurePlayer;
    if (this.puzzle.canalDrained && !this.puzzle.batteryPicked && this.isNear(p, OBJECT_LOCS.batteryPickup)) {
      return '[Enter] Pick up Chrono-Battery';
    }
    if (this.puzzle.capsuleLoaded && !this.puzzle.capsuleOpened && this.isNear(p, OBJECT_LOCS.timeCapsule)) {
      return '[Enter] Open Weathered Time Capsule';
    }
    if (this.isNear(p, OBJECT_LOCS.securityConsole)) {
      return this.puzzle.lasersDisabled ? 'Laser Grid Offline' : '[Enter] Swipe Keycard & Disable Laser Grid';
    }
    if (this.isNear(p, OBJECT_LOCS.chronoVaultCore)) {
      return this.puzzle.reactorEnergized ? 'Reactor Energized' : '[Enter] Install Chrono-Battery in Core';
    }
    return null;
  }

  public triggerSmartInteract(preferredTimeline?: TimelineType) {
    const pastNear = this.getPastInteractPrompt();
    const futureNear = this.getFutureInteractPrompt();

    if (preferredTimeline === 'PAST' && pastNear) {
      this.handlePastInteraction();
      return;
    }
    if (preferredTimeline === 'FUTURE' && futureNear) {
      this.handleFutureInteraction();
      return;
    }

    if (pastNear) {
      this.handlePastInteraction();
    } else if (futureNear) {
      this.handleFutureInteraction();
    } else if (preferredTimeline === 'PAST') {
      this.handlePastInteraction();
    } else {
      this.handleFutureInteraction();
    }
  }

  private handlePastInteraction() {
    const p = this.pastPlayer;

    // 1. Pick up Spore
    if (!this.puzzle.sporePicked && !p.heldItem && this.isNear(p, OBJECT_LOCS.seedPickup)) {
      this.puzzle.sporePicked = true;
      p.heldItem = 'CHRONO_SPORE';
      sound.playPickup();
      this.addFloatingText('Acquired Chrono-Spore!', p.x, p.y - 18, '#10b981', 'PAST');
      return;
    }

    // 2. Plant Spore
    if (p.heldItem === 'CHRONO_SPORE' && this.isNear(p, OBJECT_LOCS.soilBed)) {
      p.heldItem = null;
      this.puzzle.sporePlanted = true;
      sound.playPlantSpore();
      this.addFloatingText('Spore Planted in Fertile Loam!', p.x, p.y - 18, '#22c55e', 'PAST');
      this.checkPhaseProgress();
      return;
    }

    // 3. Sluice Valve
    if (this.isNear(p, OBJECT_LOCS.sluiceValve)) {
      if (!this.puzzle.sluiceOpened) {
        this.puzzle.sluiceOpened = true;
        this.puzzle.canalDrained = true;
        sound.playSluiceRelease();
        this.shakeTimer = 0.4;
        this.addFloatingText('Sluice Opened: Canal Draining & Soil Irrigated!', p.x, p.y - 18, '#06b6d4', 'PAST');

        this.puzzle.causalityLog.push({
          id: Math.random().toString(),
          timestamp: '1962 / 2024',
          pastAction: 'Aqueduct sluice valve opened in 1962',
          futureEffect: 'Canal dried out & Chrono-Battery unearthed in 2024',
        });

        this.checkPhaseProgress();
      }
      return;
    }

    // 4. Golden Keycard Desk
    if (!this.puzzle.capsuleLoaded && this.isNear(p, OBJECT_LOCS.keycardPedestal)) {
      p.heldItem = 'GOLDEN_KEYCARD';
      this.puzzle.keycardPicked = true;
      sound.playPickup();
      this.addFloatingText('Acquired Golden Master Keycard!', p.x, p.y - 18, '#f59e0b', 'PAST');
      return;
    }

    // 5. Time Capsule Safe
    if (this.isNear(p, OBJECT_LOCS.timeCapsule)) {
      if (!this.puzzle.capsuleLoaded) {
        this.puzzle.capsuleLoaded = true;
        p.heldItem = null;
        sound.playPickup();
        this.addFloatingText('Master Keycard Sealed in Capsule!', p.x, p.y - 18, '#f59e0b', 'PAST');

        this.puzzle.causalityLog.push({
          id: Math.random().toString(),
          timestamp: '1962 / 2024',
          pastAction: 'Master Keycard sealed inside hermetic capsule',
          futureEffect: 'Preserved undamaged across 62 years of fallout',
        });

        this.checkPhaseProgress();
      }
      return;
    }
  }

  private handleFutureInteraction() {
    const p = this.futurePlayer;

    // 1. Pick up Chrono-Battery from dry canal
    if (this.puzzle.canalDrained && !this.puzzle.batteryPicked && this.isNear(p, OBJECT_LOCS.batteryPickup)) {
      this.puzzle.batteryPicked = true;
      p.heldItem = 'CHRONO_BATTERY';
      sound.playPickup();
      this.addFloatingText('Extracted Irradiated Chrono-Battery!', p.x, p.y - 18, '#06b6d4', 'FUTURE');
      this.checkPhaseProgress();
      return;
    }

    // 2. Open Time Capsule
    if (this.puzzle.capsuleLoaded && !this.puzzle.capsuleOpened && this.isNear(p, OBJECT_LOCS.timeCapsule)) {
      this.puzzle.capsuleOpened = true;
      p.heldItem = 'GOLDEN_KEYCARD';
      sound.playPickup();
      this.addFloatingText('Extracted Pristine Keycard from Capsule!', p.x, p.y - 18, '#f59e0b', 'FUTURE');
      this.checkPhaseProgress();
      return;
    }

    // 3. Security Console (Disable Lasers)
    if (this.isNear(p, OBJECT_LOCS.securityConsole)) {
      if (this.puzzle.capsuleOpened || p.heldItem === 'GOLDEN_KEYCARD') {
        if (!this.puzzle.lasersDisabled) {
          this.puzzle.lasersDisabled = true;
          sound.playMilestoneFanfare();
          this.shakeTimer = 0.35;
          this.addFloatingText('Security Override: Red Laser Grid Offline!', p.x, p.y - 18, '#10b981', 'FUTURE');

          this.puzzle.causalityLog.push({
            id: Math.random().toString(),
            timestamp: '1962 / 2024',
            pastAction: 'Keycard safely passed through time',
            futureEffect: 'High-voltage laser defense barrier offline',
          });

          this.checkPhaseProgress();
        }
      } else {
        this.addFloatingText('Security Locked: Requires Keycard from Time Capsule!', p.x, p.y - 18, '#ef4444', 'FUTURE');
      }
      return;
    }

    // 4. Chrono-Vault Core
    if (this.isNear(p, OBJECT_LOCS.chronoVaultCore)) {
      if (this.puzzle.lasersDisabled && (this.puzzle.batteryPicked || p.heldItem === 'CHRONO_BATTERY')) {
        if (!this.puzzle.reactorEnergized) {
          this.puzzle.batteryInstalled = true;
          this.puzzle.reactorEnergized = true;
          p.heldItem = null;
          sound.playMilestoneFanfare();
          this.shakeTimer = 0.5;
          this.addFloatingText('Reactor Energized! Chrono-Gate Powered!', p.x, p.y - 18, '#06b6d4', 'FUTURE');

          this.puzzle.causalityLog.push({
            id: Math.random().toString(),
            timestamp: '2024',
            pastAction: 'Sunken battery recovered and installed in Vault Core',
            futureEffect: 'Chrono-Gate reactor powered up for synchronization',
          });

          this.checkPhaseProgress();
        }
      } else {
        this.addFloatingText('Vault Core requires Chrono-Battery & Offline Lasers!', p.x, p.y - 18, '#ef4444', 'FUTURE');
      }
      return;
    }
  }

  public triggerWhistle(timeline: TimelineType) {
    const p = timeline === 'PAST' ? this.pastPlayer : this.futurePlayer;
    this.activeWhistle = {
      active: true,
      x: p.x + p.width / 2,
      y: p.y + p.height / 2,
      timeline,
      timer: 3.0,
    };
    sound.playWhistle();

    // Goliath converges on whistle
    this.aiAgent.whistleFollowTimer = 4.5;
    this.aiAgent.currentAction = this.futurePlayer.x < this.aiAgent.x ? 'MOVE_LEFT' : 'MOVE_RIGHT';
    this.aiAgent.eyeColor = '#06b6d4'; // Cyan
  }

  private checkPhaseProgress() {
    const p = this.puzzle;

    // Check Tree Growth milestone
    if (p.sporePlanted && p.sluiceOpened && !p.treeGrown) {
      p.treeGrown = true;
      sound.playMilestoneFanfare();
      this.shakeTimer = 0.5;
      this.addFloatingText('Cause & Effect: Colossal Bio-Tendril Tree Grown in Future!', 420, 320, '#22c55e', 'FUTURE');

      p.causalityLog.push({
        id: Math.random().toString(),
        timestamp: '1962 / 2024',
        pastAction: 'Chrono-Spore planted & irrigated in 1962',
        futureEffect: 'Colossal climbable Bio-Tendril Tree in 2024',
      });
    }

    // Advance phase state machine
    if (p.currentPhase === 1 && p.treeGrown) {
      p.currentPhase = 2;
    }
    if (p.currentPhase === 2 && p.batteryPicked) {
      p.currentPhase = 3;
    }
    if (p.currentPhase === 3 && p.lasersDisabled) {
      p.currentPhase = 4;
    }
    if (p.currentPhase === 4 && p.reactorEnergized) {
      p.currentPhase = 5;
    }
  }

  private updatePuzzleTriggers(dt: number) {
    const pastRect = { x: this.pastPlayer.x, y: this.pastPlayer.y, w: this.pastPlayer.width, h: this.pastPlayer.height };
    const futureRect = { x: this.futurePlayer.x, y: this.futurePlayer.y, w: this.futurePlayer.width, h: this.futurePlayer.height };
    const aiRect = { x: this.aiAgent.x, y: this.aiAgent.y, w: this.aiAgent.width, h: this.aiAgent.height };

    // Past Resonance Plate
    this.puzzle.pastPlateActive = this.rectOverlap(pastRect, OBJECT_LOCS.pastResonancePlate);

    // Future Resonance Plate
    this.puzzle.futurePlateActive = this.rectOverlap(futureRect, OBJECT_LOCS.futureResonancePlate);

    // AI Auxiliary Switch (holds when Goliath OR Nova stands on it)
    this.puzzle.aiSwitchActive = this.rectOverlap(aiRect, OBJECT_LOCS.auxiliarySwitch) || this.rectOverlap(futureRect, OBJECT_LOCS.auxiliarySwitch);

    // Phase 5 Triple-Resonance Check
    if (this.puzzle.reactorEnergized) {
      this.puzzle.resonanceActive =
        this.puzzle.pastPlateActive &&
        this.puzzle.futurePlateActive &&
        this.puzzle.aiSwitchActive;

      if (this.puzzle.resonanceActive && !this.puzzle.gateOpened) {
        this.puzzle.gateOpened = true;
        sound.playMilestoneFanfare();
        this.shakeTimer = 0.6;
        this.addFloatingText('CHRONO-GATE HARMONIZED! PORTAL IS ACTIVE!', 1180, 200, '#22c55e', 'BOTH');

        this.puzzle.causalityLog.push({
          id: Math.random().toString(),
          timestamp: '1962 / 2024',
          pastAction: 'Triple temporal resonance stabilized by Aiden, Nova & Goliath',
          futureEffect: 'Chrono-Gate wormhole stabilized for extraction',
        });
      }
    }

    // Victory Check: Reaching the Chrono-Gate
    if (this.puzzle.gateOpened) {
      const pastAtGate = this.rectOverlap(pastRect, OBJECT_LOCS.chronoGate);
      const futureAtGate = this.rectOverlap(futureRect, OBJECT_LOCS.chronoGate);

      if ((pastAtGate || futureAtGate) && this.onVictory) {
        sound.playMilestoneFanfare();
        this.onVictory();
      }
    }
  }

  private updateCameras(dt: number) {
    this.cameraPast.x += (this.pastPlayer.x - this.cameraPast.x) * (dt * 5);
    this.cameraPast.y += (this.pastPlayer.y - this.cameraPast.y) * (dt * 5);

    this.cameraFuture.x += (this.futurePlayer.x - this.cameraFuture.x) * (dt * 5);
    this.cameraFuture.y += (this.futurePlayer.y - this.cameraFuture.y) * (dt * 5);
  }

  private spawnPuffParticles(x: number, y: number, timeline: TimelineType, color: string = '#cbd5e1') {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 50,
        vy: -Math.random() * 35,
        size: 2 + Math.random() * 2.5,
        color,
        alpha: 0.8,
        decay: 1.6,
        life: 0.5,
        timeline,
      });
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string, timeline: TimelineType | 'BOTH') {
    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
      timeline,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 25 * dt;
      ft.alpha -= 0.6 * dt;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public rectOverlap(r1: Rect, r2: Rect): boolean {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }
}
