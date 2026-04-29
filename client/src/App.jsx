import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Calibration from './pages/Calibration';
import SoundTest from './pages/SoundTest';
import ExperimentResults from './pages/ExperimentResults';
import DemoExperiment from './pages/DemoExperiment';
import DemoFlickeringGaborMovie from './pages/DemoFlickeringGaborMovie';
import MinimalExperiment from './pages/MinimalExperiment';
import QuestionExperiment from './pages/QuestionExperiment';
import ReadingExperiment from './pages/ReadingExperiment';
import TestTiming from './pages/TestTiming';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/demoExperiment" element={<DemoExperiment />} />
        <Route path="/demoFlickeringGaborMovie" element={<DemoFlickeringGaborMovie />} />
        <Route path="/minimalExperiment" element={<MinimalExperiment />} />
        <Route path="/questionExperiment" element={<QuestionExperiment />} />
        <Route path="/readingExperiment" element={<ReadingExperiment />} />
        <Route path="/testTiming" element={<TestTiming />} />
        <Route path="/calibration" element={<Calibration />} />
        <Route path="/calibration/:type" element={<Calibration />} />
        <Route path="/sound-test" element={<SoundTest />} />
        <Route path="/results" element={<ExperimentResults />} />
      </Routes>
    </Router>
  );
}

export default App;