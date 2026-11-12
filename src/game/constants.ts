/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// World & Physics constants (all tunable in one place)
export const TILE_SIZE = 32;
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;
export const MAP_COLS = 40; // 40 * 32 = 1280px
export const MAP_ROWS = 23; // ~736px, fits 720px viewport

// Physics specifications
export const GRAVITY = 1800; // px/s²
export const PLAYER_SPEED = 220; // px/s
export const JUMP_VELOCITY = -620; // px/s
export const CLIMB_SPEED = 140; // px/s
export const AI_SPEED = 160; // px/s
export const AI_JUMP_VELOCITY = -540; // px/s

// Controls & Feel tuning
export const COYOTE_TIME = 0.1; // seconds
export const JUMP_BUFFER_TIME = 0.1; // seconds

// Collision & Tile IDs
export const TILE_EMPTY = 0;
export const TILE_SOLID = 1;
export const TILE_ONEWAY = 2;
export const TILE_LADDER = 3;

// Dieselpunk Comic-Ink Palette
export const PALETTE = {
  ink: {
    black: '#06070a',
    lineThick: 3,
    lineThin: 1.5,
    halftoneDot: 'rgba(6, 7, 10, 0.25)',
  },
  past: {
    // 1962 Warm, clean, industrial Cold War chrono-bunker
    skyTop: '#18120e',
    skyBottom: '#2d1810',
    brickDark: '#361811',
    brickMain: '#5a2318',
    brickHighlight: '#7d3324',
    mortar: '#120705',
    steelGirder: '#2b3644',
    steelHighlight: '#47596f',
    amberGlow: 'rgba(245, 158, 11, 0.45)',
    amberLight: '#f59e0b',
    brass: '#d97706',
    bronze: '#b45309',
    copper: '#c2410c',
    hazmatYellow: '#eab308',
    specimenGreen: '#10b981',
    waterBlue: 'rgba(14, 116, 144, 0.85)',
  },
  future: {
    // 2024 Overgrown, rusted, green-tinted mutagenic ruins
    skyTop: '#060d09',
    skyBottom: '#0e1d15',
    rustDark: '#14171d',
    rustMain: '#241b18',
    rustCorroded: '#3f251d',
    steelDecayed: '#16221c',
    toxicGreen: '#22c55e',
    toxicGreenGlow: 'rgba(34, 197, 94, 0.55)',
    bioAcid: '#4ade80',
    bioTendrilDark: '#052e16',
    bioTendrilMain: '#14532d',
    bioTendrilLight: '#16a34a',
    laserRed: '#ef4444',
    laserRedGlow: 'rgba(239, 68, 68, 0.8)',
    hazardYellow: '#eab308',
    cyanEnergy: '#06b6d4',
  },
};

// Initial Player Positions
export const INIT_PAST_PLAYER = {
  x: 96,
  y: 544,
};

export const INIT_FUTURE_PLAYER = {
  x: 96,
  y: 544,
};

export const INIT_AI = {
  x: 960,
  y: 544,
};

// Precise World Entity Locations (Exact x-coordinates as per spec)
export const OBJECT_LOCS = {
  // Region 1: Specimen Altar & Soil / Tree
  seedPickup: { x: 160, y: 550, w: 28, h: 28 }, // Specimen Altar
  keycardPedestal: { x: 190, y: 224, w: 26, h: 26 }, // Security Desk in Past
  terraceLadder: { x: 224, y: 256, w: 32, h: 320 }, // Terrace Ladder (x=224)
  timeCapsule: { x: 320, y: 224, w: 34, h: 34 }, // Time Capsule Safe (x=320)
  soilBed: { x: 416, y: 550, w: 52, h: 24 }, // Loam Bed (x=416)
  treeTrunk: { x: 420, y: 224, w: 44, h: 352 }, // Colossal Bio-Tendril Tree (x=420)

  // Region 2: Upper Terrace Consoles & Sluice
  securityConsole: { x: 480, y: 224, w: 38, h: 38 }, // Security Console (x=480)
  laserBarrier: { x: 540, y: 192, w: 14, h: 64 }, // Laser Grid (x=540)
  sluiceLadder: { x: 576, y: 416, w: 32, h: 160 }, // Sluice ladder (x=576)
  sluiceValve: { x: 580, y: 416, w: 32, h: 32 }, // Sluice Valve (x=580)
  chronoVaultCore: { x: 580, y: 224, w: 38, h: 38 }, // Vault Terminal (x=580)

  // Region 3: Canal Bed & East Sector
  aqueductCanal: { x: 672, y: 576, w: 160, h: 48 }, // Canal bed
  batteryPickup: { x: 740, y: 580, w: 26, h: 24 }, // Canal Battery (x=740)
  sectorArchway: { x: 864, y: 480, w: 32, h: 96 }, // Sector Archway (x=864)
  eastLadder: { x: 992, y: 256, w: 32, h: 320 }, // East Ladder (x=992)

  // Region 4: Resonance Plates & Portals
  pastResonancePlate: { x: 1040, y: 248, w: 54, h: 14 }, // Resonance Plate (x=1040)
  futureResonancePlate: { x: 1040, y: 248, w: 54, h: 14 }, // Resonance Plate (x=1040)
  hazardEmitter: { x: 1080, y: 550, w: 36, h: 26 }, // Hazard arc emitter (x=1080)
  chronoGate: { x: 1180, y: 160, w: 72, h: 96 }, // Chrono-Gate (x=1180)
  auxiliarySwitch: { x: 1240, y: 562, w: 48, h: 14 }, // Auxiliary Switch for Goliath (x=1240)
};

// Hazard Arc Vent Timing (in seconds)
export const VENT_CYCLE_TIME = 5.0; // repeating 5s loop
export const VENT_WARN_START = 2.8; // warning hum & yellow sparks start
export const VENT_ON_START = 3.6; // lethal electric arc active
export const VENT_ON_END = 4.8; // arc powers off
