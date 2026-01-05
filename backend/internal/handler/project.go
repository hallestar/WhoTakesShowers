package handler

import (
	"net/http"
	"whotakesshowers/internal/middleware"
	"whotakesshowers/internal/model"
	"whotakesshowers/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ProjectHandler 项目处理器
type ProjectHandler struct{}

var projectHandler = &ProjectHandler{}

// ListProjects 获取项目列表
// GET /api/projects
func ListProjects(c *gin.Context) {
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

	projects, err := store.Projects.List(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, projects)
}

// CreateProjectRequest 创建项目请求
type CreateProjectRequest struct {
	Name         string    `json:"name" binding:"required"`
	CandidateIDs []uuid.UUID `json:"candidate_ids"`
}

// CreateProject 创建项目
// POST /api/projects
func CreateProject(c *gin.Context) {
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

	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project := &model.Project{
		Name:   req.Name,
		UserID: userID,
	}

	// 保存项目
	if err := store.Projects.Create(project); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 设置候选人
	if len(req.CandidateIDs) > 0 {
		if err := store.Projects.SetCandidateIDs(project.ID, req.CandidateIDs); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		// 重新获取以更新 candidate_ids 字段
		project, _ = store.Projects.Get(project.ID, userID)
	}

	c.JSON(http.StatusCreated, project)
}

// UpdateProjectRequest 更新项目请求
type UpdateProjectRequest struct {
	Name         string      `json:"name"`
	CandidateIDs []uuid.UUID `json:"candidate_ids"`
}

// UpdateProject 更新项目
// PUT /api/projects/:id
func UpdateProject(c *gin.Context) {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	// 获取现有项目
	project, err := store.Projects.Get(id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	var req UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新字段
	if req.Name != "" {
		project.Name = req.Name
	}
	if req.CandidateIDs != nil {
		if err := store.Projects.SetCandidateIDs(id, req.CandidateIDs); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		// 重新获取以更新 candidate_ids 字段
		project, _ = store.Projects.Get(id, userID)
	} else {
		if err := store.Projects.Update(project); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, project)
}

// GetProject 获取项目详情
// GET /api/projects/:id
func GetProject(c *gin.Context) {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	project, err := store.Projects.Get(id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	c.JSON(http.StatusOK, project)
}

// DeleteProject 删除项目
// DELETE /api/projects/:id
func DeleteProject(c *gin.Context) {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	if err := store.Projects.Delete(id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 删除相关历史记录
	store.Histories.DeleteByProject(id, userID)

	c.Status(http.StatusNoContent)
}
