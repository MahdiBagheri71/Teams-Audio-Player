// src/App.js
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import AudioService from './services/audioService';
import LoginScreen from './components/LoginScreen';
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
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioService, setAudioService] = useState(null);

  // Initialize audio service when authenticated
  useEffect(() => {
    if (graphClient) {
      const service = new AudioService(graphClient);
      setAudioService(service);
      loadAudioFiles(service);
    }
  }, [graphClient]);

  const loadAudioFiles = async (service) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading Teams audio files...');
      const files = await service.getTeamsAudioFiles();

      console.log(`Found ${files.length} audio files`);
      setAudioFiles(files);
      audioPlayer.setPlaylist(files);
    } catch (err) {
      console.error('Failed to load audio files:', err);
      setError(
        'Failed to load audio files from Teams. Please check your permissions.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (audioService) {
      loadAudioFiles(audioService);
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
          <div className="user-info">
            <span>Welcome, {user?.name || 'User'}</span>
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
            onRetry={handleRefresh}
            onDismiss={() => setError(null)}
          />
        )}

        {loading ? (
          <LoadingSpinner message="Loading your Teams audio files..." />
        ) : (
          <div className="player-container">
            <AudioPlayer
              {...audioPlayer}
              onRefresh={handleRefresh}
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
          Teams Audio Player - Plays audio files from your Microsoft Teams chats
        </p>
      </footer>
    </div>
  );
}

export default App;
