package main

import (
	"log"
	"whotakesshowers/internal/handler"
	"whotakesshowers/internal/store"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化数据库
	db, err := store.InitDB()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// 初始化存储
	store.Init(db)

	// 创建 Gin 路由
	r := gin.Default()

	// 配置 CORS
	r.Use(CORSMiddleware())

	// 注册路由
	api := r.Group("/api")
	{
		handler.RegisterRoutes(api, store.DB)
	}

	// 静态文件服务（用于上传的照片）
	r.Static("/uploads", "./uploads")

	log.Println("Server starting on :8080")
	r.Run(":8080")
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
