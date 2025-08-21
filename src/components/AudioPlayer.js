// src/components/AudioPlayer.js - Simplified (hook handles auto-play)
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
    if (!currentTrack || !duration) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = duration * percentage;

    seek(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleMuteToggle = () => {
    const newVolume = volume === 0 ? 1 : 0;
    setVolume(newVolume);
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

  const getAutoPlayStatus = () => {
    if (totalTracks <= 1) return 'Single track';
    if (repeat === 'one') return 'Repeat current';
    if (repeat === 'all') return 'Loop playlist';
    return `${totalTracks - currentIndex - 1} tracks remaining`;
  };

  return (
    <div className="audio-player">
      {/* Track Info */}
      <div className="track-info-section">
        {currentTrack ? (
          <>
            <div className="track-details">
              <h3 className="track-title" title={currentTrack.name}>
                {currentTrack.name}
              </h3>
              <p className="track-meta">
                👤 {currentTrack.sender} • 📍 {currentTrack.location}
                {totalTracks > 0 && (
                  <span className="track-position">
                    • Track {currentIndex + 1} of {totalTracks}
                  </span>
                )}
              </p>
              <p className="track-source">
                📎{' '}
                {currentTrack.source === 'shared_url'
                  ? 'Shared Link'
                  : 'File Attachment'}
                {currentTrack.canPlay ? ' • ✅ Playable' : ' • ❌ Not playable'}
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
            <p>🎵 No track selected</p>
            <p>Select a track from the playlist to start</p>
            {totalTracks === 0 && (
              <button onClick={onRefresh} className="btn-refresh">
                🔄 Load Audio Files
              </button>
            )}
          </div>
        )}
      </div>

      {/* Auto-play Status */}
      {totalTracks > 0 && (
        <div className="autoplay-status">
          <div className="autoplay-indicators">
            <span className="indicator">
              🎵 <strong>Auto-play:</strong> {getAutoPlayStatus()}
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
          <div className="playback-info">
            ℹ️ Hook handles auto-play when songs end
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-section">
        <span className="time-display current-time">
          {formatTime(currentTime)}
        </span>
        <div
          className="progress-bar"
          onClick={handleProgressClick}
          style={{ cursor: currentTrack && duration ? 'pointer' : 'default' }}
        >
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
          <div
            className="progress-handle"
            style={{
              left: `${progressPercentage}%`,
              opacity: currentTrack && duration ? 1 : 0,
            }}
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
          onClick={handleMuteToggle}
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
          onChange={handleVolumeChange}
          title={`Volume: ${Math.round(volume * 100)}%`}
        />
        <span className="volume-display">{Math.round(volume * 100)}%</span>
      </div>

      {/* Status Messages */}
      {loading && (
        <div className="status-message loading">
          ⏳ Loading: {currentTrack?.name || 'track'}
        </div>
      )}

      {error && <div className="status-message error">❌ {error}</div>}

      {!currentTrack && totalTracks > 0 && !loading && (
        <div className="status-message info">
          📋 {totalTracks} tracks loaded. Click one to start playing!
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
