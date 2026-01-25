import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward } from 'lucide-react';
import { Button } from './Button';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeekRewind: () => void;
  onSeekForward: () => void;
  playbackRate: number;
  onRateChange: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onSeekRewind,
  onSeekForward,
  playbackRate,
  onRateChange
}) => {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Primary Controls */}
      <div className="flex items-center justify-center gap-6">
        <button 
            onClick={onPrev}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Previous Chapter"
        >
            <SkipBack className="w-6 h-6" />
        </button>

        <button 
            onClick={onSeekRewind}
            className="text-slate-300 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800"
            aria-label="Rewind 15s"
        >
            <Rewind className="w-8 h-8" />
        </button>

        <button 
            onClick={onPlayPause}
            className="bg-brand-500 hover:bg-brand-400 text-white rounded-full p-5 shadow-lg shadow-brand-500/30 transition-all active:scale-95"
            aria-label={isPlaying ? "Pause" : "Play"}
        >
            {isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
            ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
            )}
        </button>

        <button 
            onClick={onSeekForward}
            className="text-slate-300 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800"
            aria-label="Forward 30s"
        >
            <FastForward className="w-8 h-8" />
        </button>

         <button 
            onClick={onNext}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Next Chapter"
        >
            <SkipForward className="w-6 h-6" />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center gap-4">
        <button 
            onClick={onRateChange}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 text-brand-300 hover:bg-slate-700 transition-colors"
        >
            {playbackRate}x
        </button>
      </div>
    </div>
  );
};
