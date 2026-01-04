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

	// 前端静态文件服务
	r.Static("/assets", "./frontend/assets")
	r.StaticFile("/", "./frontend/index.html")
	r.StaticFile("/favicon.ico", "./frontend/favicon.ico")

	// SPA fallback: 所有其他路由返回index.html
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		// 如果是API请求但找不到路由，返回404
		if len(path) >= 4 && path[:4] == "/api" {
			c.JSON(404, gin.H{"error": "Not Found"})
			return
		}
		// 其他请求返回index.html（支持React Router）
		c.File("./frontend/index.html")
	})

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
