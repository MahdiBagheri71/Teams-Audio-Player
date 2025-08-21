// src/App.js - Fixed audioPlayer.stop error
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
  const [view, setView] = useState('chat-selector');

  // Initialize audio service ONCE when graphClient is available
  useEffect(() => {
    if (graphClient && !audioService) {
      console.log('🚀 Initializing AudioService...');
      const service = new AudioService(graphClient);
      setAudioService(service);
    }
  }, [graphClient, audioService]);

  // Load chats ONCE when audioService is ready
  useEffect(() => {
    if (audioService && chats.length === 0 && !loading) {
      console.log('📞 Loading chats for the first time...');
      loadChats();
    }
  }, [audioService]); // Only depend on audioService

  const loadChats = async () => {
    if (!audioService || loading) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Loading chats...');
      const userChats = await audioService.getUserChats();

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

      // Only set playable files in player
      const playableFiles = chatAudioFiles.filter((f) => f.canPlay);
      audioPlayer.setPlaylist(playableFiles);

      setView('player');

      if (chatAudioFiles.length === 0) {
        setError(
          `No audio files found in "${selectedChatObj.title}". Try a different chat!`
        );
      } else {
        const playableCount = playableFiles.length;
        const totalCount = chatAudioFiles.length;

        if (playableCount === 0 && totalCount > 0) {
          setError(
            `Found ${totalCount} audio files, but they are Teams attachments and cannot be played directly. ` +
              `Click on files to open in Teams and download them.`
          );
        } else if (playableCount > 0) {
          setError(null); // Clear any previous errors
          console.log(
            `🎵 Ready to play ${playableCount} out of ${totalCount} files`
          );
        }
      }
    } catch (err) {
      console.error('💥 Failed to load chat audio files:', err);
      setError(`Failed to load audio files: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const goBackToChats = () => {
    // Pause audio if it's playing
    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
    }

    // Reset state
    setView('chat-selector');
    setSelectedChat(null);
    setAudioFiles([]);
    setError(null);

    // Clear playlist
    audioPlayer.setPlaylist([]);

    console.log('👈 Returned to chat selector');
  };

  const handleRefreshChats = () => {
    setChats([]); // Clear chats to trigger reload
    setError(null);
    loadChats();
  };

  const handleRefreshCurrentChat = () => {
    if (selectedChat && !loading) {
      handleChatSelect(selectedChat);
    }
  };

  // Test API access with enhanced permissions
  const testAPI = async () => {
    if (audioService) {
      console.log('🧪 Testing enhanced API access...');

      // Use the enhanced test method if available
      const testMethod =
        audioService.testEnhancedAccess || audioService.testBasicAccess;
      const result = await testMethod.call(audioService);

      const message = result
        ? '✅ API access works! Check console for details.'
        : '❌ API access failed! Check console for errors.';

      alert(message);
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

            {/* <button
              onClick={testAPI}
              className="btn-debug"
              style={{
                marginRight: '10px',
                fontSize: '0.8em',
                padding: '5px 10px',
              }}
            >
              🧪 Test API
            </button> */}

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
            loading={false}
            onChatSelect={handleChatSelect}
            onRefresh={handleRefreshChats}
            selectedChatId={selectedChat?.id}
          />
        )}

        {!loading && view === 'player' && (
          <div className="player-container">
            {/* Show file status */}
            {audioFiles.length > 0 && (
              <div className="player-status">
                <div className="status-summary">
                  <span className="total-files">
                    📁 {audioFiles.length} files found
                  </span>
                  <span className="playable-files">
                    🎵 {audioFiles.filter((f) => f.canPlay).length} ready to
                    play
                  </span>
                  <span className="teams-files">
                    📎 {audioFiles.filter((f) => !f.canPlay).length} Teams
                    attachments
                  </span>
                </div>

                {audioFiles.filter((f) => !f.canPlay).length > 0 && (
                  <div className="help-banner">
                    💡{' '}
                    <strong>Teams attachments can't be played directly.</strong>{' '}
                    Click them to open in Teams and download manually.
                  </div>
                )}
              </div>
            )}

            <AudioPlayer
              {...audioPlayer}
              onRefresh={handleRefreshCurrentChat}
              totalTracks={audioFiles.filter((f) => f.canPlay).length}
            />

            <Playlist
              files={audioFiles}
              currentIndex={audioPlayer.currentIndex}
              onTrackSelect={audioPlayer.playTrack}
              loading={false}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          {view === 'chat-selector'
            ? `Found ${chats.length} chats`
            : `${selectedChat?.title || 'Current chat'}: ${
                audioFiles.length
              } audio files`}
        </p>
      </footer>
    </div>
  );
}

export default App;
