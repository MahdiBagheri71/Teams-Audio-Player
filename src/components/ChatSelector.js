// src/components/ChatSelector.js
import React, { useState, useMemo } from 'react';
import './ChatSelector.css';

const ChatSelector = ({
  chats,
  loading,
  onChatSelect,
  onRefresh,
  selectedChatId,
}) => {
  const [scanningChat, setScanningChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) {
      return chats;
    }

    const query = searchQuery.toLowerCase().trim();
    return chats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(query) ||
        chat.type.toLowerCase().includes(query)
    );
  }, [chats, searchQuery]);

  const formatDate = (date) => {
    try {
      const now = new Date();
      const chatDate = new Date(date);
      const diffTime = Math.abs(now - chatDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return 'Today';
      if (diffDays === 2) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays - 1} days ago`;

      return chatDate.toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  const getChatIcon = (chatType) => {
    switch (chatType) {
      case 'oneOnOne':
        return '👤';
      case 'group':
        return '👥';
      case 'meeting':
        return '📹';
      default:
        return '💬';
    }
  };

  const getChatTypeLabel = (chatType) => {
    switch (chatType) {
      case 'oneOnOne':
        return 'Private';
      case 'group':
        return 'Group';
      case 'meeting':
        return 'Meeting';
      default:
        return 'Chat';
    }
  };

  const handleChatClick = async (chat) => {
    setScanningChat(chat.id);
    try {
      await onChatSelect(chat);
    } finally {
      setScanningChat(null);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="chat-selector">
        <div className="selector-header">
          <h2>🔄 Loading your chats...</h2>
        </div>
      </div>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <div className="chat-selector">
        <div className="selector-header">
          <h2>No Chats Found</h2>
        </div>
        <div className="empty-chats">
          <p>📱 No Teams chats were found.</p>
          <button onClick={onRefresh} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-selector">
      <div className="selector-header">
        <h2>💬 Select a Chat ({chats.length})</h2>
        <p>Choose a chat to scan for audio files</p>

        {/* Search Input */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="clear-search"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="search-results-info">
              {filteredChats.length === 0
                ? `No chats match "${searchQuery}"`
                : `${filteredChats.length} chat${
                    filteredChats.length === 1 ? '' : 's'
                  } found`}
            </div>
          )}
        </div>

        <button onClick={onRefresh} className="refresh-btn">
          🔄 Refresh Chats
        </button>
      </div>

      <div className="chat-list">
        {filteredChats.length === 0 ? (
          <div className="no-search-results">
            <p>🔍 No chats match your search</p>
            <p>
              Try a different search term or{' '}
              <button onClick={clearSearch} className="link-btn">
                clear the search
              </button>
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${
                selectedChatId === chat.id ? 'selected' : ''
              } ${scanningChat === chat.id ? 'scanning' : ''}`}
              onClick={() => handleChatClick(chat)}
            >
              <div className="chat-icon">
                <span className="type-icon">{getChatIcon(chat.type)}</span>
                {chat.hasAudio === true && (
                  <span className="audio-indicator">🎵</span>
                )}
              </div>

              <div className="chat-content">
                <div className="chat-title" title={chat.title}>
                  {/* Highlight search matches */}
                  {searchQuery ? (
                    <HighlightedText
                      text={chat.title}
                      highlight={searchQuery}
                    />
                  ) : (
                    chat.title
                  )}
                </div>
                <div className="chat-meta">
                  <span className="chat-type">
                    {getChatTypeLabel(chat.type)}
                  </span>
                  <span className="separator">•</span>
                  <span className="last-updated">
                    {formatDate(chat.lastUpdated)}
                  </span>
                </div>
              </div>

              <div className="chat-actions">
                {scanningChat === chat.id ? (
                  <div className="scanning-indicator">
                    <span className="spinner">⏳</span>
                    <span className="text">Scanning...</span>
                  </div>
                ) : (
                  <button className="scan-btn">🔍 Scan for Audio</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="selector-help">
        <h4>💡 How it works:</h4>
        <ul>
          <li>
            <strong>🔍 Search</strong> to find specific chats quickly
          </li>
          <li>
            <strong>Click a chat</strong> to scan it for audio files
          </li>
          <li>
            <strong>🎵 Icon</strong> means we found audio files in this chat
          </li>
          <li>
            Only your <strong>50 most recent messages</strong> per chat are
            scanned
          </li>
        </ul>
      </div>
    </div>
  );
};

// Helper component to highlight search matches
const HighlightedText = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(
    `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  );
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="search-highlight">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

export default ChatSelector;
