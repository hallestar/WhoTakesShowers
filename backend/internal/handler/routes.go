package handler

import (
	"github.com/gin-gonic/gin"
	"whotakesshowers/internal/middleware"
	"gorm.io/gorm"
)

// RegisterRoutes 注册所有路由
func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB) {
	// 认证相关（不需要token）
	r.POST("/auth/register", RegisterHandler(db))
	r.POST("/auth/login", LoginHandler(db))

	// 需要认证的路由
	auth := r.Group("")
	auth.Use(middleware.AuthMiddleware())
	{
		// 用户信息
		auth.GET("/auth/me", MeHandler(db))

		// 项目相关
		auth.GET("/projects", ListProjects)
		auth.POST("/projects", CreateProject)
		auth.GET("/projects/:id", GetProject)
		auth.PUT("/projects/:id", UpdateProject)
		auth.DELETE("/projects/:id", DeleteProject)

		// 候选人相关
		auth.GET("/candidates", ListCandidates)
		auth.POST("/candidates", CreateCandidate)
		auth.GET("/candidates/:id", GetCandidate)
		auth.PUT("/candidates/:id", UpdateCandidate)
		auth.DELETE("/candidates/:id", DeleteCandidate)
		auth.POST("/candidates/:id/photo", UploadCandidatePhoto)

		// 候选人照片相关
		auth.GET("/candidates/:id/photos", ListCandidatePhotos)
		auth.POST("/candidates/:id/photos", UploadCandidatePhotos)
		auth.PUT("/candidates/:id/avatar", SetCandidateAvatar)
		auth.DELETE("/candidates/:id/photos/:photo_id", DeleteCandidatePhoto)

		// 历史记录相关
		auth.GET("/history", ListHistory)

		// 随机选择
		auth.POST("/randomize", Randomize)
	}
}
