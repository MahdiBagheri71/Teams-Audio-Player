// src/components/AudioPlayer.js
import React from 'react';
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

  return (
    <div className="audio-player">
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
          title="Shuffle"
        >
          🔀
        </button>

        <button
          className="btn-control btn-previous"
          onClick={playPrevious}
          disabled={loading}
          title="Previous track"
        >
          ⏮
        </button>

        <button
          className="btn-control btn-play-pause main-play-button"
          onClick={togglePlayPause}
          disabled={loading}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {loading ? '⏳' : isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className="btn-control btn-next"
          onClick={playNext}
          disabled={loading}
          title="Next track"
        >
          ⏭
        </button>

        <button
          className={`btn-control btn-repeat ${getRepeatClass()}`}
          onClick={toggleRepeat}
          title={`Repeat: ${repeat}`}
        >
          {getRepeatIcon()}
        </button>
      </div>

      {/* Volume Control */}
      <div className="volume-section">
        <button className="btn-volume">
          {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </button>
        <input
          type="range"
          className="volume-slider"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
        <span className="volume-display">{Math.round(volume * 100)}%</span>
      </div>

      {/* Status Messages */}
      {loading && (
        <div className="status-message loading">Loading track...</div>
      )}

      {error && <div className="status-message error">{error}</div>}
    </div>
  );
};

export default AudioPlayer;
