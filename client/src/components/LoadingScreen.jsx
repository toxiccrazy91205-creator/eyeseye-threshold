import { useEffect } from 'react';
import './LoadingScreen.css';
import './LoadingScreen.css';

function LoadingScreen({ progress = 0, status = 'initializing', onReload }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const escDiv = document.getElementById('esc-key-handling-div');
        if (escDiv) {
          escDiv.dispatchEvent(new CustomEvent('escapeKeyPressed'));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getLoadingText = () => {
    switch (status) {
      case 'loading':
        return 'Loading Study...';
      case 'initializing':
        return 'Initializing...';
      case 'ready':
        return 'Ready';
      default:
        return 'Loading...';
    }
  };

  const showTimeout = progress < 100 && status === 'loading';

  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <div className="loading-text">{getLoadingText()}</div>
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            id="progressFill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="progress-percent" id="progressPercent">
          {Math.round(progress)}%
        </div>
        
        {showTimeout && (
          <div id="timeoutMessage" className="timeout-message" style={{ display: 'block' }}>
            This is taking longer than usual...
          </div>
        )}
        
        {showTimeout && (
          <button 
            id="reloadButton" 
            className="reload-button" 
            style={{ display: 'block' }}
            onClick={onReload}
          >
            Reload Study
          </button>
        )}
      </div>
      <div id="esc-key-handling-div"></div>
      <div id="rc-panel-holder"></div>
    </div>
  );
}

export default LoadingScreen;