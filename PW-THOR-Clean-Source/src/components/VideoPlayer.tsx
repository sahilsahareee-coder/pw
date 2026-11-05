"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Check,
  RotateCcw,
  FastForward,
  Loader2,
  AlertTriangle,
  RefreshCw,
  X,
  ExternalLink,
} from "lucide-react";
import { extractLectureVideoSource, ExtractedVideoSource } from "@/lib/video";

interface VideoQuality {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

interface VideoPlayerProps {
  src: string;
  title: string;
  lectureId?: string;
  onClose?: () => void;
  autoPlay?: boolean;
}

export default function VideoPlayer({
  src,
  title,
  lectureId = "default_lecture",
  onClose,
  autoPlay = true,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Parse and extract the video source type
  const videoSource: ExtractedVideoSource = useMemo(() => {
    return extractLectureVideoSource(src);
  }, [src]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"menu" | "speed" | "quality">("menu");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [qualities, setQualities] = useState<VideoQuality[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resumedFrom, setResumedFrom] = useState<number | null>(null);

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const progressStorageKey = `pws_video_progress_${lectureId}`;

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "00:00";
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Initialize Video & HLS (Only for HLS or MP4)
  const initVideo = useCallback(() => {
    if (videoSource.type === "youtube" || videoSource.type === "iframe") {
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video || !videoSource.url) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");

    // Check saved progress
    let savedTime = 0;
    try {
      const raw = localStorage.getItem(progressStorageKey);
      if (raw) {
        savedTime = parseFloat(raw);
        if (savedTime > 5) {
          setResumedFrom(savedTime);
          setTimeout(() => setResumedFrom(null), 4000);
        }
      }
    } catch {
      // ignore
    }

    const streamUrl = videoSource.url;
    const signedQuery = videoSource.signedUrlQuery || "";

    if (Hls.isSupported() && (videoSource.type === "hls" || streamUrl.includes(".m3u8"))) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      // Custom loader to propagate signed CloudFront/CDN query parameters across all child requests
      const DefaultLoader = Hls.DefaultConfig.loader as any;
      class QueryPreservingLoader extends DefaultLoader {
        load(context: any, config: any, callbacks: any) {
          if (
            signedQuery &&
            context.url &&
            !context.url.includes("Signature=") &&
            !context.url.includes("Policy=")
          ) {
            const sep = context.url.includes("?") ? "&" : "?";
            const q = signedQuery.startsWith("?") ? signedQuery.slice(1) : signedQuery;
            context.url = `${context.url}${sep}${q}`;
          }
          super.load(context, config, callbacks);
        }
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        manifestLoadingMaxRetry: 5,
        manifestLoadingRetryDelay: 500,
        levelLoadingMaxRetry: 5,
        levelLoadingRetryDelay: 500,
        fragLoadingMaxRetry: 5,
        fragLoadingRetryDelay: 500,
        fLoader: signedQuery ? (QueryPreservingLoader as any) : undefined,
        pLoader: signedQuery ? (QueryPreservingLoader as any) : undefined,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        const mappedQualities: VideoQuality[] = data.levels.map((level, index) => ({
          index,
          height: level.height,
          bitrate: level.bitrate,
          label: `${level.height}p`,
        }));
        mappedQualities.sort((a, b) => b.height - a.height);
        setQualities(mappedQualities);

        if (savedTime > 0 && savedTime < (video.duration || 100000)) {
          video.currentTime = savedTime;
        }

        if (autoPlay) {
          video.play().catch(() => setIsPlaying(false));
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("HLS network issue, attempting to reload stream buffer...", data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("HLS media issue, attempting to recover...", data);
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal unrecoverable HLS error:", data);
              setIsLoading(false);
              setHasError(true);
              setErrorMessage("Unable to load video stream. Please check your network or try refreshing.");
              hls.destroy();
              break;
          }
        }
      });
    } else {
      // Direct MP4 / Safari Native HLS
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        if (savedTime > 0 && savedTime < video.duration) {
          video.currentTime = savedTime;
        }
        if (autoPlay) {
          video.play().catch(() => setIsPlaying(false));
        }
      });

      video.addEventListener("error", () => {
        setIsLoading(false);
        setHasError(true);
        setErrorMessage("Unable to play video source.");
      });
    }
  }, [videoSource, autoPlay, progressStorageKey]);

  useEffect(() => {
    initVideo();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initVideo]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  }, []);

  // Update time and buffer progress
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    if (!duration || duration === 0) {
      setDuration(video.duration || 0);
    }

    // Save progress periodically (every 5 seconds)
    if (Math.floor(video.currentTime) % 5 === 0 && video.currentTime > 5) {
      try {
        localStorage.setItem(progressStorageKey, video.currentTime.toString());
      } catch {
        // ignore
      }
    }

    // Buffer range
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBuffered((bufferedEnd / (video.duration || 1)) * 100);
    }
  };

  // Seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = progressBarRef.current;
    if (!video || !bar) return;

    const rect = bar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * (duration || video.duration || 0);
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  // Skip Forward/Backward
  const skip = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    },
    []
  );

  // Volume Change
  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, newVolume));
    video.volume = clamped;
    setVolume(clamped);
    setIsMuted(clamped === 0);
  };

  // Toggle Mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Speed change
  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setIsSettingsOpen(false);
  };

  // Quality change
  const handleQualityChange = (levelIndex: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = levelIndex;
    setCurrentQuality(levelIndex);
    setIsSettingsOpen(false);
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying && !isSettingsOpen) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Keyboard controls for HLS/HTML5 player
  useEffect(() => {
    if (videoSource.type === "youtube" || videoSource.type === "iframe") {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["input", "textarea"].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          skip(-5);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          skip(5);
          break;
        case "arrowup":
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, skip, volume, isMuted, videoSource]);

  // RENDER: YouTube Video Embed Player
  if (videoSource.type === "youtube") {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-black border border-border shadow-2xl flex flex-col">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-3.5 bg-neutral-900 border-b border-neutral-800 text-white z-20">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-600 text-white shrink-0">
              YouTube Lecture
            </span>
            <h3 className="font-semibold text-sm sm:text-base text-white truncate">{title}</h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {videoSource.youtubeId && (
              <a
                href={`https://www.youtube.com/watch?v=${videoSource.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                title="Open directly in YouTube"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                aria-label="Close Player"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 16:9 Responsive Player Frame */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <iframe
            src={videoSource.url}
            title={title}
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // RENDER: Generic IFrame Embed Player
  if (videoSource.type === "iframe") {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-black border border-border shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-3.5 bg-neutral-900 border-b border-neutral-800 text-white z-20">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-600 text-white shrink-0">
              Web Stream
            </span>
            <h3 className="font-semibold text-sm sm:text-base text-white truncate">{title}</h3>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              aria-label="Close Player"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <iframe
            src={videoSource.url}
            title={title}
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // RENDER: HLS & HTML5 Video Player
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative rounded-2xl overflow-hidden bg-black border border-border shadow-2xl select-none group aspect-video flex flex-col justify-center items-center"
    >
      {/* Native Video Element */}
      <video
        ref={videoRef}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Timestamp Resume Pill */}
      {resumedFrom !== null && (
        <div className="absolute top-4 left-4 z-20 bg-background/90 backdrop-blur border text-xs px-3 py-1.5 rounded-full text-foreground shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
          <RotateCcw className="w-3.5 h-3.5 text-primary" />
          <span>Resumed from {formatTime(resumedFrom)}</span>
        </div>
      )}

      {/* Top Header Controls */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 flex items-center justify-between z-20 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-4">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-600 text-white shrink-0">
            HLS Stream
          </span>
          <h3 className="font-semibold text-sm sm:text-base text-white truncate drop-shadow-md">
            {title}
          </h3>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur transition-colors shrink-0"
            aria-label="Close Player"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            <span className="text-xs text-white/90 font-medium tracking-wide">
              Buffering stream...
            </span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm z-30 p-6">
          <div className="max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-base text-white">Playback Interrupted</h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {errorMessage || "The requested video stream could not be loaded."}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => initVideo()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Playback</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-neutral-700 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Center Big Play Button (when paused) */}
      {!isPlaying && !isLoading && !hasError && (
        <button
          onClick={togglePlay}
          className="absolute z-10 w-16 h-16 rounded-full bg-purple-600/90 hover:bg-purple-600 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-all"
          aria-label="Play video"
        >
          <Play className="w-8 h-8 fill-current ml-1" />
        </button>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300 flex flex-col gap-2 z-20 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className="relative h-1.5 hover:h-2.5 bg-white/20 rounded-full cursor-pointer transition-all flex items-center group/scrubber"
        >
          {/* Buffer Bar */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full"
            style={{ width: `${buffered}%` }}
          />

          {/* Progress Bar */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-purple-600 rounded-full flex items-center justify-end"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-white shadow scale-0 group-hover/scrubber:scale-100 transition-transform -mr-1.5" />
          </div>
        </div>

        {/* Buttons and Time */}
        <div className="flex items-center justify-between text-white text-xs pt-1">
          {/* Left Controls: Play, Skip, Volume, Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1 hover:text-purple-400 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={() => skip(-10)}
              className="p-1 hover:text-purple-400 transition-colors hidden sm:block"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => skip(10)}
              className="p-1 hover:text-purple-400 transition-colors hidden sm:block"
              title="Fast Forward 10s"
            >
              <FastForward className="w-4 h-4" />
            </button>

            {/* Volume Slider */}
            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="p-1 hover:text-purple-400 transition-colors">
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 accent-purple-500 bg-white/20 rounded cursor-pointer hidden group-hover/vol:block transition-all"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-[11px] font-mono text-neutral-300 ml-1">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1 text-neutral-500">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Settings & Fullscreen */}
          <div className="flex items-center gap-3 relative">
            {/* Settings Trigger */}
            <button
              onClick={() => {
                setIsSettingsOpen(!isSettingsOpen);
                setSettingsTab("menu");
              }}
              className="p-1 hover:text-purple-400 transition-colors"
              title="Playback Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Settings Flyout */}
            {isSettingsOpen && (
              <div className="absolute bottom-10 right-0 bg-neutral-900 border border-neutral-800 rounded-xl p-2 w-48 text-xs text-white shadow-2xl z-30 animate-in fade-in zoom-in-95">
                {settingsTab === "menu" && (
                  <div className="space-y-1">
                    <button
                      onClick={() => setSettingsTab("speed")}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-800 flex items-center justify-between transition-colors"
                    >
                      <span>Speed</span>
                      <span className="text-neutral-400 font-mono">{playbackSpeed}x</span>
                    </button>

                    {qualities.length > 0 && (
                      <button
                        onClick={() => setSettingsTab("quality")}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-800 flex items-center justify-between transition-colors"
                      >
                        <span>Quality</span>
                        <span className="text-neutral-400">
                          {currentQuality === -1
                            ? "Auto"
                            : qualities.find((q) => q.index === currentQuality)?.label || "Auto"}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {settingsTab === "speed" && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    <div className="px-3 py-1 font-semibold text-[10px] text-neutral-400 uppercase tracking-wider border-b border-neutral-800 mb-1">
                      Playback Speed
                    </div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((sp) => (
                      <button
                        key={sp}
                        onClick={() => handleSpeedChange(sp)}
                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-neutral-800 flex items-center justify-between transition-colors"
                      >
                        <span>{sp}x</span>
                        {playbackSpeed === sp && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </button>
                    ))}
                  </div>
                )}

                {settingsTab === "quality" && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    <div className="px-3 py-1 font-semibold text-[10px] text-neutral-400 uppercase tracking-wider border-b border-neutral-800 mb-1">
                      Stream Quality
                    </div>
                    <button
                      onClick={() => handleQualityChange(-1)}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-neutral-800 flex items-center justify-between transition-colors"
                    >
                      <span>Auto</span>
                      {currentQuality === -1 && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>

                    {qualities.map((q) => (
                      <button
                        key={q.index}
                        onClick={() => handleQualityChange(q.index)}
                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-neutral-800 flex items-center justify-between transition-colors"
                      >
                        <span>{q.label}</span>
                        {currentQuality === q.index && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1 hover:text-purple-400 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
