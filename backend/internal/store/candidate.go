package store

import (
	"whotakesshowers/internal/model"

	"github.com/google/uuid"
)

// CandidateStore 候选人存储
type CandidateStore struct{}

var Candidates = &CandidateStore{}

// List 获取候选人列表
func (s *CandidateStore) List(userID uuid.UUID) ([]model.Candidate, error) {
	var candidates []model.Candidate
	err := DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&candidates).Error
	return candidates, err
}

// Get 获取候选人详情
func (s *CandidateStore) Get(id uuid.UUID, userID uuid.UUID) (*model.Candidate, error) {
	var candidate model.Candidate
	err := DB.Where("id = ? AND user_id = ?", id, userID).First(&candidate).Error
	if err != nil {
		return nil, err
	}
	return &candidate, nil
}

// GetByIDs 根据ID列表获取候选人
func (s *CandidateStore) GetByIDs(ids []uuid.UUID, userID uuid.UUID) ([]model.Candidate, error) {
	var candidates []model.Candidate
	err := DB.Where("id IN ? AND user_id = ?", ids, userID).Find(&candidates).Error
	return candidates, err
}

// Create 创建候选人
func (s *CandidateStore) Create(candidate *model.Candidate) error {
	return DB.Create(candidate).Error
}

// Update 更新候选人
func (s *CandidateStore) Update(candidate *model.Candidate) error {
	return DB.Save(candidate).Error
}

// Delete 删除候选人
func (s *CandidateStore) Delete(id uuid.UUID, userID uuid.UUID) error {
	return DB.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Candidate{}).Error
}

// UpdatePhoto 更新候选人照片
func (s *CandidateStore) UpdatePhoto(id uuid.UUID, userID uuid.UUID, photoURL string) error {
	return DB.Model(&model.Candidate{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("photo_url", photoURL).Error
}
