import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  SkipBack, 
  SkipForward,
  Settings,
  Download,
  Star
} from 'lucide-react';

const VideoPlayer = ({ 
  src, 
  poster, 
  title, 
  onTimeUpdate, 
  onEnded, 
  autoPlay = false,
  controls = true 
}) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('auto');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showError, setShowError] = useState(false);

  const handleRetry = () => {
    setShowError(false);
    window.location.reload();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, onEnded]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleProgressClick = (e) => {
    const video = videoRef.current;
    const progress = progressRef.current;
    if (!video || !progress) return;

    const rect = progress.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Error Overlay */}
      {showError && (
        <div className="absolute inset-0 bg-phyght-black bg-opacity-90 flex flex-col items-center justify-center text-center p-6">
          <div className="text-phyght-red text-6xl mb-4">❌</div>
          <h3 className="text-phyght-white text-xl font-semibold mb-2">Video Error</h3>
          <p className="text-gray-300 mb-4">Unable to play this video</p>
          
          <div className="bg-phyght-gray rounded-lg p-4 mb-4 text-left max-w-md">
            <p className="text-phyght-white text-sm font-medium mb-2">Source:</p>
            <p className="text-gray-400 text-xs break-all">{src}</p>
          </div>
          
          <button
            onClick={handleRetry}
            className="bg-phyght-red hover:bg-phyght-red-dark text-phyght-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        autoPlay={autoPlay}
        playsInline
        onClick={togglePlay}
        onError={(e) => {
          console.error('Video playback error:', e);
          console.error('Video source:', src);
          console.error('Video element:', videoRef.current);
          console.error('Error details:', e.target.error);
          setShowError(true);
        }}
        onLoadedMetadata={() => {
          console.log('Video metadata loaded successfully');
          console.log('Video duration:', videoRef.current?.duration);
          console.log('Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
        }}
        onLoadStart={() => {
          console.log('Video load started');
        }}
        onCanPlay={() => {
          console.log('Video can play');
        }}
        onCanPlayThrough={() => {
          console.log('Video can play through');
        }}
      />

      {/* Play/Pause Overlay */}
      {!isPlaying && !showError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="bg-phyght-red bg-opacity-90 hover:bg-opacity-100 rounded-full p-6 transition-all duration-300 transform hover:scale-110 shadow-phyght-red"
          >
            <Play className="w-12 h-12 text-phyght-white" />
          </button>
        </div>
      )}

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-phyght-black to-transparent p-4">
        <div className="flex items-center justify-between text-phyght-white text-sm">
          <div className="flex items-center space-x-4">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : '0:00'}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>0 views</span>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-phyght-red" />
              <span>4.5</span>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400 mt-1">
          PHYGHT TV • N/A
        </div>
      </div>

      {/* Title Overlay */}
      {title && (
        <div className={`absolute top-4 left-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          <h3 className="text-white text-lg font-medium bg-black bg-opacity-50 px-3 py-1 rounded">
            {title}
          </h3>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

