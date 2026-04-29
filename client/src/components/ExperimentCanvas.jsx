import { useRef, useEffect, useState, useCallback } from 'react';

function ExperimentCanvas({ onDataUpdate, experimentData }) {
  const canvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (isReady) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    setIsReady(true);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isReady]);

  useEffect(() => {
    if (isReady) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#333333';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('EasyEyes Threshold Experiment', canvas.width / 2, canvas.height / 2 - 30);
      ctx.font = '16px Arial';
      ctx.fillText('Experiment Ready', canvas.width / 2, canvas.height / 2 + 10);
    }
  }, [isReady]);

  const getCanvas = useCallback(() => canvasRef.current, []);
  const getContext = useCallback(() => canvasRef.current?.getContext('2d'), []);

  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate({
        canvas: canvasRef.current,
        getCanvas,
        getContext,
      });
    }
  }, [onDataUpdate, getCanvas, getContext]);

  return (
    <div className="experiment-canvas-container">
      <canvas 
        ref={canvasRef} 
        id="experiment-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
      <div id="esc-key-handling-div"></div>
      <div id="rc-panel-holder"></div>
    </div>
  );
}

export default ExperimentCanvas;