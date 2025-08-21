// src/components/Playlist.js - Updated to handle non-playable files
import React from 'react';
import './Playlist.css';

const Playlist = ({ files, currentIndex, onTrackSelect, loading }) => {
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  const handleItemClick = (index, file) => {
    if (file.canPlay) {
      onTrackSelect(index);
    } else {
      // For Teams attachments, open Teams message
      if (file.teamsMessageUrl) {
        window.open(file.teamsMessageUrl, '_blank');
      } else {
        alert(
          `Cannot play "${file.name}" directly. This is a Teams attachment that needs to be downloaded manually from Teams.`
        );
      }
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'teams_chat':
        return '💬';
      case 'onedrive':
        return '📁';
      case 'shared_url':
        return '🔗';
      case 'shared_link':
        return '🌐';
      default:
        return '🎵';
    }
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'teams_chat':
        return 'Teams Chat';
      case 'onedrive':
        return 'OneDrive';
      case 'shared_url':
        return 'Shared URL';
      case 'shared_link':
        return 'Shared Link';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="playlist">
        <div className="playlist-header">
          <h2>🔄 Loading audio files...</h2>
        </div>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="playlist">
        <div className="playlist-header">
          <h2>No Audio Files Found</h2>
        </div>
        <div className="empty-playlist">
          <p>🎵 No audio files were found in your Teams chats or OneDrive.</p>
          <div className="suggestions">
            <h4>Try:</h4>
            <ul>
              <li>Send an audio file in a Teams chat</li>
              <li>Upload audio files to OneDrive</li>
              <li>Share audio links in Teams messages</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Separate playable and non-playable files
  const playableFiles = files.filter((f) => f.canPlay);
  const nonPlayableFiles = files.filter((f) => !f.canPlay);

  return (
    <div className="playlist">
      <div className="playlist-header">
        <h2>🎵 Audio Files ({files.length})</h2>
        <div className="file-stats">
          <span className="playable">✅ {playableFiles.length} playable</span>
          <span className="non-playable">
            ❌ {nonPlayableFiles.length} view only
          </span>
        </div>
      </div>

      {/* Playable Files Section */}
      {playableFiles.length > 0 && (
        <div className="file-section">
          <h3 className="section-title">🎧 Ready to Play</h3>
          <div className="playlist-items">
            {playableFiles.map((file, index) => {
              const actualIndex = files.indexOf(file);
              const isActive = currentIndex === index;

              return (
                <div
                  key={file.id}
                  className={`playlist-item playable ${
                    isActive ? 'active' : ''
                  }`}
                  onClick={() => handleItemClick(index, file)}
                >
                  <div className="item-icon">
                    <span className="source-icon">
                      {getSourceIcon(file.source)}
                    </span>
                    {isActive && <span className="playing-indicator">🔊</span>}
                  </div>

                  <div className="item-content">
                    <div className="item-title" title={file.name}>
                      {file.name}
                    </div>
                    <div className="item-meta">
                      <span className="sender">{file.sender}</span>
                      <span className="separator">•</span>
                      <span className="location">{file.location}</span>
                      <span className="separator">•</span>
                      <span className="date">{formatDate(file.date)}</span>
                      {file.size > 0 && (
                        <>
                          <span className="separator">•</span>
                          <span className="size">
                            {formatFileSize(file.size)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="item-source">
                      <span className="source-label">
                        {getSourceLabel(file.source)}
                      </span>
                    </div>
                  </div>

                  <div className="item-actions">
                    <button className="play-btn" title="Play">
                      {isActive ? '⏸' : '▶'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Non-Playable Files Section */}
      {nonPlayableFiles.length > 0 && (
        <div className="file-section">
          <h3 className="section-title">
            👁️ Teams Attachments (Click to open in Teams)
          </h3>
          <div className="playlist-items">
            {nonPlayableFiles.map((file) => (
              <div
                key={file.id}
                className="playlist-item non-playable"
                onClick={() => handleItemClick(-1, file)}
                title="Click to open in Teams"
              >
                <div className="item-icon">
                  <span className="source-icon">
                    {getSourceIcon(file.source)}
                  </span>
                  <span className="lock-icon">🔒</span>
                </div>

                <div className="item-content">
                  <div className="item-title" title={file.name}>
                    {file.name}
                  </div>
                  <div className="item-meta">
                    <span className="sender">{file.sender}</span>
                    <span className="separator">•</span>
                    <span className="location">{file.location}</span>
                    <span className="separator">•</span>
                    <span className="date">{formatDate(file.date)}</span>
                    {file.size > 0 && (
                      <>
                        <span className="separator">•</span>
                        <span className="size">
                          {formatFileSize(file.size)}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="item-instructions">{file.instructions}</div>
                </div>

                <div className="item-actions">
                  <button className="open-btn" title="Open in Teams">
                    🔗
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="playlist-help">
        <h4>💡 Tips:</h4>
        <ul>
          <li>
            <strong>🎧 Ready to Play:</strong> OneDrive files and direct links -
            click to play immediately
          </li>
          <li>
            <strong>👁️ Teams Attachments:</strong> Click to open in Teams, then
            download to play locally
          </li>
          <li>
            <strong>🔄 Refresh:</strong> Upload new files to OneDrive or send
            new audio in Teams, then refresh
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Playlist;
