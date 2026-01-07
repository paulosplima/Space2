
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  const [input, setInput] = useState({ 
    left: false, 
    right: false, 
    fire: false, 
    dash: false, 
    overdrive: false 
  });
  
  const [tacticalMessage, setTacticalMessage] = useState("Sistemas prontos. Aguardando comando.");
  const [isLoadingTactical, setIsLoadingTactical] = useState(false);

  const updateTactical = useCallback(async (status: GameStatus, score: number, level: number) => {
    setIsLoadingTactical(true);
    const msg = await getMissionCommentary(score, level, status);
    setTacticalMessage(msg);
    setIsLoadingTactical(false);
  }, []);

  useEffect(() => {
    if (gameState.status !== 'PLAYING') {
      updateTactical(gameState.status, gameState.score, gameState.level);
    }
  }, [gameState.status, gameState.score, gameState.level, updateTactical]);

  // Memoize callbacks to prevent GameEngine from re-mounting or re-starting loop unnecessarily
  const handleGameOver = useCallback((score: number) => {
    setGameState(prev => ({ ...prev, status: 'GAMEOVER', score }));
  }, []);

  const handleWin = useCallback((score: number) => {
    setGameState(prev => ({ ...prev, status: 'WON', score }));
  }, []);

  const handleScoreUpdate = useCallback((score: number) => {
    setGameState(prev => ({ ...prev, score }));
  }, []);

  const handleLivesUpdate = useCallback((lives: number) => {
    setGameState(prev => ({ ...prev, lives }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      
      setInput(prev => {
        const next = { ...prev };
        if (key === 'arrowleft' || key === 'a') next.left = true;
        if (key === 'arrowright' || key === 'd') next.right = true;
        if (key === ' ' || key === 'enter') next.fire = true;
        if (key === 'shift') next.dash = true;
        if (key === 'c') next.overdrive = true;
        return next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      setInput(prev => {
        const next = { ...prev };
        if (key === 'arrowleft' || key === 'a') next.left = false;
        if (key === 'arrowright' || key === 'd') next.right = false;
        if (key === ' ' || key === 'enter') next.fire = false;
        if (key === 'shift') next.dash = false;
        if (key === 'c') next.overdrive = false;
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    setGameState({ status: 'PLAYING', score: 0, level: 1, lives: 3 });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col p-4 md:p-8 select-none relative overflow-hidden">
      <header className="flex justify-between items-center mb-4 z-10 max-w-4xl mx-auto w-full">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            NEON STRIKE
          </h1>
          <span className="text-[10px] text-cyan-400/50 uppercase tracking-widest -mt-1 font-bold">MATCHIN INDUSTRIES v1.2</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Pontuação</div>
            <div className="text-2xl font-mono text-white leading-none">{gameState.score.toString().padStart(6, '0')}</div>
          </div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-sm rotate-45 border ${i < gameState.lives ? 'bg-green-400 shadow-[0_0_10px_#4ade80] border-green-200' : 'bg-red-900/20 border-red-500/30'}`}></div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex items-center justify-center max-w-4xl mx-auto w-full">
        <GameEngine 
          status={gameState.status}
          onGameOver={handleGameOver}
          onWin={handleWin}
          onScoreUpdate={handleScoreUpdate}
          onLivesUpdate={handleLivesUpdate}
          input={input}
        />

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm z-20 px-4">
          <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 flex items-start gap-3 shadow-2xl">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 border border-cyan-400/50">
              <i className="fa-solid fa-robot text-cyan-400 text-sm animate-pulse"></i>
            </div>
            <div className="flex flex-col">
               <span className="text-[8px] text-cyan-400 uppercase font-black tracking-widest opacity-60">TAC-LINK • ESTÁVEL</span>
               <p className="text-[11px] text-white italic">"{isLoadingTactical ? "Codificando..." : tacticalMessage}"</p>
            </div>
          </div>
        </div>

        {gameState.status === 'START' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="max-w-md animate-in fade-in zoom-in duration-300">
              <h2 className="text-5xl font-black mb-2 italic">NEON STRIKE</h2>
              <p className="text-cyan-400 mb-8 uppercase tracking-[0.3em] font-bold text-xs">Protocolo Matchin Ativado</p>
              <div className="space-y-4">
                <button onClick={startGame} className="w-full py-4 px-8 bg-white text-black font-black text-xl rounded-full hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  INICIAR SEQUÊNCIA
                </button>
                <div className="hidden md:grid grid-cols-2 gap-4 text-[9px] text-white/40 uppercase tracking-widest text-left">
                  <div>[SPACE] DISPARAR / CARREGAR</div>
                  <div>[SHIFT] DASH LATERAL</div>
                  <div>[A/D] NAVEGAÇÃO</div>
                  <div>[C] MODO OVERDRIVE</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(gameState.status === 'GAMEOVER' || gameState.status === 'WON') && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 backdrop-blur-md rounded-lg p-6 text-center">
             <div className="animate-in slide-in-from-bottom-8 duration-500">
                <h2 className={`text-6xl font-black mb-4 ${gameState.status === 'WON' ? 'text-green-400 shadow-green-500' : 'text-red-500 shadow-red-500'}`}>
                  {gameState.status === 'WON' ? 'CONQUISTADO' : 'NEUTRALIZADO'}
                </h2>
                <div className="text-4xl font-mono text-white mb-8 drop-shadow-md">
                  {gameState.score.toString().padStart(6, '0')}
                </div>
                <button onClick={startGame} className="py-4 px-12 bg-cyan-500 text-black font-black text-lg rounded-full hover:bg-white transition-all">
                  REBOOT
                </button>
             </div>
          </div>
        )}
      </main>

      <TouchControls onInputUpdate={(key, pressed) => setInput(prev => ({ ...prev, [key]: pressed }))} />

      <footer className="mt-4 text-center z-10 opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-[9px] uppercase tracking-[0.4em] font-black text-cyan-400">
          MATCHIN.COM.BR // PROTOCOLO DE DEFESA ESPACIAL
        </p>
      </footer>
      
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_3px,3px_100%] z-50 opacity-30"></div>
    </div>
  );
};

export default App;
