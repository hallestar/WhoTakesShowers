import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { getCandidateTerm } from '../utils/candidateTerm';
import { apiClient, type Project, type Candidate } from '../api';

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
        apiClient.getProject(id!),
        apiClient.getCandidates(),
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
      const response = await apiClient.randomize(id!);
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
          marginBottom: 'clamp(16px, 4vw, 32px)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'white',
          color: 'var(--deep-purple)',
          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
          padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
        }}
      >
        ⬅️ 返回首页
      </Link>

      {/* Project Title */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 48px)' }}>
        <h1 style={{ marginBottom: 'clamp(8px, 2vw, 16px)', fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>🎰 {project.name}</h1>
        <p style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: 'var(--deep-purple)', opacity: 0.8, fontFamily: "Fredoka One, cursive" }}>
          点击按钮开始随机选择！
        </p>
      </div>

      {candidates.length === 0 ? (
        <div
          className="arcade-card stagger-in"
          style={{
            textAlign: 'center',
            padding: 'clamp(32px, 8vw, 64px) clamp(16px, 4vw, 32px)',
            background: 'linear-gradient(135deg, #FFE8D4 0%, #E8E4FF 100%)',
          }}
        >
          <div style={{ fontSize: 'clamp(48px, 12vw, 80px)', marginBottom: 'clamp(12px, 3vw, 20px)' }}>👥</div>
          <h3 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>还没有{candidateTerm}</h3>
          <p style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)', opacity: 0.8, marginBottom: 'clamp(12px, 3vw, 24px)' }}>请先到{candidateTerm}管理页面添加{candidateTerm}</p>
          <Link to="/candidates" className="arcade-btn arcade-btn-accent">
            去添加{candidateTerm}
          </Link>
        </div>
      ) : (
        <>
          {/* Candidates Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(180px, 45vw, 220px), 1fr))',
            gap: 'clamp(12px, 3vw, 24px)',
            marginBottom: 'clamp(20px, 5vw, 40px)'
          }}>
            {candidates.map((candidate, index) => {
              const isSelected = index === selectedIndex;
              const isDimmed = isSelecting && !isSelected;

              return (
                <div
                  key={candidate.id}
                  className="arcade-card"
                  style={{
                    padding: 'clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 'clamp(180px, 45vw, 240px)',
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
                  <div style={{ marginBottom: 'clamp(8px, 2vw, 16px)' }}>
                    <Avatar photoUrl={candidate.photo_url} size={100} />
                  </div>
                  <h3 style={{ fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', textAlign: 'center' }}>{candidate.name}</h3>
                  {isSelected && (
                    <div
                      style={{
                        marginTop: 'clamp(6px, 1.5vw, 12px)',
                        padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 16px)',
                        background: 'var(--sunset-orange)',
                        color: 'white',
                        borderRadius: '999px',
                        fontFamily: "Fredoka One, cursive",
                        fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
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
                padding: 'clamp(12px, 3vw, 20px) clamp(32px, 10vw, 64px)',
                fontSize: 'clamp(1.125rem, 3vw, 1.75rem)',
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
            backgroundColor: 'rgba(26, 26, 46, 0.95)',
            zIndex: 100,
            backdropFilter: 'blur(10px)',
            padding: 'clamp(16px, 4vw, 32px)',
          }}
          onClick={() => {
            setWinner(null);
            setShowConfetti(false);
          }}
        >
          {/* Enhanced Confetti Effect */}
          {showConfetti && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              {/* Confetti */}
              {[...Array(80)].map((_, i) => (
                <div
                  key={`confetti-${i}`}
                  style={{
                    position: 'absolute',
                    width: `${10 + Math.random() * 12}px`,
                    height: `${10 + Math.random() * 12}px`,
                    backgroundColor: ['#00D4FF', '#FF2E93', '#CCFF00', '#FF6B00', '#FFE700', '#FF1493'][i % 6],
                    top: '-30px',
                    left: `${Math.random() * 100}%`,
                    animation: `confettiFall ${1.2 + Math.random() * 0.8}s ease-in forwards`,
                    animationDelay: `${Math.random() * 0.6}s`,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  }}
                />
              ))}
              {/* Stars */}
              {[...Array(20)].map((_, i) => (
                <div
                  key={`star-${i}`}
                  style={{
                    position: 'absolute',
                    fontSize: `${20 + Math.random() * 24}px`,
                    top: '-40px',
                    left: `${Math.random() * 100}%`,
                    animation: `starFall ${1.5 + Math.random()}s ease-in forwards`,
                    animationDelay: `${Math.random() * 0.8}s`,
                  }}
                >
                  ⭐
                </div>
              ))}
              {/* Sparkles */}
              {[...Array(30)].map((_, i) => (
                <div
                  key={`sparkle-${i}`}
                  style={{
                    position: 'absolute',
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#FFE700',
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animation: `sparkle ${0.8 + Math.random() * 0.4}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 1}s`,
                    borderRadius: '50%',
                    boxShadow: '0 0 10px #FFE700, 0 0 20px #FFE700',
                  }}
                />
              ))}
            </div>
          )}

          {/* Rainbow Ring Animation */}
          {showConfetti && (
            <div
              style={{
                position: 'absolute',
                width: 'clamp(350px, 80vw, 500px)',
                height: 'clamp(350px, 80vw, 500px)',
                borderRadius: '50%',
                border: '8px solid transparent',
                borderTopColor: '#FF2E93',
                borderRightColor: '#00D4FF',
                borderBottomColor: '#CCFF00',
                borderLeftColor: '#FF6B00',
                animation: 'rainbowRing 2s linear infinite',
                pointerEvents: 'none',
              }}
            />
          )}

          <div
            className="arcade-card"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5E6 100%)',
              padding: 'clamp(32px, 8vw, 64px)',
              textAlign: 'center',
              maxWidth: 'clamp(360px, 90vw, 520px)',
              animation: 'slideInUp 0.5s ease-out, glowPulse 1.5s ease-in-out infinite',
              position: 'relative',
              borderRadius: '24px',
              border: '6px solid',
              borderImage: 'linear-gradient(45deg, #FF2E93, #00D4FF, #CCFF00, #FF6B00) 1',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner Decorations */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '30px',
                  height: '30px',
                  border: '4px solid var(--neon-pink)',
                  top: i < 2 ? '12px' : 'auto',
                  bottom: i >= 2 ? '12px' : 'auto',
                  left: i % 2 === 0 ? '12px' : 'auto',
                  right: i % 2 === 1 ? '12px' : 'auto',
                  borderColor: ['#FF2E93', '#00D4FF', '#CCFF00', '#FF6B00'][i],
                  animation: `cornerPulse 0.8s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}

            <div style={{ fontSize: 'clamp(64px, 16vw, 100px)', marginBottom: 'clamp(12px, 3vw, 20px)', animation: 'bounce 0.6s ease-in-out infinite' }}>
              🎊
            </div>

            <h2 style={{
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              marginBottom: 'clamp(8px, 2vw, 16px)',
              background: 'linear-gradient(45deg, #FF2E93, #00D4FF, #CCFF00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'textShimmer 2s linear infinite',
            }}>
              🎉 恭喜 🎉
            </h2>

            <p style={{
              fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
              marginBottom: 'clamp(8px, 2vw, 16px)',
              opacity: 0.9,
              fontWeight: '700',
              color: 'var(--deep-purple)',
            }}>
              「{project.name}」
            </p>

            <p style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              marginBottom: 'clamp(20px, 5vw, 32px)',
              opacity: 0.7,
              fontFamily: "'Fredoka One', cursive",
            }}>
              获胜者是
            </p>

            {/* Winner Avatar with Special Effect */}
            <div style={{
              position: 'relative',
              margin: '0 auto clamp(20px, 5vw, 32px)',
              display: 'inline-block',
            }}>
              {/* Rotating Sparkle Ring */}
              {showConfetti && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    border: '3px dashed #FFE700',
                    animation: 'rotateRing 3s linear infinite',
                    pointerEvents: 'none',
                  }}
                />
              )}

              <Avatar
                photoUrl={winner.photo_url}
                size={150}
                className="avatar-animated"
              />

              {/* Crown */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 'clamp(36px, 8vw, 48px)',
                animation: 'crownBounce 1s ease-in-out infinite',
              }}>
                👑
              </div>
            </div>

            <h3 style={{
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              background: 'linear-gradient(45deg, #FF2E93, #FF6B00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 'clamp(8px, 2vw, 16px)',
              animation: 'winnerPop 0.5s ease-out, textGlow 1.5s ease-in-out infinite',
              fontWeight: '900',
            }}>
              {winner.name}
            </h3>

            <p style={{
              fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
              marginBottom: 'clamp(24px, 6vw, 40px)',
              color: 'var(--electric-blue)',
              fontFamily: "'Fredoka One', cursive",
              animation: 'slideInUp 0.8s ease-out 0.3s both',
            }}>
              🏆 运气爆棚！ 🏆
            </p>

            <button
              onClick={() => {
                setWinner(null);
                setShowConfetti(false);
              }}
              className="arcade-btn arcade-btn-primary"
              style={{
                fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                padding: 'clamp(12px, 3vw, 20px) clamp(40px, 10vw, 80px)',
                background: 'linear-gradient(45deg, #FF2E93, #FF6B00)',
                border: 'none',
                animation: 'buttonPulse 1.5s ease-in-out infinite',
              }}
            >
              🎊 太棒了！
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
            top: -30px;
            opacity: 1;
            transform: translateX(0) rotate(0deg);
          }
          100% {
            top: 100vh;
            opacity: 0;
            transform: translateX(var(--random-x, 100px)) rotate(1080deg);
          }
        }

        @keyframes starFall {
          0% {
            top: -40px;
            opacity: 1;
            transform: scale(0) rotate(0deg);
          }
          50% {
            transform: scale(1.5) rotate(180deg);
          }
          100% {
            top: 100vh;
            opacity: 0;
            transform: scale(1) rotate(360deg);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes rainbowRing {
          0% {
            transform: rotate(0deg) scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) scale(1.2);
            opacity: 0;
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 46, 147, 0.3), 0 0 40px rgba(0, 212, 255, 0.2);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 46, 147, 0.5), 0 0 80px rgba(0, 212, 255, 0.4);
          }
        }

        @keyframes cornerPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
        }

        @keyframes textShimmer {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        @keyframes rotateRing {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes crownBounce {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-10px);
          }
        }

        @keyframes winnerPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes textGlow {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(255, 46, 147, 0.5));
          }
          50% {
            filter: drop-shadow(0 0 25px rgba(255, 107, 0, 0.8));
          }
        }

        @keyframes buttonPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 15px rgba(255, 46, 147, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 6px 25px rgba(255, 46, 147, 0.6);
          }
        }
      `}</style>
    </div>
  );
}
