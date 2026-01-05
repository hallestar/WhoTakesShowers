package main

import (
	"os"

	"whotakesshowers/internal/config"
	"whotakesshowers/internal/handler"
	"whotakesshowers/internal/logger"
	"whotakesshowers/internal/store"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// 加载配置
	cfg, err := config.Load("./config.yaml")
	if err != nil {
		// 如果配置文件不存在，使用默认配置
		cfg = config.Get()
	}

	// 初始化日志系统
	if err := logger.Init(cfg); err != nil {
		panic("Failed to initialize logger: " + err.Error())
	}
	defer logger.Sync()

	logger.Info("Starting WhoTakesShowers server",
		zap.String("version", "1.0.0"),
		zap.Int("port", cfg.Server.Port),
		zap.String("mode", cfg.Server.Mode),
	)

	// 设置 Gin 模式
	gin.SetMode(cfg.Server.Mode)

	// 初始化数据库
	db, err := store.InitDB()
	if err != nil {
		logger.Fatal("Failed to initialize database", zap.Error(err))
	}
	logger.Info("Database initialized successfully", zap.String("path", cfg.Database.Path))

	// 初始化存储
	store.Init(db)

	// 创建 Gin 路由
	r := gin.New()

	// 使用自定义日志中间件
	r.Use(LoggerMiddleware())
	r.Use(gin.Recovery())

	// 配置 CORS
	r.Use(CORSMiddleware())

	// 注册路由
	api := r.Group("/api")
	{
		handler.RegisterRoutes(api, store.DB)
	}
	logger.Info("API routes registered")

	// 静态文件服务（用于上传的照片）
	r.Static("/uploads", "./uploads")
	logger.Info("Static file serving configured", zap.String("path", "./uploads"))

	// 前端静态文件服务
	r.Static("/assets", "./frontend/assets")
	r.StaticFile("/", "./frontend/index.html")
	r.StaticFile("/favicon.ico", "./frontend/favicon.ico")

	// SPA fallback: 所有其他路由返回index.html
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		// 如果是API请求但找不到路由，返回404
		if len(path) >= 4 && path[:4] == "/api" {
			logger.Warn("API route not found", zap.String("path", path))
			c.JSON(404, gin.H{"error": "Not Found"})
			return
		}
		// 其他请求返回index.html（支持React Router）
		c.File("./frontend/index.html")
	})

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	// 监听在 0.0.0.0 以允许外部设备访问
	addr := "0.0.0.0:" + port
	logger.Info("Server is ready", zap.String("address", addr))

	if err := r.Run(addr); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}

// LoggerMiddleware 自定义日志中间件
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := c.Request.URL.Path
		logger.Debug("Incoming request",
			zap.String("method", c.Request.Method),
			zap.String("path", start),
			zap.String("client_ip", c.ClientIP()),
		)

		c.Next()

		logger.Debug("Request completed",
			zap.String("method", c.Request.Method),
			zap.String("path", start),
			zap.Int("status", c.Writer.Status()),
			zap.Int("size", c.Writer.Size()),
		)
	}
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
