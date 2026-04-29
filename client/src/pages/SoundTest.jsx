import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import { calibrationAPI } from '../utils/api';
import './SoundTest.css';

function SoundTest() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [testPhase, setTestPhase] = useState('intro');
  const [currentTest, setCurrentTest] = useState(1);
  const [volumeLevel, setVolumeLevel] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingProgress(100);
      setIsLoading(false);
    }, 1500);

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => (prev >= 90 ? 90 : prev + 15));
    }, 200);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playTone = (freq = 1000, duration = 0.5) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
    }

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    
    const volume = volumeLevel / 100;
    gainNode.gain.value = volume * 0.5;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.start();
    oscillatorRef.current = oscillator;
    
    setIsPlaying(true);
    
    setTimeout(() => {
      oscillator.stop();
      setIsPlaying(false);
    }, duration * 1000);
  };

  const handleStartTest = () => {
    setTestPhase('testing');
  };

  const handleContinue = () => {
    if (currentTest < 3) {
      setCurrentTest(currentTest + 1);
    } else {
      setTestPhase('complete');
      
      // Save calibration data to backend
      const sessionId = sessionStorage.getItem('sessionId') || `sound_${Date.now()}`;
      calibrationAPI.saveCalibration({
        sessionId,
        participantId: sessionStorage.getItem('participantId') || 'anon',
        type: 'sound',
        completed: true,
        data: { finalVolume: volumeLevel },
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Failed to save sound calibration:', err));
    }
  };

  const runTest = (testNum) => {
    switch(testNum) {
      case 1:
        playTone(1000, 1);
        break;
      case 2:
        playTone(500, 1);
        break;
      case 3:
        playTone(2000, 1);
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return <LoadingScreen progress={loadingProgress} status="loading" />;
  }

  if (testPhase === 'complete') {
    return (
      <div className="sound-test-page">
        <div className="sound-test-complete">
          <h2>Sound Test Complete</h2>
          <p>Your audio settings are ready for the experiment.</p>
          <button className="sound-test-btn" onClick={() => navigate('/')}>
            Continue to Experiment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sound-test-page">
      <div className="sound-test-container">
        <h1>Sound Test</h1>
        
        {testPhase === 'intro' && (
          <div className="sound-test-intro">
            <p>This test will check if your audio device is working properly.</p>
            <p>Please ensure your speakers are on and volume is at a comfortable level.</p>
            <button className="sound-test-btn" onClick={handleStartTest}>
              Start Test
            </button>
          </div>
        )}

        {testPhase === 'testing' && (
          <div className="sound-test-content">
            <div className="volume-control">
              <label>Volume: {volumeLevel}%</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volumeLevel}
                onChange={(e) => setVolumeLevel(parseInt(e.target.value))}
              />
            </div>

            <div className="test-buttons">
              <button 
                className={`test-btn ${isPlaying ? 'playing' : ''}`}
                onClick={() => runTest(currentTest)}
                disabled={isPlaying}
              >
                {isPlaying ? 'Playing...' : 'Play Test Tone'}
              </button>
            </div>

            <p className="test-info">
              Test {currentTest} of 3: {currentTest === 1 ? '1000Hz' : currentTest === 2 ? '500Hz' : '2000Hz'}
            </p>

            <button className="sound-test-btn" onClick={handleContinue}>
              {currentTest < 3 ? 'Next' : 'Finish'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SoundTest;