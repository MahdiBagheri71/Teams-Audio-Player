
// src/components/DebugPanel.js
import React, { useState } from 'react';
import './DebugPanel.css';

const DebugPanel = ({ 
    isAuthenticated, 
    user, 
    audioFiles, 
    currentTrack, 
    graphClient,
    audioPlayer 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('auth');

    if (process.env.NODE_ENV !== 'development' || !process.env.REACT_APP_DEBUG) {
        return null;
    }

    const debugData = {
        auth: {
            isAuthenticated,
            userInfo: user ? {
                name: user.name,
                username: user.username,
                id: user.localAccountId
            } : null,
            hasGraphClient: !!graphClient
        },
        audio: {
            totalFiles: audioFiles?.length || 0,
            currentTrack: currentTrack ? {
                name: currentTrack.name,
                source: currentTrack.source,
                size: currentTrack.size
            } : null,
            playerState: {
                isPlaying: audioPlayer?.isPlaying,
                currentTime: audioPlayer?.currentTime,
                duration: audioPlayer?.duration,
                volume: audioPlayer?.volume
            }
        },
        files: audioFiles?.slice(0, 5).map(file => ({
            name: file.name,
            source: file.source,
            sender: file.sender,
            size: file.size
        })) || []
    };

    return (
        <div className={`debug-panel ${isOpen ? 'open' : ''}`}>
            <button 
                className="debug-toggle"
                onClick={() => setIsOpen(!isOpen)}
                title="Debug Panel"
            >
                🐛
            </button>

            {isOpen && (
                <div className="debug-content">
                    <div className="debug-header">
                        <h3>Debug Panel</h3>
                        <button 
                            className="debug-close"
                            onClick={() => setIsOpen(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="debug-tabs">
                        <button 
                            className={activeTab === 'auth' ? 'active' : ''}
                            onClick={() => setActiveTab('auth')}
                        >
                            Auth
                        </button>
                        <button 
                            className={activeTab === 'audio' ? 'active' : ''}
                            onClick={() => setActiveTab('audio')}
                        >
                            Audio
                        </button>
                        <button 
                            className={activeTab === 'files' ? 'active' : ''}
                            onClick={() => setActiveTab('files')}
                        >
                            Files
                        </button>
                    </div>

                    <div className="debug-body">
                        <pre>{JSON.stringify(debugData[activeTab], null, 2)}</pre>
                    </div>

                    <div className="debug-actions">
                        <button onClick={() => console.log('Full Debug Data:', debugData)}>
                            Log to Console
                        </button>
                        <button onClick={() => localStorage.clear()}>
                            Clear Storage
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebugPanel;
