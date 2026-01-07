
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
import { audio } from '../services/audioService';

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
  const requestRef = useRef<number | null>(null);
  
  // Referências para persistência e performance
  const inputRef = useRef(input);
  const statusRef = useRef(status);
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
  const wasFiringRef = useRef(false);

  // Atualiza refs quando as props mudam
  useEffect(() => { inputRef.current = input; }, [input]);
  useEffect(() => { statusRef.current = status; }, [status]);

  const callbacksRef = useRef({ onGameOver, onWin, onScoreUpdate, onLivesUpdate });
  useEffect(() => {
    callbacksRef.current = { onGameOver, onWin, onScoreUpdate, onLivesUpdate };
  }, [onGameOver, onWin, onScoreUpdate, onLivesUpdate]);

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
    
    playerRef.current = {
      ...playerRef.current,
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      lives: 3,
      energy: 100,
      charge: 0,
      isOverdrive: false
    };

    invadersRef.current = invaders;
    invaderSpeed.current = 1.2;
    invaderDirection.current = 1;
    bulletsRef.current = [];
    scoreRef.current = 0;
    callbacksRef.current.onScoreUpdate(0);
    callbacksRef.current.onLivesUpdate(3);
  }, []);

  const spawnExplosion = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1, color
      });
    }
  };

  const fireBullet = (x: number, y: number, isMega = false) => {
    bulletsRef.current.push({
      x: x - (isMega ? 6 : 2),
      y: y,
      width: isMega ? 12 : BULLET_WIDTH,
      height: isMega ? 24 : BULLET_HEIGHT,
      speed: -BULLET_SPEED * (isMega ? 0.8 : 1.2),
      fromPlayer: true,
      isMega
    });
    if (isMega) audio.playMegaShoot(); else audio.playShoot();
  };

  const update = () => {
    if (statusRef.current !== 'PLAYING') return;

    const inp = inputRef.current;
    const p = playerRef.current;
    const now = Date.now();
    let currentSpeed = p.isOverdrive ? PLAYER_SPEED * 1.6 : PLAYER_SPEED;

    // Movimentação
    if (inp.left) p.x -= currentSpeed;
    if (inp.right) p.x += currentSpeed;
    p.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, p.x));

    // Dash
    if (inp.dash && now - lastDashTime.current > 700) {
      if (inp.left) p.x -= 140;
      if (inp.right) p.x += 140;
      p.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, p.x));
      lastDashTime.current = now;
      audio.playDash();
      spawnExplosion(p.x + PLAYER_WIDTH/2, p.y + PLAYER_HEIGHT/2, COLORS.CYAN, 12);
    }

    // Overdrive
    if (p.isOverdrive) {
      p.overdriveTime--;
      if (p.overdriveTime <= 0) p.isOverdrive = false;
    } else if (inp.overdrive && p.energy >= 100) {
      p.isOverdrive = true;
      p.overdriveTime = 300;
      p.energy = 0;
      audio.playOverdrive();
      spawnExplosion(p.x + PLAYER_WIDTH/2, p.y, COLORS.PINK, 25);
    }
    if (!p.isOverdrive && p.energy < 100) p.energy += 0.4;

    // Tiro
    if (inp.fire) {
      if (p.isOverdrive) {
        if (now - lastFireTime.current > 100) {
          fireBullet(p.x + PLAYER_WIDTH / 2, p.y);
          fireBullet(p.x + PLAYER_WIDTH / 2 - 20, p.y + 10);
          fireBullet(p.x + PLAYER_WIDTH / 2 + 20, p.y + 10);
          lastFireTime.current = now;
        }
      } else {
        // Atira imediatamente no primeiro clique
        if (!wasFiringRef.current && now - lastFireTime.current > 200) {
          fireBullet(p.x + PLAYER_WIDTH / 2, p.y);
          lastFireTime.current = now;
        }
        p.charge = Math.min(100, p.charge + 2.5);
      }
      wasFiringRef.current = true;
    } else {
      if (p.charge >= 100) {
        fireBullet(p.x + PLAYER_WIDTH / 2, p.y, true);
        lastFireTime.current = now;
      }
      p.charge = 0;
      wasFiringRef.current = false;
    }

    // Invasores
    let edgeReached = false;
    invadersRef.current.forEach(inv => {
      if (!inv.alive) return;
      inv.x += invaderDirection.current * invaderSpeed.current;
      if (inv.x + inv.width > CANVAS_WIDTH - 10 || inv.x < 10) edgeReached = true;
      if (inv.y + inv.height > p.y) callbacksRef.current.onGameOver(scoreRef.current);
    });

    if (edgeReached) {
      invaderDirection.current *= -1;
      invadersRef.current.forEach(inv => { inv.y += 25; });
      invaderSpeed.current = Math.min(invaderSpeed.current + 0.1, 5);
    }

    // Tiro Invasor
    if (Math.random() < 0.02) {
      const active = invadersRef.current.filter(i => i.alive);
      if (active.length > 0) {
        const s = active[Math.floor(Math.random() * active.length)];
        bulletsRef.current.push({
          x: s.x + s.width / 2, y: s.y + s.height,
          width: BULLET_WIDTH, height: BULLET_HEIGHT,
          speed: BULLET_SPEED - 3, fromPlayer: false
        });
      }
    }

    // Colisões e Projéteis
    bulletsRef.current = bulletsRef.current.filter(b => {
      b.y += b.speed;
      if (b.fromPlayer) {
        for (const inv of invadersRef.current) {
          if (inv.alive && b.x < inv.x + inv.width && b.x + b.width > inv.x && b.y < inv.y + inv.height && b.y + b.height > inv.y) {
            inv.alive = false;
            scoreRef.current += inv.points;
            callbacksRef.current.onScoreUpdate(scoreRef.current);
            spawnExplosion(inv.x + inv.width/2, inv.y + inv.height/2, b.isMega ? COLORS.PINK : COLORS.CYAN);
            audio.playExplosion();
            if (!b.isMega) return false;
          }
        }
      } else {
        if (b.x < p.x + PLAYER_WIDTH && b.x + b.width > p.x && b.y < p.y + PLAYER_HEIGHT && b.y + b.height > p.y) {
          p.lives--;
          callbacksRef.current.onLivesUpdate(p.lives);
          spawnExplosion(p.x + PLAYER_WIDTH/2, p.y + PLAYER_HEIGHT/2, COLORS.RED, 15);
          audio.playPlayerHit();
          if (p.lives <= 0) callbacksRef.current.onGameOver(scoreRef.current);
          return false;
        }
      }
      return b.y > 0 && b.y < CANVAS_HEIGHT;
    });

    // Partículas
    particlesRef.current.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.03; });
    particlesRef.current = particlesRef.current.filter(pt => pt.life > 0);

    if (invadersRef.current.length > 0 && invadersRef.current.every(i => !i.alive)) callbacksRef.current.onWin(scoreRef.current);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid Neon
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for(let i=0; i<CANVAS_WIDTH; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,CANVAS_HEIGHT); ctx.stroke(); }
    for(let i=0; i<CANVAS_HEIGHT; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(CANVAS_WIDTH,i); ctx.stroke(); }

    const p = playerRef.current;

    // Partículas
    particlesRef.current.forEach(pt => {
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 2, 2);
    });
    ctx.globalAlpha = 1;

    // Jogador (Triângulo Verde)
    ctx.shadowBlur = p.isOverdrive ? 25 : 10;
    ctx.shadowColor = p.isOverdrive ? COLORS.PINK : COLORS.GREEN;
    ctx.fillStyle = p.isOverdrive ? COLORS.PINK : COLORS.GREEN;
    ctx.beginPath();
    ctx.moveTo(p.x + PLAYER_WIDTH/2, p.y);
    ctx.lineTo(p.x, p.y + PLAYER_HEIGHT);
    ctx.lineTo(p.x + PLAYER_WIDTH, p.y + PLAYER_HEIGHT);
    ctx.fill();

    // UI da Nave
    ctx.shadowBlur = 0;
    if (p.charge > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(p.x, p.y + PLAYER_HEIGHT + 6, PLAYER_WIDTH, 4);
      ctx.fillStyle = p.charge >= 100 ? COLORS.CYAN : '#fff';
      ctx.fillRect(p.x, p.y + PLAYER_HEIGHT + 6, (p.charge/100) * PLAYER_WIDTH, 4);
    }
    ctx.fillStyle = 'rgba(189,0,255,0.1)';
    ctx.fillRect(p.x, p.y + PLAYER_HEIGHT + 14, PLAYER_WIDTH, 4);
    ctx.fillStyle = p.energy >= 100 ? COLORS.PURPLE : '#444';
    ctx.fillRect(p.x, p.y + PLAYER_HEIGHT + 14, (p.energy/100) * PLAYER_WIDTH, 4);

    // Invasores
    invadersRef.current.forEach(inv => {
      if (!inv.alive) return;
      ctx.shadowBlur = 10;
      ctx.shadowColor = COLORS.PURPLE;
      ctx.fillStyle = COLORS.PURPLE;
      ctx.fillRect(inv.x + 4, inv.y, inv.width - 8, inv.height);
      ctx.fillRect(inv.x, inv.y + 4, inv.width, inv.height - 8);
    });

    // Projéteis
    bulletsRef.current.forEach(b => {
      ctx.shadowBlur = b.isMega ? 25 : 10;
      ctx.shadowColor = b.fromPlayer ? (b.isMega ? COLORS.PINK : COLORS.CYAN) : COLORS.RED;
      ctx.fillStyle = ctx.shadowColor;
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    if (status === 'PLAYING') initLevel();
  }, [status, initLevel]);

  useEffect(() => {
    const loop = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden border-2 border-cyan-900/30 rounded-lg shadow-2xl">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full max-h-full object-contain" />
    </div>
  );
};

export default GameEngine;
