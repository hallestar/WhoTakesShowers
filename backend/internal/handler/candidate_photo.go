package handler

import (
	"net/http"
	"whotakesshowers/internal/model"
	"whotakesshowers/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ListCandidatePhotos 获取候选人的所有照片
// GET /api/candidates/:id/photos
func ListCandidatePhotos(c *gin.Context) {
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

	photos, err := store.CandidatePhotos.List(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, photos)
}

// UploadCandidatePhotos 上传候选人的多张照片
// POST /api/candidates/:id/photos
func UploadCandidatePhotos(c *gin.Context) {
	userID := store.GetDefaultUserID()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	// 检查候选人是否存在
	candidate, err := store.Candidates.Get(id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	// 获取上传的多个文件
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no files uploaded"})
		return
	}

	files := form.File["photos"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no files uploaded"})
		return
	}

	// 保存所有文件并创建照片记录
	photos := make([]model.CandidatePhoto, 0, len(files))
	for _, file := range files {
		// 生成文件名
		filename := uuid.New().String() + "_" + file.Filename
		filepath := "./uploads/" + filename

		// 保存文件
		if err := c.SaveUploadedFile(file, filepath); err != nil {
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
	}

	// 批量保存照片记录
	if err := store.CandidatePhotos.CreateBatch(photos); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 如果候选人还没有头像，设置第一张照片为头像
	if candidate.PhotoURL == "" && len(photos) > 0 {
		avatarID := photos[0].ID
		if err := store.CandidatePhotos.SetAvatar(id, avatarID); err == nil {
			// 更新候选人的头像URL
			if err := store.Candidates.UpdatePhoto(id, userID, photos[0].PhotoURL); err != nil {
				// 即使更新失败也不影响整体流程，记录日志即可
			}
		}
	}

	c.JSON(http.StatusCreated, photos)
}

// SetAvatarRequest 设置头像请求
type SetAvatarRequest struct {
	PhotoID string `json:"photo_id" binding:"required"`
}

// SetCandidateAvatar 设置候选人的头像
// PUT /api/candidates/:id/avatar
func SetCandidateAvatar(c *gin.Context) {
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

	var req SetAvatarRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	photoID, err := uuid.Parse(req.PhotoID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid photo id"})
		return
	}

	// 设置头像
	if err := store.CandidatePhotos.SetAvatar(id, photoID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取照片信息并更新候选人的photo_url
	photo, err := store.CandidatePhotos.GetAvatar(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新候选人的头像URL
	if err := store.Candidates.UpdatePhoto(id, userID, photo.PhotoURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"photo_url": photo.PhotoURL})
}

// DeleteCandidatePhoto 删除候选人的照片
// DELETE /api/candidates/:id/photos/:photo_id
func DeleteCandidatePhoto(c *gin.Context) {
	userID := store.GetDefaultUserID()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	photoID, err := uuid.Parse(c.Param("photo_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid photo id"})
		return
	}

	// 检查候选人是否存在
	_, err = store.Candidates.Get(id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	// 删除照片
	if err := store.CandidatePhotos.Delete(photoID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
