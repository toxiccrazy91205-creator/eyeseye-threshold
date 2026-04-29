import { useState, useEffect, useRef, useCallback } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { dataAPI, experimentAPI } from '../utils/api';
import './Home.css';

function DemoFlickeringGaborMovie() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [experimentState, setExperimentState] = useState('ready');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalTrials] = useState(10);
  const [trialData, setTrialData] = useState({});
  const [response, setResponse] = useState(null);
  const [stimulus, setStimulus] = useState(null);
  const [stimulusVisible, setStimulusVisible] = useState(false);
  const [responsePhase, setResponsePhase] = useState(false);
  const [conditionName] = useState('Demo Flickering Gabor Movie');
  const canvasRef = useRef(null);
  const trialStartTime = useRef(null);
  const animationRef = useRef(null);
  const timers = useRef([]);
  const sessionId = useRef(sessionStorage.getItem('sessionId') || `gabor_${Date.now()}`);

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) root.classList.add('loaded');
  }, []);

  useEffect(() => {
    loadExperiment();

    experimentAPI.createSession({
      sessionId: sessionId.current,
      experimentName: conditionName,
      status: 'started'
    }).catch(console.error);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timers.current.forEach(t => {
        clearTimeout(t);
        clearInterval(t);
      });
    };
  }, []);

  const loadExperiment = async () => {
    setIsLoading(true);
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(r => setTimeout(r, 50));
      setLoadingProgress(i);
    }
    setIsLoading(false);
  };

  const drawGabor = (ctx, x, y, size, frequency, angle, phase, contrast) => {
    const sigma = size / 4;
    const halfSize = size / 2;
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const dx = j - halfSize;
        const dy = i - halfSize;
        
        // Gaussian envelope
        const g = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        
        // Grating
        const x_theta = dx * Math.cos(angle) + dy * Math.sin(angle);
        const s = Math.sin(2 * Math.PI * frequency * x_theta + phase);
        
        const val = 127 + 127 * contrast * g * s;
        const idx = (i * size + j) * 4;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, x - halfSize, y - halfSize);
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    
    ctx.fillStyle = '#808080'; // Neutral gray background for Gabors
    ctx.fillRect(0, 0, w, h);

    if (experimentState === 'fixation' || (!stimulusVisible && experimentState !== 'idle' && experimentState !== 'ready')) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, cy + 10);
      ctx.stroke();
    }

    if (stimulusVisible && experimentState === 'stimulus') {
      const contrast = 1.0;
      const freq = 0.05;
      const angle = Math.PI / 4; // 45 degrees
      const phase = (Date.now() / 100) % (2 * Math.PI); // Flickering effect via phase shift
      drawGabor(ctx, cx, cy, 200, freq, angle, phase, contrast);
    }

    if (experimentState === 'ready') {
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Demo Flickering Gabor Movie', cx, cy - 20);
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#ddd';
      ctx.fillText('Click "Start" to begin', cx, cy + 10);
    }
  }, [experimentState, stimulusVisible]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const animate = useCallback(() => {
    if (experimentState === 'stimulus' && stimulusVisible) {
      drawCanvas();
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [experimentState, stimulusVisible, drawCanvas]);

  useEffect(() => {
    if (experimentState === 'stimulus' && stimulusVisible) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [experimentState, stimulusVisible, animate]);

  const runTrial = useCallback(() => {
    setExperimentState('fixation');
    setStimulusVisible(false);

    const fixationTimeout = setTimeout(() => {
      setExperimentState('stimulus');
      setStimulusVisible(true);
      trialStartTime.current = Date.now();
      
      const stimulusDuration = 2000; // 2 seconds of flickering
      const stimulusTimeout = setTimeout(() => {
        setStimulusVisible(false);
        setExperimentState('response');
        setResponsePhase(true);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }, stimulusDuration);
      
      timers.current.push(stimulusTimeout);
    }, 1000);
    
    timers.current.push(fixationTimeout);
  }, []);

  const handleResponse = useCallback((key) => {
    if (!trialStartTime.current) return;
    const reactionTime = Date.now() - trialStartTime.current;
    const correct = Math.random() > 0.3;
    
    setTrialData(prev => ({
      ...prev,
      [currentTrial]: { stimulus: 'Gabor', response: key, correct, reactionTime }
    }));
    
    setResponse({ key, correct, reactionTime });
    setResponsePhase(false);
    setExperimentState('feedback');

    dataAPI.saveTrialData({
      sessionId: sessionId.current,
      trialNumber: currentTrial + 1,
      stimulus: 'Gabor',
      response: key,
      correct,
      reactionTime,
      experimentName: conditionName
    }).catch(err => console.error('Failed to save trial:', err));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = correct ? '#d4edda' : '#f8d7da';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.fillStyle = correct ? '#155724' : '#721c24';
    ctx.textAlign = 'center';
    ctx.fillText(correct ? '✓' : '✗', canvas.width/2, canvas.height/2);
    
    const feedbackTimeout = setTimeout(() => {
      if (currentTrial < totalTrials - 1) {
        setCurrentTrial(c => c + 1);
        setResponse(null);
        runTrial();
      } else {
        setExperimentState('complete');
        experimentAPI.updateSession(sessionId.current, { status: 'completed' }).catch(console.error);
      }
    }, 1000);
    timers.current.push(feedbackTimeout);
  }, [currentTrial, totalTrials, runTrial, conditionName]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (responsePhase && e.key.length === 1) {
        e.preventDefault();
        handleResponse(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [responsePhase, handleResponse]);

  const calculateResults = useCallback(() => {
    const trials = Object.values(trialData);
    if (trials.length === 0) return { correct: 0, total: 0, avgRT: 0 };
    const correct = trials.filter(t => t.correct).length;
    const avgRT = trials.reduce((sum, t) => sum + t.reactionTime, 0) / trials.length;
    return { correct, total: trials.length, avgRT: Math.round(avgRT) };
  }, [trialData]);

  const handleRestart = useCallback(() => {
    setCurrentTrial(0);
    setTrialData({});
    setExperimentState('ready');
    setResponse(null);
  }, []);

  if (isLoading) {
    return <LoadingScreen progress={loadingProgress} status="loading" />;
  }

  return (
    <div className="experiment-page">
      <header className="experiment-header">
        <a href="/" className="back-link">← Back to Home</a>
        <h1>{conditionName}</h1>
        <span>Trial {currentTrial + 1}/{totalTrials}</span>
      </header>

      <div className="experiment-workspace">
        <div className="canvas-container">
          <canvas ref={canvasRef} width={700} height={400} className="experiment-canvas" />
        </div>

        <div className="controls">
          <button 
            className="start-btn" 
            onClick={runTrial}
            disabled={experimentState !== 'idle' && experimentState !== 'complete' && experimentState !== 'ready'}
          >
            {experimentState === 'complete' || experimentState === 'ready' ? 'Start' : 'Running...'}
          </button>
          
          {experimentState === 'complete' && (
            <div className="results-summary">
              <p>Accuracy: {calculateResults().correct}/{calculateResults().total} ({Math.round((calculateResults().correct/calculateResults().total)*100)}%)</p>
              <p>Avg RT: {calculateResults().avgRT}ms</p>
              <button className="restart-btn" onClick={handleRestart}>Run Again</button>
            </div>
          )}
        </div>

        {responsePhase && (
          <div className="response-prompt">Press any key</div>
        )}
      </div>
    </div>
  );
}

export default DemoFlickeringGaborMovie;