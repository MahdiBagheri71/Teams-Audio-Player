// src/components/AudioPlayer.js - Fixed with auto-play
import React, { useRef, useEffect } from 'react';
import './AudioPlayer.css';

const AudioPlayer = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  currentTrack,
  currentIndex,
  loading,
  error,
  shuffle,
  repeat,
  togglePlayPause,
  playNext,
  playPrevious,
  seek,
  setVolume,
  toggleShuffle,
  toggleRepeat,
  formatTime,
  onRefresh,
  totalTracks,
}) => {
  const audioRef = useRef(null);

  // Handle auto-play next song when current song ends
  useEffect(() => {
    const audio = audioRef.current;

    if (audio && currentTrack) {
      const handleEnded = () => {
        console.log('🔚 Song ended');

        if (repeat === 'one') {
          // Repeat current song
          console.log('🔂 Repeating current song');
          audio.currentTime = 0;
          audio.play().catch(console.error);
        } else if (repeat === 'all' || repeat !== 'none') {
          // Play next song, or loop to first if at end
          console.log('🔁 Auto-playing next (repeat all mode)');
          playNext();
        } else {
          // Normal auto-play next (if not last song)
          if (currentIndex < totalTracks - 1) {
            console.log(`⏭️ Auto-playing next track: ${currentIndex + 1}`);
            playNext();
          } else {
            console.log('🏁 Reached end of playlist');
          }
        }
      };

      const handleLoadedData = () => {
        console.log('📀 Audio loaded:', currentTrack.name);
      };

      const handleError = () => {
        console.error('❌ Audio error for:', currentTrack.name);
      };

      // Add event listeners
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('loadeddata', handleLoadedData);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [currentTrack, currentIndex, totalTracks, repeat, playNext]);

  // Update audio source when track changes
  useEffect(() => {
    const audio = audioRef.current;

    if (audio && currentTrack?.downloadUrl) {
      console.log('🎵 Setting audio source:', currentTrack.name);
      audio.src = currentTrack.downloadUrl;
      audio.load(); // Force reload

      // Play if should be playing
      if (isPlaying) {
        audio.play().catch((error) => {
          console.error('❌ Failed to auto-play:', error);
        });
      }
    }
  }, [currentTrack]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;

    if (audio && currentTrack) {
      if (isPlaying) {
        audio.play().catch((error) => {
          console.error('❌ Failed to play:', error);
        });
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  // Handle seek changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && Math.abs(audio.currentTime - currentTime) > 1) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = duration * percentage;
    seek(newTime);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getRepeatIcon = () => {
    switch (repeat) {
      case 'one':
        return '🔂';
      case 'all':
        return '🔁';
      default:
        return '🔁';
    }
  };

  const getRepeatClass = () => {
    return repeat !== 'none' ? 'active' : '';
  };

  const getVolumeIcon = () => {
    if (volume === 0) return '🔇';
    if (volume < 0.5) return '🔉';
    return '🔊';
  };

  return (
    <div className="audio-player">
      {/* Hidden audio element for actual playback */}
      <audio ref={audioRef} />

      {/* Track Info */}
      <div className="track-info-section">
        {currentTrack ? (
          <>
            <div className="track-details">
              <h3 className="track-title">{currentTrack.name}</h3>
              <p className="track-meta">
                {currentTrack.sender} • {currentTrack.location}
                {totalTracks > 0 && (
                  <span className="track-position">
                    • Track {currentIndex + 1} of {totalTracks}
                  </span>
                )}
              </p>
              {currentTrack.source && (
                <p className="track-source">
                  Source:{' '}
                  {currentTrack.source === 'shared_url'
                    ? '🔗 Shared Link'
                    : '📁 File Attachment'}
                </p>
              )}
            </div>
            <div className="track-actions">
              <button
                onClick={onRefresh}
                className="btn-refresh"
                title="Refresh playlist"
              >
                🔄
              </button>
            </div>
          </>
        ) : (
          <div className="no-track">
            <p>No track selected</p>
            {totalTracks === 0 && (
              <button onClick={onRefresh} className="btn-refresh">
                🔄 Load Audio Files
              </button>
            )}
          </div>
        )}
      </div>

      {/* Auto-play Status */}
      {totalTracks > 1 && (
        <div className="autoplay-status">
          <div className="autoplay-indicators">
            <span className="indicator">
              🔄 <strong>Auto-play:</strong> {totalTracks > 1 ? 'ON' : 'OFF'}
            </span>
            {shuffle && (
              <span className="indicator">
                🔀 <strong>Shuffle:</strong> ON
              </span>
            )}
            <span className="indicator">
              {getRepeatIcon()} <strong>Repeat:</strong>{' '}
              {repeat === 'one'
                ? 'Current Song'
                : repeat === 'all'
                ? 'All Songs'
                : 'OFF'}
            </span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-section">
        <span className="time-display current-time">
          {formatTime(currentTime)}
        </span>
        <div className="progress-bar" onClick={handleProgressClick}>
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
          <div
            className="progress-handle"
            style={{ left: `${progressPercentage}%` }}
          />
        </div>
        <span className="time-display total-time">{formatTime(duration)}</span>
      </div>

      {/* Main Controls */}
      <div className="main-controls">
        <button
          className={`btn-control btn-shuffle ${shuffle ? 'active' : ''}`}
          onClick={toggleShuffle}
          title={`Shuffle: ${shuffle ? 'ON' : 'OFF'}`}
        >
          🔀
        </button>

        <button
          className="btn-control btn-previous"
          onClick={playPrevious}
          disabled={loading || !currentTrack}
          title="Previous track"
        >
          ⏮
        </button>

        <button
          className="btn-control btn-play-pause main-play-button"
          onClick={togglePlayPause}
          disabled={loading || !currentTrack}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {loading ? '⏳' : isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className="btn-control btn-next"
          onClick={playNext}
          disabled={loading || !currentTrack}
          title="Next track"
        >
          ⏭
        </button>

        <button
          className={`btn-control btn-repeat ${getRepeatClass()}`}
          onClick={toggleRepeat}
          title={`Repeat: ${
            repeat === 'one' ? 'Current' : repeat === 'all' ? 'All' : 'Off'
          }`}
        >
          {getRepeatIcon()}
        </button>
      </div>

      {/* Volume Control */}
      <div className="volume-section">
        <button
          className="btn-volume"
          onClick={() => setVolume(volume === 0 ? 1 : 0)}
          title={volume === 0 ? 'Unmute' : 'Mute'}
        >
          {getVolumeIcon()}
        </button>
        <input
          type="range"
          className="volume-slider"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          title={`Volume: ${Math.round(volume * 100)}%`}
        />
        <span className="volume-display">{Math.round(volume * 100)}%</span>
      </div>

      {/* Status Messages */}
      {loading && (
        <div className="status-message loading">
          Loading track... {currentTrack?.name}
        </div>
      )}

      {error && <div className="status-message error">{error}</div>}

      {!currentTrack && totalTracks === 0 && (
        <div className="status-message info">
          No audio files available. Select a chat with audio files.
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
