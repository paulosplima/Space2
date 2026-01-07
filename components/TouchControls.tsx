
import React from 'react';

interface TouchControlsProps {
  onInputUpdate: (key: string, pressed: boolean) => void;
}

const TouchControls: React.FC<TouchControlsProps> = ({ onInputUpdate }) => {
  return (
    <div className="md:hidden fixed bottom-8 left-0 right-0 px-6 flex justify-between items-end pointer-events-none">
      {/* Directional Controls */}
      <div className="flex gap-4 pointer-events-auto">
        <button
          className="w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center active:scale-95 active:bg-cyan-500/40 transition-all text-white text-3xl"
          onTouchStart={() => onInputUpdate('left', true)}
          onTouchEnd={() => onInputUpdate('left', false)}
          onMouseDown={() => onInputUpdate('left', true)}
          onMouseUp={() => onInputUpdate('left', false)}
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <button
          className="w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center active:scale-95 active:bg-cyan-500/40 transition-all text-white text-3xl"
          onTouchStart={() => onInputUpdate('right', true)}
          onTouchEnd={() => onInputUpdate('right', false)}
          onMouseDown={() => onInputUpdate('right', true)}
          onMouseUp={() => onInputUpdate('right', false)}
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      {/* Action Button */}
      <div className="pointer-events-auto">
        <button
          className="w-24 h-24 bg-red-500/30 backdrop-blur-md border-2 border-red-500/50 rounded-full flex items-center justify-center active:scale-90 active:bg-red-500/60 transition-all text-white text-4xl shadow-[0_0_20px_rgba(239,68,68,0.5)]"
          onTouchStart={() => onInputUpdate('fire', true)}
          onTouchEnd={() => onInputUpdate('fire', false)}
          onMouseDown={() => onInputUpdate('fire', true)}
          onMouseUp={() => onInputUpdate('fire', false)}
        >
          <i className="fa-solid fa-crosshairs"></i>
        </button>
      </div>
    </div>
  );
};

export default TouchControls;
