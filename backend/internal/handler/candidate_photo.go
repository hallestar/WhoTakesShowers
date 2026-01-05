package handler

import (
	"net/http"
	"whotakesshowers/internal/logger"
	"whotakesshowers/internal/middleware"
	"whotakesshowers/internal/model"
	"whotakesshowers/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// ListCandidatePhotos 获取候选人的所有照片
// GET /api/candidates/:id/photos
func ListCandidatePhotos(c *gin.Context) {
	userIDStr, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		logger.Warn("Invalid candidate ID for listing photos",
			zap.String("id", c.Param("id")),
			zap.Error(err),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	// 检查候选人是否存在
	_, err = store.Candidates.Get(id, userID)
	if err != nil {
		logger.Warn("Candidate not found when listing photos",
			zap.String("candidate_id", id.String()),
			zap.String("user_id", userID.String()),
		)
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	photos, err := store.CandidatePhotos.List(id)
	if err != nil {
		logger.Error("Failed to list candidate photos",
			zap.String("candidate_id", id.String()),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Debug("Listed candidate photos",
		zap.String("candidate_id", id.String()),
		zap.Int("count", len(photos)),
	)
	c.JSON(http.StatusOK, photos)
}

// UploadCandidatePhotos 上传候选人的多张照片
// POST /api/candidates/:id/photos
func UploadCandidatePhotos(c *gin.Context) {
	userIDStr, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

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
	candidate, err := store.Candidates.Get(id, userID)
	if err != nil {
		logger.Warn("Candidate not found for photo upload",
			zap.String("candidate_id", id.String()),
			zap.String("user_id", userID.String()),
		)
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	// 获取上传的多个文件
	form, err := c.MultipartForm()
	if err != nil {
		logger.Warn("Failed to parse multipart form",
			zap.String("candidate_id", id.String()),
			zap.Error(err),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": "no files uploaded"})
		return
	}

	files := form.File["photos"]
	if len(files) == 0 {
		logger.Warn("No files in upload request",
			zap.String("candidate_id", id.String()),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": "no files uploaded"})
		return
	}

	logger.Info("Uploading multiple photos for candidate",
		zap.String("candidate_id", id.String()),
		zap.Int("file_count", len(files)),
	)

	// 保存所有文件并创建照片记录
	photos := make([]model.CandidatePhoto, 0, len(files))
	for _, file := range files {
		// 生成文件名
		filename := uuid.New().String() + "_" + file.Filename
		filepath := "./uploads/" + filename

		// 保存文件
		if err := c.SaveUploadedFile(file, filepath); err != nil {
			logger.Error("Failed to save uploaded photo",
				zap.String("candidate_id", id.String()),
				zap.String("filename", filename),
				zap.Error(err),
			)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// 创建照片记录
		photoURL := "/uploads/" + filename
		photos = append(photos, model.CandidatePhoto{
			CandidateID: id,
			PhotoURL:    photoURL,
			IsAvatar:    false,
		})

		logger.Debug("Saved photo file",
			zap.String("candidate_id", id.String()),
			zap.String("filename", filename),
			zap.Int64("size", file.Size),
		)
	}

	// 批量保存照片记录
	if err := store.CandidatePhotos.CreateBatch(photos); err != nil {
		logger.Error("Failed to create photo records",
			zap.String("candidate_id", id.String()),
			zap.Int("photo_count", len(photos)),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 如果候选人还没有头像，设置第一张照片为头像
	if candidate.PhotoURL == "" && len(photos) > 0 {
		avatarID := photos[0].ID
		if err := store.CandidatePhotos.SetAvatar(id, avatarID); err == nil {
			// 更新候选人的头像URL
			if err := store.Candidates.UpdatePhoto(id, userID, photos[0].PhotoURL); err != nil {
				logger.Error("Failed to update candidate avatar URL",
					zap.String("candidate_id", id.String()),
					zap.String("photo_url", photos[0].PhotoURL),
					zap.Error(err),
				)
			} else {
				logger.Info("Set first photo as avatar",
					zap.String("candidate_id", id.String()),
					zap.String("photo_url", photos[0].PhotoURL),
				)
			}
		}
	}

	logger.Info("Photos uploaded successfully",
		zap.String("candidate_id", id.String()),
		zap.Int("count", len(photos)),
	)
	c.JSON(http.StatusCreated, photos)
}

// SetAvatarRequest 设置头像请求
type SetAvatarRequest struct {
	PhotoID string `json:"photo_id" binding:"required"`
}

// SetCandidateAvatar 设置候选人的头像
// PUT /api/candidates/:id/avatar
func SetCandidateAvatar(c *gin.Context) {
	userIDStr, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		logger.Warn("Invalid candidate ID for setting avatar",
			zap.String("id", c.Param("id")),
			zap.Error(err),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	// 检查候选人是否存在
	_, err = store.Candidates.Get(id, userID)
	if err != nil {
		logger.Warn("Candidate not found for setting avatar",
			zap.String("candidate_id", id.String()),
			zap.String("user_id", userID.String()),
		)
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	var req SetAvatarRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid request for setting avatar",
			zap.String("candidate_id", id.String()),
			zap.Error(err),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	photoID, err := uuid.Parse(req.PhotoID)
	if err != nil {
		logger.Warn("Invalid photo ID for setting avatar",
			zap.String("photo_id", req.PhotoID),
			zap.Error(err),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid photo id"})
		return
	}

	// 设置头像
	if err := store.CandidatePhotos.SetAvatar(id, photoID); err != nil {
		logger.Error("Failed to set avatar",
			zap.String("candidate_id", id.String()),
			zap.String("photo_id", photoID.String()),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取照片信息并更新候选人的photo_url
	photo, err := store.CandidatePhotos.GetAvatar(id)
	if err != nil {
		logger.Error("Failed to get avatar photo",
			zap.String("candidate_id", id.String()),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新候选人的头像URL
	if err := store.Candidates.UpdatePhoto(id, userID, photo.PhotoURL); err != nil {
		logger.Error("Failed to update candidate photo URL",
			zap.String("candidate_id", id.String()),
			zap.String("photo_url", photo.PhotoURL),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Avatar set successfully",
		zap.String("candidate_id", id.String()),
		zap.String("photo_id", photoID.String()),
	)
	c.JSON(http.StatusOK, gin.H{"photo_url": photo.PhotoURL})
}

// DeleteCandidatePhoto 删除候选人的照片
// DELETE /api/candidates/:id/photos/:photo_id
func DeleteCandidatePhoto(c *gin.Context) {
	userIDStr, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		logger.Warn("Invalid candidate ID for photo deletion",
			zap.String("id", c.Param("id")),
			zap.Error(err),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	photoID, err := uuid.Parse(c.Param("photo_id"))
	if err != nil {
		logger.Warn("Invalid photo ID for deletion",
			zap.String("photo_id", c.Param("photo_id")),
			zap.Error(err),
		)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid photo id"})
		return
	}

	// 检查候选人是否存在
	_, err = store.Candidates.Get(id, userID)
	if err != nil {
		logger.Warn("Candidate not found for photo deletion",
			zap.String("candidate_id", id.String()),
			zap.String("user_id", userID.String()),
		)
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	// 删除照片
	if err := store.CandidatePhotos.Delete(photoID); err != nil {
		logger.Error("Failed to delete photo",
			zap.String("candidate_id", id.String()),
			zap.String("photo_id", photoID.String()),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Photo deleted successfully",
		zap.String("candidate_id", id.String()),
		zap.String("photo_id", photoID.String()),
	)
	c.Status(http.StatusNoContent)
}
