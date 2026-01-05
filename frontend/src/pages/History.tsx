import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

interface History {
  id: string;
  project_id: string;
  project_name: string;
  candidate_id: string;
  candidate_name: string;
  selected_at: string;
  user_id: string;
}

export default function HistoryPage() {
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await axios.get<History[]>(`${API_BASE_URL}/history?limit=50`);
      setHistories(response.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天 ' + date.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays}天前 ` + date.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
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

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 48px)', position: 'relative' }}>
        <h1 style={{ marginBottom: 'clamp(8px, 2vw, 16px)' }}>📜 历史记录</h1>
        <p style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: 'var(--deep-purple)', opacity: 0.8, fontFamily: "Fredoka One, cursive" }}>
          查看过去的随机选择结果
        </p>
      </div>

      {histories.length === 0 ? (
        <div
          className="arcade-card stagger-in"
          style={{
            textAlign: 'center',
            padding: 'clamp(32px, 8vw, 64px) clamp(16px, 4vw, 32px)',
            background: 'linear-gradient(135deg, #FFE8D4 0%, #E8E4FF 100%)',
          }}
        >
          <div style={{ fontSize: 'clamp(48px, 12vw, 80px)', marginBottom: 'clamp(12px, 3vw, 20px)', animation: 'bounce 2s ease-in-out infinite' }}>📋</div>
          <h3 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>还没有历史记录</h3>
          <p style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)', opacity: 0.8 }}>开始第一次随机选择吧！</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 3vw, 20px)' }}>
          {histories.map((history, index) => (
            <div
              key={history.id}
              className="arcade-card"
              style={{
                padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 32px)',
                animation: `slideInUp 0.5s ease-out forwards ${index * 0.08}s`,
                background: index % 3 === 0 ? 'var(--soft-lilac)' : index % 3 === 1 ? 'var(--minty-fresh)' : 'var(--peachy)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'clamp(12px, 3vw, 24px)', flexWrap: 'wrap' }}>
                {/* Left Section - Icons and Info */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 24px)', minWidth: '200px' }}>
                  {/* Trophy Icon */}
                  <div
                    style={{
                      width: 'clamp(48px, 12vw, 80px)',
                      height: 'clamp(48px, 12vw, 80px)',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--electric-blue) 0%, var(--neon-pink) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(24px, 6vw, 40px)',
                      border: '4px solid var(--deep-purple)',
                      boxShadow: '3px 3px 0 var(--deep-purple)',
                      flexShrink: 0,
                    }}
                  >
                    🏆
                  </div>

                  {/* Info Section */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)', marginBottom: 'clamp(4px, 1vw, 8px)' }}>
                      <span style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>🎯</span>
                      <h3 style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', margin: 0 }}>{history.project_name}</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>🎉</span>
                      <p
                        style={{
                          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                          fontFamily: "Fredoka One, cursive",
                          color: 'var(--neon-pink)',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        {history.candidate_name}
                      </p>
                      <span className="arcade-tag arcade-tag-green">
                        获胜者
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Time */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)',
                      background: 'white',
                      border: '3px solid var(--deep-purple)',
                      borderRadius: '16px',
                      boxShadow: '3px 3px 0 var(--deep-purple)',
                    }}
                  >
                    <div style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)', opacity: 0.7, marginBottom: 'clamp(2px, 0.5vw, 4px)', fontFamily: "Fredoka One, cursive" }}>
                      🕐 时间
                    </div>
                    <div style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)', fontWeight: '700' }}>{formatDate(history.selected_at)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
