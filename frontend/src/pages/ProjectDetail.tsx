import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Avatar from '../components/Avatar';
import { getCandidateTerm } from '../utils/candidateTerm';

const API_BASE_URL = 'http://localhost:8080/api';

interface Project {
  id: string;
  name: string;
  candidate_ids: string;
  created_at: string;
  updated_at: string;
}

interface Candidate {
  id: string;
  name: string;
  photo_url?: string;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [winner, setWinner] = useState<Candidate | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [candidateTerm, setCandidateTerm] = useState(() => getCandidateTerm());

  useEffect(() => {
    loadProject();
  }, [id]);

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

  const loadProject = async () => {
    if (!id) return;
    try {
      const [projectRes, candidatesRes] = await Promise.all([
        axios.get<Project>(`${API_BASE_URL}/projects/${id}`),
        axios.get<Candidate[]>(`${API_BASE_URL}/candidates`),
      ]);

      setProject(projectRes.data);

      const candidateIds = JSON.parse(projectRes.data.candidate_ids || '[]');
      const filteredCandidates = candidatesRes.data.filter((c) =>
        candidateIds.includes(c.id)
      );
      setCandidates(filteredCandidates);
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (candidates.length === 0) {
      alert(`请先添加${candidateTerm}到项目中！`);
      return;
    }

    setIsSelecting(true);
    setSelectedIndex(-1);
    setWinner(null);

    const duration = 3000;
    const startTime = Date.now();
    let currentIndex = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        finalizeSelection();
        return;
      }

      const rotationsPerSecond = 10 * (1 - progress * 0.8);
      currentIndex = Math.floor(elapsed * rotationsPerSecond / 1000) % candidates.length;
      setSelectedIndex(currentIndex);

      setTimeout(animate, 50);
    };

    animate();
  };

  const finalizeSelection = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/randomize`, { project_id: id });
      const winnerId = response.data.candidate_id;
      const wIndex = candidates.findIndex((c) => c.id === winnerId);
      setSelectedIndex(wIndex);
      setWinner(candidates[wIndex] || null);
      setIsSelecting(false);
      setShowConfetti(true);
    } catch (error) {
      console.error('Randomize failed:', error);
      setIsSelecting(false);
      alert('随机选择失败');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="arcade-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 16px' }}>
        <p style={{ fontSize: '1.5rem', fontFamily: "Fredoka One, cursive" }}>项目不存在</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <Link
        to="/"
        className="arcade-btn"
        style={{
          marginBottom: '32px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'white',
          color: 'var(--deep-purple)',
          fontSize: '1rem',
        }}
      >
        ⬅️ 返回首页
      </Link>

      {/* Project Title */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ marginBottom: '16px', fontSize: '3.5rem' }}>🎰 {project.name}</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--deep-purple)', opacity: 0.8, fontFamily: "Fredoka One, cursive" }}>
          点击按钮开始随机选择！
        </p>
      </div>

      {candidates.length === 0 ? (
        <div
          className="arcade-card stagger-in"
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            background: 'linear-gradient(135deg, #FFE8D4 0%, #E8E4FF 100%)',
          }}
        >
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>👥</div>
          <h3 style={{ fontSize: '2rem', marginBottom: '12px' }}>还没有{candidateTerm}</h3>
          <p style={{ fontSize: '1.125rem', opacity: 0.8, marginBottom: '24px' }}>请先到{candidateTerm}管理页面添加{candidateTerm}</p>
          <Link to="/candidates" className="arcade-btn arcade-btn-accent">
            去添加{candidateTerm}
          </Link>
        </div>
      ) : (
        <>
          {/* Candidates Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            {candidates.map((candidate, index) => {
              const isSelected = index === selectedIndex;
              const isDimmed = isSelecting && !isSelected;

              return (
                <div
                  key={candidate.id}
                  className="arcade-card"
                  style={{
                    padding: '32px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '240px',
                    opacity: isDimmed ? 0.3 : 1,
                    transform: isSelected ? 'scale(1.15) rotate(3deg)' : isSelecting ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    background: isSelected
                      ? 'var(--lime-green)'
                      : index % 3 === 0
                      ? 'var(--soft-lilac)'
                      : index % 3 === 1
                      ? 'var(--minty-fresh)'
                      : 'var(--peachy)',
                    border: isSelected ? '4px solid var(--sunset-orange)' : '3px solid var(--deep-purple)',
                    boxShadow: isSelected
                      ? '8px 8px 0 var(--sunset-orange)'
                      : '4px 4px 0 var(--deep-purple)',
                    animation: isSelected ? 'pulse 0.5s ease-in-out infinite' : 'none',
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <Avatar photoUrl={candidate.photo_url} size={100} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', textAlign: 'center' }}>{candidate.name}</h3>
                  {isSelected && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        background: 'var(--sunset-orange)',
                        color: 'white',
                        borderRadius: '999px',
                        fontFamily: "Fredoka One, cursive",
                        fontSize: '1rem',
                        border: '2px solid var(--deep-purple)',
                        boxShadow: '2px 2px 0 var(--deep-purple)',
                        animation: 'bounce 0.6s ease-in-out infinite',
                      }}
                    >
                      ⭐ 选中中
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Start Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleStart}
              disabled={isSelecting}
              className="arcade-btn arcade-btn-primary"
              style={{
                padding: '20px 64px',
                fontSize: '1.75rem',
                opacity: isSelecting ? 0.6 : 1,
                cursor: isSelecting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSelecting ? '🎰 随机选择中...' : '🚀 开始挑战'}
            </button>
          </div>
        </>
      )}

      {/* Winner Modal */}
      {winner && !isSelecting && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(26, 26, 46, 0.9)',
            zIndex: 100,
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => {
            setWinner(null);
            setShowConfetti(false);
          }}
        >
          {/* Confetti Effect */}
          {showConfetti && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '12px',
                    height: '12px',
                    backgroundColor: ['#00D4FF', '#FF2E93', '#CCFF00', '#FF6B00'][i % 4],
                    top: '-20px',
                    left: `${Math.random() * 100}%`,
                    animation: `confettiFall ${1.5 + Math.random()}s ease-in forwards`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    borderRadius: Math.random() > 0.5 ? '50%' : '0',
                  }}
                />
              ))}
            </div>
          )}

          <div
            className="arcade-card"
            style={{
              background: 'white',
              padding: '48px',
              textAlign: 'center',
              maxWidth: '480px',
              animation: 'slideInUp 0.5s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '80px', marginBottom: '20px', animation: 'bounce 1s ease-in-out infinite' }}>
              🎉
            </div>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>恭喜</h2>
            <p style={{ fontSize: '1.125rem', marginBottom: '24px', opacity: 0.8 }}>获胜者是</p>

            <div style={{ margin: '0 auto 24px' }}>
              <Avatar
                photoUrl={winner.photo_url}
                size={140}
                className="avatar-animated"
              />
            </div>

            <h3 style={{ fontSize: '2.5rem', color: 'var(--neon-pink)', marginBottom: '32px' }}>
              {winner.name}
            </h3>

            <button
              onClick={() => {
                setWinner(null);
                setShowConfetti(false);
              }}
              className="arcade-btn arcade-btn-primary"
              style={{ fontSize: '1.25rem' }}
            >
              确定
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes confettiFall {
          0% {
            top: -20px;
            opacity: 1;
            transform: translateX(0) rotate(0deg);
          }
          100% {
            top: 100vh;
            opacity: 0;
            transform: translateX(${Math.random() * 200 - 100}px) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}
