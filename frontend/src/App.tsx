import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Candidates from './pages/Candidates';
import History from './pages/History';
import ProjectDetail from './pages/ProjectDetail';
import Settings from './pages/Settings';
import { getCandidateTerm } from './utils/candidateTerm';

function App() {
  const [candidateTerm, setCandidateTerm] = useState(() => getCandidateTerm());

  // 监听storage变化，实时更新候选人称呼
  useEffect(() => {
    const handleStorageChange = () => {
      setCandidateTerm(getCandidateTerm());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleStorageChange);
    };
  }, []);
  return (
    <Router>
      <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* Animated Background Blobs */}
        <div className="blob-bg blob-1"></div>
        <div className="blob-bg blob-2"></div>
        <div className="blob-bg blob-3"></div>

        {/* Navigation Bar */}
        <nav className="arcade-nav">
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <Link
                to="/"
                style={{
                  fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                  fontWeight: '900',
                  fontFamily: "'Bungee Shade', cursive",
                  color: 'var(--neon-pink)',
                  textDecoration: 'none',
                  textShadow: '2px 2px 0 var(--electric-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)' }}>🎮</span>
                <span style={{ display: 'inline-block' }}>家庭争端</span>
              </Link>

              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <Link
                  to="/history"
                  className="arcade-btn arcade-btn-secondary"
                  style={{
                    fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
                    padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)'
                  }}
                >
                  📜 历史记录
                </Link>
                <Link
                  to="/candidates"
                  className="arcade-btn arcade-btn-accent"
                  style={{
                    fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
                    padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)'
                  }}
                >
                  👥 {candidateTerm}
                </Link>
                <Link
                  to="/settings"
                  className="arcade-btn"
                  style={{
                    background: 'var(--lime-green)',
                    color: 'var(--deep-purple)',
                    fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
                    padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)'
                  }}
                >
                  ⚙️ 设置
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
