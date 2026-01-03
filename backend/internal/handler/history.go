package handler

import (
	"fmt"
	"net/http"
	"whotakesshowers/internal/service"
	"whotakesshowers/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ListHistory 获取历史记录
// GET /api/history
func ListHistory(c *gin.Context) {
	userID := store.GetDefaultUserID()

	var projectID *uuid.UUID
	if projectIDStr := c.Query("project_id"); projectIDStr != "" {
		id, err := uuid.Parse(projectIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project_id"})
			return
		}
		projectID = &id
	}

	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := parseInt(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	histories, err := store.Histories.List(userID, projectID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, histories)
}

// Randomize 执行随机选择
// POST /api/randomize
func Randomize(c *gin.Context) {
	userID := store.GetDefaultUserID()

	var req service.RandomizeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := service.Randomizer.Execute(&req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no candidates available"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// parseInt 辅助函数：解析整数
func parseInt(s string) (int, error) {
	var result int
	_, err := fmt.Sscanf(s, "%d", &result)
	return result, err
}
