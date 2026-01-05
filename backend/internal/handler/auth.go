package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"whotakesshowers/internal/middleware"
	"whotakesshowers/internal/model"
	"whotakesshowers/internal/store"
	"gorm.io/gorm"
)

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse 认证响应
type AuthResponse struct {
	Token string      `json:"token"`
	User  model.User  `json:"user"`
}

// RegisterHandler 用户注册
func RegisterHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
			return
		}

		// 创建用户
		user, err := store.CreateUser(db, req.Username, req.Email, req.Password)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 生成token
		token, err := middleware.GenerateToken(user.ID.String())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "生成token失败"})
			return
		}

		c.JSON(http.StatusOK, AuthResponse{
			Token: token,
			User:  *user,
		})
	}
}

// LoginHandler 用户登录
func LoginHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数"})
			return
		}

		// 查找用户
		user, err := store.GetUserByUsername(db, req.Username)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
			return
		}

		// 验证密码
		if !store.ValidatePassword(user.Password, req.Password) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
			return
		}

		// 生成token
		token, err := middleware.GenerateToken(user.ID.String())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "生成token失败"})
			return
		}

		c.JSON(http.StatusOK, AuthResponse{
			Token: token,
			User:  *user,
		})
	}
}

// MeHandler 获取当前用户信息
func MeHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := middleware.GetUserID(c)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
			return
		}

		var user model.User
		if err := db.Where("id = ?", userID).First(&user).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
			return
		}

		c.JSON(http.StatusOK, user)
	}
}
