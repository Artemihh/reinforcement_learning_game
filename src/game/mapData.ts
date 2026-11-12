/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MAP_COLS,
  MAP_ROWS,
  TILE_EMPTY,
  TILE_LADDER,
  TILE_ONEWAY,
  TILE_SOLID,
  TILE_SIZE,
} from './constants';
import { PuzzleState, Rect, TimelineType } from '../types/game';

/**
 * Creates the base 1280x720 tile grid (40 cols x 23 rows)
 * Features:
 * - Solid floor at r=18 (y=576) with canal ditch between c=21 and c=26
 * - Stepped access rungs at canal walls so no player can ever be trapped in canal
 * - Upper Terrace catwalk at r=8 (c=6..18, y=256)
 * - Eastern High Catwalk at r=8 (c=30..39, y=256)
 * - Sluice catwalk at r=13 (c=17..21, y=416)
 * - Generator sub-catwalk at r=14 (c=28..36, y=448)
 * - Open doorway archway at c=27 allowing smooth passage across the facility
 */
export function createBaseMap(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < MAP_COLS; c++) {
      // Outer border walls
      if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
        row.push(TILE_SOLID);
      } else if (r === 18) {
        // Ground floor (y=576)
        // Canal depression between cols 21 and 26
        if (c >= 21 && c <= 26) {
          row.push(TILE_EMPTY);
        } else {
          row.push(TILE_SOLID);
        }
      } else if (r === 19 || r === 20) {
        // Canal bottom floor at r=20
        if (c >= 21 && c <= 26 && r === 20) {
          row.push(TILE_SOLID);
        } else if (c >= 21 && c <= 26) {
          row.push(TILE_EMPTY);
        } else {
          row.push(TILE_SOLID);
        }
      } else if (r === 8 && c >= 6 && c <= 18) {
        // Upper Terrace catwalk (y=256) - One-Way Platform
        row.push(TILE_ONEWAY);
      } else if (r === 8 && c >= 30 && c <= 39) {
        // Eastern high sanctuary catwalk (y=256) - One-Way Platform
        row.push(TILE_ONEWAY);
      } else if (r === 13 && c >= 17 && c <= 21) {
        // Sluice valve maintenance catwalk (y=416) - One-Way Platform
        row.push(TILE_ONEWAY);
      } else if (r === 14 && c >= 28 && c <= 36) {
        // Sub-level generator catwalk (y=448) - One-Way Platform
        row.push(TILE_ONEWAY);
      } else if (c === 27 && r >= 9 && r <= 15) {
        // Archway divider wall (doorway cleanly open at r=16, 17, height 64px)
        row.push(TILE_SOLID);
      } else {
        row.push(TILE_EMPTY);
      }
    }
    grid.push(row);
  }
  return grid;
}

export interface LadderVolume {
  x: number;
  y: number;
  w: number;
  h: number;
  timeline: TimelineType | 'BOTH';
}

/**
 * Returns all active ladder / vine volumes in the world
 */
export function getActiveLadderVolumes(timeline: TimelineType, puzzle: PuzzleState): Rect[] {
  const volumes: Rect[] = [];

  // 1. Terrace bronze ladder (Past only)
  // Col 7 (x=224), from upper catwalk r=8 (y=256) down to floor r=18 (y=576)
  if (timeline === 'PAST') {
    volumes.push({ x: 224, y: 224, w: 32, h: 352 });
  }

  // 2. Colossal Bio-Tendril Tree (Future only, when grown)
  // Col 13 (x=416), from upper catwalk r=8 (y=256) down to floor r=18 (y=576)
  if (timeline === 'FUTURE' && puzzle.treeGrown) {
    volumes.push({ x: 416, y: 224, w: 48, h: 352 });
  }

  // 3. Sluice valve ladder (Past only)
  // Col 18 (x=576), from sluice catwalk r=13 (y=416) down to floor r=18 (y=576)
  if (timeline === 'PAST') {
    volumes.push({ x: 576, y: 384, w: 32, h: 192 });
  }

  // 4. Canal Maintenance Ladders (Both Timelines)
  // Left wall of canal (x=672) and right wall (x=832) - runs from y=576 down to y=640
  // Ensures NO PLAYER CAN EVER BE TRAPPED in the canal!
  volumes.push({ x: 672, y: 576, w: 32, h: 64 });
  volumes.push({ x: 832, y: 576, w: 32, h: 64 });

  // 5. East Sector high catwalk maintenance ladder (Both Timelines)
  // Col 31 (x=992), from east catwalk r=8 (y=256) down to floor r=18 (y=576)
  volumes.push({ x: 992, y: 224, w: 32, h: 352 });

  return volumes;
}

/**
 * Check if a bounding box overlaps an active ladder
 */
export function checkLadderOverlap(rect: Rect, timeline: TimelineType, puzzle: PuzzleState): boolean {
  const ladders = getActiveLadderVolumes(timeline, puzzle);
  for (const lad of ladders) {
    if (
      rect.x < lad.x + lad.w &&
      rect.x + rect.w > lad.x &&
      rect.y < lad.y + lad.h &&
      rect.y + rect.h > lad.y
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Checks horizontal collision against solid tiles.
 * CRITICAL: Shrinks the bottom by 4px so the floor underneath the player NEVER
 * falsely flags horizontal movement as blocked!
 */
export function checkHorizontalCollision(
  rect: Rect,
  baseGrid: number[][]
): { hit: boolean; hitX: number } {
  // Test only the body of the player (excluding bottom 4px that touch floor)
  const top = rect.y;
  const bottom = rect.y + rect.h - 4;

  const minCol = Math.max(0, Math.floor(rect.x / TILE_SIZE));
  const maxCol = Math.min(MAP_COLS - 1, Math.floor((rect.x + rect.w - 1) / TILE_SIZE));
  const minRow = Math.max(0, Math.floor(top / TILE_SIZE));
  const maxRow = Math.min(MAP_ROWS - 1, Math.floor(bottom / TILE_SIZE));

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (baseGrid[r][c] === TILE_SOLID) {
        return { hit: true, hitX: c * TILE_SIZE };
      }
    }
  }

  return { hit: false, hitX: 0 };
}

/**
 * Checks vertical collision against solid tiles and one-way platforms.
 */
export function checkVerticalCollision(
  oldY: number,
  newY: number,
  rect: Rect,
  vy: number,
  moveDown: boolean,
  baseGrid: number[][]
): {
  hitGround: boolean;
  groundY: number;
  hitCeiling: boolean;
  ceilingY: number;
} {
  const left = rect.x + 2;
  const right = rect.x + rect.w - 3; // slight horizontal inset to avoid wall snags

  const minCol = Math.max(0, Math.floor(left / TILE_SIZE));
  const maxCol = Math.min(MAP_COLS - 1, Math.floor(right / TILE_SIZE));

  // 1. Moving Downwards (Falling)
  if (vy >= 0) {
    const bottomNew = newY + rect.h;
    const oldBottom = oldY + rect.h;

    const testRow = Math.floor(bottomNew / TILE_SIZE);
    if (testRow >= 0 && testRow < MAP_ROWS) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = baseGrid[testRow][c];

        // Solid Floor
        if (tile === TILE_SOLID) {
          const surfaceY = testRow * TILE_SIZE;
          if (bottomNew >= surfaceY) {
            return {
              hitGround: true,
              groundY: surfaceY - rect.h,
              hitCeiling: false,
              ceilingY: 0,
            };
          }
        }

        // One-Way Platform (catwalks)
        if (tile === TILE_ONEWAY && !moveDown) {
          const surfaceY = testRow * TILE_SIZE;
          // Must have been above or at surface before, and now crossing it
          if (oldBottom <= surfaceY + 12 && bottomNew >= surfaceY) {
            return {
              hitGround: true,
              groundY: surfaceY - rect.h,
              hitCeiling: false,
              ceilingY: 0,
            };
          }
        }
      }
    }
  }

  // 2. Moving Upwards (Jumping)
  if (vy < 0) {
    const topNew = newY;
    const testRow = Math.floor(topNew / TILE_SIZE);
    if (testRow >= 0 && testRow < MAP_ROWS) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = baseGrid[testRow][c];
        // Solid ceiling (One-Way platforms do NOT block upward jumps)
        if (tile === TILE_SOLID) {
          const undersideY = (testRow + 1) * TILE_SIZE;
          if (topNew <= undersideY) {
            return {
              hitGround: false,
              groundY: 0,
              hitCeiling: true,
              ceilingY: undersideY,
            };
          }
        }
      }
    }
  }

  return { hitGround: false, groundY: 0, hitCeiling: false, ceilingY: 0 };
}
