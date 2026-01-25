import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Book as BookType, Chapter, PlaybackState, Bookmark } from '../types';
import { PlayerControls } from './PlayerControls';
import { ChevronDown, List, MessageSquarePlus, Bookmark as BookmarkIcon, Book } from 'lucide-react';
import { db } from '../services/db';
import { Button } from './Button';

interface PlayerProps {
  book: BookType;
  chapters: Chapter[];
  initialState?: PlaybackState;
  onClose: () => void;
}

const SKIP_BACK_SECONDS = 15;
const SKIP_FORWARD_SECONDS = 30;

export const Player: React.FC<PlayerProps> = ({ book, chapters, initialState, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(initialState?.chapterIndex || 0);
  const [currentTime, setCurrentTime] = useState(initialState?.currentTime || 0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(initialState?.playbackRate || 1.0);
  const [showChapters, setShowChapters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ref to hold latest state for reliable saving on unmount/close
  const stateRef = useRef({
      bookId: book.id,
      chapterIndex: currentChapterIndex,
      currentTime: currentTime,
      playbackRate: playbackRate
  });

  // Keep stateRef in sync with state
  useEffect(() => {
      stateRef.current = {
          bookId: book.id,
          chapterIndex: currentChapterIndex,
          currentTime: currentTime,
          playbackRate: playbackRate
      };
  }, [book.id, currentChapterIndex, currentTime, playbackRate]);

  // Periodic save while playing (every 5s) - avoids data loss on crash
  useEffect(() => {
      if (!isPlaying) return;
      const interval = setInterval(() => {
          db.saveProgress(stateRef.current);
      }, 5000);
      return () => clearInterval(interval);
  }, [isPlaying]);

  // Save on unmount (e.g. browser back button or refresh)
  useEffect(() => {
      return () => {
          db.saveProgress(stateRef.current);
      };
  }, []);

  const handleManualClose = async () => {
      // Explicitly save before closing to prevent race conditions with Library refresh
      await db.saveProgress(stateRef.current);
      onClose();
  };

  // Load Chapter Blob
  useEffect(() => {
    const loadChapter = async () => {
      setIsLoading(true);
      try {
        const chapter = chapters[currentChapterIndex];
        if (!chapter) return;

        // Revoke old URL if exists to prevent memory leak
        if (audioRef.current?.src) {
           URL.revokeObjectURL(audioRef.current.src);
        }

        const blob = await db.getChapterBlob(book.id, chapter.index);
        if (blob && audioRef.current) {
          const url = URL.createObjectURL(blob);
          audioRef.current.src = url;
          audioRef.current.playbackRate = playbackRate;
          
          // Restore time if it's the chapter we initiated with
          if (initialState && initialState.chapterIndex === currentChapterIndex && Math.abs(initialState.currentTime - currentTime) < 1) {
             audioRef.current.currentTime = initialState.currentTime;
          } else if (currentTime > 0) {
             // If we switched chapters within this session, currentTime was likely set to 0 by the handler
             audioRef.current.currentTime = 0;
          }
          
          if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Auto-play failed", e));
          }
        }
      } catch (err) {
        console.error("Failed to load chapter", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadChapter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, currentChapterIndex, chapters]);

  // Sync Timer
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const updateDuration = () => setDuration(audio.duration);
    const onEnd = () => handleNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapterIndex]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
      setCurrentTime(0);
    } else {
        setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentTime > 5) {
      if (audioRef.current) audioRef.current.currentTime = 0;
    } else if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
      setCurrentTime(0);
    }
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const cycleRate = () => {
    const rates = [0.8, 1.0, 1.2, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) audioRef.current.playbackRate = newRate;
  };

  const formatTime = (t: number) => {
    if (!t) return "00:00";
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  const currentChapter = chapters[currentChapterIndex];

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      <audio ref={audioRef} />
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-md">
        <button onClick={handleManualClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
          <ChevronDown />
        </button>
        <span className="text-sm font-medium text-slate-400 uppercase tracking-wider text-xs">Now Playing</span>
        <button onClick={() => setShowChapters(!showChapters)} className={`p-2 rounded-full hover:bg-slate-800 ${showChapters ? 'text-brand-400' : 'text-slate-400'}`}>
          <List />
        </button>
      </div>

      {showChapters ? (
        <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
          <h3 className="text-xl font-bold mb-4 px-2">Chapters</h3>
          <div className="space-y-1">
            {chapters.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => {
                  setCurrentChapterIndex(idx);
                  setCurrentTime(0);
                  setShowChapters(false);
                  setIsPlaying(true);
                }}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  idx === currentChapterIndex 
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-medium truncate">{ch.title}</div>
                <div className="text-xs text-slate-500 mt-1">Chapter {idx + 1}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
            {/* Art Placeholder */}
            <div className="flex-1 flex items-center justify-center py-8">
                <div className="w-64 h-64 md:w-80 md:h-80 bg-slate-900 rounded-3xl shadow-2xl shadow-black/50 border border-slate-800 flex items-center justify-center relative overflow-hidden group">
                     {/* Decorative gradient */}
                     <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 z-0"></div>
                     <Book className="w-24 h-24 text-slate-700 z-10 group-hover:scale-110 transition-transform duration-500" />
                     {isLoading && (
                         <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-sm">
                             <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                         </div>
                     )}
                </div>
            </div>

            {/* Info */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2 leading-tight">{book.title}</h2>
                <p className="text-brand-400 font-medium">{currentChapter?.title || `Chapter ${currentChapterIndex + 1}`}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSliderChange}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:accent-brand-400"
                    style={{
                        backgroundSize: `${(currentTime / (duration || 1)) * 100}% 100%`,
                        backgroundImage: `linear-gradient(#0ea5e9, #0ea5e9)`
                    }}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>-{formatTime(duration - currentTime)}</span>
                </div>
            </div>

            {/* Controls */}
            <PlayerControls
                isPlaying={isPlaying}
                onPlayPause={togglePlay}
                onNext={handleNext}
                onPrev={handlePrev}
                onSeekRewind={() => seek(-SKIP_BACK_SECONDS)}
                onSeekForward={() => seek(SKIP_FORWARD_SECONDS)}
                playbackRate={playbackRate}
                onRateChange={cycleRate}
            />
            
            <div className="mt-8 flex justify-center">
                 <button className="text-slate-500 hover:text-white flex items-center gap-2 text-sm px-4 py-2 rounded-full hover:bg-slate-900 transition-colors"
                  onClick={() => alert("Bookmark saved (simulated)")}
                 >
                    <BookmarkIcon className="w-4 h-4" />
                    <span>Bookmark</span>
                 </button>
            </div>
        </div>
      )}
    </div>
  );
};