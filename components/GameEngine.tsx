
import React, { useEffect, useRef, useCallback } from 'react';
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
  input: { left: boolean; right: boolean; fire: boolean; dash: boolean; overdrive: boolean };
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
  const requestRef = useRef<number | undefined>(undefined);
  
  // Use refs for inputs and callbacks to keep the animate loop stable
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const callbacksRef = useRef({ onGameOver, onWin, onScoreUpdate, onLivesUpdate });
  useEffect(() => {
    callbacksRef.current = { onGameOver, onWin, onScoreUpdate, onLivesUpdate };
  }, [onGameOver, onWin, onScoreUpdate, onLivesUpdate]);

  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - 60,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PLAYER_SPEED,
    lives: 3,
    energy: 100,
    isOverdrive: false,
    overdriveTime: 0,
    charge: 0
  });

  const invadersRef = useRef<Invader[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const invaderDirection = useRef(1);
  const invaderSpeed = useRef(1);
  const lastFireTime = useRef(0);
  const lastDashTime = useRef(0);

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
    
    // Reset Player position and state
    playerRef.current.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
    playerRef.current.y = CANVAS_HEIGHT - 60;
    playerRef.current.lives = 3;
    playerRef.current.energy = 100;
    playerRef.current.charge = 0;
    playerRef.current.isOverdrive = false;

    invadersRef.current = invaders;
    invaderSpeed.current = 1;
    bulletsRef.current = [];
    scoreRef.current = 0;
    callbacksRef.current.onScoreUpdate(0);
    callbacksRef.current.onLivesUpdate(3);
  }, []);

  useEffect(() => {
    if (status === 'PLAYING') {
      initLevel();
    }
  }, [status, initLevel]);

  const spawnExplosion = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1, color
      });
    }
  };

  const fireBullet = (x: number, y: number, isMega = false, angle = 0) => {
    const vy = -BULLET_SPEED;
    
    bulletsRef.current.push({
      x: x - (isMega ? 6 : 2),
      y: y,
      width: isMega ? 12 : BULLET_WIDTH,
      height: isMega ? 24 : BULLET_HEIGHT,
      speed: vy,
      fromPlayer: true,
      isMega
    });
  };

  const update = () => {
    if (status !== 'PLAYING') return;

    const currentInput = inputRef.current;
    const p = playerRef.current;
    let currentSpeed = p.isOverdrive ? PLAYER_SPEED * 1.5 : PLAYER_SPEED;

    // Overdrive Logic
    if (p.isOverdrive) {
      p.overdriveTime--;
      if (p.overdriveTime <= 0) p.isOverdrive = false;
    } else if (currentInput.overdrive && p.energy >= 100) {
      p.isOverdrive = true;
      p.overdriveTime = 300;
      p.energy = 0;
      spawnExplosion(p.x + PLAYER_WIDTH/2, p.y, COLORS.PINK, 20);
    }
    
    if (!p.isOverdrive && p.energy < 100) p.energy += 0.3;

    // Dash Logic
    if (currentInput.dash && Date.now() - lastDashTime.current > 800) {
      if (currentInput.left) p.x -= 120;
      if (currentInput.right) p.x += 120;
      lastDashTime.current = Date.now();
      spawnExplosion(p.x + PLAYER_WIDTH/2, p.y + PLAYER_HEIGHT/2, COLORS.CYAN, 10);
    }

    // Move Player
    if (currentInput.left) p.x -= currentSpeed;
    if (currentInput.right) p.x += currentSpeed;
    p.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, p.x));

    // Shooting Logic
    const now = Date.now();
    if (currentInput.fire) {
      if (p.isOverdrive) {
        if (now - lastFireTime.current > 120) {
          fireBullet(p.x + PLAYER_WIDTH / 2, p.y);
          fireBullet(p.x + PLAYER_WIDTH / 2 - 15, p.y, false, -0.15);
          fireBullet(p.x + PLAYER_WIDTH / 2 + 15, p.y, false, 0.15);
          lastFireTime.current = now;
        }
      } else {
        // Fire one bullet immediately if we haven't fired in a while
        if (p.charge === 0 && now - lastFireTime.current > 400) {
            fireBullet(p.x + PLAYER_WIDTH / 2, p.y);
            lastFireTime.current = now;
        }
        p.charge = Math.min(100, p.charge + 2);
      }
    } else {
      if (p.charge >= 100) {
        fireBullet(p.x + PLAYER_WIDTH / 2, p.y, true);
        lastFireTime.current = now;
      }
      p.charge = 0;
    }

    // Move Invaders
    let edgeReached = false;
    invadersRef.current.forEach(invader => {
      if (!invader.alive) return;
      invader.x += invaderDirection.current * invaderSpeed.current;
      if (invader.x + invader.width > CANVAS_WIDTH - 10 || invader.x < 10) edgeReached = true;
      if (invader.y + invader.height > p.y) callbacksRef.current.onGameOver(scoreRef.current);
    });

    if (edgeReached) {
      invaderDirection.current *= -1;
      invadersRef.current.forEach(invader => { invader.y += 20; });
      invaderSpeed.current += 0.05;
    }

    // Invader Shooting
    if (Math.random() < 0.02) {
      const active = invadersRef.current.filter(i => i.alive);
      if (active.length > 0) {
        const s = active[Math.floor(Math.random() * active.length)];
        bulletsRef.current.push({
          x: s.x + s.width / 2, y: s.y + s.height,
          width: BULLET_WIDTH, height: BULLET_HEIGHT,
          speed: BULLET_SPEED - 2, fromPlayer: false
        });
      }
    }

    // Bullets and Collisions
    bulletsRef.current = bulletsRef.current.filter(bullet => {
      bullet.y += bullet.speed;
      if (bullet.fromPlayer) {
        for (const invader of invadersRef.current) {
          if (invader.alive &&
              bullet.x < invader.x + invader.width &&
              bullet.x + bullet.width > invader.x &&
              bullet.y < invader.y + invader.height &&
              bullet.y + bullet.height > invader.y) {
            invader.alive = false;
            scoreRef.current += invader.points;
            callbacksRef.current.onScoreUpdate(scoreRef.current);
            spawnExplosion(invader.x + invader.width/2, invader.y + invader.height/2, bullet.isMega ? COLORS.PINK : COLORS.CYAN);
            if (!bullet.isMega) return false;
          }
        }
      } else {
        if (bullet.x < p.x + PLAYER_WIDTH && bullet.x + bullet.width > p.x &&
            bullet.y < p.y + PLAYER_HEIGHT && bullet.y + bullet.height > p.y) {
          p.lives--;
          callbacksRef.current.onLivesUpdate(p.lives);
          spawnExplosion(p.x + PLAYER_WIDTH/2, p.y + PLAYER_HEIGHT/2, COLORS.RED, 15);
          if (p.lives <= 0) callbacksRef.current.onGameOver(scoreRef.current);
          return false;
        }
      }
      return bullet.y > 0 && bullet.y < CANVAS_HEIGHT;
    });

    particlesRef.current.forEach(part => { part.x += part.vx; part.y += part.vy; part.life -= 0.025; });
    particlesRef.current = particlesRef.current.filter(part => part.life > 0);

    if (invadersRef.current.length > 0 && invadersRef.current.every(i => !i.alive)) callbacksRef.current.onWin(scoreRef.current);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for(let i=0; i<CANVAS_WIDTH; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,CANVAS_HEIGHT); ctx.stroke(); }
    for(let i=0; i<CANVAS_HEIGHT; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(CANVAS_WIDTH,i); ctx.stroke(); }

    const p = playerRef.current;

    // Particles
    particlesRef.current.forEach(pt => {
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 2, 2);
    });
    ctx.globalAlpha = 1;

    // Player
    ctx.shadowBlur = p.isOverdrive ? 25 : 10;
    ctx.shadowColor = p.isOverdrive ? COLORS.PINK : COLORS.GREEN;
    ctx.fillStyle = p.isOverdrive ? COLORS.PINK : COLORS.GREEN;
    ctx.beginPath();
    ctx.moveTo(p.x + PLAYER_WIDTH/2, p.y);
    ctx.lineTo(p.x, p.y + PLAYER_HEIGHT);
    ctx.lineTo(p.x + PLAYER_WIDTH, p.y + PLAYER_HEIGHT);
    ctx.fill();

    // Meters
    ctx.shadowBlur = 0;
    if (p.charge > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(p.x, p.y + PLAYER_HEIGHT + 6, PLAYER_WIDTH, 4);
      ctx.fillStyle = p.charge >= 100 ? COLORS.CYAN : '#fff';
      ctx.fillRect(p.x, p.y + PLAYER_HEIGHT + 6, (p.charge/100) * PLAYER_WIDTH, 4);
    }
    ctx.fillStyle = 'rgba(189,0,255,0.1)';
    ctx.fillRect(p.x, p.y + PLAYER_HEIGHT + 14, PLAYER_WIDTH, 4);
    ctx.fillStyle = p.energy >= 100 ? COLORS.PURPLE : '#555';
    ctx.fillRect(p.x, p.y + PLAYER_HEIGHT + 14, (p.energy/100) * PLAYER_WIDTH, 4);

    // Invaders
    invadersRef.current.forEach(inv => {
      if (!inv.alive) return;
      ctx.shadowBlur = 10;
      ctx.shadowColor = COLORS.PURPLE;
      ctx.fillStyle = COLORS.PURPLE;
      ctx.fillRect(inv.x + 4, inv.y, inv.width - 8, inv.height);
      ctx.fillRect(inv.x, inv.y + 4, inv.width, inv.height - 8);
    });

    // Bullets
    bulletsRef.current.forEach(b => {
      ctx.shadowBlur = b.isMega ? 25 : 10;
      ctx.shadowColor = b.fromPlayer ? (b.isMega ? COLORS.PINK : COLORS.CYAN) : COLORS.RED;
      ctx.fillStyle = ctx.shadowColor;
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    ctx.shadowBlur = 0;
  };

  const animate = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(animate);
  }, [status]); // Only restart loop if game status changes (Start/Over)

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden border-2 border-cyan-900/30 rounded-lg shadow-2xl">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full max-h-full object-contain" />
    </div>
  );
};

export default GameEngine;
