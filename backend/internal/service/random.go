package service

import (
	"encoding/json"
	"math/rand"
	"time"
	"whotakesshowers/internal/model"
	"whotakesshowers/internal/store"

	"github.com/google/uuid"
)

// RandomizeService 随机选择服务
type RandomizeService struct{}

var Randomizer = &RandomizeService{}

// RandomizeRequest 随机选择请求
type RandomizeRequest struct {
	ProjectID uuid.UUID `json:"project_id" binding:"required"`
}

// RandomizeResponse 随机选择响应
type RandomizeResponse struct {
	CandidateID   uuid.UUID `json:"candidate_id"`
	CandidateName string    `json:"candidate_name"`
}

// Execute 执行随机选择
func (s *RandomizeService) Execute(req *RandomizeRequest, userID uuid.UUID) (*RandomizeResponse, error) {
	// 获取项目
	project, err := store.Projects.Get(req.ProjectID, userID)
	if err != nil {
		return nil, err
	}

	// 获取项目内的候选人ID列表
	var candidateIDs []uuid.UUID
	if project.CandidateIDs != "" {
		if err := json.Unmarshal([]byte(project.CandidateIDs), &candidateIDs); err != nil {
			return nil, err
		}
	}

	if len(candidateIDs) == 0 {
		return nil, nil
	}

	// 获取项目内的候选人列表
	candidates, err := store.Candidates.GetByIDs(candidateIDs, userID)
	if err != nil {
		return nil, err
	}

	if len(candidates) == 0 {
		return nil, nil
	}

	// 随机选择一个候选人
	rand.Seed(time.Now().UnixNano())
	selectedIndex := rand.Intn(len(candidates))
	selected := candidates[selectedIndex]

	// 记录历史
	history := &model.History{
		ProjectID:     project.ID,
		ProjectName:   project.Name,
		CandidateID:   selected.ID,
		CandidateName: selected.Name,
		SelectedAt:    time.Now(),
		UserID:        userID,
	}
	if err := store.Histories.Create(history); err != nil {
		// 记录失败不影响主流程
		// log.Printf("Warning: failed to create history: %v", err)
	}

	return &RandomizeResponse{
		CandidateID:   selected.ID,
		CandidateName: selected.Name,
	}, nil
}
