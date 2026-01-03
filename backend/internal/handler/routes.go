package handler

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes 注册所有路由
func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB) {
	// 项目相关
	r.GET("/projects", ListProjects)
	r.POST("/projects", CreateProject)
	r.GET("/projects/:id", GetProject)
	r.PUT("/projects/:id", UpdateProject)
	r.DELETE("/projects/:id", DeleteProject)

	// 候选人相关
	r.GET("/candidates", ListCandidates)
	r.POST("/candidates", CreateCandidate)
	r.GET("/candidates/:id", GetCandidate)
	r.PUT("/candidates/:id", UpdateCandidate)
	r.DELETE("/candidates/:id", DeleteCandidate)
	r.POST("/candidates/:id/photo", UploadCandidatePhoto)

	// 候选人照片相关
	r.GET("/candidates/:id/photos", ListCandidatePhotos)
	r.POST("/candidates/:id/photos", UploadCandidatePhotos)
	r.PUT("/candidates/:id/avatar", SetCandidateAvatar)
	r.DELETE("/candidates/:id/photos/:photo_id", DeleteCandidatePhoto)

	// 历史记录相关
	r.GET("/history", ListHistory)

	// 随机选择
	r.POST("/randomize", Randomize)
}
