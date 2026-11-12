/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MAP_COLS,
  MAP_ROWS,
  OBJECT_LOCS,
  PALETTE,
  TILE_LADDER,
  TILE_ONEWAY,
  TILE_SOLID,
  TILE_SIZE,
} from './constants';
import { FloatingText, Particle, Player, PuzzleState, RLAgent, TimelineType, Vector2D } from '../types/game';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pastPlayer: Player;
  futurePlayer: Player;
  aiAgent: RLAgent;
  puzzle: PuzzleState;
  particles: Particle[];
  floatingTexts: FloatingText[];
  baseGrid: number[][];
  cameraPast: Vector2D;
  cameraFuture: Vector2D;
  time: number;
  activeTimelineFocus: TimelineType;
  hazardPulseActive: boolean;
  activeWhistle: { active: boolean; x: number; y: number; timeline: TimelineType } | null;
  shakeTimer: number;
  interactPromptPast?: string | null;
  interactPromptFuture?: string | null;
}

export function renderGameScene(rc: RenderContext) {
  const { ctx, width, height } = rc;

  // Clear canvas to deep graphic-novel ink void
  ctx.fillStyle = PALETTE.ink.black;
  ctx.fillRect(0, 0, width, height);

  const halfWidth = Math.floor(width / 2);

  // Apply camera shake if any
  let shakeX = 0;
  let shakeY = 0;
  if (rc.shakeTimer > 0) {
    shakeX = (Math.random() - 0.5) * 8;
    shakeY = (Math.random() - 0.5) * 8;
  }

  // 1. RENDER PAST (LEFT VIEWPORT: Sector 1962 - Cold War Chrono-Bunker)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, halfWidth, height);
  ctx.clip();
  renderTimelineViewport(
    rc,
    'PAST',
    0,
    0,
    halfWidth,
    height,
    rc.cameraPast.x + shakeX,
    rc.cameraPast.y + shakeY
  );
  ctx.restore();

  // 2. RENDER FUTURE (RIGHT VIEWPORT: Sector 2024 - Mutagenic Breach Ruins)
  ctx.save();
  ctx.beginPath();
  ctx.rect(halfWidth, 0, width - halfWidth, height);
  ctx.clip();
  renderTimelineViewport(
    rc,
    'FUTURE',
    halfWidth,
    0,
    width - halfWidth,
    height,
    rc.cameraFuture.x + shakeX,
    rc.cameraFuture.y + shakeY
  );
  ctx.restore();

  // 3. RENDER TEMPORAL RIFT SEAM (Comic Ink Fracture & Glowing Fissure)
  renderDieselpunkRift(ctx, halfWidth, height, rc.time, rc.activeTimelineFocus);

  // 4. RENDER TIMELINE HEADERS
  renderTimelineHeaders(ctx, halfWidth, width, rc.activeTimelineFocus);
}

function renderTimelineViewport(
  rc: RenderContext,
  timeline: TimelineType,
  viewX: number,
  viewY: number,
  viewW: number,
  viewH: number,
  camX: number,
  camY: number
) {
  const { ctx, puzzle, baseGrid, time } = rc;
  const isPast = timeline === 'PAST';

  // Center camera with gentle clamping
  const offsetX = viewX + viewW / 2 - camX;
  const offsetY = viewY + viewH / 2 - camY;

  // Draw Background Backdrop (Warm Brick & Vacuum Tubes vs Mutagenic Toxic Decay)
  drawBunkerBackdrop(ctx, timeline, viewX, viewY, viewW, viewH, camX, time);

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Draw Comic-Inked Platform Tiles & Hazards
  drawInkedTiles(ctx, timeline, puzzle, baseGrid, time);

  // Draw Interactive Puzzle & Facility Objects
  drawWorldObjects(ctx, timeline, puzzle, time, rc.hazardPulseActive);

  // Draw Whistle / Acoustic Beacon Waves
  if (rc.activeWhistle && rc.activeWhistle.timeline === timeline && rc.activeWhistle.active) {
    drawAcousticBeacon(ctx, rc.activeWhistle.x, rc.activeWhistle.y, time, isPast);
  }

  // Draw Characters in Graphic Novel Cel-Shaded Style
  if (isPast) {
    drawAidenHazmat(ctx, rc.pastPlayer, time);
  } else {
    drawNovaSurvivalist(ctx, rc.futurePlayer, time);
    // Draw Goliath Sentinel in Future
    drawGoliathSentinel(ctx, rc.aiAgent, time);
  }

  // Draw Particles for this timeline
  drawParticles(ctx, rc.particles, timeline);

  // Draw Floating Text Popups
  drawFloatingTexts(ctx, rc.floatingTexts, timeline);

  // Draw Contextual Interaction Prompt
  const prompt = isPast ? rc.interactPromptPast : rc.interactPromptFuture;
  const player = isPast ? rc.pastPlayer : rc.futurePlayer;
  if (prompt) {
    drawComicPrompt(ctx, prompt, player.x + player.width / 2, player.y, time, isPast);
  }

  ctx.restore();
}

/**
 * Atmospheric Dieselpunk Backdrop:
 * Past: Clean industrial Cold War bunker with brick textures, glowing vacuum tube racks, and analog dials.
 * Future: Post-meltdown mossy rusted bunker with green acid drips and broken sparking monitors.
 */
function drawBunkerBackdrop(
  ctx: CanvasRenderingContext2D,
  timeline: TimelineType,
  vx: number,
  vy: number,
  vw: number,
  vh: number,
  camX: number,
  time: number
) {
  const isPast = timeline === 'PAST';

  if (isPast) {
    // 1962 Industrial Bunker
    const bgGrad = ctx.createLinearGradient(vx, 0, vx, vh);
    bgGrad.addColorStop(0, PALETTE.past.skyTop);
    bgGrad.addColorStop(1, PALETTE.past.skyBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(vx, vy, vw, vh);

    // Warm Brick Texture
    ctx.strokeStyle = PALETTE.past.mortar;
    ctx.lineWidth = 1;
    const brickW = 32;
    const brickH = 16;
    for (let y = 0; y < vh; y += brickH) {
      const rowIdx = Math.floor(y / brickH);
      const shift = (rowIdx % 2) * (brickW / 2);
      ctx.beginPath();
      ctx.moveTo(vx, y);
      ctx.lineTo(vx + vw, y);
      ctx.stroke();

      for (let x = vx + shift; x < vx + vw; x += brickW) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + brickH);
        ctx.stroke();
      }
    }

    // Parallax Vacuum Tube Server Racks with Amber Indicator Lamps
    const rackSpacing = 160;
    for (let rx = vx + 40; rx < vx + vw; rx += rackSpacing) {
      const scrollX = rx - (camX * 0.15) % rackSpacing;
      // Server Rack Frame
      ctx.fillStyle = PALETTE.past.steelGirder;
      ctx.fillRect(scrollX, vh - 220, 68, 180);
      ctx.strokeStyle = PALETTE.ink.black;
      ctx.lineWidth = PALETTE.ink.lineThick;
      ctx.strokeRect(scrollX, vh - 220, 68, 180);

      // Vacuum Tube Lamps
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 4; col++) {
          const lampX = scrollX + 10 + col * 13;
          const lampY = vh - 200 + row * 16;
          const isAmber = (row + col + Math.floor(time * 2.5)) % 3 !== 0;
          ctx.fillStyle = isAmber ? PALETTE.past.amberLight : '#ef4444';
          ctx.beginPath();
          ctx.arc(lampX, lampY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Analog Pressure Gauge
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(scrollX + 34, vh - 100, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink.black;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(scrollX + 34, vh - 100);
      ctx.lineTo(scrollX + 34 + Math.cos(time * 1.5 + rx) * 7, vh - 100 + Math.sin(time * 1.5 + rx) * 7);
      ctx.stroke();
    }

    // Overhead Industrial Lamp with Amber Cone Light
    const lampX = vx + vw * 0.38;
    ctx.fillStyle = '#475569';
    ctx.fillRect(lampX - 5, 0, 10, 26);
    const coneGrad = ctx.createRadialGradient(lampX, 26, 4, lampX, 180, 240);
    coneGrad.addColorStop(0, PALETTE.past.amberGlow);
    coneGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(lampX, 26);
    ctx.lineTo(lampX - 160, vh);
    ctx.lineTo(lampX + 160, vh);
    ctx.closePath();
    ctx.fill();

  } else {
    // 2024 Overgrown Mutagenic Breach Ruins
    const bgGrad = ctx.createLinearGradient(vx, 0, vx, vh);
    bgGrad.addColorStop(0, PALETTE.future.skyTop);
    bgGrad.addColorStop(1, PALETTE.future.skyBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(vx, vy, vw, vh);

    // Weathered Corroded Wall Panels
    ctx.strokeStyle = '#020503';
    ctx.lineWidth = 1;
    for (let y = 0; y < vh; y += 16) {
      ctx.beginPath();
      ctx.moveTo(vx, y);
      ctx.lineTo(vx + vw, y);
      ctx.stroke();
    }

    // Broken Smashed Racks with Dangling Mutagenic Wires
    const rackSpacing = 160;
    for (let rx = vx + 40; rx < vx + vw; rx += rackSpacing) {
      const scrollX = rx - (camX * 0.15) % rackSpacing;
      ctx.fillStyle = PALETTE.future.rustDark;
      ctx.fillRect(scrollX, vh - 220, 68, 180);
      ctx.strokeStyle = PALETTE.ink.black;
      ctx.lineWidth = PALETTE.ink.lineThick;
      ctx.strokeRect(scrollX, vh - 220, 68, 180);

      // Flickering green terminal CRT
      const flicker = Math.sin(time * 10 + rx) > -0.2;
      ctx.fillStyle = flicker ? PALETTE.future.toxicGreenGlow : '#051f11';
      ctx.fillRect(scrollX + 8, vh - 190, 52, 32);
      ctx.strokeRect(scrollX + 8, vh - 190, 52, 32);

      // Dangling glowing cables
      ctx.strokeStyle = PALETTE.future.toxicGreen;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(scrollX + 18, vh - 220);
      ctx.bezierCurveTo(scrollX + 8, vh - 170, scrollX + 32, vh - 150, scrollX + 24, vh - 110);
      ctx.stroke();
    }

    // Toxic Acid Puddle Drips
    ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
    for (let i = 0; i < 5; i++) {
      const dripX = vx + ((i * 130 + 40) % vw);
      ctx.beginPath();
      ctx.ellipse(dripX, vh - 38, 48, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Inked Tile Grid with Comic Line Work & Hatches
 */
function drawInkedTiles(
  ctx: CanvasRenderingContext2D,
  timeline: TimelineType,
  puzzle: PuzzleState,
  baseGrid: number[][],
  time: number
) {
  const isPast = timeline === 'PAST';

  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const tile = baseGrid[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      if (tile === TILE_SOLID) {
        if (isPast) {
          // Warm red-brick & steel foundation
          ctx.fillStyle = PALETTE.past.brickMain;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          // Top steel cap
          if (r === 18 || (r === 20 && c >= 21 && c <= 26)) {
            ctx.fillStyle = PALETTE.past.steelGirder;
            ctx.fillRect(x, y, TILE_SIZE, 6);
            ctx.fillStyle = PALETTE.past.steelHighlight;
            ctx.fillRect(x + 4, y + 2, 4, 2);
            ctx.fillRect(x + 20, y + 2, 4, 2);
          }

          // Inked border
          ctx.strokeStyle = PALETTE.ink.black;
          ctx.lineWidth = PALETTE.ink.lineThin;
          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

          // Diagonal hatch mark
          if ((r + c) % 3 === 0) {
            ctx.beginPath();
            ctx.moveTo(x + 4, y + TILE_SIZE - 4);
            ctx.lineTo(x + TILE_SIZE - 4, y + 4);
            ctx.stroke();
          }
        } else {
          // Mutagenic corroded steel
          ctx.fillStyle = PALETTE.future.rustDark;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          // Toxic slime coat
          if (r === 18 || (r === 20 && c >= 21 && c <= 26)) {
            ctx.fillStyle = PALETTE.future.bioTendrilMain;
            ctx.fillRect(x, y, TILE_SIZE, 6);
            if (c % 2 === 0) {
              ctx.fillStyle = PALETTE.future.toxicGreen;
              ctx.fillRect(x + 10, y + 6, 6, 8);
            }
          }

          ctx.strokeStyle = PALETTE.ink.black;
          ctx.lineWidth = PALETTE.ink.lineThin;
          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        }
      } else if (tile === TILE_ONEWAY) {
        // Catwalk Platforms
        ctx.fillStyle = isPast ? PALETTE.past.steelGirder : PALETTE.future.steelDecayed;
        ctx.fillRect(x, y, TILE_SIZE, 10);

        // Industrial hazard striping
        for (let s = 0; s < TILE_SIZE; s += 8) {
          ctx.fillStyle = (s / 8) % 2 === 0 ? PALETTE.past.amberLight : '#0f172a';
          ctx.fillRect(x + s, y, 8, 3);
        }

        ctx.strokeStyle = PALETTE.ink.black;
        ctx.lineWidth = PALETTE.ink.lineThin;
        ctx.strokeRect(x, y, TILE_SIZE, 10);
      }
    }
  }

  // Draw Ladders
  if (isPast) {
    // 1. Terrace bronze ladder (col 7: x = 224, rows 7 to 18: y = 224 to 576)
    drawLadder(ctx, 224, 224, 352, PALETTE.past.bronze, PALETTE.past.amberLight);
    // 2. Sluice valve ladder (col 18: x = 576, rows 12 to 18: y = 384 to 576)
    drawLadder(ctx, 576, 384, 192, PALETTE.past.bronze, PALETTE.past.amberLight);
    // 3. Canal maintenance ladders (x = 672 and x = 832, rows 18 to 20: y = 576 to 640)
    drawLadder(ctx, 672, 576, 64, PALETTE.past.bronze, PALETTE.past.amberLight);
    drawLadder(ctx, 832, 576, 64, PALETTE.past.bronze, PALETTE.past.amberLight);
    // 4. East maintenance ladder (col 31: x = 992, rows 7 to 18: y = 224 to 576)
    drawLadder(ctx, 992, 224, 352, PALETTE.past.bronze, PALETTE.past.amberLight);
  } else {
    // In Future: Rubble at col 7
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(224, 576);
    ctx.lineTo(224 + 16, 546);
    ctx.lineTo(224 + 32, 576);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 2;
    ctx.stroke();

    // In Future: Canal ladders allow easy ascent out of canal bed
    drawLadder(ctx, 672, 576, 64, '#38bdf8', '#0284c7');
    drawLadder(ctx, 832, 576, 64, '#38bdf8', '#0284c7');

    // In Future: East maintenance ladder is still intact
    drawLadder(ctx, 992, 224, 352, '#38bdf8', '#0284c7');
  }

  // Draw Colossal Bio-Tendril Tree in Future when grown
  if (!isPast && puzzle.treeGrown) {
    drawColossalBioTendrilTree(ctx, time, puzzle.treeGrowthAnim);
  }
}

function drawLadder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  mainColor: string,
  rungColor: string
) {
  // Ladder vertical rails with ink border
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 4, y + h);
  ctx.moveTo(x + 28, y);
  ctx.lineTo(x + 28, y + h);
  ctx.stroke();

  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 4, y + h);
  ctx.moveTo(x + 28, y);
  ctx.lineTo(x + 28, y + h);
  ctx.stroke();

  // Rungs
  for (let ly = y + 12; ly < y + h; ly += 20) {
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x + 4, ly);
    ctx.lineTo(x + 28, ly);
    ctx.stroke();

    ctx.strokeStyle = rungColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 4, ly);
    ctx.lineTo(x + 28, ly);
    ctx.stroke();
  }
}

/**
 * Colossal Bio-Tendril Tree (Echoing mutant weapon in the reference image)
 */
function drawColossalBioTendrilTree(ctx: CanvasRenderingContext2D, time: number, growth: number) {
  const { treeTrunk } = OBJECT_LOCS;
  const currentHeight = treeTrunk.h * Math.max(0.2, growth);
  const currentY = treeTrunk.y + treeTrunk.h - currentHeight;

  // Mutated Bio-Tendril Trunk
  const trunkGrad = ctx.createLinearGradient(treeTrunk.x, 0, treeTrunk.x + treeTrunk.w, 0);
  trunkGrad.addColorStop(0, PALETTE.future.bioTendrilDark);
  trunkGrad.addColorStop(0.5, PALETTE.future.bioTendrilMain);
  trunkGrad.addColorStop(1, PALETTE.future.bioTendrilDark);
  ctx.fillStyle = trunkGrad;
  ctx.fillRect(treeTrunk.x, currentY, treeTrunk.w, currentHeight);

  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = PALETTE.ink.lineThick;
  ctx.strokeRect(treeTrunk.x, currentY, treeTrunk.w, currentHeight);

  // Climbable Tendril Rungs with Glowing Green Pustules
  for (let y = currentY + 20; y < treeTrunk.y + treeTrunk.h; y += 22) {
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(treeTrunk.x + 2, y);
    ctx.lineTo(treeTrunk.x + treeTrunk.w - 2, y + Math.sin(y + time * 3) * 2);
    ctx.stroke();

    ctx.strokeStyle = PALETTE.future.toxicGreen;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(treeTrunk.x + 2, y);
    ctx.lineTo(treeTrunk.x + treeTrunk.w - 2, y + Math.sin(y + time * 3) * 2);
    ctx.stroke();

    // Glowing Bio-Fluid Pustule
    const pulse = Math.sin(time * 4 + y) * 1.5;
    ctx.fillStyle = PALETTE.future.bioAcid;
    ctx.beginPath();
    ctx.arc(treeTrunk.x + 10, y - 2, 4 + pulse, 0, Math.PI * 2);
    ctx.arc(treeTrunk.x + treeTrunk.w - 10, y + 2, 4 - pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Spore Canopy Cluster
  if (growth > 0.8) {
    ctx.fillStyle = PALETTE.future.bioTendrilDark;
    ctx.beginPath();
    ctx.ellipse(treeTrunk.x + 22, currentY, 84, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = PALETTE.future.toxicGreen;
    ctx.beginPath();
    ctx.ellipse(treeTrunk.x + 14, currentY - 10, 60, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * Interactive Facility Objects for Both Timelines
 */
function drawWorldObjects(
  ctx: CanvasRenderingContext2D,
  timeline: TimelineType,
  puzzle: PuzzleState,
  time: number,
  hazardPulseActive: boolean
) {
  const isPast = timeline === 'PAST';

  // 1. Specimen Altar & Soil Bed (Past)
  if (isPast) {
    // Specimen Altar table
    if (!puzzle.sporePicked) {
      ctx.fillStyle = PALETTE.past.steelGirder;
      ctx.fillRect(OBJECT_LOCS.seedPickup.x - 2, OBJECT_LOCS.seedPickup.y + 12, 32, 16);
      ctx.strokeStyle = PALETTE.ink.black;
      ctx.lineWidth = 2;
      ctx.strokeRect(OBJECT_LOCS.seedPickup.x - 2, OBJECT_LOCS.seedPickup.y + 12, 32, 16);

      // Glass Bell Jar with Glowing Chrono-Spore
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fillRect(OBJECT_LOCS.seedPickup.x + 2, OBJECT_LOCS.seedPickup.y - 2, 24, 16);
      ctx.strokeRect(OBJECT_LOCS.seedPickup.x + 2, OBJECT_LOCS.seedPickup.y - 2, 24, 16);

      const bob = Math.sin(time * 3.5) * 2;
      ctx.fillStyle = PALETTE.past.specimenGreen;
      ctx.beginPath();
      ctx.arc(OBJECT_LOCS.seedPickup.x + 14, OBJECT_LOCS.seedPickup.y + 6 + bob, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink.black;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Soil Bed
    ctx.fillStyle = '#2d140e';
    ctx.beginPath();
    ctx.ellipse(OBJECT_LOCS.soilBed.x + 26, OBJECT_LOCS.soilBed.y + 16, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (puzzle.sporePlanted) {
      ctx.fillStyle = PALETTE.past.specimenGreen;
      ctx.beginPath();
      ctx.arc(OBJECT_LOCS.soilBed.x + 26, OBJECT_LOCS.soilBed.y + 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink.black;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // 2. Sluice Valve & Canal Bed
  if (isPast) {
    // Sluice Valve Wheel (x=580, y=416)
    ctx.save();
    ctx.translate(OBJECT_LOCS.sluiceValve.x + 16, OBJECT_LOCS.sluiceValve.y + 16);
    if (puzzle.sluiceOpened) {
      ctx.rotate(Math.PI / 4);
    }
    ctx.fillStyle = PALETTE.past.bronze;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = PALETTE.past.amberLight;
    ctx.fillRect(-3, -12, 6, 24);
    ctx.fillRect(-12, -3, 24, 6);
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 2;
    ctx.strokeRect(-3, -12, 6, 24);
    ctx.strokeRect(-12, -3, 24, 6);
    ctx.restore();

    // Flooded Canal
    if (!puzzle.canalDrained) {
      ctx.fillStyle = PALETTE.past.waterBlue;
      ctx.fillRect(OBJECT_LOCS.aqueductCanal.x, 576, OBJECT_LOCS.aqueductCanal.w, 64);
      ctx.strokeStyle = PALETTE.ink.black;
      ctx.lineWidth = 2;
      ctx.strokeRect(OBJECT_LOCS.aqueductCanal.x, 576, OBJECT_LOCS.aqueductCanal.w, 64);
    } else {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(OBJECT_LOCS.aqueductCanal.x, 594, OBJECT_LOCS.aqueductCanal.w, 46);
    }
  } else {
    // Future Canal: Drained water reveals Chrono-Battery!
    if (!puzzle.batteryPicked && puzzle.canalDrained) {
      const bob = Math.sin(time * 4) * 2;
      ctx.fillStyle = PALETTE.future.toxicGreen;
      ctx.fillRect(OBJECT_LOCS.batteryPickup.x, OBJECT_LOCS.batteryPickup.y + bob, 22, 16);
      ctx.fillStyle = PALETTE.future.bioAcid;
      ctx.fillRect(OBJECT_LOCS.batteryPickup.x + 4, OBJECT_LOCS.batteryPickup.y + bob + 3, 14, 10);
      ctx.strokeStyle = PALETTE.ink.black;
      ctx.lineWidth = 2;
      ctx.strokeRect(OBJECT_LOCS.batteryPickup.x, OBJECT_LOCS.batteryPickup.y + bob, 22, 16);
    }
  }

  // 3. Security Desk & Keycard / Time Capsule
  if (isPast) {
    // Security Desk with Golden Master Keycard (x=190, y=224)
    if (!puzzle.keycardPicked && !puzzle.capsuleLoaded) {
      ctx.fillStyle = PALETTE.past.steelGirder;
      ctx.fillRect(OBJECT_LOCS.keycardPedestal.x - 4, OBJECT_LOCS.keycardPedestal.y + 12, 34, 16);
      ctx.strokeStyle = PALETTE.ink.black;
      ctx.lineWidth = 2;
      ctx.strokeRect(OBJECT_LOCS.keycardPedestal.x - 4, OBJECT_LOCS.keycardPedestal.y + 12, 34, 16);

      // Golden Keycard
      const bob = Math.sin(time * 4) * 2;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(OBJECT_LOCS.keycardPedestal.x + 3, OBJECT_LOCS.keycardPedestal.y + bob, 18, 12);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(OBJECT_LOCS.keycardPedestal.x + 6, OBJECT_LOCS.keycardPedestal.y + 3 + bob, 6, 6);
      ctx.strokeStyle = PALETTE.ink.black;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(OBJECT_LOCS.keycardPedestal.x + 3, OBJECT_LOCS.keycardPedestal.y + bob, 18, 12);
    }

    // Time Capsule Safe (x=320, y=224)
    ctx.fillStyle = PALETTE.past.steelGirder;
    ctx.fillRect(OBJECT_LOCS.timeCapsule.x, OBJECT_LOCS.timeCapsule.y, 34, 34);
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(OBJECT_LOCS.timeCapsule.x, OBJECT_LOCS.timeCapsule.y, 34, 34);

    ctx.fillStyle = puzzle.capsuleLoaded ? PALETTE.past.amberLight : '#0f172a';
    ctx.beginPath();
    ctx.arc(OBJECT_LOCS.timeCapsule.x + 17, OBJECT_LOCS.timeCapsule.y + 17, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Future Weathered Capsule (x=320, y=224)
    ctx.fillStyle = PALETTE.future.rustDark;
    ctx.fillRect(OBJECT_LOCS.timeCapsule.x, OBJECT_LOCS.timeCapsule.y, 34, 34);
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(OBJECT_LOCS.timeCapsule.x, OBJECT_LOCS.timeCapsule.y, 34, 34);

    if (puzzle.capsuleLoaded && !puzzle.capsuleOpened) {
      ctx.fillStyle = PALETTE.past.amberLight;
      ctx.beginPath();
      ctx.arc(OBJECT_LOCS.timeCapsule.x + 17, OBJECT_LOCS.timeCapsule.y + 17, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Future Security Console (x=480, y=224)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(OBJECT_LOCS.securityConsole.x, OBJECT_LOCS.securityConsole.y, 38, 38);
    ctx.strokeStyle = puzzle.lasersDisabled ? PALETTE.future.toxicGreen : PALETTE.future.laserRed;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(OBJECT_LOCS.securityConsole.x, OBJECT_LOCS.securityConsole.y, 38, 38);

    // Red Laser Grid (x=540)
    if (!puzzle.lasersDisabled) {
      ctx.strokeStyle = PALETTE.future.laserRed;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(OBJECT_LOCS.laserBarrier.x + 7, OBJECT_LOCS.laserBarrier.y);
      ctx.lineTo(OBJECT_LOCS.laserBarrier.x + 7, OBJECT_LOCS.laserBarrier.y + OBJECT_LOCS.laserBarrier.h);
      ctx.stroke();

      // Laser emitters top & bottom
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(OBJECT_LOCS.laserBarrier.x, OBJECT_LOCS.laserBarrier.y - 6, 14, 8);
      ctx.fillRect(OBJECT_LOCS.laserBarrier.x, OBJECT_LOCS.laserBarrier.y + OBJECT_LOCS.laserBarrier.h - 2, 14, 8);
    }

    // Chrono-Vault Core Terminal (x=580, y=224)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(OBJECT_LOCS.chronoVaultCore.x, OBJECT_LOCS.chronoVaultCore.y, 38, 38);
    ctx.strokeStyle = puzzle.reactorEnergized ? PALETTE.future.toxicGreen : '#475569';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(OBJECT_LOCS.chronoVaultCore.x, OBJECT_LOCS.chronoVaultCore.y, 38, 38);

    ctx.fillStyle = puzzle.reactorEnergized ? PALETTE.future.toxicGreen : '#334155';
    ctx.beginPath();
    ctx.arc(OBJECT_LOCS.chronoVaultCore.x + 19, OBJECT_LOCS.chronoVaultCore.y + 19, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Sub-Level Hazard Vents & AI Auxiliary Switch (Future)
  if (!isPast) {
    // Hazard Arc Emitter (x=1080)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(OBJECT_LOCS.hazardEmitter.x, OBJECT_LOCS.hazardEmitter.y, OBJECT_LOCS.hazardEmitter.w, OBJECT_LOCS.hazardEmitter.h);
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 2;
    ctx.strokeRect(OBJECT_LOCS.hazardEmitter.x, OBJECT_LOCS.hazardEmitter.y, OBJECT_LOCS.hazardEmitter.w, OBJECT_LOCS.hazardEmitter.h);

    if (hazardPulseActive) {
      // Discharging electric arc
      ctx.strokeStyle = PALETTE.future.laserRed;
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(OBJECT_LOCS.hazardEmitter.x + 6 + i * 11, OBJECT_LOCS.hazardEmitter.y);
        ctx.lineTo(
          OBJECT_LOCS.hazardEmitter.x + 6 + i * 11 + (Math.random() - 0.5) * 18,
          OBJECT_LOCS.hazardEmitter.y - 42
        );
        ctx.stroke();
      }
    }

    // Auxiliary Switch for Goliath (x=1240)
    ctx.fillStyle = puzzle.aiSwitchActive ? PALETTE.future.toxicGreen : PALETTE.future.hazardYellow;
    ctx.fillRect(
      OBJECT_LOCS.auxiliarySwitch.x,
      OBJECT_LOCS.auxiliarySwitch.y + (puzzle.aiSwitchActive ? 4 : 0),
      OBJECT_LOCS.auxiliarySwitch.w,
      puzzle.aiSwitchActive ? 8 : 12
    );
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      OBJECT_LOCS.auxiliarySwitch.x,
      OBJECT_LOCS.auxiliarySwitch.y + (puzzle.aiSwitchActive ? 4 : 0),
      OBJECT_LOCS.auxiliarySwitch.w,
      puzzle.aiSwitchActive ? 8 : 12
    );
  }

  // 5. Dual Resonance Plates (x=1040) & Chrono-Gate (x=1180)
  const plate = isPast ? OBJECT_LOCS.pastResonancePlate : OBJECT_LOCS.futureResonancePlate;
  const isPlateActive = isPast ? puzzle.pastPlateActive : puzzle.futurePlateActive;

  ctx.fillStyle = isPlateActive ? PALETTE.future.toxicGreen : (isPast ? PALETTE.past.bronze : PALETTE.future.hazardYellow);
  ctx.fillRect(plate.x, plate.y + (isPlateActive ? 4 : 0), plate.w, isPlateActive ? 8 : 12);
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 2;
  ctx.strokeRect(plate.x, plate.y + (isPlateActive ? 4 : 0), plate.w, isPlateActive ? 8 : 12);

  // Chrono-Gate Archway (x=1180)
  const gate = OBJECT_LOCS.chronoGate;
  ctx.strokeStyle = puzzle.gateOpened ? PALETTE.future.toxicGreen : PALETTE.ink.black;
  ctx.lineWidth = 4;
  ctx.strokeRect(gate.x, gate.y, gate.w, gate.h);

  if (puzzle.gateOpened) {
    const portalGrad = ctx.createRadialGradient(
      gate.x + gate.w / 2,
      gate.y + gate.h / 2,
      6,
      gate.x + gate.w / 2,
      gate.y + gate.h / 2,
      44
    );
    portalGrad.addColorStop(0, '#ffffff');
    portalGrad.addColorStop(0.4, PALETTE.future.toxicGreen);
    portalGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = portalGrad;
    ctx.beginPath();
    ctx.arc(gate.x + gate.w / 2, gate.y + gate.h / 2, 40, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Aiden: 1962 Hazmat Scientist in Mustard Coat, Gas Mask & Goggles
 */
function drawAidenHazmat(ctx: CanvasRenderingContext2D, player: Player, time: number) {
  ctx.save();
  ctx.translate(player.x, player.y);

  if (player.facing === 'left') {
    ctx.scale(-1, 1);
    ctx.translate(-player.width, 0);
  }

  const bounce = Math.abs(player.vx) > 10 ? Math.sin(time * 14) * 2 : 0;

  // Rubber boots
  ctx.fillStyle = '#1e293b';
  if (Math.abs(player.vx) > 10) {
    const legSwing = Math.sin(time * 14) * 6;
    ctx.fillRect(4 + legSwing, 22, 6, 10);
    ctx.fillRect(14 - legSwing, 22, 6, 10);
  } else {
    ctx.fillRect(5, 22, 5, 10);
    ctx.fillRect(14, 22, 5, 10);
  }
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 22, 6, 10);
  ctx.strokeRect(13, 22, 6, 10);

  // Mustard yellow hazmat trench coat
  ctx.fillStyle = PALETTE.past.hazmatYellow;
  ctx.fillRect(3, 10 + bounce, 18, 14);
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 10 + bounce, 18, 14);

  // Leather harness
  ctx.fillStyle = '#78350f';
  ctx.fillRect(3, 16 + bounce, 18, 3);

  // Hood & Gas mask snout
  ctx.fillStyle = '#854d0e';
  ctx.fillRect(6, 1 + bounce, 14, 11);
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 1 + bounce, 14, 11);

  // Brass goggles
  ctx.fillStyle = PALETTE.past.amberLight;
  ctx.fillRect(13, 4 + bounce, 6, 3);
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(13, 4 + bounce, 6, 3);

  // Filter snout
  ctx.fillStyle = '#334155';
  ctx.fillRect(16, 8 + bounce, 4, 4);

  // Held Item Icon
  if (player.heldItem) {
    ctx.fillStyle = player.heldItem === 'CHRONO_SPORE' ? PALETTE.past.specimenGreen : '#f59e0b';
    ctx.beginPath();
    ctx.arc(12, -8 + Math.sin(time * 4) * 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Nova: 2024 Exoskeleton Survivalist with Cyan Visor
 */
function drawNovaSurvivalist(ctx: CanvasRenderingContext2D, player: Player, time: number) {
  ctx.save();
  ctx.translate(player.x, player.y);

  if (player.facing === 'left') {
    ctx.scale(-1, 1);
    ctx.translate(-player.width, 0);
  }

  const bounce = Math.abs(player.vx) > 10 ? Math.sin(time * 14) * 2 : 0;

  // Armor legs
  ctx.fillStyle = '#0f172a';
  if (Math.abs(player.vx) > 10) {
    const legSwing = Math.sin(time * 14) * 6;
    ctx.fillRect(4 + legSwing, 22, 6, 10);
    ctx.fillRect(14 - legSwing, 22, 6, 10);
  } else {
    ctx.fillRect(5, 22, 5, 10);
    ctx.fillRect(14, 22, 5, 10);
  }
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 22, 6, 10);
  ctx.strokeRect(13, 22, 6, 10);

  // Armor torso with glowing green bio-conduit
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(3, 10 + bounce, 18, 14);
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 10 + bounce, 18, 14);

  ctx.strokeStyle = PALETTE.future.toxicGreen;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(6, 13 + bounce);
  ctx.lineTo(16, 19 + bounce);
  ctx.stroke();

  // Helmet with glowing cyan visor
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(6, 1 + bounce, 14, 11);
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 1 + bounce, 14, 11);

  ctx.fillStyle = PALETTE.future.cyanEnergy;
  ctx.fillRect(12, 4 + bounce, 7, 3);

  // Held Item Icon
  if (player.heldItem) {
    ctx.fillStyle = player.heldItem === 'CHRONO_BATTERY' ? PALETTE.future.toxicGreen : '#f59e0b';
    ctx.beginPath();
    ctx.arc(12, -8 + Math.sin(time * 4) * 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Goliath: Biomechanical Q-Learning Mutant Sentinel (Inspired by reference art)
 */
function drawGoliathSentinel(ctx: CanvasRenderingContext2D, ai: RLAgent, time: number) {
  ctx.save();
  ctx.translate(ai.x, ai.y);

  if (ai.facing === 'left') {
    ctx.scale(-1, 1);
    ctx.translate(-ai.width, 0);
  }

  const hoverY = Math.sin(time * 4) * 1.5;

  // Massive Mutated Legs
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(2, 20 + hoverY, 10, 12);
  ctx.fillRect(16, 20 + hoverY, 10, 12);
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(2, 20 + hoverY, 10, 12);
  ctx.strokeRect(16, 20 + hoverY, 10, 12);

  // Huge Torso with Yellow Hazard Arm Guard
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 6 + hoverY, 28, 16);
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(0, 6 + hoverY, 28, 16);

  ctx.fillStyle = PALETTE.future.hazardYellow;
  ctx.fillRect(18, 10 + hoverY, 10, 12);
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 10 + hoverY, 10, 12);

  // Glass Mutagen Vat on Spine with Bubbles
  ctx.fillStyle = PALETTE.future.toxicGreen;
  ctx.fillRect(-6, 4 + hoverY, 8, 16);
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 2;
  ctx.strokeRect(-6, 4 + hoverY, 8, 16);

  // Rising bubble
  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.arc(-2, 8 + ((time * 15) % 10) + hoverY, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Heavy Mask / Head
  ctx.fillStyle = '#475569';
  ctx.fillRect(6, -2 + hoverY, 16, 12);
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(6, -2 + hoverY, 16, 12);

  // Cyclopean Visor Eye (Adaptive state colors: green, cyan, purple, red)
  ctx.fillStyle = ai.eyeColor;
  ctx.fillRect(12, 2 + hoverY, 8, 4);

  // Action text badge
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(ai.currentAction.replace('_', ' '), ai.width / 2, -8 + hoverY);

  ctx.restore();
}

function drawAcousticBeacon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  isPast: boolean
) {
  const pulse = (time * 60) % 55;
  ctx.strokeStyle = isPast
    ? `rgba(245, 158, 11, ${1 - pulse / 55})`
    : `rgba(34, 197, 94, ${1 - pulse / 55})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, pulse, 0, Math.PI * 2);
  ctx.stroke();
}

function drawComicPrompt(
  ctx: CanvasRenderingContext2D,
  prompt: string,
  x: number,
  y: number,
  time: number,
  isPast: boolean
) {
  ctx.save();
  const bounce = Math.sin(time * 6) * 3;
  ctx.font = 'bold 11px sans-serif';
  const textWidth = ctx.measureText(prompt).width;
  const padX = 10;
  const boxW = textWidth + padX * 2;
  const boxH = 24;
  const boxX = x - boxW / 2;
  const boxY = y - 32 + bounce;

  ctx.fillStyle = isPast ? '#451a03' : '#052e16';
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = isPast ? PALETTE.past.amberLight : PALETTE.future.toxicGreen;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(prompt, x, boxY + boxH / 2);

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], timeline: TimelineType) {
  particles.forEach((p) => {
    if (p.timeline && p.timeline !== timeline && p.timeline !== 'ALL') return;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[], timeline: TimelineType) {
  ctx.save();
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  texts.forEach((ft) => {
    if (ft.timeline !== timeline && ft.timeline !== 'BOTH') return;
    ctx.globalAlpha = ft.alpha;
    ctx.strokeStyle = PALETTE.ink.black;
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  });
  ctx.restore();
}

function renderDieselpunkRift(
  ctx: CanvasRenderingContext2D,
  midX: number,
  h: number,
  time: number,
  activeFocus: TimelineType
) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(midX - 16, 0, 32, h);

  // Jagged ink fracture line
  ctx.strokeStyle = PALETTE.ink.black;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(midX, 0);
  for (let y = 0; y < h; y += 14) {
    const jitter = Math.sin(y * 0.08 + time * 5) * 5;
    ctx.lineTo(midX + jitter, y);
  }
  ctx.lineTo(midX, h);
  ctx.stroke();

  // Core lightning glow
  ctx.strokeStyle = activeFocus === 'PAST' ? PALETTE.past.amberLight : PALETTE.future.toxicGreen;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Sparks
  ctx.fillStyle = PALETTE.future.bioAcid;
  for (let i = 0; i < 5; i++) {
    const py = (time * 90 + i * 120) % h;
    const px = midX + Math.sin(py * 0.06 + time * 4) * 8;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderTimelineHeaders(
  ctx: CanvasRenderingContext2D,
  midX: number,
  w: number,
  activeFocus: TimelineType
) {
  ctx.save();
  ctx.font = 'bold 11px monospace';

  // Past Label
  ctx.fillStyle = activeFocus === 'PAST' ? PALETTE.past.amberLight : PALETTE.past.bronze;
  ctx.textAlign = 'left';
  ctx.fillText('SECTOR 1962 · COLD WAR CHRONO-BUNKER', 18, 26);

  // Future Label
  ctx.fillStyle = activeFocus === 'FUTURE' ? PALETTE.future.toxicGreen : '#15803d';
  ctx.textAlign = 'right';
  ctx.fillText('SECTOR 2024 · MUTAGENIC BREACH RUINS', w - 18, 26);

  ctx.restore();
}
