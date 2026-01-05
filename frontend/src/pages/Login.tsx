import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, saveAuth } from '../utils/auth';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let authResponse;
      if (isLogin) {
        // 登录
        authResponse = await login(username, password);
      } else {
        // 注册
        if (!email) {
          throw new Error('请输入邮箱');
        }
        if (password.length < 6) {
          throw new Error('密码至少6位');
        }
        authResponse = await register(username, email, password);
      }

      // 保存登录信息
      saveAuth(authResponse);

      // 跳转到首页
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
  };

  const formStyle: React.CSSProperties = {
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '8px 8px 0 var(--deep-purple)',
    width: '100%',
    maxWidth: '400px',
    animation: 'slideInUp 0.3s ease-out',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: '900',
    fontFamily: "'Bungee Shade', cursive",
    color: 'var(--deep-purple)',
    textAlign: 'center',
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: 'var(--electric-blue)',
    textAlign: 'center',
    marginBottom: '32px',
  };

  const inputGroupStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: 'var(--deep-purple)',
    marginBottom: '8px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    border: '3px solid ' + (error ? 'var(--sunset-orange)' : 'var(--deep-purple)'),
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    fontFamily: "'Fredoka One', cursive",
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    fontFamily: "'Fredoka One', cursive",
    color: 'white',
    background: loading ? 'var(--peachy)' : 'var(--neon-pink)',
    border: 'none',
    borderRadius: '8px',
    cursor: loading ? 'not-allowed' : 'pointer',
    boxShadow: '4px 4px 0 var(--deep-purple)',
    transition: 'all 0.2s',
    marginTop: '8px',
  };

  const toggleButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    fontFamily: "'Fredoka One', cursive",
    color: 'var(--deep-purple)',
    background: 'white',
    border: '3px solid var(--electric-blue)',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '16px',
    transition: 'all 0.2s',
  };

  const errorStyle: React.CSSProperties = {
    background: '#FFE5E5',
    color: '#D32F2F',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    marginBottom: '20px',
    textAlign: 'center',
    border: '2px solid #FFCDD2',
  };

  return (
    <div style={containerStyle}>
      <div style={formStyle}>
        <div style={titleStyle}>🎮 家庭争端</div>
        <div style={subtitleStyle}>{isLogin ? '登录账户' : '创建账户'}</div>

        {error && <div style={errorStyle}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>用户名</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              minLength={3}
              maxLength={50}
            />
          </div>

          {!isLogin && (
            <div style={inputGroupStyle}>
              <label style={labelStyle}>邮箱</label>
              <input
                type="email"
                style={inputStyle}
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          )}

          <div style={inputGroupStyle}>
            <label style={labelStyle}>密码</label>
            <input
              type="password"
              style={inputStyle}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            style={buttonStyle}
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translate(-2px, -2px)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translate(0, 0)')}
          >
            {loading ? '处理中...' : isLogin ? '🚀 登录' : '🎉 注册'}
          </button>
        </form>

        <button
          style={toggleButtonStyle}
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          disabled={loading}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translate(-2px, -2px)')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translate(0, 0)')}
        >
          {isLogin ? "还没有账户？点击注册" : "已有账户？点击登录"}
        </button>
      </div>
    </div>
  );
}

export default Login;
