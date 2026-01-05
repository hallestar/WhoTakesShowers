package config

import (
	"fmt"
	"os"

	"github.com/fsnotify/fsnotify"
	"gopkg.in/yaml.v3"
)

// Config 应用配置
type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	Logging  LoggingConfig  `yaml:"logging"`
	Upload   UploadConfig   `yaml:"upload"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port int    `yaml:"port"`
	Mode string `yaml:"mode"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Path string `yaml:"path"`
}

// LoggingConfig 日志配置
type LoggingConfig struct {
	Level    string        `yaml:"level"`     // 日志级别
	Format   string        `yaml:"format"`    // 输出格式: json, console
	Output   string        `yaml:"output"`    // 日志输出目录
	Rotation RotationConfig `yaml:"rotation"`  // 日志滚动配置
}

// RotationConfig 日志滚动配置
type RotationConfig struct {
	MaxSize    int  `yaml:"max_size"`    // 单个日志文件最大大小(MB)
	MaxAge     int  `yaml:"max_age"`     // 日志文件保留天数
	MaxBackups int  `yaml:"max_backups"` // 最多保留的日志文件个数
	Compress   bool `yaml:"compress"`    // 是否压缩旧日志文件
}

// UploadConfig 上传配置
type UploadConfig struct {
	MaxSize      int64    `yaml:"max_size"`       // 最大上传大小(字节)
	AllowedTypes []string `yaml:"allowed_types"`  // 允许的文件类型
}

var (
	cfg     *Config
	watcher *fsnotify.Watcher
)

// Load 加载配置文件
func Load(configPath string) (*Config, error) {
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %w", err)
	}

	config := &Config{}
	if err := yaml.Unmarshal(data, config); err != nil {
		return nil, fmt.Errorf("解析配置文件失败: %w", err)
	}

	cfg = config
	return cfg, nil
}

// Get 获取配置
func Get() *Config {
	if cfg == nil {
		// 返回默认配置
		return &Config{
			Server: ServerConfig{
				Port: 8080,
				Mode: "debug",
			},
			Database: DatabaseConfig{
				Path: "./data/whotakesshowers.db",
			},
			Logging: LoggingConfig{
				Level:  "info",
				Format: "json",
				Output: "./log",
				Rotation: RotationConfig{
					MaxSize:    100,
					MaxAge:     30,
					MaxBackups: 10,
					Compress:   true,
				},
			},
			Upload: UploadConfig{
				MaxSize: 10485760, // 10MB
				AllowedTypes: []string{
					"image/jpeg",
					"image/png",
					"image/gif",
					"image/webp",
				},
			},
		}
	}
	return cfg
}

// Watch 监听配置文件变化
func Watch(configPath string) error {
	w, err := fsnotify.NewWatcher()
	if err != nil {
		return fmt.Errorf("创建文件监听器失败: %w", err)
	}

	watcher = w

	go func() {
		defer w.Close()
		for {
			select {
			case event, ok := <-w.Events:
				if !ok {
					return
				}
				if event.Op&fsnotify.Write == fsnotify.Write {
					if newCfg, err := Load(configPath); err == nil {
						cfg = newCfg
					}
				}
			case err, ok := <-w.Errors:
				if !ok {
					return
				}
				fmt.Printf("配置文件监听错误: %v\n", err)
			}
		}
	}()

	return w.Add(configPath)
}

// Close 关闭配置监听
func Close() {
	if watcher != nil {
		watcher.Close()
	}
}
