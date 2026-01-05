import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { getCandidateTerm } from '../utils/candidateTerm';
import { apiClient, type Candidate, type CandidatePhoto } from '../api';

interface CandidateWithPhotos extends Candidate {
  photos?: CandidatePhoto[];
}

export default function Candidates() {
  const [candidates, setCandidates] = useState<CandidateWithPhotos[]>([]);
  const [candidatePhotos, setCandidatePhotos] = useState<Record<string, CandidatePhoto[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // 照片模态框状态
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalPhotos, setModalPhotos] = useState<CandidatePhoto[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentCandidateId, setCurrentCandidateId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [candidateTerm, setCandidateTerm] = useState(() => getCandidateTerm());

  useEffect(() => {
    loadCandidates();
  }, []);

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

  const loadCandidates = async () => {
    try {
      const response = await apiClient.getCandidates();
      setCandidates(response.data);

      // 加载每个候选人的照片
      for (const candidate of response.data) {
        await loadCandidatePhotos(candidate.id);
      }
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidatePhotos = async (candidateId: string) => {
    try {
      const response = await apiClient.getCandidatePhotos(candidateId);
      setCandidatePhotos(prev => ({
        ...prev,
        [candidateId]: response.data,
      }));
    } catch (error) {
      console.error('Failed to load candidate photos:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateName.trim()) return;

    try {
      await apiClient.createCandidate({ name: newCandidateName });
      setNewCandidateName('');
      setShowAddForm(false);
      await loadCandidates();
    } catch (error) {
      console.error('Failed to create candidate:', error);
      alert(`创建${candidateTerm}失败`);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;

    try {
      await apiClient.updateCandidate(id, { name: editName });
      setEditingId(null);
      await loadCandidates();
    } catch (error) {
      console.error('Failed to update candidate:', error);
      alert(`更新${candidateTerm}失败`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`确定要删除这个${candidateTerm}吗？`)) return;

    try {
      await apiClient.deleteCandidate(id);
      await loadCandidates();
    } catch (error) {
      console.error('Failed to delete candidate:', error);
      alert(`删除${candidateTerm}失败`);
    }
  };

  const handlePhotoUpload = async (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    try {
      await apiClient.uploadCandidatePhotos(id, fileArray);
      await loadCandidatePhotos(id);
      await loadCandidates();
      alert(`成功上传 ${fileArray.length} 张照片！`);
    } catch (error) {
      console.error('Failed to upload photos:', error);
      alert('照片上传失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedPhotoIds.size === 0) return;

    if (!confirm(`确定要删除选中的 ${selectedPhotoIds.size} 张照片吗？`)) return;

    if (!currentCandidateId) return;

    try {
      for (const photoId of selectedPhotoIds) {
        await apiClient.deleteCandidatePhoto(currentCandidateId, photoId);
      }

      if (currentCandidateId) {
        await loadCandidatePhotos(currentCandidateId);
        await loadCandidates();
      }

      // 重置选择状态
      setSelectedPhotoIds(new Set());
      setSelectionMode(false);

      alert(`成功删除 ${selectedPhotoIds.size} 张照片！`);
    } catch (error) {
      console.error('Failed to delete photos:', error);
      alert('删除照片失败');
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
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
        <h1 style={{ marginBottom: 'clamp(8px, 2vw, 16px)' }}>👥 {candidateTerm}管理</h1>
        <p style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: 'var(--deep-purple)', opacity: 0.8, fontFamily: '"Fredoka One", cursive' }}>
          添加和管理随机选择的参与者
        </p>
      </div>

      {candidates.length === 0 && !showAddForm && (
        <div
          className="arcade-card"
          style={{
            textAlign: 'center',
            padding: 'clamp(32px, 8vw, 64px) clamp(16px, 4vw, 32px)',
            marginBottom: 'clamp(16px, 4vw, 32px)',
            background: 'linear-gradient(135deg, #FFE8D4 0%, #E8E4FF 100%)',
          }}
        >
          <div style={{ fontSize: 'clamp(48px, 12vw, 80px)', marginBottom: 'clamp(12px, 3vw, 20px)', animation: 'bounce 2s ease-in-out infinite' }}>👤</div>
          <h3 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>还没有{candidateTerm}</h3>
          <p style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)', opacity: 0.8 }}>点击下方按钮添加第一个{candidateTerm}</p>
        </div>
      )}

      {/* Candidates Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(280px, 85vw, 320px), 1fr))',
        gap: 'clamp(16px, 4vw, 32px)',
        marginBottom: 'clamp(16px, 4vw, 32px)'
      }}>
        {candidates.map((candidate, index) => (
          <div
            key={candidate.id}
            className="arcade-card"
            style={{
              padding: 'clamp(16px, 4vw, 32px)',
              animation: `slideInUp 0.5s ease-out forwards ${index * 0.1}s`,
              background: index % 3 === 0 ? 'var(--soft-lilac)' : index % 3 === 1 ? 'var(--minty-fresh)' : 'var(--peachy)',
            }}
          >
            {editingId === candidate.id ? (
              <div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="arcade-input"
                  style={{ marginBottom: 'clamp(12px, 3vw, 20px)' }}
                  placeholder={`${candidateTerm}姓名`}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)' }}>
                  <button
                    onClick={() => handleUpdate(candidate.id)}
                    className="arcade-btn arcade-btn-primary"
                    style={{ flex: 1, fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditName('');
                    }}
                    className="arcade-btn"
                    style={{
                      flex: 1,
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                      background: 'white',
                      color: 'var(--deep-purple)',
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(12px, 3vw, 24px)' }}>
                  {/* Avatar */}
                  <div style={{ position: 'relative' }}>
                    <Avatar photoUrl={candidate.photo_url} size={100} />
                    {/* Photo Upload Button */}
                    <label
                      htmlFor={`photo-upload-${candidate.id}`}
                      style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        width: 'clamp(24px, 6vw, 32px)',
                        height: 'clamp(24px, 6vw, 32px)',
                        background: 'var(--neon-pink)',
                        border: '2px solid var(--deep-purple)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 'clamp(12px, 3vw, 16px)',
                        boxShadow: '2px 2px 0 var(--deep-purple)',
                      }}
                      title="上传照片"
                    >
                      📷
                    </label>
                    <input
                      id={`photo-upload-${candidate.id}`}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => handlePhotoUpload(candidate.id, e.target.files)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 1vw, 8px)' }}>
                    <button
                      onClick={() => {
                        setEditingId(candidate.id);
                        setEditName(candidate.name);
                      }}
                      style={{
                        padding: 'clamp(6px, 1.5vw, 10px) clamp(10px, 2.5vw, 14px)',
                        backgroundColor: 'var(--electric-blue)',
                        color: 'white',
                        border: '2px solid var(--deep-purple)',
                        borderRadius: '12px',
                        boxShadow: '2px 2px 0 var(--deep-purple)',
                        cursor: 'pointer',
                        fontFamily: '"Fredoka One", cursive',
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = '';
                      }}
                    >
                      ✏️ 编辑
                    </button>
                    <button
                      onClick={() => handleDelete(candidate.id)}
                      style={{
                        padding: 'clamp(6px, 1.5vw, 10px) clamp(10px, 2.5vw, 14px)',
                        backgroundColor: 'var(--neon-pink)',
                        color: 'white',
                        border: '2px solid var(--deep-purple)',
                        borderRadius: '12px',
                        boxShadow: '2px 2px 0 var(--deep-purple)',
                        cursor: 'pointer',
                        fontFamily: '"Fredoka One", cursive',
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = '';
                      }}
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
                <h3 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', marginBottom: 'clamp(4px, 1vw, 8px)', textAlign: 'center' }}>{candidate.name}</h3>
                <div style={{ textAlign: 'center' }}>
                  <span className="arcade-tag arcade-tag-blue">
                    {candidateTerm} #{index + 1}
                  </span>
                </div>

                {/* Photo Gallery Button - Always Visible */}
                <div style={{ marginTop: 'clamp(8px, 2vw, 16px)' }}>
                  <label
                    htmlFor={`gallery-upload-${candidate.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'clamp(4px, 1vw, 8px)',
                      width: '100%',
                      padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)',
                      background: candidatePhotos[candidate.id] && candidatePhotos[candidate.id].length > 0
                        ? 'linear-gradient(135deg, var(--electric-blue) 0%, var(--minty-fresh) 100%)'
                        : 'linear-gradient(135deg, var(--neon-pink) 0%, var(--sunset-orange) 100%)',
                      color: 'white',
                      border: '3px solid var(--deep-purple)',
                      borderRadius: '12px',
                      boxShadow: '3px 3px 0 var(--deep-purple)',
                      cursor: 'pointer',
                      fontFamily: '"Fredoka One", cursive',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '4px 4px 0 var(--deep-purple)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '3px 3px 0 var(--deep-purple)';
                    }}
                  >
                    <span style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>📸</span>
                    <span>
                      {candidatePhotos[candidate.id] && candidatePhotos[candidate.id].length > 0
                        ? `查看相册 (${candidatePhotos[candidate.id].length})`
                        : '添加照片'}
                    </span>
                  </label>
                  <input
                    id={`gallery-upload-${candidate.id}`}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => handlePhotoUpload(candidate.id, e.target.files)}
                  />
                </div>

                {/* Photo Gallery */}
                {candidatePhotos[candidate.id] && candidatePhotos[candidate.id].length > 0 && (
                  <div style={{ marginTop: 'clamp(8px, 2vw, 16px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(4px, 1vw, 8px)' }}>
                      <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', fontFamily: '"Fredoka One", cursive', color: 'var(--deep-purple)' }}>
                        📸 相册 ({candidatePhotos[candidate.id].length})
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(4px, 1vw, 8px)' }}>
                      {candidatePhotos[candidate.id].slice(0, 6).map((photo, photoIndex) => (
                        <div
                          key={photo.id}
                          onClick={() => {
                            setModalPhotos(candidatePhotos[candidate.id] || []);
                            setCurrentPhotoIndex(photoIndex);
                            setCurrentCandidateId(candidate.id);
                            setShowPhotoModal(true);
                          }}
                          style={{
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '2px solid var(--deep-purple)',
                            boxShadow: '2px 2px 0 var(--deep-purple)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = '';
                          }}
                        >
                          <img
                            src={`http://localhost:8080${photo.photo_url}`}
                            alt={`Photo ${photoIndex + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          {photo.is_avatar && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                background: 'var(--electric-blue)',
                                color: 'white',
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontFamily: '"Fredoka One", cursive',
                              }}
                            >
                              头像
                            </div>
                          )}
                        </div>
                      ))}
                      {candidatePhotos[candidate.id].length > 6 && (
                        <div
                          onClick={() => {
                            setModalPhotos(candidatePhotos[candidate.id] || []);
                            setCurrentPhotoIndex(0);
                            setCurrentCandidateId(candidate.id);
                            setShowPhotoModal(true);
                          }}
                          style={{
                            aspectRatio: '1',
                            borderRadius: '8px',
                            border: '2px dashed var(--deep-purple)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontFamily: '"Fredoka One", cursive',
                            fontSize: '0.875rem',
                            color: 'var(--deep-purple)',
                          }}
                        >
                          +{candidatePhotos[candidate.id].length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* Add Candidate Button/Form */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="arcade-card"
            style={{
              cursor: 'pointer',
              border: '3px dashed var(--deep-purple)',
              background: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '280px',
              padding: '32px',
              animation: `slideInUp 0.5s ease-out forwards ${candidates.length * 0.1}s`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-12px) rotate(2deg) scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'bounce 2s ease-in-out infinite' }}>➕</div>
            <span style={{ fontSize: '1.5rem', fontFamily: '"Fredoka One", cursive', color: 'var(--sunset-orange)' }}>
              添加{candidateTerm}
            </span>
          </button>
        ) : (
          <div
            className="arcade-card"
            style={{
              padding: '32px',
              background: 'var(--lime-green)',
              animation: `slideInUp 0.5s ease-out forwards ${candidates.length * 0.1}s`,
            }}
          >
            <form onSubmit={handleCreate}>
              <h3 style={{ marginBottom: '24px', textAlign: 'center' }}>✨ 添加新{candidateTerm}</h3>

              <input
                type="text"
                value={newCandidateName}
                onChange={(e) => setNewCandidateName(e.target.value)}
                placeholder={`${candidateTerm}姓名`}
                className="arcade-input"
                style={{ marginBottom: '20px' }}
                autoFocus
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  className="arcade-btn arcade-btn-primary"
                  style={{ flex: 1, fontSize: '1rem' }}
                >
                  创建
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCandidateName('');
                  }}
                  className="arcade-btn"
                  style={{
                    flex: 1,
                    fontSize: '1rem',
                    background: 'white',
                    color: 'var(--deep-purple)',
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {showPhotoModal && modalPhotos.length > 0 && (
        <div
          onClick={() => setShowPhotoModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(99, 71, 148, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'clamp(8px, 2vw, 20px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(12px, 3vw, 24px)',
            }}
          >
            {/* Photo Display */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: '100%',
              }}
            >
              <div
                onClick={() => {
                  if (selectionMode) {
                    togglePhotoSelection(modalPhotos[currentPhotoIndex].id);
                  }
                }}
                style={{
                  position: 'relative',
                  cursor: selectionMode ? 'pointer' : 'default',
                }}
              >
                <img
                  src={`http://localhost:8080${modalPhotos[currentPhotoIndex]?.photo_url}`}
                  alt="Enlarged photo"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    borderRadius: '16px',
                    border: selectedPhotoIds.has(modalPhotos[currentPhotoIndex]?.id || '')
                      ? '6px solid var(--neon-pink)'
                      : '4px solid var(--deep-purple)',
                    boxShadow: selectedPhotoIds.has(modalPhotos[currentPhotoIndex]?.id || '')
                      ? '12px 12px 0 var(--neon-pink)'
                      : '8px 8px 0 var(--deep-purple)',
                    objectFit: 'contain',
                    transition: 'all 0.2s',
                  }}
                />
                {selectionMode && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: selectedPhotoIds.has(modalPhotos[currentPhotoIndex]?.id || '')
                        ? 'var(--neon-pink)'
                        : 'white',
                      border: '4px solid var(--deep-purple)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      boxShadow: '3px 3px 0 var(--deep-purple)',
                    }}
                  >
                    {selectedPhotoIds.has(modalPhotos[currentPhotoIndex]?.id || '') ? '✓' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Side Panel */}
            <div
              style={{
                width: '100%',
                maxWidth: '200px',
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 'clamp(8px, 2vw, 16px)',
                justifyContent: 'center',
                alignSelf: 'center',
              }}
            >
              {/* Navigation Buttons */}
              <div style={{ display: 'flex', gap: 'clamp(4px, 1vw, 8px)', width: '100%', justifyContent: 'center' }}>
                <button
                  onClick={() => setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : modalPhotos.length - 1))}
                  disabled={modalPhotos.length <= 1 || selectionMode}
                  style={{
                    padding: 'clamp(8px, 2vw, 12px)',
                    background: 'var(--electric-blue)',
                    color: 'white',
                    border: '2px solid var(--deep-purple)',
                    borderRadius: '12px',
                    boxShadow: '3px 3px 0 var(--deep-purple)',
                    cursor: modalPhotos.length <= 1 || selectionMode ? 'not-allowed' : 'pointer',
                    fontFamily: '"Fredoka One", cursive',
                    fontSize: 'clamp(0.75rem, 2vw, 1rem)',
                    opacity: modalPhotos.length <= 1 || selectionMode ? 0.5 : 1,
                    flex: 1,
                    minWidth: 'clamp(80px, 25vw, 120px)',
                  }}
                >
                  ⬅️ 上一张
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex((prev) => (prev < modalPhotos.length - 1 ? prev + 1 : 0))}
                  disabled={modalPhotos.length <= 1 || selectionMode}
                  style={{
                    padding: 'clamp(8px, 2vw, 12px)',
                    background: 'var(--electric-blue)',
                    color: 'white',
                    border: '2px solid var(--deep-purple)',
                    borderRadius: '12px',
                    boxShadow: '3px 3px 0 var(--deep-purple)',
                    cursor: modalPhotos.length <= 1 || selectionMode ? 'not-allowed' : 'pointer',
                    fontFamily: '"Fredoka One", cursive',
                    fontSize: 'clamp(0.75rem, 2vw, 1rem)',
                    opacity: modalPhotos.length <= 1 || selectionMode ? 0.5 : 1,
                    flex: 1,
                    minWidth: 'clamp(80px, 25vw, 120px)',
                  }}
                >
                  ➡️ 下一张
                </button>
              </div>

              {/* Photo Counter */}
              <div
                style={{
                  textAlign: 'center',
                  padding: 'clamp(8px, 2vw, 12px)',
                  background: 'white',
                  borderRadius: '12px',
                  border: '2px solid var(--deep-purple)',
                  fontFamily: '"Fredoka One", cursive',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  color: 'var(--deep-purple)',
                }}
              >
                {currentPhotoIndex + 1} / {modalPhotos.length}
              </div>

              {/* Set as Avatar Button - Hidden in selection mode */}
              {!selectionMode && !modalPhotos[currentPhotoIndex]?.is_avatar && (
                <button
                  onClick={async () => {
                    if (!currentCandidateId) return;
                    try {
                      await apiClient.setCandidateAvatar(currentCandidateId, modalPhotos[currentPhotoIndex].id);
                      await loadCandidatePhotos(currentCandidateId);
                      await loadCandidates();
                      alert('头像设置成功！');
                    } catch (error) {
                      console.error('Failed to set avatar:', error);
                      alert('设置头像失败');
                    }
                  }}
                  style={{
                    padding: 'clamp(10px, 2.5vw, 16px)',
                    background: 'var(--neon-pink)',
                    color: 'white',
                    border: '2px solid var(--deep-purple)',
                    borderRadius: '12px',
                    boxShadow: '3px 3px 0 var(--deep-purple)',
                    cursor: 'pointer',
                    fontFamily: '"Fredoka One", cursive',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                  }}
                >
                  ⭐ 设为头像
                </button>
              )}

              {!selectionMode && modalPhotos[currentPhotoIndex]?.is_avatar && (
                <div
                  style={{
                    padding: 'clamp(10px, 2.5vw, 16px)',
                    background: 'var(--minty-fresh)',
                    color: 'white',
                    border: '2px solid var(--deep-purple)',
                    borderRadius: '12px',
                    boxShadow: '3px 3px 0 var(--deep-purple)',
                    textAlign: 'center',
                    fontFamily: '"Fredoka One", cursive',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  }}
                >
                  ✅ 当前头像
                </div>
              )}

              {/* Selection Mode Toggle */}
              <button
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  setSelectedPhotoIds(new Set());
                }}
                style={{
                  padding: 'clamp(8px, 2vw, 12px)',
                  background: selectionMode ? 'var(--sunset-orange)' : 'var(--lime-green)',
                  color: 'white',
                  border: '2px solid var(--deep-purple)',
                  borderRadius: '12px',
                  boxShadow: '3px 3px 0 var(--deep-purple)',
                  cursor: 'pointer',
                  fontFamily: '"Fredoka One", cursive',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                }}
              >
                {selectionMode ? '✖️ 取消选择' : '☑️ 批量删除'}
              </button>

              {/* Selection Info & Delete Button */}
              {selectionMode && (
                <>
                  {selectedPhotoIds.size > 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: 'clamp(8px, 2vw, 12px)',
                        background: 'var(--neon-pink)',
                        borderRadius: '12px',
                        border: '2px solid var(--deep-purple)',
                        fontFamily: '"Fredoka One", cursive',
                        fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                        color: 'white',
                      }}
                    >
                      已选 {selectedPhotoIds.size} 张
                    </div>
                  )}
                  <button
                    onClick={handleBatchDelete}
                    disabled={selectedPhotoIds.size === 0}
                    style={{
                      padding: 'clamp(12px, 3vw, 16px)',
                      background: selectedPhotoIds.size > 0 ? 'var(--sunset-orange)' : 'white',
                      color: selectedPhotoIds.size > 0 ? 'white' : 'var(--deep-purple)',
                      border: '2px solid var(--deep-purple)',
                      borderRadius: '12px',
                      boxShadow: '3px 3px 0 var(--deep-purple)',
                      cursor: selectedPhotoIds.size > 0 ? 'pointer' : 'not-allowed',
                      fontFamily: '"Fredoka One", cursive',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                      opacity: selectedPhotoIds.size > 0 ? 1 : 0.5,
                    }}
                  >
                    🗑️ 删除选中
                  </button>
                </>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowPhotoModal(false)}
                style={{
                  padding: 'clamp(8px, 2vw, 12px)',
                  background: 'var(--sunset-orange)',
                  color: 'white',
                  border: '2px solid var(--deep-purple)',
                  borderRadius: '12px',
                  boxShadow: '3px 3px 0 var(--deep-purple)',
                  cursor: 'pointer',
                  fontFamily: '"Fredoka One", cursive',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                }}
              >
                ✖️ 关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
