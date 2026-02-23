import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Maximize, Minimize, Settings, Volume2, VolumeX, FileText, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CustomPlayerProps {
  videoId: string;
  onTimeUpdate?: (time: number) => void;
  onSummaryClick?: () => void;
  onNotesClick?: () => void;
  initialTime?: number;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function CustomPlayer({ videoId, onTimeUpdate, onSummaryClick, onNotesClick, initialTime = 0 }: CustomPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          start: Math.floor(initialTime)
        },
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration());
            if (initialTime > 0) {
              event.target.seekTo(initialTime, true);
            }
          },
          onStateChange: (event: any) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [videoId]);

  const togglePlay = () => {
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const seek = (seconds: number) => {
    const newTime = playerRef.current.getCurrentTime() + seconds;
    playerRef.current.seekTo(newTime, true);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    playerRef.current.seekTo(time, true);
    setCurrentTime(time);
  };

  const handlePlaybackRateChange = (rate: number) => {
    playerRef.current.setPlaybackRate(rate);
    setPlaybackRate(rate);
  };

  const toggleMute = () => {
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black group overflow-hidden rounded-lg shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <div id="youtube-player" className="w-full h-full pointer-events-none" />
      
      {/* Custom Controls Overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 transition-opacity duration-300 flex flex-col justify-end p-4",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        {/* Top Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={onSummaryClick} 
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
            aria-label="Get AI Summary"
          >
            <Sparkles size={20} />
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={onNotesClick} 
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
            aria-label="Get AI Notes"
          >
            <FileText size={20} />
          </motion.button>
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-4 group/progress">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all"
          />
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-6">
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={togglePlay} 
              className="hover:scale-110 transition-transform p-2"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={() => seek(-10)} 
              className="hover:scale-110 transition-transform p-2"
              aria-label="Seek backward 10 seconds"
            >
              <RotateCcw size={22} />
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={() => seek(10)} 
              className="hover:scale-110 transition-transform p-2"
              aria-label="Seek forward 10 seconds"
            >
              <RotateCw size={22} />
            </motion.button>
            <div className="text-sm font-bold tabular-nums tracking-tight">
              {formatTime(currentTime)} <span className="opacity-40 mx-1">/</span> {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 group/volume">
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </motion.button>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume} 
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setVolume(v);
                  playerRef.current.setVolume(v);
                }}
                className="w-0 group-hover/volume:w-24 transition-all h-1.5 appearance-none bg-white/30 rounded-lg accent-blue-500 cursor-pointer"
                aria-label="Volume"
              />
            </div>

            <div className="relative group/speed">
              <button className="text-xs font-black bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors uppercase tracking-widest">
                {playbackRate}x
              </button>
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-xl rounded-xl p-2 hidden group-hover:block border border-white/10 shadow-2xl min-w-[80px]">
                {[0.5, 1, 1.5, 2, 3].map(rate => (
                  <button 
                    key={rate}
                    onClick={() => handlePlaybackRateChange(rate)}
                    className={cn(
                      "block w-full text-center px-4 py-2 text-xs font-bold hover:bg-blue-600 rounded-lg transition-colors",
                      playbackRate === rate ? "text-blue-400" : "text-white"
                    )}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={toggleFullscreen} 
              className="hover:scale-110 transition-transform p-2"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
