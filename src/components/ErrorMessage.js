// src/components/ErrorMessage.js
import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onRetry, onDismiss }) => {
  return (
    <div className="error-message-container">
      <div className="error-message">
        <div className="error-icon">⚠️</div>
        <div className="error-content">
          <h4>Something went wrong</h4>
          <p>{message}</p>
          <div className="error-actions">
            {onRetry && (
              <button onClick={onRetry} className="btn-retry">
                🔄 Try Again
              </button>
            )}
            {onDismiss && (
              <button onClick={onDismiss} className="btn-dismiss">
                ✕ Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
