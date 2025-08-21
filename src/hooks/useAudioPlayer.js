// src/hooks/useAudioPlayer.js - Simplified and Robust
import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioPlayer = () => {
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playlist, setPlaylistState] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('none');
  const [canPlayNext, setCanPlayNext] = useState(true); // Anti-loop protection

  // Simple next/previous index calculation
  const getNextIndex = useCallback(() => {
    if (shuffle) {
      const availableIndices = playlist
        .map((_, idx) => idx)
        .filter((idx) => idx !== currentIndex);
      return availableIndices.length > 0
        ? availableIndices[Math.floor(Math.random() * availableIndices.length)]
        : (currentIndex + 1) % playlist.length;
    }
    return (currentIndex + 1) % playlist.length;
  }, [shuffle, currentIndex, playlist.length]);

  const getPreviousIndex = useCallback(() => {
    if (shuffle) {
      const availableIndices = playlist
        .map((_, idx) => idx)
        .filter((idx) => idx !== currentIndex);
      return availableIndices.length > 0
        ? availableIndices[Math.floor(Math.random() * availableIndices.length)]
        : (currentIndex - 1 + playlist.length) % playlist.length;
    }
    return (currentIndex - 1 + playlist.length) % playlist.length;
  }, [shuffle, currentIndex, playlist.length]);

  // Simple, reliable loading
  const loadTrack = useCallback(async (track, index) => {
    if (!track || !track.downloadUrl) {
      setError('No valid audio URL');
      return false;
    }

    console.log('🎵 Loading track:', track.name);

    try {
      setLoading(true);
      setError(null);

      const audio = audioRef.current;

      // Stop any current playback
      audio.pause();
      setIsPlaying(false);

      // Clear and set new source
      audio.src = '';
      audio.src = track.downloadUrl;

      // Update state immediately
      setCurrentTrack(track);
      setCurrentIndex(index);
      setCurrentTime(0);
      setDuration(0);

      // Simple load with reasonable timeout
      return new Promise((resolve) => {
        let resolved = false;

        const cleanup = () => {
          if (!resolved) {
            resolved = true;
            audio.removeEventListener('loadedmetadata', onSuccess);
            audio.removeEventListener('canplay', onSuccess);
            audio.removeEventListener('loadeddata', onSuccess);
            audio.removeEventListener('error', onError);
            setLoading(false);
          }
        };

        const onSuccess = () => {
          console.log('✅ Track loaded successfully:', track.name);
          cleanup();
          resolve(true);
        };

        const onError = (e) => {
          console.error('❌ Load failed:', track.name, e.type);
          setError(`Failed to load: ${track.name}`);
          cleanup();
          resolve(false);
        };

        // Add listeners
        audio.addEventListener('loadedmetadata', onSuccess, { once: true });
        audio.addEventListener('canplay', onSuccess, { once: true });
        audio.addEventListener('loadeddata', onSuccess, { once: true });
        audio.addEventListener('error', onError, { once: true });

        // Set timeout
        setTimeout(() => {
          if (!resolved) {
            console.log('⚠️ Load timeout, but continuing anyway:', track.name);
            cleanup();
            resolve(true); // Continue anyway
          }
        }, 10000); // 10 second timeout

        // Start loading
        audio.load();
      });
    } catch (error) {
      console.error('💥 Load error:', error);
      setError(`Load error: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const play = useCallback(async () => {
    if (!currentTrack) {
      console.warn('⚠️ No track to play');
      return false;
    }

    try {
      console.log('▶️ Playing:', currentTrack.name);

      const audio = audioRef.current;
      await audio.play();

      setIsPlaying(true);
      setError(null);
      setCanPlayNext(true); // Reset auto-play protection
      return true;
    } catch (error) {
      console.error('❌ Play failed:', error);

      if (error.name === 'NotAllowedError') {
        setError('🔊 Click play button - browser blocked autoplay');
      } else if (error.name === 'NotSupportedError') {
        setError('❌ Audio format not supported');
      } else {
        setError('❌ Playback failed - check your connection');
      }

      setIsPlaying(false);
      return false;
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    console.log('⏸️ Pausing');
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const playTrack = useCallback(
    async (index, autoPlay = true) => {
      if (index < 0 || index >= playlist.length) {
        console.warn('⚠️ Invalid track index:', index);
        return false;
      }

      const track = playlist[index];
      if (!track) {
        console.warn('⚠️ No track at index:', index);
        return false;
      }

      console.log(
        `🎯 Loading track ${index + 1}/${playlist.length}:`,
        track.name
      );

      const loaded = await loadTrack(track, index);

      if (loaded && autoPlay) {
        return await play();
      }

      return loaded;
    },
    [playlist, loadTrack, play]
  );

  const playNext = useCallback(
    async (force = false) => {
      // Anti-loop protection
      if (!force && !canPlayNext) {
        console.log('🛑 Auto-play next blocked to prevent loop');
        setError('❌ Multiple playback failures. Please try manually.');
        return false;
      }

      if (playlist.length <= 1) {
        console.log('🏁 Single track playlist');
        setIsPlaying(false);
        return false;
      }

      const nextIndex = getNextIndex();

      // Check repeat mode
      if (repeat === 'all' || nextIndex !== currentIndex) {
        console.log('⏭️ Playing next:', nextIndex + 1);
        setCanPlayNext(false); // Prevent rapid auto-skip

        const success = await playTrack(nextIndex);

        if (!success) {
          console.log('❌ Next track failed, stopping auto-play');
          setCanPlayNext(false);
          return false;
        }

        return true;
      } else {
        console.log('🏁 End of playlist');
        setIsPlaying(false);
        return false;
      }
    },
    [
      playlist.length,
      getNextIndex,
      repeat,
      currentIndex,
      canPlayNext,
      playTrack,
    ]
  );

  const playPrevious = useCallback(async () => {
    if (playlist.length <= 1) {
      console.log('🏁 Single track playlist');
      return false;
    }

    const prevIndex = getPreviousIndex();

    if (repeat === 'all' || prevIndex !== currentIndex) {
      console.log('⏮️ Playing previous:', prevIndex + 1);
      return await playTrack(prevIndex);
    } else {
      console.log('🏁 Start of playlist');
      return false;
    }
  }, [playlist.length, getPreviousIndex, repeat, currentIndex, playTrack]);

  // Handle when track ends - SIMPLE
  const handleTrackEnd = useCallback(() => {
    console.log('🔚 Track ended:', currentTrack?.name);
    console.log('🔄 Repeat mode:', repeat);

    if (repeat === 'one') {
      console.log('🔂 Repeating current track');
      const audio = audioRef.current;
      audio.currentTime = 0;
      audio.play().catch(() => {
        console.error('❌ Repeat failed');
        setError('❌ Repeat failed');
        setIsPlaying(false);
      });
      return;
    }

    // Auto-play next (with protection)
    if (repeat === 'all' || currentIndex < playlist.length - 1) {
      console.log('✨ Auto-playing next track...');
      playNext();
    } else {
      console.log('🏁 Playlist ended');
      setIsPlaying(false);
    }
  }, [repeat, currentIndex, playlist.length, currentTrack, playNext]);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      if (currentTrack) {
        await play();
      } else if (playlist.length > 0) {
        await playTrack(0);
      } else {
        setError('❌ No tracks available');
      }
    }
  }, [isPlaying, currentTrack, playlist.length, play, pause, playTrack]);

  const seek = useCallback(
    (time) => {
      if (isFinite(time) && time >= 0 && duration > 0) {
        try {
          audioRef.current.currentTime = Math.min(time, duration);
          setCurrentTime(time);
        } catch (error) {
          console.warn('⚠️ Seek failed:', error);
        }
      }
    },
    [duration]
  );

  const updatePlaylist = useCallback((tracks) => {
    console.log('📋 Updating playlist:', tracks.length, 'tracks');

    // Reset everything
    const audio = audioRef.current;
    audio.pause();
    audio.src = '';

    setPlaylistState(tracks);
    setCurrentIndex(0);
    setCurrentTrack(null);
    setIsPlaying(false);
    setLoading(false);
    setError(null);
    setCanPlayNext(true);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      console.log('🔀 Shuffle:', !prev ? 'ON' : 'OFF');
      return !prev;
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat((prev) => {
      const modes = ['none', 'all', 'one'];
      const currentIdx = modes.indexOf(prev);
      const nextMode = modes[(currentIdx + 1) % modes.length];
      console.log('🔁 Repeat mode:', nextMode);
      return nextMode;
    });
  }, []);

  const formatTime = useCallback((seconds) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Manual retry function
  const retryCurrentTrack = useCallback(async () => {
    if (currentTrack) {
      console.log('🔄 Retrying current track:', currentTrack.name);
      setCanPlayNext(true); // Reset protection
      await playTrack(currentIndex);
    }
  }, [currentTrack, currentIndex, playTrack]);

  // Initialize audio element listeners - SIMPLIFIED
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleWaiting = () => {
      console.log('⏳ Buffering...');
    };

    const handlePlaying = () => {
      console.log('▶️ Playback started');
      setLoading(false);
    };

    const handlePause = () => {
      console.log('⏸️ Playback paused');
    };

    const handleError = (e) => {
      console.error('❌ Audio error:', e.type, e.message);
      setIsPlaying(false);
      setLoading(false);
      setError('❌ Playback error occurred');
      setCanPlayNext(false); // Prevent auto-skip loops
    };

    // Add listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('error', handleError);

    return () => {
      // Cleanup
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('error', handleError);
    };
  }, [handleTrackEnd]);

  // Volume control
  useEffect(() => {
    try {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    } catch (error) {
      console.warn('⚠️ Volume change failed:', error);
    }
  }, [volume]);

  return {
    // State
    isPlaying,
    currentTime,
    duration,
    volume,
    currentTrack,
    playlist,
    currentIndex,
    loading,
    error,
    shuffle,
    repeat,
    canPlayNext,

    // Actions
    togglePlayPause,
    playTrack,
    playNext: () => playNext(true), // Force next
    playPrevious,
    seek,
    setVolume,
    setPlaylist: updatePlaylist,
    toggleShuffle,
    toggleRepeat,
    retryCurrentTrack,

    // Utils
    formatTime,
  };
};
