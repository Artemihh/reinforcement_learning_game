/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameMode, GameState, KeyControls, TimelineType } from './types/game';
import { GameEngine } from './game/engine';
import { renderGameScene } from './game/renderer';
import { sound } from './audio/synth';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { AIBrainInspector } from './components/AIBrainInspector';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import { HintModal } from './components/HintModal';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [gameMode, setGameMode] = useState<GameMode>('SOLO');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAIBrainOpen, setIsAIBrainOpen] = useState<boolean>(false);
  const [isHintOpen, setIsHintOpen] = useState<boolean>(false);
  const [activeFocus, setActiveFocus] = useState<TimelineType>('PAST');
  const [timeElapsed, setTimeElapsed] = useState<number>(0);

  // References for game loop & canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const keysHeld = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameRef = useRef<number | null>(null);

  // Initialize Game Engine once
  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }

  // Handle victory callback
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.onVictory = () => {
        setGameState('VICTORY');
        setTimeElapsed(engineRef.current?.time ?? 0);
      };
    }
  }, []);

  // Update game mode in engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.gameMode = gameMode;
    }
  }, [gameMode]);

  // Handle start game
  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    if (engineRef.current) {
      engineRef.current.resetLevel();
      engineRef.current.gameMode = mode;
      engineRef.current.activeTimelineFocus = 'PAST';
    }
    setActiveFocus('PAST');
    setGameState('PLAYING');
    sound.startAmbientHum();
  };

  const handleRestartLevel = () => {
    if (engineRef.current) {
      engineRef.current.resetLevel();
    }
    setIsAIBrainOpen(false);
    setGameState('PLAYING');
  };

  const handleRestartPhase = () => {
    if (engineRef.current) {
      engineRef.current.restartCurrentPhase();
    }
    setGameState('PLAYING');
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleSwapFocus = () => {
    const next = activeFocus === 'PAST' ? 'FUTURE' : 'PAST';
    setActiveFocus(next);
    if (engineRef.current) {
      engineRef.current.activeTimelineFocus = next;
    }
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Audio unlock on user gesture
      sound.startAmbientHum();

      // Global hotkeys
      if (e.code === 'Escape') {
        e.preventDefault();
        if (isHintOpen) {
          setIsHintOpen(false);
        } else if (isAIBrainOpen) {
          setIsAIBrainOpen(false);
        } else if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
        return;
      }

      if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if (e.code === 'KeyH' && gameState === 'PLAYING') {
        e.preventDefault();
        setIsHintOpen((prev) => !prev);
        return;
      }

      if (e.code === 'KeyB' && gameState === 'PLAYING') {
        e.preventDefault();
        setIsAIBrainOpen((prev) => !prev);
        return;
      }

      if (e.code === 'Tab' && gameState === 'PLAYING' && gameMode === 'SOLO') {
        e.preventDefault();
        handleSwapFocus();
        return;
      }

      // Title screen quick-start
      if ((e.code === 'Enter' || e.code === 'Space') && gameState === 'TITLE_MENU') {
        e.preventDefault();
        handleStartGame(gameMode);
        return;
      }

      // Edge-triggered actions
      if (gameState === 'PLAYING' && engineRef.current) {
        if (e.code === 'KeyE') {
          e.preventDefault();
          engineRef.current.triggerSmartInteract(gameMode === 'SOLO' ? activeFocus : 'PAST');
        }
        if (e.code === 'Enter' || e.code === 'Slash') {
          e.preventDefault();
          engineRef.current.triggerSmartInteract(gameMode === 'SOLO' ? activeFocus : 'FUTURE');
        }
        if (e.code === 'KeyQ') {
          e.preventDefault();
          engineRef.current.triggerWhistle(gameMode === 'SOLO' ? activeFocus : 'PAST');
        }
        if (e.code === 'Period') {
          e.preventDefault();
          engineRef.current.triggerWhistle('FUTURE');
        }
      }

      keysHeld.current.add(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeld.current.delete(e.code);
    };

    const handleBlur = () => {
      keysHeld.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, gameMode, activeFocus, isAIBrainOpen]);

  // Main 60fps Animation Loop
  useEffect(() => {
    let active = true;

    const loop = (timestamp: number) => {
      if (!active) return;

      const rawDt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      const dt = Math.min(rawDt, 0.05);

      const canvas = canvasRef.current;
      const engine = engineRef.current;

      if (canvas && engine) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Adjust canvas internal size to matched container
          const rect = canvas.getBoundingClientRect();
          if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
          }

          // If game is playing, update physics & simulation
          if (gameState === 'PLAYING') {
            const held = keysHeld.current;
            const controls: KeyControls = {
              pastLeft: held.has('KeyA'),
              pastRight: held.has('KeyD'),
              pastUp: held.has('KeyW'),
              pastDown: held.has('KeyS'),
              pastInteract: held.has('KeyE'),
              pastWhistle: held.has('KeyQ'),

              futureLeft: held.has('ArrowLeft'),
              futureRight: held.has('ArrowRight'),
              futureUp: held.has('ArrowUp'),
              futureDown: held.has('ArrowDown'),
              futureInteract: held.has('Enter') || held.has('Slash'),
              futureWhistle: held.has('Period'),
            };

            engine.update(dt, controls);
          }

          // Render game scene
          renderGameScene({
            ctx,
            width: canvas.width,
            height: canvas.height,
            pastPlayer: engine.pastPlayer,
            futurePlayer: engine.futurePlayer,
            aiAgent: engine.aiAgent,
            puzzle: engine.puzzle,
            particles: engine.particles,
            floatingTexts: engine.floatingTexts,
            baseGrid: engine.baseGrid,
            cameraPast: engine.cameraPast,
            cameraFuture: engine.cameraFuture,
            time: engine.time,
            activeTimelineFocus: engine.activeTimelineFocus,
            hazardPulseActive: engine.hazardPulseActive,
            activeWhistle: engine.activeWhistle,
            shakeTimer: engine.shakeTimer,
            interactPromptPast: engine.getPastInteractPrompt(),
            interactPromptFuture: engine.getFutureInteractPrompt(),
          });
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameState]);

  const engine = engineRef.current;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none flex flex-col">
      {/* Canvas Viewport */}
      <div className="relative flex-1 w-full h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full block bg-slate-950"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* In-Game HUD overlay */}
        {gameState === 'PLAYING' && engine && (
          <GameHUD
            gameMode={gameMode}
            activeFocus={activeFocus}
            pastHeldItem={engine.pastPlayer.heldItem}
            futureHeldItem={engine.futurePlayer.heldItem}
            puzzle={engine.puzzle}
            aiAgent={engine.aiAgent}
            currentHint={engine.getCurrentMissionHint()}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenPause={() => setGameState('PAUSED')}
            onToggleAIBrain={() => setIsAIBrainOpen(true)}
            onOpenHints={() => setIsHintOpen(true)}
            onSwapFocus={handleSwapFocus}
          />
        )}
      </div>

      {/* Title Screen Overlay */}
      {gameState === 'TITLE_MENU' && (
        <div className="absolute inset-0 z-40">
          <TitleScreen
            onStartGame={handleStartGame}
            gameMode={gameMode}
            setGameMode={setGameMode}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        </div>
      )}

      {/* AI Brain Telemetry & Q-Table Inspector */}
      {engine && (
        <AIBrainInspector
          isOpen={isAIBrainOpen}
          onClose={() => setIsAIBrainOpen(false)}
          aiAgent={engine.aiAgent}
          qEngine={engine.qEngine}
        />
      )}

      {/* Mission Field Guide & Hint Modal */}
      {engine && (
        <HintModal
          isOpen={isHintOpen}
          onClose={() => setIsHintOpen(false)}
          puzzle={engine.puzzle}
          currentHint={engine.getCurrentMissionHint()}
          aiAgent={engine.aiAgent}
        />
      )}

      {/* Pause Menu Modal */}
      <PauseModal
        isOpen={gameState === 'PAUSED'}
        onResume={() => setGameState('PLAYING')}
        onRestartPhase={handleRestartPhase}
        onRestartLevel={handleRestartLevel}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        gameMode={gameMode}
      />

      {/* Victory Level Complete Modal */}
      {engine && (
        <VictoryModal
          isOpen={gameState === 'VICTORY'}
          onRestart={handleRestartLevel}
          timeElapsed={timeElapsed}
          aiAgent={engine.aiAgent}
          puzzle={engine.puzzle}
        />
      )}
    </div>
  );
}
