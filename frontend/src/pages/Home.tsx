import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

export default function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, candidatesRes] = await Promise.all([
        axios.get<Project[]>(`${API_BASE_URL}/projects`),
        axios.get<Candidate[]>(`${API_BASE_URL}/candidates`),
      ]);
      setProjects(projectsRes.data);
      setCandidates(candidatesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await axios.get<Project[]>(`${API_BASE_URL}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const toggleCandidate = (id: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    if (selectedCandidateIds.length === 0) {
      alert('请至少选择一个候选人！');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/projects`, {
        name: newProjectName,
        candidate_ids: selectedCandidateIds,
      });
      setNewProjectName('');
      setShowAddForm(false);
      setSelectedCandidateIds([]);
      await loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('创建项目失败');
    }
  };

  const toggleProjectSelection = (id: string) => {
    setSelectedProjectIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBatchDelete = async () => {
    if (selectedProjectIds.size === 0) {
      alert('请先选择要删除的项目！');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedProjectIds.size} 个项目吗？`)) return;

    try {
      await Promise.all(
        Array.from(selectedProjectIds).map((id) =>
          axios.delete(`${API_BASE_URL}/projects/${id}`)
        )
      );
      setSelectedProjectIds(new Set());
      await loadProjects();
    } catch (error) {
      console.error('Failed to delete projects:', error);
      alert('删除项目失败');
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
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '48px', position: 'relative' }}>
        <h1 style={{ marginBottom: '16px' }}>🎯 随机挑战</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--deep-purple)', opacity: 0.8, fontFamily: "Fredoka One, cursive" }}>
          选择一个项目开始公平竞争！
        </p>
      </div>

      {/* Batch Delete Button */}
      {projects.length > 0 && (
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '12px 20px',
            background: 'var(--neon-pink)',
            color: 'white',
            border: '3px solid var(--deep-purple)',
            borderRadius: '16px',
            boxShadow: '3px 3px 0 var(--deep-purple)',
            fontFamily: "Fredoka One, cursive",
            fontSize: '1rem',
          }}>
            已选择: {selectedProjectIds.size} 个项目
          </div>
          <button
            onClick={handleBatchDelete}
            disabled={selectedProjectIds.size === 0}
            className="arcade-btn arcade-btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              opacity: selectedProjectIds.size === 0 ? 0.5 : 1,
              cursor: selectedProjectIds.size === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            🗑️ 批量删除
          </button>
        </div>
      )}

      {projects.length === 0 && !showAddForm && (
        <div
          className="arcade-card stagger-in"
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            marginBottom: '32px',
            background: 'linear-gradient(135deg, #FFE8D4 0%, #E8E4FF 100%)',
          }}
        >
          <div style={{ fontSize: '80px', marginBottom: '20px', animation: 'bounce 2s ease-in-out infinite' }}>🎯</div>
          <h3 style={{ fontSize: '2rem', marginBottom: '12px' }}>还没有项目呢！</h3>
          <p style={{ fontSize: '1.125rem', opacity: 0.8 }}>点击下方按钮创建第一个随机项目吧</p>
        </div>
      )}

      {/* Projects Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px', marginBottom: '32px' }}>
        {projects.map((project, index) => {
          const candidateIds = JSON.parse(project.candidate_ids || '[]');
          const projectCandidates = candidates.filter((c) => candidateIds.includes(c.id));
          return (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              className="arcade-card"
              style={{
                padding: '32px',
                cursor: 'pointer',
                animation: `slideInUp 0.5s ease-out forwards ${index * 0.1}s`,
                background: index % 3 === 0 ? 'var(--soft-lilac)' : index % 3 === 1 ? 'var(--minty-fresh)' : 'var(--peachy)',
                position: 'relative',
              }}
            >
              {/* Checkbox */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleProjectSelection(project.id);
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  width: '32px',
                  height: '32px',
                  background: selectedProjectIds.has(project.id) ? 'var(--lime-green)' : 'white',
                  border: '3px solid var(--deep-purple)',
                  borderRadius: '8px',
                  boxShadow: '2px 2px 0 var(--deep-purple)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  transition: 'all 0.2s',
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                }}
              >
                {selectedProjectIds.has(project.id) ? '✓' : ''}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ fontSize: '48px' }}>🎲</div>
                <div style={{
                  padding: '8px 16px',
                  background: 'white',
                  border: '3px solid var(--deep-purple)',
                  borderRadius: '999px',
                  fontFamily: "Fredoka One, cursive",
                  fontSize: '0.875rem',
                  boxShadow: '2px 2px 0 var(--deep-purple)',
                }}>
                  {projectCandidates.length} 人
                </div>
              </div>

              <h3 style={{ fontSize: '1.75rem', marginBottom: '12px', lineHeight: '1.3' }}>{project.name}</h3>
              <p style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '20px', fontFamily: "'Nunito', sans-serif", fontWeight: '600' }}>
                点击开始随机选择
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {projectCandidates.slice(0, 3).map((c) => (
                  <span key={c.id} className="arcade-tag arcade-tag-blue">
                    {c.name}
                  </span>
                ))}
                {projectCandidates.length > 3 && (
                  <span className="arcade-tag arcade-tag-orange">
                    +{projectCandidates.length - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Project Button/Form */}
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
              animation: `slideInUp 0.5s ease-out forwards ${projects.length * 0.1}s`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-12px) rotate(2deg) scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'bounce 2s ease-in-out infinite' }}>➕</div>
            <span style={{ fontSize: '1.5rem', fontFamily: "Fredoka One, cursive", color: 'var(--neon-pink)' }}>
              添加新项目
            </span>
          </button>
        ) : (
          <div
            className="arcade-card"
            style={{
              padding: '32px',
              background: 'var(--lime-green)',
              animation: `slideInUp 0.5s ease-out forwards ${projects.length * 0.1}s`,
            }}
          >
            <form onSubmit={handleCreateProject}>
              <h3 style={{ marginBottom: '24px', textAlign: 'center' }}>✨ 创建新项目</h3>

              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="项目名称（如：谁先洗澡）"
                className="arcade-input"
                style={{ marginBottom: '20px' }}
                autoFocus
              />

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontFamily: "Fredoka One, cursive", fontSize: '1.125rem' }}>
                  选择候选人
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {candidates.length === 0 ? (
                    <p style={{ padding: '16px', background: 'white', borderRadius: '12px', fontSize: '0.875rem', opacity: 0.8 }}>
                      还没有候选人，请先去候选人管理页面添加
                    </p>
                  ) : (
                    candidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => toggleCandidate(candidate.id)}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '999px',
                          border: '3px solid var(--deep-purple)',
                          backgroundColor: selectedCandidateIds.includes(candidate.id) ? 'var(--deep-purple)' : 'white',
                          color: selectedCandidateIds.includes(candidate.id) ? 'white' : 'var(--deep-purple)',
                          fontFamily: "Fredoka One, cursive",
                          fontSize: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '2px 2px 0 var(--deep-purple)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = '';
                        }}
                      >
                        {candidate.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

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
                    setNewProjectName('');
                    setSelectedCandidateIds([]);
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
    </div>
  );
}
