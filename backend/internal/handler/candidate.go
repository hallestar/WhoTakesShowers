package handler

import (
	"net/http"
	"whotakesshowers/internal/model"
	"whotakesshowers/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ListCandidates 获取候选人列表
// GET /api/candidates
func ListCandidates(c *gin.Context) {
	userID := store.GetDefaultUserID()

	candidates, err := store.Candidates.List(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	candidate := &model.Candidate{
		Name:     req.Name,
		PhotoURL: req.PhotoURL,
		UserID:   userID,
	}

	if err := store.Candidates.Create(candidate); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	candidate, err := store.Candidates.Get(id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	var req UpdateCandidateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// UploadCandidatePhoto 上传候选人照片
// POST /api/candidates/:id/photo
func UploadCandidatePhoto(c *gin.Context) {
	userID := store.GetDefaultUserID()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	// 检查候选人是否存在
	_, err = store.Candidates.Get(id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	// 获取上传的文件
	file, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded"})
		return
	}

	// 生成文件名
	filename := uuid.New().String() + "_" + file.Filename
	filepath := "./uploads/" + filename

	// 保存文件
	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新候选人照片URL
	photoURL := "/uploads/" + filename
	if err := store.Candidates.UpdatePhoto(id, userID, photoURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"photo_url": photoURL})
}
