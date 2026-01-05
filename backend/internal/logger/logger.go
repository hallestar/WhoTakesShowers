package logger

import (
	"os"
	"path/filepath"

	"whotakesshowers/internal/config"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

var (
	log     *zap.Logger
	sugar   *zap.SugaredLogger
	encoder zapcore.Encoder
)

// Init 初始化日志系统
func Init(cfg *config.Config) error {
	// 创建日志目录
	if err := os.MkdirAll(cfg.Logging.Output, 0755); err != nil {
		return err
	}

	// 设置日志级别
	level := zapcore.InfoLevel
	switch cfg.Logging.Level {
	case "debug":
		level = zapcore.DebugLevel
	case "info":
		level = zapcore.InfoLevel
	case "warn":
		level = zapcore.WarnLevel
	case "error":
		level = zapcore.ErrorLevel
	case "fatal":
		level = zapcore.FatalLevel
	}

	// 配置日志轮转
	lumberjackLogger := &lumberjack.Logger{
		Filename:   filepath.Join(cfg.Logging.Output, "app.log"),
		MaxSize:    cfg.Logging.Rotation.MaxSize,    // MB
		MaxAge:     cfg.Logging.Rotation.MaxAge,     // days
		MaxBackups: cfg.Logging.Rotation.MaxBackups, // number of backups
		Compress:   cfg.Logging.Rotation.Compress,   // compress old files
	}

	// 配置编码器
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		FunctionKey:    zapcore.OmitKey,
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	// 根据配置选择编码器
	if cfg.Logging.Format == "json" {
		encoder = zapcore.NewJSONEncoder(encoderConfig)
	} else {
		encoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		encoder = zapcore.NewConsoleEncoder(encoderConfig)
	}

	// 创建核心
	core := zapcore.NewCore(
		encoder,
		zapcore.AddSync(lumberjackLogger),
		level,
	)

	// 创建 logger
	log = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))
	sugar = log.Sugar()

	return nil
}

// Get 获取 logger
func Get() *zap.Logger {
	if log == nil {
		// 如果未初始化，返回开发环境的默认 logger
		logger, _ := zap.NewDevelopment()
		log = logger
		sugar = logger.Sugar()
	}
	return log
}

// GetSugared 获取 SugaredLogger
func GetSugared() *zap.SugaredLogger {
	if sugar == nil {
		Get()
	}
	return sugar
}

// Sync 同步日志缓冲区
func Sync() {
	if log != nil {
		_ = log.Sync()
	}
}

// Debug 输出 debug 日志
func Debug(msg string, fields ...zap.Field) {
	Get().Debug(msg, fields...)
}

// Info 输出 info 日志
func Info(msg string, fields ...zap.Field) {
	Get().Info(msg, fields...)
}

// Warn 输出 warn 日志
func Warn(msg string, fields ...zap.Field) {
	Get().Warn(msg, fields...)
}

// Error 输出 error 日志
func Error(msg string, fields ...zap.Field) {
	Get().Error(msg, fields...)
}

// Fatal 输出 fatal 日志并退出程序
func Fatal(msg string, fields ...zap.Field) {
	Get().Fatal(msg, fields...)
}

// With 创建一个带有预设字段的 logger
func With(fields ...zap.Field) *zap.Logger {
	return Get().With(fields...)
}
