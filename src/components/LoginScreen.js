// src/components/LoginScreen.js
import React from 'react';
import './LoginScreen.css';

const LoginScreen = ({ onLogin }) => {
  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <div className="login-icon">🎵</div>
          <h1>Teams Audio Player</h1>
          <p>Access and play all your audio files from Microsoft Teams</p>
        </div>

        <div className="login-features">
          <div className="feature">
            <span className="feature-icon">🎧</span>
            <span>Play audio files from Teams chats</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📂</span>
            <span>Access OneDrive shared files</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔄</span>
            <span>Create playlists automatically</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span>Secure Microsoft authentication</span>
          </div>
        </div>

        <button onClick={onLogin} className="login-button">
          <span className="microsoft-icon">Ⓜ</span>
          Sign in with Microsoft
        </button>

        <div className="login-footer">
          <p>You'll be redirected to Microsoft to sign in securely</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
