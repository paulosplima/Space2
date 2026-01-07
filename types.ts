
export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Entity {
  speed: number;
  lives: number;
}

export interface Invader extends Entity {
  type: 'small' | 'medium' | 'large' | 'boss';
  points: number;
  alive: boolean;
}

export interface Bullet extends Entity {
  speed: number;
  fromPlayer: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export type GameStatus = 'START' | 'PLAYING' | 'GAMEOVER' | 'WON';

export interface GameState {
  status: GameStatus;
  score: number;
  level: number;
  lives: number;
}
