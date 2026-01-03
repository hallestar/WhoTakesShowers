import { useState } from 'react';
import { Link } from 'react-router-dom';

interface ColorOption {
  name: string;
  value: string;
  preview: string;
}

interface EmojiOption {
  name: string;
  emoji: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { name: '淡紫色', value: 'var(--soft-lilac)', preview: '#E8E4FF' },
  { name: '薄荷绿', value: 'var(--minty-fresh)', preview: '#D4FFEA' },
  { name: '桃色', value: 'var(--peachy)', preview: '#FFE8D4' },
  { name: '电光蓝', value: 'var(--electric-blue)', preview: '#00D4FF' },
  { name: '霓虹粉', value: 'var(--neon-pink)', preview: '#FF2E93' },
  { name: '酸橙绿', value: 'var(--lime-green)', preview: '#CCFF00' },
  { name: '太阳橙', value: 'var(--sunset-orange)', preview: '#FF6B00' },
];

const EMOJI_OPTIONS: EmojiOption[] = [
  { name: '笑脸', emoji: '😀' },
  { name: '墨镜', emoji: '😎' },
  { name: '派对', emoji: '🥳' },
  { name: '开心', emoji: '😊' },
  { name: '星星眼', emoji: '🤩' },
  { name: '大笑', emoji: '😄' },
  { name: '爱心', emoji: '😍' },
  { name: '酷', emoji: '😏' },
];

export default function Settings() {
  const [randomAvatar, setRandomAvatar] = useState(() => {
    const saved = localStorage.getItem('randomAvatar');
    return saved ? JSON.parse(saved) : false;
  });
  const [defaultColor, setDefaultColor] = useState(() => {
    return localStorage.getItem('defaultColor') || 'var(--soft-lilac)';
  });
  const [defaultEmoji, setDefaultEmoji] = useState(() => {
    return localStorage.getItem('defaultEmoji') || '😀';
  });

  const handleSave = () => {
    localStorage.setItem('randomAvatar', JSON.stringify(randomAvatar));
    localStorage.setItem('defaultColor', defaultColor);
    localStorage.setItem('defaultEmoji', defaultEmoji);
    alert('设置已保存！');
  };

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

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px', position: 'relative' }}>
        <h1 style={{ marginBottom: '16px' }}>⚙️ 系统设置</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--deep-purple)', opacity: 0.8, fontFamily: "Fredoka One, cursive" }}>
          配置默认头像和显示选项
        </p>
      </div>

      {/* Settings Container */}
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Random Avatar Toggle */}
        <div className="arcade-card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🎲</span>
            随机头像
          </h3>
          <p style={{ marginBottom: '20px', opacity: 0.8 }}>
            开启后，候选人页面的头像将随机显示，不会使用固定的默认头像
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setRandomAvatar(!randomAvatar)}
              style={{
                padding: '16px 32px',
                background: randomAvatar ? 'var(--lime-green)' : 'white',
                color: randomAvatar ? 'var(--deep-purple)' : 'var(--deep-purple)',
                border: '3px solid var(--deep-purple)',
                borderRadius: '16px',
                boxShadow: '3px 3px 0 var(--deep-purple)',
                cursor: 'pointer',
                fontFamily: "Fredoka One, cursive",
                fontSize: '1.125rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
              }}
            >
              {randomAvatar ? '✓ 已开启' : '✗ 已关闭'}
            </button>
            <span style={{ fontSize: '1.125rem', opacity: 0.8 }}>
              当前状态: {randomAvatar ? '随机显示' : '固定显示'}
            </span>
          </div>
        </div>

        {/* Default Color Selection */}
        <div className="arcade-card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🎨</span>
            默认配色
          </h3>
          <p style={{ marginBottom: '20px', opacity: 0.8 }}>
            当候选人没有上传照片时，使用此配色作为头像背景
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={() => setDefaultColor(color.value)}
                style={{
                  padding: '20px',
                  background: color.preview,
                  border: defaultColor === color.value ? '4px solid var(--deep-purple)' : '3px solid var(--deep-purple)',
                  borderRadius: '16px',
                  boxShadow: '3px 3px 0 var(--deep-purple)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: color.preview,
                    border: '3px solid var(--deep-purple)',
                  }}
                />
                <span style={{ fontFamily: "Fredoka One, cursive", fontSize: '0.875rem' }}>
                  {color.name}
                </span>
                {defaultColor === color.value && (
                  <span style={{ fontSize: '1.5rem' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Default Emoji Selection */}
        <div className="arcade-card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>😀</span>
            默认表情
          </h3>
          <p style={{ marginBottom: '20px', opacity: 0.8 }}>
            当候选人没有上传照片时，使用此表情作为头像
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' }}>
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji.emoji}
                onClick={() => setDefaultEmoji(emoji.emoji)}
                style={{
                  padding: '20px',
                  background: defaultEmoji === emoji.emoji ? 'var(--lime-green)' : 'white',
                  border: '3px solid var(--deep-purple)',
                  borderRadius: '16px',
                  boxShadow: '3px 3px 0 var(--deep-purple)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                }}
              >
                <span style={{ fontSize: '3rem' }}>{emoji.emoji}</span>
                <span style={{ fontFamily: "Fredoka One, cursive", fontSize: '0.875rem' }}>
                  {emoji.name}
                </span>
                {defaultEmoji === emoji.emoji && (
                  <span style={{ fontSize: '1.5rem' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar Preview */}
        <div className="arcade-card" style={{ padding: '32px', background: 'linear-gradient(135deg, #FFE8D4 0%, #E8E4FF 100%)' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>👁️</span>
            头像预览
          </h3>
          <p style={{ marginBottom: '24px', opacity: 0.8 }}>
            这是候选人使用默认头像时的显示效果
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: defaultColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px',
                  margin: '0 auto 12px',
                  border: '5px solid var(--deep-purple)',
                  boxShadow: '4px 4px 0 var(--deep-purple)',
                }}
              >
                {defaultEmoji}
              </div>
              <p style={{ fontFamily: "Fredoka One, cursive", fontSize: '1rem' }}>默认头像</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleSave}
            className="arcade-btn arcade-btn-primary"
            style={{ padding: '20px 64px', fontSize: '1.5rem' }}
          >
            💾 保存设置
          </button>
        </div>
      </div>
    </div>
  );
}
