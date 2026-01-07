
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_WIDTH, 
  PLAYER_HEIGHT, 
  PLAYER_SPEED,
  INVADER_ROWS,
  INVADER_COLS,
  INVADER_WIDTH,
  INVADER_HEIGHT,
  INVADER_SPACING,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  BULLET_SPEED,
  COLORS
} from '../constants';
import { Player, Invader, Bullet, Particle, GameStatus } from '../types';

interface GameEngineProps {
  status: GameStatus;
  onGameOver: (score: number) => void;
  onWin: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onLivesUpdate: (lives: number) => void;
  input: { left: boolean; right: boolean; fire: boolean };
}

const GameEngine: React.FC<GameEngineProps> = ({ 
  status, 
  onGameOver, 
  onWin, 
  onScoreUpdate, 
  onLivesUpdate,
  input 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Initializing with undefined to satisfy the expected 1 argument for useRef in some strict environments
  const requestRef = useRef<number | undefined>(undefined);
  
  // Game State Refs (to avoid re-renders)
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - 60,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PLAYER_SPEED,
    lives: 3
  });

  const invadersRef = useRef<Invader[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const invaderDirection = useRef(1); // 1 for right, -1 for left
  const invaderSpeed = useRef(1);
  const lastFireTime = useRef(0);

  const initLevel = useCallback(() => {
    const invaders: Invader[] = [];
    const startX = (CANVAS_WIDTH - (INVADER_COLS * (INVADER_WIDTH + INVADER_SPACING))) / 2;
    const startY = 80;

    for (let row = 0; row < INVADER_ROWS; row++) {
      for (let col = 0; col < INVADER_COLS; col++) {
        invaders.push({
          x: startX + col * (INVADER_WIDTH + INVADER_SPACING),
          y: startY + row * (INVADER_HEIGHT + INVADER_SPACING),
          width: INVADER_WIDTH,
          height: INVADER_HEIGHT,
          type: row === 0 ? 'large' : row < 3 ? 'medium' : 'small',
          points: (INVADER_ROWS - row) * 10,
          alive: true
        });
      }
    }
    invadersRef.current = invaders;
    invaderSpeed.current = 1;
    bulletsRef.current = [];
  }, []);

  useEffect(() => {
    if (status === 'PLAYING') {
      initLevel();
      onLivesUpdate(3);
      onScoreUpdate(0);
      playerRef.current.lives = 3;
      scoreRef.current = 0;
    }
  }, [status, initLevel, onLivesUpdate, onScoreUpdate]);

  const spawnExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        color
      });
    }
  };

  const update = () => {
    if (status !== 'PLAYING') return;

    // Move Player
    if (input.left && playerRef.current.x > 0) playerRef.current.x -= PLAYER_SPEED;
    if (input.right && playerRef.current.x < CANVAS_WIDTH - PLAYER_WIDTH) playerRef.current.x += PLAYER_SPEED;

    // Player Shooting
    const now = Date.now();
    if (input.fire && now - lastFireTime.current > 400) {
      bulletsRef.current.push({
        x: playerRef.current.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
        y: playerRef.current.y - 10,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        speed: -BULLET_SPEED,
        fromPlayer: true
      });
      lastFireTime.current = now;
    }

    // Move Invaders
    let edgeReached = false;
    invadersRef.current.forEach(invader => {
      if (!invader.alive) return;
      invader.x += invaderDirection.current * invaderSpeed.current;
      if (invader.x + invader.width > CANVAS_WIDTH - 10 || invader.x < 10) edgeReached = true;
      
      // Check collision with player
      if (invader.y + invader.height > playerRef.current.y) {
        onGameOver(scoreRef.current);
      }
    });

    if (edgeReached) {
      invaderDirection.current *= -1;
      invadersRef.current.forEach(invader => {
        invader.y += 20;
      });
      invaderSpeed.current += 0.1;
    }

    // Invader Shooting
    if (Math.random() < 0.02) {
      const activeInvaders = invadersRef.current.filter(i => i.alive);
      if (activeInvaders.length > 0) {
        const shooter = activeInvaders[Math.floor(Math.random() * activeInvaders.length)];
        bulletsRef.current.push({
          x: shooter.x + shooter.width / 2,
          y: shooter.y + shooter.height,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          speed: BULLET_SPEED - 2,
          fromPlayer: false
        });
      }
    }

    // Update Bullets
    bulletsRef.current = bulletsRef.current.filter(bullet => {
      bullet.y += bullet.speed;

      // Player bullet hit invader
      if (bullet.fromPlayer) {
        for (const invader of invadersRef.current) {
          if (invader.alive &&
              bullet.x < invader.x + invader.width &&
              bullet.x + bullet.width > invader.x &&
              bullet.y < invader.y + invader.height &&
              bullet.y + bullet.height > invader.y) {
            invader.alive = false;
            scoreRef.current += invader.points;
            onScoreUpdate(scoreRef.current);
            spawnExplosion(invader.x + invader.width / 2, invader.y + invader.height / 2, COLORS.CYAN);
            return false;
          }
        }
      } else {
        // Invader bullet hit player
        if (bullet.x < playerRef.current.x + PLAYER_WIDTH &&
            bullet.x + bullet.width > playerRef.current.x &&
            bullet.y < playerRef.current.y + PLAYER_HEIGHT &&
            bullet.y + bullet.height > playerRef.current.y) {
          playerRef.current.lives--;
          onLivesUpdate(playerRef.current.lives);
          spawnExplosion(playerRef.current.x + PLAYER_WIDTH / 2, playerRef.current.y + PLAYER_HEIGHT / 2, COLORS.RED);
          if (playerRef.current.lives <= 0) {
            onGameOver(scoreRef.current);
          }
          return false;
        }
      }

      return bullet.y > 0 && bullet.y < CANVAS_HEIGHT;
    });

    // Update Particles
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // Check Win
    if (invadersRef.current.every(i => !i.alive)) {
      onWin(scoreRef.current);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Grid Lines (Stylized background)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1;

    // Draw Player (Neon Ship)
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.GREEN;
    ctx.fillStyle = COLORS.GREEN;
    ctx.beginPath();
    ctx.moveTo(playerRef.current.x + PLAYER_WIDTH / 2, playerRef.current.y);
    ctx.lineTo(playerRef.current.x, playerRef.current.y + PLAYER_HEIGHT);
    ctx.lineTo(playerRef.current.x + PLAYER_WIDTH, playerRef.current.y + PLAYER_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Draw Invaders
    invadersRef.current.forEach(invader => {
      if (!invader.alive) return;
      ctx.shadowBlur = 10;
      ctx.shadowColor = COLORS.PURPLE;
      ctx.fillStyle = COLORS.PURPLE;
      
      // Stylized Invader Shape
      ctx.fillRect(invader.x + 5, invader.y, invader.width - 10, invader.height);
      ctx.fillRect(invader.x, invader.y + 5, invader.width, invader.height - 10);
      // "Eyes"
      ctx.fillStyle = '#fff';
      ctx.fillRect(invader.x + 8, invader.y + 5, 4, 4);
      ctx.fillRect(invader.x + invader.width - 12, invader.y + 5, 4, 4);
    });

    // Draw Bullets
    bulletsRef.current.forEach(bullet => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = bullet.fromPlayer ? COLORS.CYAN : COLORS.RED;
      ctx.fillStyle = bullet.fromPlayer ? COLORS.CYAN : COLORS.RED;
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    ctx.shadowBlur = 0;
  };

  const animate = () => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, input]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden border-2 border-cyan-900/30 rounded-lg shadow-2xl shadow-cyan-500/20">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};

export default GameEngine;
