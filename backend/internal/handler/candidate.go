package handler

import (
	"net/http"
	"whotakesshowers/internal/logger"
	"whotakesshowers/internal/model"
	"whotakesshowers/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// ListCandidates 获取候选人列表
// GET /api/candidates
func ListCandidates(c *gin.Context) {
	userID := store.GetDefaultUserID()

	candidates, err := store.Candidates.List(userID)
	if err != nil {
		logger.Error("Failed to list candidates",
			zap.String("user_id", userID.String()),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Listed candidates successfully",
		zap.Int("count", len(candidates)),
	)
	c.JSON(http.StatusOK, candidates)
}

// CreateCandidateRequest 创建候选人请求
type CreateCandidateRequest struct {
	Name     string `json:"name" binding:"required"`
	PhotoURL string `json:"photo_url"`
}

// CreateCandidate 创建候选人
// POST /api/candidates
func CreateCandidate(c *gin.Context) {
	userID := store.GetDefaultUserID()

	var req CreateCandidateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid request for creating candidate",
			zap.String("user_id", userID.String()),
			zap.Error(err),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	candidate := &model.Candidate{
		Name:     req.Name,
		PhotoURL: req.PhotoURL,
		UserID:   userID,
	}

	if err := store.Candidates.Create(candidate); err != nil {
		logger.Error("Failed to create candidate",
			zap.String("user_id", userID.String()),
			zap.String("name", req.Name),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Candidate created successfully",
		zap.String("candidate_id", candidate.ID.String()),
		zap.String("name", candidate.Name),
	)
	c.JSON(http.StatusCreated, candidate)
}

// UpdateCandidateRequest 更新候选人请求
type UpdateCandidateRequest struct {
	Name     string `json:"name"`
	PhotoURL string `json:"photo_url"`
}

// UpdateCandidate 更新候选人
// PUT /api/candidates/:id
func UpdateCandidate(c *gin.Context) {
	userID := store.GetDefaultUserID()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		logger.Warn("Invalid candidate ID for update",
			zap.String("id", c.Param("id")),
			zap.Error(err),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	candidate, err := store.Candidates.Get(id, userID)
	if err != nil {
		logger.Warn("Candidate not found for update",
			zap.String("candidate_id", id.String()),
			zap.String("user_id", userID.String()),
		)
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	var req UpdateCandidateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid request for updating candidate",
			zap.String("candidate_id", id.String()),
			zap.Error(err),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		candidate.Name = req.Name
	}
	if req.PhotoURL != "" {
		candidate.PhotoURL = req.PhotoURL
	}

	if err := store.Candidates.Update(candidate); err != nil {
		logger.Error("Failed to update candidate",
			zap.String("candidate_id", id.String()),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Candidate updated successfully",
		zap.String("candidate_id", id.String()),
		zap.String("name", candidate.Name),
	)
	c.JSON(http.StatusOK, candidate)
}

// GetCandidate 获取候选人详情
// GET /api/candidates/:id
func GetCandidate(c *gin.Context) {
	userID := store.GetDefaultUserID()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	candidate, err := store.Candidates.Get(id, userID)
	if err != nil {
		logger.Warn("Candidate not found",
			zap.String("candidate_id", id.String()),
			zap.String("user_id", userID.String()),
		)
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	c.JSON(http.StatusOK, candidate)
}

// DeleteCandidate 删除候选人
// DELETE /api/candidates/:id
func DeleteCandidate(c *gin.Context) {
	userID := store.GetDefaultUserID()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	if err := store.Candidates.Delete(id, userID); err != nil {
		logger.Error("Failed to delete candidate",
			zap.String("candidate_id", id.String()),
			zap.String("user_id", userID.String()),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Candidate deleted successfully",
		zap.String("candidate_id", id.String()),
	)
	c.Status(http.StatusNoContent)
}

// UploadCandidatePhoto 上传候选人照片
// POST /api/candidates/:id/photo
func UploadCandidatePhoto(c *gin.Context) {
	userID := store.GetDefaultUserID()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		logger.Warn("Invalid candidate ID for photo upload",
			zap.String("id", c.Param("id")),
			zap.Error(err),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	// 检查候选人是否存在
	_, err = store.Candidates.Get(id, userID)
	if err != nil {
		logger.Warn("Candidate not found for photo upload",
			zap.String("candidate_id", id.String()),
			zap.String("user_id", userID.String()),
		)
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	// 获取上传的文件
	file, err := c.FormFile("photo")
	if err != nil {
		logger.Warn("No file uploaded",
			zap.String("candidate_id", id.String()),
			zap.Error(err),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded"})
		return
	}

	// 生成文件名
	filename := uuid.New().String() + "_" + file.Filename
	filepath := "./uploads/" + filename

	logger.Info("Saving uploaded photo",
		zap.String("candidate_id", id.String()),
		zap.String("filename", filename),
		zap.Int64("size", file.Size),
	)

	// 保存文件
	if err := c.SaveUploadedFile(file, filepath); err != nil {
		logger.Error("Failed to save uploaded file",
			zap.String("candidate_id", id.String()),
			zap.String("filepath", filepath),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新候选人照片URL
	photoURL := "/uploads/" + filename
	if err := store.Candidates.UpdatePhoto(id, userID, photoURL); err != nil {
		logger.Error("Failed to update candidate photo URL",
			zap.String("candidate_id", id.String()),
			zap.String("photo_url", photoURL),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Photo uploaded successfully",
		zap.String("candidate_id", id.String()),
		zap.String("photo_url", photoURL),
	)
	c.JSON(http.StatusOK, gin.H{"photo_url": photoURL})
}
