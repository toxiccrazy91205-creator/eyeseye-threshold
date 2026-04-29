import { useState, useEffect, useRef, useCallback } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { dataAPI, experimentAPI } from '../utils/api';
import './Home.css';

function ReadingExperiment() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [experimentState, setExperimentState] = useState('ready');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalTrials] = useState(5);
  const [trialData, setTrialData] = useState({});
  const [response, setResponse] = useState(null);
  const [text, setText] = useState('');
  const [textVisible, setTextVisible] = useState(false);
  const [responsePhase, setResponsePhase] = useState(false);
  const [conditionName] = useState('Reading Experiment');
  const canvasRef = useRef(null);
  const readingStartTime = useRef(null);
  const timers = useRef([]);
  const sessionId = useRef(sessionStorage.getItem('sessionId') || `read_${Date.now()}`);

  const passages = [
    'The quick brown fox jumps over the lazy dog. This famous pangram contains every letter of the English alphabet.',
    'Reading is a complex cognitive process of decoding symbols to construct meaning. It requires multiple skills working together.',
    'When you read, your brain processes visual information and converts it into understanding. This happens very quickly.',
    'Books open new worlds and expand our imagination. Every page turned is a journey to a different place.',
    'Good readers develop strong comprehension skills. They can summarize, infer, and analyze what they read.'
  ];

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
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(r => setTimeout(r, 50));
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
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);

    if (experimentState === 'ready') {
      ctx.fillStyle = '#333';
      ctx.font = '22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Reading Experiment', w/2, h/2 - 40);
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText('Click "Start" to begin reading', w/2, h/2 + 10);
    }

    if (textVisible && text) {
      ctx.fillStyle = '#333';
      ctx.font = '20px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      const words = text.split(' ');
      let line = '';
      let y = 60;
      const x = 60;
      const maxWidth = w - 120;
      const lineHeight = 30;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y);
    }
  }, [experimentState, textVisible, text]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const runTrial = useCallback(() => {
    setExperimentState('reading');
    setTextVisible(false);

    const readingDelayTimeout = setTimeout(() => {
      setText(passages[currentTrial % passages.length]);
      setTextVisible(true);
      setResponsePhase(true); // Allow SPACE press immediately
      readingStartTime.current = Date.now();
    }, 1000);
    
    timers.current.push(readingDelayTimeout);
  }, [currentTrial, passages]);

  const handleDone = useCallback(() => {
    if (!readingStartTime.current) return;
    const readingTime = Date.now() - readingStartTime.current;
    
    setTrialData(prev => ({
      ...prev,
      [currentTrial]: { 
        text: text.substring(0, 30) + '...', 
        response: 'read', 
        correct: true, 
        reactionTime: readingTime 
      }
    }));
    
    setResponse({ key: 'done', correct: true, reactionTime: readingTime });
    setResponsePhase(false);
    setExperimentState('feedback');

    dataAPI.saveTrialData({
      sessionId: sessionId.current,
      trialNumber: currentTrial + 1,
      stimulus: text.substring(0, 30) + '...',
      response: 'read',
      correct: true,
      reactionTime: readingTime,
      experimentName: conditionName
    }).catch(err => console.error('Failed to save trial:', err));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#d4edda';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillStyle = '#155724';
    ctx.textAlign = 'center';
    ctx.fillText('✓ Read Complete!', canvas.width/2, canvas.height/2);
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText(`Time: ${readingTime}ms`, canvas.width/2, canvas.height/2 + 40);
    
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
  }, [currentTrial, text, totalTrials, runTrial, conditionName]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (responsePhase && e.key === ' ') {
        e.preventDefault();
        handleDone();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [responsePhase, handleDone]);

  const calculateResults = useCallback(() => {
    const trials = Object.values(trialData);
    if (trials.length === 0) return { total: 0, avgRT: 0 };
    const avgRT = trials.reduce((sum, t) => sum + t.reactionTime, 0) / trials.length;
    return { total: trials.length, avgRT: Math.round(avgRT) };
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
        <span>Passage {currentTrial + 1}/{totalTrials}</span>
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
              <p>Passages Read: {calculateResults().total}</p>
              <p>Avg Time: {calculateResults().avgRT}ms</p>
              <button className="restart-btn" onClick={handleRestart}>Again</button>
            </div>
          )}
        </div>
        {textVisible && (
          <div className="response-prompt">Reading... Press SPACE when finished.</div>
        )}
      </div>
    </div>
  );
}

export default ReadingExperiment;