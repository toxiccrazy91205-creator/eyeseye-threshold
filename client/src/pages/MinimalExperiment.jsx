import { useState, useEffect, useRef, useCallback } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { dataAPI, experimentAPI } from '../utils/api';
import './Home.css';

function MinimalExperiment() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [experimentState, setExperimentState] = useState('ready');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalTrials] = useState(4);
  const [trialData, setTrialData] = useState({});
  const [response, setResponse] = useState(null);
  const [stimulus, setStimulus] = useState(null);
  const [stimulusVisible, setStimulusVisible] = useState(false);
  const [responsePhase, setResponsePhase] = useState(false);
  const [conditionName] = useState('Minimal Experiment');
  const canvasRef = useRef(null);
  const trialStartTime = useRef(null);
  const timers = useRef([]);
  const sessionId = useRef(sessionStorage.getItem('sessionId') || `min_${Date.now()}`);

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
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const loadExperiment = async () => {
    setIsLoading(true);
    for (let i = 0; i <= 100; i += 25) {
      await new Promise(r => setTimeout(r, 40));
      setLoadingProgress(i);
    }
    setIsLoading(false);
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
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);

    if (experimentState === 'fixation' || (!stimulusVisible && experimentState !== 'idle' && experimentState !== 'ready')) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, cy + 10);
      ctx.stroke();
    }

    if (stimulusVisible && stimulus) {
      ctx.font = 'bold 60px Arial, sans-serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stimulus, cx, cy);
    }

    if (experimentState === 'ready') {
      ctx.fillStyle = '#333';
      ctx.font = '20px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Minimal Experiment', cx, cy - 20);
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText('Press Start', cx, cy + 10);
    }
  }, [experimentState, stimulusVisible, stimulus]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const runTrial = useCallback(() => {
    setExperimentState('fixation');
    setStimulusVisible(false);

    const fixationTimeout = setTimeout(() => {
      const letters = 'ABCD';
      const newStimulus = letters[Math.floor(Math.random() * letters.length)];
      setStimulus(newStimulus);
      setStimulusVisible(true);
      trialStartTime.current = Date.now();
      
      const stimulusTimeout = setTimeout(() => {
        setStimulusVisible(false);
        setExperimentState('response');
        setResponsePhase(true);
      }, 300);
      
      timers.current.push(stimulusTimeout);
    }, 1000);
    
    timers.current.push(fixationTimeout);
  }, []);

  const handleResponse = useCallback((key) => {
    if (!trialStartTime.current) return;
    const reactionTime = Date.now() - trialStartTime.current;
    const correct = key === stimulus;
    
    setTrialData(prev => ({
      ...prev,
      [currentTrial]: { stimulus, response: key, correct, reactionTime }
    }));
    
    setResponse({ key, correct, reactionTime });
    setResponsePhase(false);
    setExperimentState('feedback');

    dataAPI.saveTrialData({
      sessionId: sessionId.current,
      trialNumber: currentTrial + 1,
      stimulus,
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
    ctx.fillText(correct ? '✓' : `✗ ${stimulus}`, canvas.width/2, canvas.height/2);
    
    const feedbackTimeout = setTimeout(() => {
      if (currentTrial < totalTrials - 1) {
        setCurrentTrial(c => c + 1);
        setResponse(null);
        runTrial();
      } else {
        setExperimentState('complete');
        experimentAPI.updateSession(sessionId.current, { status: 'completed' }).catch(console.error);
      }
    }, 800);
    timers.current.push(feedbackTimeout);
  }, [currentTrial, stimulus, totalTrials, runTrial, conditionName]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (responsePhase && e.key.length === 1 && e.key.match(/[ABCD]/i)) {
        e.preventDefault();
        handleResponse(e.key.toUpperCase());
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
        <a href="/" className="back-link">← Back</a>
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
              <button className="restart-btn" onClick={handleRestart}>Again</button>
            </div>
          )}
        </div>
        {responsePhase && <div className="response-prompt">Press A, B, C, or D</div>}
        {response && !responsePhase && experimentState === 'feedback' && (
          <div className={`response-feedback ${response.correct ? 'correct' : 'incorrect'}`}>
            {response.correct ? '✓' : `✗ ${stimulus}`} • {response.reactionTime}ms
          </div>
        )}
      </div>
    </div>
  );
}

export default MinimalExperiment;