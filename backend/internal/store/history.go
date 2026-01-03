package store

import (
	"whotakesshowers/internal/model"

	"github.com/google/uuid"
)

// HistoryStore 历史记录存储
type HistoryStore struct{}

var Histories = &HistoryStore{}

// List 获取历史记录列表
func (s *HistoryStore) List(userID uuid.UUID, projectID *uuid.UUID, limit int) ([]model.History, error) {
	var histories []model.History
	query := DB.Where("user_id = ?", userID)

	if projectID != nil {
		query = query.Where("project_id = ?", *projectID)
	}

	err := query.Order("selected_at DESC").Limit(limit).Find(&histories).Error
	return histories, err
}

// Create 创建历史记录
func (s *HistoryStore) Create(history *model.History) error {
	return DB.Create(history).Error
}

// DeleteByProject 删除项目相关的历史记录
func (s *HistoryStore) DeleteByProject(projectID uuid.UUID, userID uuid.UUID) error {
	return DB.Where("project_id = ? AND user_id = ?", projectID, userID).Delete(&model.History{}).Error
}
