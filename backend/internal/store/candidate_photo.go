package store

import (
	"whotakesshowers/internal/model"

	"github.com/google/uuid"
)

// CandidatePhotoStore 候选人照片存储
type CandidatePhotoStore struct{}

var CandidatePhotos = &CandidatePhotoStore{}

// List 获取候选人的所有照片
func (s *CandidatePhotoStore) List(candidateID uuid.UUID) ([]model.CandidatePhoto, error) {
	var photos []model.CandidatePhoto
	err := DB.Where("candidate_id = ?", candidateID).Order("created_at DESC").Find(&photos).Error
	return photos, err
}

// Create 创建照片记录
func (s *CandidatePhotoStore) Create(photo *model.CandidatePhoto) error {
	return DB.Create(photo).Error
}

// CreateBatch 批量创建照片记录
func (s *CandidatePhotoStore) CreateBatch(photos []model.CandidatePhoto) error {
	if len(photos) == 0 {
		return nil
	}
	return DB.Create(&photos).Error
}

// Delete 删除照片
func (s *CandidatePhotoStore) Delete(id uuid.UUID) error {
	return DB.Delete(&model.CandidatePhoto{}, "id = ?", id).Error
}

// DeleteByCandidateID 删除候选人的所有照片
func (s *CandidatePhotoStore) DeleteByCandidateID(candidateID uuid.UUID) error {
	return DB.Delete(&model.CandidatePhoto{}, "candidate_id = ?", candidateID).Error
}

// SetAvatar 设置头像（将指定照片设为头像，其他照片取消头像标记）
func (s *CandidatePhotoStore) SetAvatar(candidateID uuid.UUID, photoID uuid.UUID) error {
	// 先取消该候选人的所有头像标记
	if err := DB.Model(&model.CandidatePhoto{}).
		Where("candidate_id = ?", candidateID).
		Update("is_avatar", false).Error; err != nil {
		return err
	}

	// 设置新的头像
	return DB.Model(&model.CandidatePhoto{}).
		Where("id = ? AND candidate_id = ?", photoID, candidateID).
		Update("is_avatar", true).Error
}

// GetAvatar 获取候选人的头像
func (s *CandidatePhotoStore) GetAvatar(candidateID uuid.UUID) (*model.CandidatePhoto, error) {
	var photo model.CandidatePhoto
	err := DB.Where("candidate_id = ? AND is_avatar = ?", candidateID, true).First(&photo).Error
	if err != nil {
		return nil, err
	}
	return &photo, nil
}
