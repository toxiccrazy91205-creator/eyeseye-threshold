import { useState, useEffect, useRef, useCallback } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { dataAPI, experimentAPI } from '../utils/api';
import './Home.css';

function QuestionExperiment() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [experimentState, setExperimentState] = useState('ready');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalTrials] = useState(8);
  const [trialData, setTrialData] = useState({});
  const [response, setResponse] = useState(null);
  const [stimulus, setStimulus] = useState(null);
  const [stimulusVisible, setStimulusVisible] = useState(false);
  const [responsePhase, setResponsePhase] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [conditionName] = useState('Question Experiment');
  const canvasRef = useRef(null);
  const trialStartTime = useRef(null);
  const timers = useRef([]);
  const sessionId = useRef(sessionStorage.getItem('sessionId') || `quest_${Date.now()}`);

  const questions = [
    { q: 'Is the letter A or B?', options: ['A', 'B'], correct: 'A' },
    { q: 'Is the number 1 or 2?', options: ['1', '2'], correct: '2' },
    { q: 'Red or Blue?', options: ['Red', 'Blue'], correct: 'Red' },
    { q: 'Left or Right?', options: ['Left', 'Right'], correct: 'Left' },
    { q: 'Up or Down?', options: ['Up', 'Down'], correct: 'Down' },
    { q: 'Circle or Square?', options: ['Circle', 'Square'], correct: 'Circle' },
    { q: 'Big or Small?', options: ['Big', 'Small'], correct: 'Small' },
    { q: 'Hot or Cold?', options: ['Hot', 'Cold'], correct: 'Hot' },
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
    const cx = w / 2;
    const cy = h / 2;
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);

    if (experimentState === 'ready') {
      ctx.fillStyle = '#333';
      ctx.font = '24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Question Experiment', cx, cy - 40);
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText('Click "Start" to begin', cx, cy + 20);
    }

    if (stimulusVisible && stimulus) {
      ctx.fillStyle = '#333';
      ctx.font = '24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stimulus.q, cx, cy - 80);
      
      const btnWidth = 150;
      const btnHeight = 50;
      const gap = 30;
      
      stimulus.options.forEach((opt, i) => {
        const bx = cx - btnWidth - gap/2 + i * (btnWidth + gap);
        const by = cy;
        
        ctx.fillStyle = hoveredOption === opt ? '#d0d0d0' : '#e0e0e0';
        ctx.fillRect(bx, by, btnWidth, btnHeight);
        ctx.strokeStyle = hoveredOption === opt ? '#333' : '#999';
        ctx.lineWidth = hoveredOption === opt ? 2 : 1;
        ctx.strokeRect(bx, by, btnWidth, btnHeight);
        
        ctx.fillStyle = '#333';
        ctx.font = '20px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(opt, bx + btnWidth/2, by + btnHeight/2 + 7);
      });
    }
  }, [experimentState, stimulusVisible, stimulus, hoveredOption]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const runTrial = useCallback(() => {
    setExperimentState('question');
    setStimulusVisible(false);

    const questionTimeout = setTimeout(() => {
      setStimulus(questions[currentTrial % questions.length]);
      setStimulusVisible(true);
      trialStartTime.current = Date.now();
      setExperimentState('response');
      setResponsePhase(true);
    }, 800);
    
    timers.current.push(questionTimeout);
  }, [currentTrial, questions]);

  const handleResponse = useCallback((key) => {
    if (!trialStartTime.current) return;
    const reactionTime = Date.now() - trialStartTime.current;
    const correct = key === stimulus.correct;
    
    setTrialData(prev => ({
      ...prev,
      [currentTrial]: { stimulus: stimulus.q, response: key, correct, reactionTime }
    }));
    
    setResponse({ key, correct, reactionTime });
    setResponsePhase(false);
    setExperimentState('feedback');

    dataAPI.saveTrialData({
      sessionId: sessionId.current,
      trialNumber: currentTrial + 1,
      stimulus: stimulus.q,
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
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillStyle = correct ? '#155724' : '#721c24';
    ctx.textAlign = 'center';
    ctx.fillText(correct ? '✓ Correct!' : `✗ ${stimulus.correct}`, canvas.width/2, canvas.height/2);
    
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
  }, [currentTrial, stimulus, totalTrials, runTrial, conditionName]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!responsePhase || !stimulus) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const btnWidth = 150;
      const btnHeight = 50;
      const gap = 30;
      
      stimulus.options.forEach((opt, i) => {
        const bx = cx - btnWidth - gap/2 + i * (btnWidth + gap);
        const by = cy;
        
        if (x >= bx && x <= bx + btnWidth && y >= by && y <= by + btnHeight) {
          handleResponse(opt);
        }
      });
    };

    const handleMouseMove = (e) => {
      if (!responsePhase || !stimulus) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const btnWidth = 150;
      const btnHeight = 50;
      const gap = 30;
      
      let found = null;
      stimulus.options.forEach((opt, i) => {
        const bx = cx - btnWidth - gap/2 + i * (btnWidth + gap);
        const by = cy;
        if (x >= bx && x <= bx + btnWidth && y >= by && y <= by + btnHeight) {
          found = opt;
        }
      });
      setHoveredOption(found);
    };
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('click', handleClick);
      canvas.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (canvas) {
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [responsePhase, stimulus, handleResponse]);

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
              <p>Avg RT: {calculateResults().avgRT}ms</p>
              <button className="restart-btn" onClick={handleRestart}>Again</button>
            </div>
          )}
        </div>
        {responsePhase && <div className="response-prompt">Click your answer</div>}
      </div>
    </div>
  );
}

export default QuestionExperiment;