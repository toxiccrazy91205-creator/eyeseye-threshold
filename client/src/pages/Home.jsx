import { useState, useEffect } from 'react';

function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) root.classList.add('loaded');
    loadPage();
  }, []);

  const loadPage = async () => {
    await new Promise(r => setTimeout(r, 500));
    setIsLoading(false);
  };

  const experiments = [
    { path: '/demoExperiment', name: 'Demo Experiment' },
    { path: '/demoFlickeringGaborMovie', name: 'Demo Flickering Gabor' },
    { path: '/minimalExperiment', name: 'Minimal Experiment' },
    { path: '/questionExperiment', name: 'Question Experiment' },
    { path: '/readingExperiment', name: 'Reading Experiment' },
    { path: '/testTiming', name: 'Test Timing' },
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: '#1a1a2e' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>EasyEyes</h1>
        <nav className="nav-links">
          <a href="/calibration">Calibration</a>
          <a href="/sound-test">Sound</a>
          <a href="/results">Results</a>
        </nav>
      </header>

      <section className="home-content">
        <h2>Select Experiment</h2>
        <div className="experiment-links">
          {experiments.map((exp) => (
            <a key={exp.path} href={exp.path} className="experiment-link">
              {exp.name}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;