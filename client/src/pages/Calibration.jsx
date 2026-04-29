import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import { calibrationAPI } from '../utils/api';
import './Calibration.css';

function Calibration() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [calibrationType, setCalibrationType] = useState(type || 'visual');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [step, setStep] = useState(0);
  const [calibrationComplete, setCalibrationComplete] = useState(false);

  useEffect(() => {
    const sessionIdFromStorage = sessionStorage.getItem('sessionId') || 
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('sessionId', sessionIdFromStorage);
    setSessionId(sessionIdFromStorage);

    const timer = setTimeout(() => {
      setLoadingProgress(100);
      setIsLoading(false);
    }, 2000);

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, []);

  const handleCalibrationStart = () => {
    setStep(1);
  };

  const handleCalibrationNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setCalibrationComplete(true);
      if (sessionId) {
        calibrationAPI.saveCalibration({
          sessionId,
          participantId: sessionStorage.getItem('participantId') || 'anon',
          type: calibrationType,
          completed: true,
          timestamp: new Date().toISOString()
        }).then(() => {
          console.log(`${calibrationType} calibration saved`);
        }).catch(err => {
          console.error('Failed to save calibration:', err);
          alert('Warning: Could not save calibration data to server. You can continue, but results may not be recorded.');
        });
      }
    }
  };

  const renderVisualCalibration = () => (
    <div className="calibration-step">
      <h2>Visual Calibration</h2>
      {step === 0 && (
        <div className="calibration-intro">
          <p>We'll calibrate your display for the experiment.</p>
          <p>Please ensure you're in a comfortable position and can see the screen clearly.</p>
          <button className="calibration-btn" onClick={handleCalibrationStart}>
            Start Calibration
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="calibration-content">
          <div className="calibration-guide">
            <div className="calibration-target"></div>
          </div>
          <p>Click on the center of the circle</p>
          <button className="calibration-btn" onClick={handleCalibrationNext}>
            Continue
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="calibration-content">
          <p>Adjust your viewing distance</p>
          <div className="calibration-ruler"></div>
          <button className="calibration-btn" onClick={handleCalibrationNext}>
            Continue
          </button>
        </div>
      )}
      {step === 3 && (
        <div className="calibration-content">
          <p>Click "Continue" when ready</p>
          <button className="calibration-btn" onClick={handleCalibrationNext}>
            Continue
          </button>
        </div>
      )}
    </div>
  );

  const renderAudioCalibration = () => (
    <div className="calibration-step">
      <h2>Audio Calibration</h2>
      {step === 0 && (
        <div className="calibration-intro">
          <p>We'll calibrate your audio settings for the experiment.</p>
          <p>Please ensure your speakers are on and you're in a quiet environment.</p>
          <button className="calibration-btn" onClick={handleCalibrationStart}>
            Start Calibration
          </button>
        </div>
      )}
      {step > 0 && (
        <div className="calibration-content">
          <div className="audio-test">
            <button 
              className="audio-test-btn" 
              onClick={() => {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRYrV6nmjlQjHm+cy9Sreh4mW7Hpj1okH2Ww79aweR4kWrPwklomI2Ow8Nq0ex8kW7PxklopJGOw8Nu1ex8kW7PxklopJGOw8Nu1ex8kW7PxklopJGOw8Nu1');
                audio.play().catch(console.error);
              }}
            >
              🔊 Test Sound
            </button>
          </div>
          <p>Adjust your volume to a comfortable level</p>
          <button className="calibration-btn" onClick={handleCalibrationNext}>
            Continue
          </button>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <LoadingScreen progress={loadingProgress} status="loading" />;
  }

  if (calibrationComplete) {
    return (
      <div className="calibration-complete">
        <h2>Calibration Complete</h2>
        <p>Your {calibrationType} calibration has been saved.</p>
        <button className="calibration-btn" onClick={() => navigate('/')}>
          Continue to Experiment
        </button>
      </div>
    );
  }

  return (
    <div className="calibration-page">
      <div className="calibration-type-selector">
        <button 
          className={calibrationType === 'visual' ? 'active' : ''} 
          onClick={() => setCalibrationType('visual')}
        >
          Visual
        </button>
        <button 
          className={calibrationType === 'audio' ? 'active' : ''} 
          onClick={() => setCalibrationType('audio')}
        >
          Audio
        </button>
      </div>
      
      {calibrationType === 'visual' ? renderVisualCalibration() : renderAudioCalibration()}
    </div>
  );
}

export default Calibration;