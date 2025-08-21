// src/App.js
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import AudioService from './services/audioService';
import LoginScreen from './components/LoginScreen';
import ChatSelector from './components/ChatSelector';
import AudioPlayer from './components/AudioPlayer';
import Playlist from './components/Playlist';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import './App.css';

function App() {
  const {
    isAuthenticated,
    user,
    graphClient,
    loading: authLoading,
    login,
    logout,
  } = useAuth();

  const audioPlayer = useAudioPlayer();

  // State management
  const [audioService, setAudioService] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('chat-selector'); // 'chat-selector' or 'player'

  // Initialize audio service
  useEffect(() => {
    if (graphClient) {
      const service = new AudioService(graphClient);
      setAudioService(service);
      loadChats(service);
    }
  }, [graphClient]);

  const loadChats = async (service = audioService) => {
    if (!service) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Loading chats...');
      const userChats = await service.getUserChats();

      console.log(`✅ Loaded ${userChats.length} chats`);
      setChats(userChats);

      if (userChats.length === 0) {
        setError(
          'No Teams chats found. Make sure you have access to Microsoft Teams.'
        );
      }
    } catch (err) {
      console.error('💥 Failed to load chats:', err);
      setError(`Failed to load chats: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = async (selectedChatObj) => {
    if (!audioService) return;

    try {
      setLoading(true);
      setError(null);
      setSelectedChat(selectedChatObj);

      console.log(`🎯 Loading audio files from chat: ${selectedChatObj.title}`);

      const chatAudioFiles = await audioService.getChatAudioFiles(
        selectedChatObj.id,
        selectedChatObj.title
      );

      console.log(`✅ Found ${chatAudioFiles.length} audio files in chat`);

      setAudioFiles(chatAudioFiles);
      audioPlayer.setPlaylist(chatAudioFiles.filter((f) => f.canPlay)); 
      setView('player');

      if (chatAudioFiles.length === 0) {
        setError(
          `No audio files found in "${selectedChatObj.title}". Try a different chat or send some audio files first!`
        );
      }
    } catch (err) {
      console.error('💥 Failed to load chat audio files:', err);
      setError(`Failed to load audio files: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const goBackToChats = () => {
    setView('chat-selector');
    setSelectedChat(null);
    setAudioFiles([]);
    setError(null);
    audioPlayer.setPlaylist([]);
  };

  const handleRefreshChats = () => {
    loadChats();
  };

  const handleRefreshCurrentChat = () => {
    if (selectedChat) {
      handleChatSelect(selectedChat);
    }
  };

  // Test API access
  const testAPI = async () => {
    if (audioService) {
      console.log('🧪 Manual API test...');
      const result = await audioService.testBasicAccess();
      alert(result ? '✅ API access works!' : '❌ API access failed!');
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Initializing..." />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🎵 Teams Audio Player</h1>

          {/* Navigation */}
          {view === 'player' && selectedChat && (
            <div className="nav-breadcrumb">
              <button onClick={goBackToChats} className="back-btn">
                ← Back to Chats
              </button>
              <span className="current-chat">📱 {selectedChat.title}</span>
            </div>
          )}

          <div className="user-info">
            <span>Welcome, {user?.name || 'User'}</span>

            <button
              onClick={testAPI}
              className="btn-debug"
              style={{
                marginRight: '10px',
                fontSize: '0.8em',
                padding: '5px 10px',
              }}
            >
              🧪 Test API
            </button>

            <button onClick={logout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <ErrorMessage
            message={error}
            onRetry={
              view === 'chat-selector'
                ? handleRefreshChats
                : handleRefreshCurrentChat
            }
            onDismiss={() => setError(null)}
          />
        )}

        {loading && <LoadingSpinner message="Loading..." />}

        {!loading && view === 'chat-selector' && (
          <ChatSelector
            chats={chats}
            loading={loading}
            onChatSelect={handleChatSelect}
            onRefresh={handleRefreshChats}
            selectedChatId={selectedChat?.id}
          />
        )}

        {!loading && view === 'player' && (
          <div className="player-container">
            <AudioPlayer
              {...audioPlayer}
              onRefresh={handleRefreshCurrentChat}
              totalTracks={audioFiles.length}
            />

            <Playlist
              files={audioFiles}
              currentIndex={audioPlayer.currentIndex}
              onTrackSelect={audioPlayer.playTrack}
              loading={loading}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          {view === 'chat-selector'
            ? `Found ${chats.length} chats`
            : `Found ${audioFiles.length} audio files in "${selectedChat?.title}"`}
        </p>
      </footer>
    </div>
  );
}

export default App;
