package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Username  string    `gorm:"type:varchar(100)" json:"username"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BeforeCreate GORM hook
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// Project 项目模型
type Project struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Name         string    `gorm:"type:varchar(200);not null" json:"name"`
	UserID       uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	CandidateIDs string    `gorm:"type:text" json:"candidate_ids"` // JSON array
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// BeforeCreate GORM hook
func (p *Project) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// Candidate 候选人模型
type Candidate struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	PhotoURL  string    `gorm:"type:varchar(500)" json:"photo_url"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BeforeCreate GORM hook
func (c *Candidate) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// CandidatePhoto 候选人照片模型
type CandidatePhoto struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	CandidateID  uuid.UUID `gorm:"type:uuid;not null" json:"candidate_id"`
	PhotoURL     string    `gorm:"type:varchar(500);not null" json:"photo_url"`
	IsAvatar     bool      `gorm:"default:false" json:"is_avatar"`
	CreatedAt    time.Time `json:"created_at"`
}

// BeforeCreate GORM hook
func (cp *CandidatePhoto) BeforeCreate(tx *gorm.DB) error {
	if cp.ID == uuid.Nil {
		cp.ID = uuid.New()
	}
	return nil
}

// History 历史记录模型
type History struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	ProjectID    uuid.UUID `gorm:"type:uuid;not null" json:"project_id"`
	ProjectName  string    `gorm:"type:varchar(200);not null" json:"project_name"`
	CandidateID  uuid.UUID `gorm:"type:uuid;not null" json:"candidate_id"`
	CandidateName string   `gorm:"type:varchar(100);not null" json:"candidate_name"`
	SelectedAt   time.Time `gorm:"not null" json:"selected_at"`
	UserID       uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
}

// BeforeCreate GORM hook
func (h *History) BeforeCreate(tx *gorm.DB) error {
	if h.ID == uuid.Nil {
		h.ID = uuid.New()
	}
	return nil
}
