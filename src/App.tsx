/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;
  const GROUND_HEIGHT = 50;

  // Use refs for mutable game state to avoid re-renders during the game loop
  const gameRef = useRef({
    player: {
      x: 50,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - 40,
      width: 40,
      height: 40,
      dy: 0,
      gravity: 0.6,
      jumpPower: -12,
      isJumping: false,
    },
    obstacles: [] as any[],
    gameSpeed: 5,
    score: 0,
    animationFrameId: 0,
    spawnTimer: 0,
  });

  const jump = () => {
    const state = gameRef.current;
    if (!state.player.isJumping && gameState === 'playing') {
      state.player.dy = state.player.jumpPower;
      state.player.isJumping = true;
    }
  };

  const startGame = () => {
    gameRef.current = {
      player: {
        x: 50,
        y: CANVAS_HEIGHT - GROUND_HEIGHT - 40,
        width: 40,
        height: 40,
        dy: 0,
        gravity: 0.6,
        jumpPower: -12,
        isJumping: false,
      },
      obstacles: [],
      gameSpeed: 5,
      score: 0,
      animationFrameId: 0,
      spawnTimer: 0,
    };
    setScore(0);
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'playing') {
          jump();
        } else {
          startGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameRef.current;

    const update = () => {
      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Sky/Background
      ctx.fillStyle = '#e0f2fe'; // sky-100
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Ground
      ctx.fillStyle = '#334155'; // slate-700
      ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

      // Update & Draw Player
      state.player.dy += state.player.gravity;
      state.player.y += state.player.dy;

      // Ground collision
      if (state.player.y + state.player.height >= CANVAS_HEIGHT - GROUND_HEIGHT) {
        state.player.y = CANVAS_HEIGHT - GROUND_HEIGHT - state.player.height;
        state.player.dy = 0;
        state.player.isJumping = false;
      }

      ctx.fillStyle = '#3b82f6'; // blue-500
      ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);

      // Spawn Obstacles
      state.spawnTimer--;
      if (state.spawnTimer <= 0) {
        const minHeight = 20;
        const maxHeight = 70;
        const height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        state.obstacles.push({
          x: CANVAS_WIDTH,
          y: CANVAS_HEIGHT - GROUND_HEIGHT - height,
          width: 30,
          height: height,
        });
        
        // Randomize next spawn based on speed
        const minSpawnTime = 50;
        const maxSpawnTime = 120;
        state.spawnTimer = Math.floor(Math.random() * (maxSpawnTime - minSpawnTime + 1) + minSpawnTime) / (state.gameSpeed / 5);
      }

      // Update & Draw Obstacles
      ctx.fillStyle = '#ef4444'; // red-500
      for (let i = 0; i < state.obstacles.length; i++) {
        const obs = state.obstacles[i];
        obs.x -= state.gameSpeed;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Collision Detection (AABB)
        if (
          state.player.x < obs.x + obs.width &&
          state.player.x + state.player.width > obs.x &&
          state.player.y < obs.y + obs.height &&
          state.player.y + state.player.height > obs.y
        ) {
          setGameState('gameover');
          return; // Stop updating loop
        }
      }

      // Remove off-screen obstacles
      state.obstacles = state.obstacles.filter(obs => obs.x + obs.width > 0);

      // Update Score & Speed
      state.score += 1;
      if (state.score % 500 === 0) {
        state.gameSpeed += 0.5; // Increase speed over time
      }

      // Draw Score
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText(`Score: ${Math.floor(state.score / 10)}`, 20, 40);

      // Loop
      state.animationFrameId = requestAnimationFrame(update);
    };

    state.animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(state.animationFrameId);
    };
  }, [gameState]);

  // Sync score to React state for UI when game over
  useEffect(() => {
    if (gameState === 'gameover') {
      setScore(Math.floor(gameRef.current.score / 10));
    }
  }, [gameState]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="relative bg-white p-2 sm:p-4 rounded-2xl shadow-2xl w-full max-w-4xl">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bg-sky-100 rounded-xl block w-full h-auto cursor-pointer"
          onClick={() => {
            if (gameState === 'playing') jump();
            else startGame();
          }}
        />
        
        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl text-white backdrop-blur-sm">
            <h1 className="text-5xl font-black mb-4 tracking-tight text-white drop-shadow-lg">Endless Runner</h1>
            <p className="mb-8 text-xl text-slate-200">Press <kbd className="bg-slate-800 border border-slate-600 px-3 py-1 rounded-md shadow-sm">Space</kbd> or Click to Jump</p>
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-full font-bold text-xl transition-all hover:scale-105 shadow-lg active:scale-95"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl text-white backdrop-blur-sm">
            <h2 className="text-6xl font-black mb-2 text-red-500 drop-shadow-lg tracking-tighter">GAME OVER</h2>
            <p className="text-3xl mb-8 font-medium text-slate-200">Score: {score}</p>
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-white text-slate-900 hover:bg-slate-200 rounded-full font-bold text-xl transition-all hover:scale-105 shadow-lg active:scale-95"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <p className="mt-8 text-slate-400 text-sm font-medium">Use Spacebar or tap the screen to jump. The game gets faster over time!</p>
    </div>
  );
}
