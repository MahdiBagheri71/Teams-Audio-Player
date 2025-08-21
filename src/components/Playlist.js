// src/components/Playlist.js
import React, { useState, useMemo } from 'react';
import './Playlist.css';

const Playlist = ({ files, currentIndex, onTrackSelect, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'sender', 'location'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'chat', 'onedrive', 'shared_link'

  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (file) =>
          file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply source filter
    if (filterBy !== 'all') {
      filtered = filtered.filter((file) => file.source === filterBy);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'sender':
          return a.sender.localeCompare(b.sender);
        case 'location':
          return a.location.localeCompare(b.location);
        case 'date':
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return filtered;
  }, [files, searchTerm, sortBy, filterBy]);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'onedrive':
        return '☁️';
      case 'shared_link':
        return '🔗';
      case 'chat':
      default:
        return '💬';
    }
  };

  const getSourceName = (source) => {
    switch (source) {
      case 'onedrive':
        return 'OneDrive';
      case 'shared_link':
        return 'Shared Link';
      case 'chat':
      default:
        return 'Chat';
    }
  };

  if (loading) {
    return (
      <div className="playlist loading-state">
        <div className="playlist-header">
          <h3>Loading Playlist...</h3>
        </div>
        <div className="loading-animation">
          <div className="loading-bar"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="playlist">
      <div className="playlist-header">
        <h3>
          Playlist
          <span className="track-count">
            ({filteredAndSortedFiles.length} of {files.length} tracks)
          </span>
        </h3>

        <div className="playlist-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="sender">Sort by Sender</option>
            <option value="location">Sort by Location</option>
          </select>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Sources</option>
            <option value="chat">Teams Chats</option>
            <option value="onedrive">OneDrive</option>
            <option value="shared_link">Shared Links</option>
          </select>
        </div>
      </div>

      <div className="playlist-content">
        {filteredAndSortedFiles.length === 0 ? (
          <div className="empty-playlist">
            {files.length === 0 ? (
              <div className="no-files">
                <p>No audio files found in your Teams chats</p>
                <small>
                  Try sharing some audio files in your Teams chats first
                </small>
              </div>
            ) : (
              <div className="no-results">
                <p>No files match your search criteria</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBy('all');
                  }}
                  className="btn-clear-filters"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="track-list">
            {filteredAndSortedFiles.map((file, index) => {
              const originalIndex = files.indexOf(file);
              const isCurrentTrack = originalIndex === currentIndex;

              return (
                <div
                  key={file.id}
                  className={`track-item ${isCurrentTrack ? 'active' : ''}`}
                  onClick={() => onTrackSelect(originalIndex)}
                >
                  <div className="track-number">
                    {isCurrentTrack ? '🎵' : index + 1}
                  </div>

                  <div className="track-info">
                    <div className="track-name">{file.name}</div>
                    <div className="track-meta">
                      <span className="sender">{file.sender}</span>
                      <span className="separator">•</span>
                      <span className="location">{file.location}</span>
                      <span className="separator">•</span>
                      <span className="date">{formatDate(file.date)}</span>
                    </div>
                  </div>

                  <div className="track-details">
                    <div className="source-info">
                      <span className="source-icon">
                        {getSourceIcon(file.source)}
                      </span>
                      <span className="source-name">
                        {getSourceName(file.source)}
                      </span>
                    </div>
                    {file.size > 0 && (
                      <div className="file-size">
                        {formatFileSize(file.size)}
                      </div>
                    )}
                  </div>

                  <div className="track-actions">
                    <button
                      className="btn-play-track"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrackSelect(originalIndex);
                      }}
                      title="Play this track"
                    >
                      {isCurrentTrack ? '⏸' : '▶'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Playlist;
