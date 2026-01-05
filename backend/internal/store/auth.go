package store

import (
	"errors"

	"whotakesshowers/internal/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// CreateUser 创建新用户
func CreateUser(db *gorm.DB, username, email, password string) (*model.User, error) {
	// 检查用户名是否已存在
	var existingUser model.User
	if err := db.Where("username = ?", username).First(&existingUser).Error; err == nil {
		return nil, errors.New("用户名已存在")
	}

	// 检查邮箱是否已存在（如果提供了邮箱）
	if email != "" {
		if err := db.Where("email = ?", email).First(&existingUser).Error; err == nil {
			return nil, errors.New("邮箱已被注册")
		}
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 创建用户
	user := &model.User{
		Username: username,
		Email:    email,
		Password: string(hashedPassword),
	}

	if err := db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

// GetUserByUsername 根据用户名获取用户
func GetUserByUsername(db *gorm.DB, username string) (*model.User, error) {
	var user model.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail 根据邮箱获取用户
func GetUserByEmail(db *gorm.DB, email string) (*model.User, error) {
	var user model.User
	if err := db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// ValidatePassword 验证密码
func ValidatePassword(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}
