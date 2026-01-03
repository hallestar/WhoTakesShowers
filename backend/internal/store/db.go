package store

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"whotakesshowers/internal/model"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB 全局数据库实例
var DB *gorm.DB

// InitDB 初始化数据库
func InitDB() (*gorm.DB, error) {
	// 确保数据目录存在
	dataDir := "./data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	dbPath := filepath.Join(dataDir, "whotakesshowers.db")

	// 打开数据库连接
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// 自动迁移
	if err := db.AutoMigrate(
		&model.User{},
		&model.Project{},
		&model.Candidate{},
		&model.History{},
	); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database initialized successfully")
	return db, nil
}

// Init 初始化存储层
func Init(db *gorm.DB) {
	DB = db

	// 创建默认用户（如果不存在）
	var defaultUser model.User
	result := DB.Where("username = ?", "default").First(&defaultUser)
	if result.Error != nil {
		// 创建默认用户
		defaultUser = model.User{
			Username: "default",
		}
		if err := DB.Create(&defaultUser).Error; err != nil {
			log.Printf("Warning: failed to create default user: %v", err)
		} else {
			log.Printf("Default user created: %s", defaultUser.ID)
		}
	}
}

// GetDefaultUserID 获取默认用户ID
func GetDefaultUserID() uuid.UUID {
	var user model.User
	if err := DB.Where("username = ?", "default").First(&user).Error; err != nil {
		log.Printf("Error getting default user: %v", err)
		return uuid.Nil
	}
	return user.ID
}
