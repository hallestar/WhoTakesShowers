import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Avatar from '../components/Avatar';

const API_BASE_URL = 'http://localhost:8080/api';

interface Candidate {
  id: string;
  name: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

interface CandidatePhoto {
  id: string;
  candidate_id: string;
  photo_url: string;
  is_avatar: boolean;
  created_at: string;
}

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

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const response = await axios.get<Candidate[]>(`${API_BASE_URL}/candidates`);
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
      const response = await axios.get<CandidatePhoto[]>(`${API_BASE_URL}/candidates/${candidateId}/photos`);
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
      await axios.post(`${API_BASE_URL}/candidates`, { name: newCandidateName });
      setNewCandidateName('');
      setShowAddForm(false);
      await loadCandidates();
    } catch (error) {
      console.error('Failed to create candidate:', error);
      alert('创建候选人失败');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;

    try {
      await axios.put(`${API_BASE_URL}/candidates/${id}`, { name: editName });
      setEditingId(null);
      await loadCandidates();
    } catch (error) {
      console.error('Failed to update candidate:', error);
      alert('更新候选人失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个候选人吗？')) return;

    try {
      await axios.delete(`${API_BASE_URL}/candidates/${id}`);
      await loadCandidates();
    } catch (error) {
      console.error('Failed to delete candidate:', error);
      alert('删除候选人失败');
    }
  };

  const handlePhotoUpload = async (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    // 支持多张照片上传
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }

    try {
      await axios.post(`${API_BASE_URL}/candidates/${id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await loadCandidatePhotos(id);
      await loadCandidates();
      alert(`成功上传 ${files.length} 张照片！`);
    } catch (error) {
      console.error('Failed to upload photos:', error);
      alert('照片上传失败');
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
        <h1 style={{ marginBottom: '16px' }}>👥 候选人管理</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--deep-purple)', opacity: 0.8, fontFamily: '"Fredoka One", cursive' }}>
          添加和管理随机选择的参与者
        </p>
      </div>

      {candidates.length === 0 && !showAddForm && (
        <div
          className="arcade-card"
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            marginBottom: '32px',
            background: 'linear-gradient(135deg, #FFE8D4 0%, #E8E4FF 100%)',
          }}
        >
          <div style={{ fontSize: '80px', marginBottom: '20px', animation: 'bounce 2s ease-in-out infinite' }}>👤</div>
          <h3 style={{ fontSize: '2rem', marginBottom: '12px' }}>还没有候选人</h3>
          <p style={{ fontSize: '1.125rem', opacity: 0.8 }}>点击下方按钮添加第一个候选人</p>
        </div>
      )}

      {/* Candidates Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px', marginBottom: '32px' }}>
        {candidates.map((candidate, index) => (
          <div
            key={candidate.id}
            className="arcade-card"
            style={{
              padding: '32px',
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
                  style={{ marginBottom: '20px' }}
                  placeholder="候选人姓名"
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleUpdate(candidate.id)}
                    className="arcade-btn arcade-btn-primary"
                    style={{ flex: 1, fontSize: '1rem' }}
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
                      fontSize: '1rem',
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
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
                        width: '32px',
                        height: '32px',
                        background: 'var(--neon-pink)',
                        border: '2px solid var(--deep-purple)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '16px',
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setEditingId(candidate.id);
                        setEditName(candidate.name);
                      }}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--electric-blue)',
                        color: 'white',
                        border: '2px solid var(--deep-purple)',
                        borderRadius: '12px',
                        boxShadow: '2px 2px 0 var(--deep-purple)',
                        cursor: 'pointer',
                        fontFamily: '"Fredoka One", cursive',
                        fontSize: '0.875rem',
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
                        padding: '10px 14px',
                        backgroundColor: 'var(--neon-pink)',
                        color: 'white',
                        border: '2px solid var(--deep-purple)',
                        borderRadius: '12px',
                        boxShadow: '2px 2px 0 var(--deep-purple)',
                        cursor: 'pointer',
                        fontFamily: '"Fredoka One", cursive',
                        fontSize: '0.875rem',
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
                <h3 style={{ fontSize: '1.75rem', marginBottom: '8px', textAlign: 'center' }}>{candidate.name}</h3>
                <div style={{ textAlign: 'center' }}>
                  <span className="arcade-tag arcade-tag-blue">
                    候选人 #{index + 1}
                  </span>
                </div>

                {/* Photo Info */}
                {candidate.photo_url && candidate.photo_url.trim() !== '' && (
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <button
                      onClick={async () => {
                        if (!confirm('确定要移除照片吗？')) return;
                        try {
                          await axios.put(`${API_BASE_URL}/candidates/${candidate.id}`, { photo_url: '' });
                          await loadCandidates();
                        } catch (error) {
                          console.error('Failed to remove photo:', error);
                          alert('移除照片失败');
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--sunset-orange)',
                        color: 'white',
                        border: '2px solid var(--deep-purple)',
                        borderRadius: '8px',
                        boxShadow: '2px 2px 0 var(--deep-purple)',
                        cursor: 'pointer',
                        fontFamily: '"Fredoka One", cursive',
                        fontSize: '0.75rem',
                      }}
                    >
                      移除照片
                    </button>
                  </div>
                )}

                {/* Photo Gallery */}
                {candidatePhotos[candidate.id] && candidatePhotos[candidate.id].length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontFamily: '"Fredoka One", cursive', color: 'var(--deep-purple)' }}>
                        📸 相册 ({candidatePhotos[candidate.id].length})
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
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
              添加候选人
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
              <h3 style={{ marginBottom: '24px', textAlign: 'center' }}>✨ 添加新候选人</h3>

              <input
                type="text"
                value={newCandidateName}
                onChange={(e) => setNewCandidateName(e.target.value)}
                placeholder="候选人姓名"
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
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              gap: '24px',
            }}
          >
            {/* Photo Display */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={`http://localhost:8080${modalPhotos[currentPhotoIndex]?.photo_url}`}
                alt="Enlarged photo"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  borderRadius: '16px',
                  border: '4px solid var(--deep-purple)',
                  boxShadow: '8px 8px 0 var(--deep-purple)',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Side Panel */}
            <div
              style={{
                width: '200px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Navigation Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : modalPhotos.length - 1))}
                  disabled={modalPhotos.length <= 1}
                  style={{
                    padding: '12px',
                    background: 'var(--electric-blue)',
                    color: 'white',
                    border: '2px solid var(--deep-purple)',
                    borderRadius: '12px',
                    boxShadow: '3px 3px 0 var(--deep-purple)',
                    cursor: modalPhotos.length <= 1 ? 'not-allowed' : 'pointer',
                    fontFamily: '"Fredoka One", cursive',
                    fontSize: '1rem',
                    opacity: modalPhotos.length <= 1 ? 0.5 : 1,
                  }}
                >
                  ⬅️ 上一张
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex((prev) => (prev < modalPhotos.length - 1 ? prev + 1 : 0))}
                  disabled={modalPhotos.length <= 1}
                  style={{
                    padding: '12px',
                    background: 'var(--electric-blue)',
                    color: 'white',
                    border: '2px solid var(--deep-purple)',
                    borderRadius: '12px',
                    boxShadow: '3px 3px 0 var(--deep-purple)',
                    cursor: modalPhotos.length <= 1 ? 'not-allowed' : 'pointer',
                    fontFamily: '"Fredoka One", cursive',
                    fontSize: '1rem',
                    opacity: modalPhotos.length <= 1 ? 0.5 : 1,
                  }}
                >
                  ➡️ 下一张
                </button>
              </div>

              {/* Photo Counter */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '12px',
                  border: '2px solid var(--deep-purple)',
                  fontFamily: '"Fredoka One", cursive',
                  fontSize: '1rem',
                  color: 'var(--deep-purple)',
                }}
              >
                {currentPhotoIndex + 1} / {modalPhotos.length}
              </div>

              {/* Set as Avatar Button */}
              {!modalPhotos[currentPhotoIndex]?.is_avatar && (
                <button
                  onClick={async () => {
                    if (!currentCandidateId) return;
                    try {
                      await axios.put(`${API_BASE_URL}/candidates/${currentCandidateId}/avatar`, {
                        photo_id: modalPhotos[currentPhotoIndex].id,
                      });
                      await loadCandidatePhotos(currentCandidateId);
                      await loadCandidates();
                      alert('头像设置成功！');
                    } catch (error) {
                      console.error('Failed to set avatar:', error);
                      alert('设置头像失败');
                    }
                  }}
                  style={{
                    padding: '16px',
                    background: 'var(--neon-pink)',
                    color: 'white',
                    border: '2px solid var(--deep-purple)',
                    borderRadius: '12px',
                    boxShadow: '3px 3px 0 var(--deep-purple)',
                    cursor: 'pointer',
                    fontFamily: '"Fredoka One", cursive',
                    fontSize: '1rem',
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

              {modalPhotos[currentPhotoIndex]?.is_avatar && (
                <div
                  style={{
                    padding: '16px',
                    background: 'var(--minty-fresh)',
                    color: 'white',
                    border: '2px solid var(--deep-purple)',
                    borderRadius: '12px',
                    boxShadow: '3px 3px 0 var(--deep-purple)',
                    textAlign: 'center',
                    fontFamily: '"Fredoka One", cursive',
                    fontSize: '1rem',
                  }}
                >
                  ✅ 当前头像
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowPhotoModal(false)}
                style={{
                  padding: '12px',
                  background: 'var(--sunset-orange)',
                  color: 'white',
                  border: '2px solid var(--deep-purple)',
                  borderRadius: '12px',
                  boxShadow: '3px 3px 0 var(--deep-purple)',
                  cursor: 'pointer',
                  fontFamily: '"Fredoka One", cursive',
                  fontSize: '1rem',
                  marginTop: 'auto',
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
