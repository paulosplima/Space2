
import React, { useState, useEffect, useCallback } from 'react';
import GameEngine from './components/GameEngine';
import TouchControls from './components/TouchControls';
import { GameStatus, GameState } from './types';
import { getMissionCommentary } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1,
    lives: 3
  });

  const [input, setInput] = useState({ left: false, right: false, fire: false });
  const [tacticalMessage, setTacticalMessage] = useState("Sistemas prontos. Aguardando comando.");
  const [isLoadingTactical, setIsLoadingTactical] = useState(false);

  const updateTactical = useCallback(async (status: GameStatus, score: number, level: number) => {
    setIsLoadingTactical(true);
    const msg = await getMissionCommentary(score, level, status);
    setTacticalMessage(msg);
    setIsLoadingTactical(false);
  }, []);

  // Update tactical message on state change
  useEffect(() => {
    if (gameState.status !== 'PLAYING') {
      updateTactical(gameState.status, gameState.score, gameState.level);
    }
  }, [gameState.status, gameState.score, gameState.level, updateTactical]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') setInput(prev => ({ ...prev, left: true }));
      if (e.key === 'ArrowRight' || e.key === 'd') setInput(prev => ({ ...prev, right: true }));
      if (e.key === ' ' || e.key === 'Enter') setInput(prev => ({ ...prev, fire: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') setInput(prev => ({ ...prev, left: false }));
      if (e.key === 'ArrowRight' || e.key === 'd') setInput(prev => ({ ...prev, right: false }));
      if (e.key === ' ' || e.key === 'Enter') setInput(prev => ({ ...prev, fire: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    setGameState(prev => ({ ...prev, status: 'PLAYING', score: 0, level: 1 }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col p-4 md:p-8 select-none relative overflow-hidden">
      {/* Header UI */}
      <header className="flex justify-between items-center mb-4 z-10 max-w-4xl mx-auto w-full">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            NEON STRIKE
          </h1>
          <span className="text-[10px] text-cyan-400/50 uppercase tracking-widest -mt-1 font-bold">MATCHIN INDUSTRIES v1.0</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Pontuação</div>
            <div className="text-2xl font-mono text-white leading-none">{gameState.score.toString().padStart(6, '0')}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-purple-400 uppercase tracking-widest font-bold">Vidas</div>
            <div className="flex gap-1 justify-end">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < gameState.lives ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-900/40 border border-red-500/20'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Container */}
      <main className="flex-1 relative flex items-center justify-center max-w-4xl mx-auto w-full">
        <GameEngine 
          status={gameState.status}
          onGameOver={(score) => setGameState(prev => ({ ...prev, status: 'GAMEOVER', score }))}
          onWin={(score) => setGameState(prev => ({ ...prev, status: 'WON', score }))}
          onScoreUpdate={(score) => setGameState(prev => ({ ...prev, score }))}
          onLivesUpdate={(lives) => setGameState(prev => ({ ...prev, lives }))}
          input={input}
        />

        {/* Tactical AI Message Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm z-20 px-4">
          <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-3 flex items-start gap-3 shadow-2xl">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 border border-cyan-400/50 animate-pulse">
              <i className="fa-solid fa-robot text-cyan-400 text-sm"></i>
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] text-cyan-400 uppercase font-bold tracking-widest opacity-60">IA Tática • Analisando...</span>
               <p className="text-xs text-white/90 italic font-medium">"{isLoadingTactical ? "Codificando..." : tacticalMessage}"</p>
            </div>
          </div>
        </div>

        {/* Overlay States */}
        {gameState.status === 'START' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="max-w-md animate-in fade-in zoom-in duration-500">
              <h2 className="text-5xl font-black mb-2 text-white italic">MATCHIN INVADERS</h2>
              <p className="text-cyan-400 mb-8 uppercase tracking-[0.2em] font-bold text-sm">Proteja o domínio matchin.com.br</p>
              
              <div className="space-y-4">
                <button 
                  onClick={startGame}
                  className="w-full py-4 px-8 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xl rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(34,211,238,0.5)]"
                >
                  INICIAR MISSÃO
                </button>
                <div className="hidden md:block text-[10px] text-white/40 uppercase tracking-widest">
                  Use setas para mover • Espaço para atirar
                </div>
              </div>
            </div>
          </div>
        )}

        {(gameState.status === 'GAMEOVER' || gameState.status === 'WON') && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 backdrop-blur-md rounded-lg p-6 text-center">
             <div className="animate-in slide-in-from-bottom-8 duration-500">
                <h2 className={`text-6xl font-black mb-4 ${gameState.status === 'WON' ? 'text-green-400' : 'text-red-500'}`}>
                  {gameState.status === 'WON' ? 'VITÓRIA' : 'MISSÃO FALHOU'}
                </h2>
                <div className="text-3xl font-mono text-white mb-8">
                  PONTOS: {gameState.score}
                </div>
                <button 
                  onClick={startGame}
                  className="py-4 px-12 bg-white text-black font-black text-lg rounded-full hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  TENTAR NOVAMENTE
                </button>
             </div>
          </div>
        )}
      </main>

      {/* Mobile Controls */}
      <TouchControls 
        onInputUpdate={(key, pressed) => setInput(prev => ({ ...prev, [key]: pressed }))} 
      />

      {/* Footer Branding */}
      <footer className="mt-4 text-center z-10 opacity-30">
        <p className="text-[10px] uppercase tracking-widest font-bold">
          &copy; 2025 Matchin Corp • Built with Gemini 3
        </p>
      </footer>
      
      {/* Decorative scanline effect */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-40"></div>
    </div>
  );
};

export default App;
