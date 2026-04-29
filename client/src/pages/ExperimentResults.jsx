import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import { experimentAPI, dataAPI } from '../utils/api';
import './ExperimentResults.css';

function ExperimentResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [session, setSession] = useState(null);
  const [trials, setTrials] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const storedSessionId = sessionId || sessionStorage.getItem('sessionId');
      
      if (storedSessionId) {
        try {
          setLoadingProgress(30);
          const sessionData = await experimentAPI.getSession(storedSessionId);
          setSession(sessionData.data);
          
          setLoadingProgress(60);
          const trialsData = await dataAPI.getTrialsBySession(storedSessionId);
          setTrials(trialsData.data);
          
          if (trialsData.data.length > 0) {
            const correct = trialsData.data.filter(t => t.correct).length;
            const total = trialsData.data.length;
            setStats({
              totalTrials: total,
              correctTrials: correct,
              accuracy: Math.round((correct / total) * 100),
              blocks: Math.max(0, ...trialsData.data.map(t => t.blockNumber || 0)),
            });
          }
        } catch (error) {
          console.error('Error fetching experiment data:', error);
        }
      }
      
      setLoadingProgress(100);
      setIsLoading(false);
    };

    fetchData();
  }, [sessionId]);

  if (isLoading) {
    return <LoadingScreen progress={loadingProgress} status="loading" />;
  }

  return (
    <div className="results-page">
      <div className="results-container">
        <h1>Experiment Results</h1>

        {!session && !trials.length ? (
          <div className="no-results">
            <p>No experiment data found.</p>
            <p>Complete an experiment to see your results here.</p>
            <button onClick={() => navigate('/')}>
              Start Experiment
            </button>
          </div>
        ) : (
          <>
            <div className="results-summary">
              <h2>Summary</h2>
              
              {session && (
                <div className="summary-item">
                  <span className="label">Session ID:</span>
                  <span className="value">{session.sessionId}</span>
                </div>
              )}
              
              {session && session.status && (
                <div className="summary-item">
                  <span className="label">Status:</span>
                  <span className="value status-badge" data-status={session.status}>
                    {session.status}
                  </span>
                </div>
              )}

              {stats && (
                <>
                  <div className="summary-item">
                    <span className="label">Total Trials:</span>
                    <span className="value">{stats.totalTrials}</span>
                  </div>
                  
                  <div className="summary-item">
                    <span className="label">Correct:</span>
                    <span className="value">{stats.correctTrials}</span>
                  </div>
                  
                  <div className="summary-item">
                    <span className="label">Accuracy:</span>
                    <span className="value">{stats.accuracy}%</span>
                  </div>
                  
                  {stats.blocks > 0 && (
                    <div className="summary-item">
                      <span className="label">Blocks Completed:</span>
                      <span className="value">{stats.blocks}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {trials.length > 0 && (
              <div className="trials-table">
                <h2>Trial Details</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Block</th>
                      <th>Trial</th>
                      <th>Stimulus</th>
                      <th>Correct</th>
                      <th>Reaction Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trials.slice(0, 20).map((trial, index) => (
                      <tr key={index}>
                        <td>{trial.blockNumber}</td>
                        <td>{trial.trialNumber}</td>
                        <td>{trial.stimulus || trial.targetKind || '-'}</td>
                        <td>{trial.correct ? '✓' : '✗'}</td>
                        <td>{trial.reactionTime ? `${trial.reactionTime}ms` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {trials.length > 20 && (
                  <p className="more-trials">Showing 20 of {trials.length} trials</p>
                )}
              </div>
            )}
          </>
        )}

        <div className="results-actions">
          <button onClick={() => navigate('/')}>
            New Experiment
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExperimentResults;