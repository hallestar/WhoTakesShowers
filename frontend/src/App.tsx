import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Candidates from './pages/Candidates';
import History from './pages/History';
import ProjectDetail from './pages/ProjectDetail';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { getCandidateTerm } from './utils/candidateTerm';
import { isAuthenticated, logout, getUser } from './utils/auth';

function App() {
  const [candidateTerm, setCandidateTerm] = useState(() => getCandidateTerm());
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());

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

  // 监听登录状态变化
  useEffect(() => {
    const checkAuth = () => {
      setAuthenticated(isAuthenticated());
    };

    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
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
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {authenticated ? (
                  <>
                    <div style={{
                      fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                      color: 'var(--deep-purple)',
                      fontFamily: "'Fredoka One', cursive",
                      padding: '8px 12px'
                    }}>
                      👤 {getUser()?.username}
                    </div>
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
                    <button
                      onClick={logout}
                      className="arcade-btn"
                      style={{
                        background: 'var(--sunset-orange)',
                        color: 'white',
                        fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
                        padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      🚪 登出
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="arcade-btn"
                    style={{
                      background: 'var(--electric-blue)',
                      color: 'white',
                      fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
                      padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)'
                    }}
                  >
                    🔐 登录
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidates"
              element={
                <ProtectedRoute>
                  <Candidates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
