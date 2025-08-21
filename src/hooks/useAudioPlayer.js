// src/hooks/useAudioPlayer.js
import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioPlayer = () => {
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playlist, setPlaylistState] = useState([]); // ✅ نام تغییر کرد
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('none'); // 'none', 'one', 'all'

  // Initialize audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleLoadStart = () => setLoading(true);
    const handleCanPlay = () => setLoading(false);
    const handleEnded = () => handleTrackEnd();
    const handleError = (e) => {
      setError('Failed to load audio file');
      setLoading(false);
      console.error('Audio error:', e);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Update volume when changed
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  const handleTrackEnd = useCallback(() => {
    if (repeat === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (repeat === 'all' || currentIndex < playlist.length - 1) {
      playNext();
    } else {
      setIsPlaying(false);
    }
  }, [repeat, currentIndex, playlist.length]); // ✅ dependencies اصلاح شد

  const loadTrack = useCallback(async (track, index) => {
    try {
      setError(null);
      setLoading(true);

      const audio = audioRef.current;
      audio.src = track.downloadUrl;

      setCurrentTrack(track);
      setCurrentIndex(index);

      // Wait for metadata to load
      await new Promise((resolve, reject) => {
        const handleLoadedMetadata = () => {
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          resolve();
        };

        const handleError = () => {
          audio.removeEventListener('error', handleError);
          reject(new Error('Failed to load track'));
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('error', handleError);
      });
    } catch (error) {
      console.error('Failed to load track:', error);
      setError(`Failed to load: ${track.name}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const play = useCallback(async () => {
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setError(null);
    } catch (error) {
      console.error('Failed to play:', error);
      setError('Failed to play audio');
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      if (currentTrack) {
        await play();
      } else if (playlist.length > 0) {
        await loadTrack(playlist[0], 0);
        await play();
      }
    }
  }, [isPlaying, currentTrack, playlist, loadTrack, play, pause]);

  const playTrack = useCallback(
    async (index) => {
      if (index >= 0 && index < playlist.length) {
        await loadTrack(playlist[index], index);
        await play();
      }
    },
    [playlist, loadTrack, play]
  );

  const playNext = useCallback(async () => {
    let nextIndex;

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= playlist.length) {
        nextIndex = repeat === 'all' ? 0 : playlist.length - 1;
      }
    }

    if (nextIndex < playlist.length) {
      await playTrack(nextIndex);
    }
  }, [currentIndex, playlist.length, shuffle, repeat, playTrack]);

  const playPrevious = useCallback(async () => {
    let prevIndex;

    if (shuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = repeat === 'all' ? playlist.length - 1 : 0;
      }
    }

    if (prevIndex >= 0) {
      await playTrack(prevIndex);
    }
  }, [currentIndex, playlist.length, shuffle, repeat, playTrack]);

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  // ✅ اصلاح شده - نام function تغییر کرد
  const updatePlaylist = useCallback(
    (tracks) => {
      setPlaylistState(tracks); // ✅ درست شد
      setCurrentIndex(0);
      if (tracks.length > 0 && !currentTrack) {
        setCurrentTrack(tracks[0]);
      }
    },
    [currentTrack]
  );

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat((prev) => {
      switch (prev) {
        case 'none':
          return 'all';
        case 'all':
          return 'one';
        case 'one':
          return 'none';
        default:
          return 'none';
      }
    });
  }, []);

  const formatTime = useCallback((seconds) => {
    if (!isFinite(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

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
    setPlaylist: updatePlaylist, // ✅ exported با نام درست
    toggleShuffle,
    toggleRepeat,

    // Utils
    formatTime,
  };
};
