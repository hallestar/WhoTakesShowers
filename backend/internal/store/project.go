package store

import (
	"encoding/json"
	"whotakesshowers/internal/model"

	"github.com/google/uuid"
)

// ProjectStore 项目存储
type ProjectStore struct{}

var Projects = &ProjectStore{}

// List 获取项目列表
func (s *ProjectStore) List(userID uuid.UUID) ([]model.Project, error) {
	var projects []model.Project
	err := DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&projects).Error
	return projects, err
}

// Get 获取项目详情
func (s *ProjectStore) Get(id uuid.UUID, userID uuid.UUID) (*model.Project, error) {
	var project model.Project
	err := DB.Where("id = ? AND user_id = ?", id, userID).First(&project).Error
	if err != nil {
		return nil, err
	}
	return &project, nil
}

// Create 创建项目
func (s *ProjectStore) Create(project *model.Project) error {
	return DB.Create(project).Error
}

// Update 更新项目
func (s *ProjectStore) Update(project *model.Project) error {
	return DB.Save(project).Error
}

// Delete 删除项目
func (s *ProjectStore) Delete(id uuid.UUID, userID uuid.UUID) error {
	return DB.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Project{}).Error
}

// GetCandidateIDs 获取项目的候选人ID列表
func (s *ProjectStore) GetCandidateIDs(projectID uuid.UUID) ([]uuid.UUID, error) {
	var project model.Project
	if err := DB.First(&project, projectID).Error; err != nil {
		return nil, err
	}

	var candidateIDs []uuid.UUID
	if project.CandidateIDs != "" {
		if err := json.Unmarshal([]byte(project.CandidateIDs), &candidateIDs); err != nil {
			return nil, err
		}
	}

	return candidateIDs, nil
}

// SetCandidateIDs 设置项目的候选人ID列表
func (s *ProjectStore) SetCandidateIDs(projectID uuid.UUID, candidateIDs []uuid.UUID) error {
	data, err := json.Marshal(candidateIDs)
	if err != nil {
		return err
	}
	return DB.Model(&model.Project{}).Where("id = ?", projectID).Update("candidate_ids", string(data)).Error
}
