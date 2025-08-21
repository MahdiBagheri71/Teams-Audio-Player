// src/hooks/useAudioPlayer.js - Fixed auto-play
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
  const [repeat, setRepeat] = useState('none'); // 'none', 'one', 'all'

  // Helper function to get next track index
  const getNextIndex = useCallback(() => {
    if (shuffle) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } while (nextIndex === currentIndex && playlist.length > 1);
      return nextIndex;
    } else {
      return currentIndex + 1;
    }
  }, [shuffle, currentIndex, playlist.length]);

  // Helper function to get previous track index
  const getPreviousIndex = useCallback(() => {
    if (shuffle) {
      let prevIndex;
      do {
        prevIndex = Math.floor(Math.random() * playlist.length);
      } while (prevIndex === currentIndex && playlist.length > 1);
      return prevIndex;
    } else {
      return currentIndex - 1;
    }
  }, [shuffle, currentIndex, playlist.length]);

  const loadTrack = useCallback(async (track, index) => {
    if (!track || !track.downloadUrl) {
      setError('No valid audio URL');
      return false;
    }

    try {
      setError(null);
      setLoading(true);

      console.log('🎵 Loading track:', track.name, 'at index:', index);

      const audio = audioRef.current;

      // Clear previous source
      audio.src = '';
      audio.load();

      // Set new source
      audio.src = track.downloadUrl;

      setCurrentTrack(track);
      setCurrentIndex(index);

      // Wait for metadata to load
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Load timeout'));
        }, 10000); // 10 second timeout

        const handleLoadedMetadata = () => {
          clearTimeout(timeoutId);
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('error', handleError);
          console.log('✅ Track loaded successfully:', track.name);
          resolve();
        };

        const handleError = (e) => {
          clearTimeout(timeoutId);
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('error', handleError);
          console.error('❌ Failed to load track:', track.name, e);
          reject(new Error(`Failed to load: ${track.name}`));
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('error', handleError);

        // Start loading
        audio.load();
      });

      return true;
    } catch (error) {
      console.error('💥 Load track failed:', error);
      setError(error.message);
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
      await audioRef.current.play();
      setIsPlaying(true);
      setError(null);
      return true;
    } catch (error) {
      console.error('❌ Failed to play:', error);
      setError('Failed to play audio - ' + error.message);
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
    async (index) => {
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
        `🎯 Playing track ${index + 1}/${playlist.length}:`,
        track.name
      );

      const loaded = await loadTrack(track, index);
      if (loaded) {
        return await play();
      }

      return false;
    },
    [playlist, loadTrack, play]
  );

  const playNext = useCallback(async () => {
    console.log('⏭️ Playing next track...');
    console.log('Current state:', {
      currentIndex,
      playlistLength: playlist.length,
      repeat,
    });

    const nextIndex = getNextIndex();

    if (repeat === 'all' && nextIndex >= playlist.length) {
      // Loop to beginning
      console.log('🔁 Looping to beginning');
      return await playTrack(0);
    } else if (nextIndex < playlist.length) {
      console.log(`➡️ Moving to track ${nextIndex + 1}`);
      return await playTrack(nextIndex);
    } else {
      console.log('🏁 No more tracks');
      setIsPlaying(false);
      return false;
    }
  }, [currentIndex, playlist.length, repeat, getNextIndex, playTrack]);

  const playPrevious = useCallback(async () => {
    console.log('⏮️ Playing previous track...');

    const prevIndex = getPreviousIndex();

    if (repeat === 'all' && prevIndex < 0) {
      // Loop to end
      console.log('🔁 Looping to end');
      return await playTrack(playlist.length - 1);
    } else if (prevIndex >= 0) {
      console.log(`⬅️ Moving to track ${prevIndex + 1}`);
      return await playTrack(prevIndex);
    } else {
      console.log('🏁 No previous tracks');
      return false;
    }
  }, [currentIndex, playlist.length, repeat, getPreviousIndex, playTrack]);

  // Handle when track ends - با تمام dependencies
  const handleTrackEnd = useCallback(() => {
    console.log('🔚 Track ended:', currentTrack?.name);
    console.log('End state:', {
      repeat,
      currentIndex,
      playlistLength: playlist.length,
    });

    if (repeat === 'one') {
      console.log('🔂 Repeating current track');
      const audio = audioRef.current;
      audio.currentTime = 0;
      audio.play().catch(console.error);
      return;
    }

    if (repeat === 'all') {
      console.log('🔁 Repeat all mode - playing next');
      playNext();
      return;
    }

    // Normal mode
    if (currentIndex < playlist.length - 1) {
      console.log(
        `✨ Auto-playing next: ${currentIndex + 1}/${playlist.length}`
      );
      playNext();
    } else {
      console.log('🏁 End of playlist reached');
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
      }
    }
  }, [isPlaying, currentTrack, playlist, play, pause, playTrack]);

  const seek = useCallback(
    (time) => {
      if (isFinite(time) && time >= 0) {
        audioRef.current.currentTime = Math.min(time, duration || 0);
        setCurrentTime(time);
      }
    },
    [duration]
  );

  const updatePlaylist = useCallback(
    (tracks) => {
      console.log('📋 Updating playlist:', tracks.length, 'tracks');
      setPlaylistState(tracks);
      setCurrentIndex(0);
      setCurrentTrack(null);
      setIsPlaying(false);
      setError(null);

      // Auto-load first track if available
      if (tracks.length > 0) {
        loadTrack(tracks[0], 0);
      }
    },
    [loadTrack]
  );

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

  // Initialize audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      setCurrentTime(currentTime);

      // Debug timing
      if (audio.duration && Math.abs(audio.duration - currentTime) < 0.1) {
        console.log('🕐 Almost ended:', {
          currentTime: currentTime.toFixed(2),
          duration: audio.duration.toFixed(2),
          difference: (audio.duration - currentTime).toFixed(2),
        });
      }
    };

    const handleDurationChange = () => {
      const newDuration = audio.duration || 0;
      console.log('⏱️ Duration loaded:', formatTime(newDuration));
      setDuration(newDuration);
    };

    const handleLoadStart = () => {
      console.log('📀 Load started');
      setLoading(true);
    };

    const handleCanPlay = () => {
      console.log('✅ Can play');
      setLoading(false);
    };

    const handleError = (e) => {
      console.error('❌ Audio error:', e);
      setError('Audio playback error');
      setLoading(false);
      setIsPlaying(false);
    };

    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('error', handleError);

    return () => {
      // Cleanup
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('error', handleError);
    };
  }, [handleTrackEnd, formatTime]); // ✅ handleTrackEnd dependency اضافه شد

  // Update volume when changed
  useEffect(() => {
    audioRef.current.volume = Math.max(0, Math.min(1, volume));
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

    // Actions
    togglePlayPause,
    playTrack,
    playNext,
    playPrevious,
    seek,
    setVolume,
    setPlaylist: updatePlaylist,
    toggleShuffle,
    toggleRepeat,

    // Utils
    formatTime,
  };
};
