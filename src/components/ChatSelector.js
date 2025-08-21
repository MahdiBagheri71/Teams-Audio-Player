// src/components/ChatSelector.js
import React, { useState } from 'react';
import './ChatSelector.css';

const ChatSelector = ({
  chats,
  loading,
  onChatSelect,
  onRefresh,
  selectedChatId,
}) => {
  const [scanningChat, setScanningChat] = useState(null);

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
        <button onClick={onRefresh} className="refresh-btn">
          🔄 Refresh Chats
        </button>
      </div>

      <div className="chat-list">
        {chats.map((chat) => (
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
                {chat.title}
              </div>
              <div className="chat-meta">
                <span className="chat-type">{getChatTypeLabel(chat.type)}</span>
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
        ))}
      </div>

      <div className="selector-help">
        <h4>💡 How it works:</h4>
        <ul>
          <li>
            <strong>Click a chat</strong> to scan it for audio files
          </li>
          <li>
            <strong>🎵 Icon</strong> means we found audio files in this chat
          </li>
          <li>
            <strong>Newer chats</strong> are shown first
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

export default ChatSelector;
