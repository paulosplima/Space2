
import React from 'react';

interface TouchControlsProps {
  onInputUpdate: (key: string, pressed: boolean) => void;
}

const TouchControls: React.FC<TouchControlsProps> = ({ onInputUpdate }) => {
  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 px-4 flex flex-col gap-4 pointer-events-none">
      <div className="flex justify-between items-end">
        {/* Left Side: Movement & Dash */}
        <div className="flex flex-col gap-4 pointer-events-auto">
          <button
            className="w-16 h-16 bg-cyan-500/20 backdrop-blur-md border border-cyan-500/40 rounded-xl flex items-center justify-center active:scale-90 active:bg-cyan-500/60 active:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all text-cyan-400"
            onTouchStart={() => onInputUpdate('dash', true)}
            onTouchEnd={() => onInputUpdate('dash', false)}
          >
            <i className="fa-solid fa-bolt text-2xl"></i>
          </button>
          <div className="flex gap-2">
            <button
              className="w-20 h-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center active:bg-cyan-500/40 active:shadow-[0_0_30px_rgba(6,182,212,0.4)] text-white text-3xl transition-all"
              onTouchStart={() => onInputUpdate('left', true)}
              onTouchEnd={() => onInputUpdate('left', false)}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button
              className="w-20 h-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center active:bg-cyan-500/40 active:shadow-[0_0_30px_rgba(6,182,212,0.4)] text-white text-3xl transition-all"
              onTouchStart={() => onInputUpdate('right', true)}
              onTouchEnd={() => onInputUpdate('right', false)}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>

        {/* Right Side: Fire & Overdrive */}
        <div className="flex flex-col gap-4 items-end pointer-events-auto">
          <button
            className="w-16 h-16 bg-purple-500/20 backdrop-blur-md border border-purple-500/40 rounded-xl flex items-center justify-center active:scale-90 active:bg-purple-500/60 active:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all text-purple-400"
            onTouchStart={() => onInputUpdate('overdrive', true)}
            onTouchEnd={() => onInputUpdate('overdrive', false)}
          >
            <i className="fa-solid fa-fire-glow text-2xl"></i>
          </button>
          <button
            className="w-24 h-24 bg-red-500/20 backdrop-blur-md border-2 border-red-500/40 rounded-full flex items-center justify-center active:scale-95 active:bg-red-500/60 active:shadow-[0_0_40px_rgba(239,68,68,0.6)] text-white text-4xl shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all"
            onTouchStart={() => onInputUpdate('fire', true)}
            onTouchEnd={() => onInputUpdate('fire', false)}
          >
            <i className="fa-solid fa-crosshairs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TouchControls;
