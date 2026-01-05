# WhoTakesShowers 日志系统文档

## 概述

本项目使用 Uber 开发的高性能日志库 **zap**，配合 **lumberjack** 实现日志滚动功能，使用 YAML 配置文件管理日志配置。

## 技术栈

- **zap**: Uber 开发的高性能结构化日志库
- **lumberjack**: 日志滚动库
- **viper**: 配置文件读取库（通过 fsnotify 实现热更新）
- **YAML**: 配置文件格式

## 日志特性

### 1. 结构化日志

日志采用 JSON 格式存储，便于后续分析和查询：

```json
{
  "level": "info",
  "time": "2025-01-05T12:34:56.789+08:00",
  "caller": "handler/candidate.go:29",
  "msg": "Listed candidates successfully",
  "count": 5
}
```

### 2. 日志级别

支持以下日志级别：
- `debug`: 调试信息
- `info`: 一般信息
- `warn`: 警告信息
- `error`: 错误信息
- `fatal`: 致命错误（会导致程序退出）

### 3. 日志滚动

日志自动按以下规则滚动：
- **单个文件大小限制**: 默认 100MB
- **保留天数**: 默认 30 天
- **最大备份数**: 默认 10 个
- **压缩**: 自动压缩旧日志文件

滚动后的日志文件命名：
```
app.log           # 当前日志
app-2025-01-04.log.gz  # 压缩的历史日志
app-2025-01-03.log.gz
```

## 配置文件

配置文件位置：`backend/config.yaml`

```yaml
# 日志配置
logging:
  level: info  # 日志级别: debug, info, warn, error, fatal
  format: json  # 输出格式: json, console
  output: ./log  # 日志输出目录

  # 日志滚动配置
  rotation:
    max_size: 100    # 单个日志文件最大大小(MB)
    max_age: 30      # 日志文件保留天数
    max_backups: 10  # 最多保留的日志文件个数
    compress: true   # 是否压缩旧日志文件
```

### 配置项说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `level` | 日志级别 | `info` |
| `format` | 输出格式（`json` 或 `console`） | `json` |
| `output` | 日志目录 | `./log` |
| `max_size` | 单个日志文件最大大小（MB） | `100` |
| `max_age` | 日志文件保留天数 | `30` |
| `max_backups` | 最多保留的日志文件个数 | `10` |
| `compress` | 是否压缩旧日志 | `true` |

## 安装依赖

在 `backend` 目录下运行：

```bash
cd backend
go mod tidy
```

这将自动安装以下依赖：
- `go.uber.org/zap` - 核心日志库
- `gopkg.in/natefinch/lumberjack.v2` - 日志滚动
- `github.com/fsnotify/fsnotify` - 文件监听（配置热更新）
- `gopkg.in/yaml.v3` - YAML 解析

## 使用示例

### 1. 在代码中使用日志

```go
import (
    "whotakesshowers/internal/logger"
    "go.uber.org/zap"
)

// 简单日志
logger.Info("Server started")
logger.Error("Failed to connect database", zap.Error(err))

// 带字段的日志
logger.Info("User created",
    zap.String("user_id", userID),
    zap.String("name", userName),
    zap.Int("age", 25),
)

// 不同级别
logger.Debug("Debug information")
logger.Info("Information message")
logger.Warn("Warning message")
logger.Error("Error occurred")
logger.Fatal("Fatal error - will exit")
```

### 2. 获取 SugaredLogger

如果需要更灵活的日志方式（牺牲少量性能）：

```go
sugar := logger.GetSugared()

// 使用 printf 风格
sugar.Infof("User %s created at %v", userName, time.Now())

// 使用任意参数
sugar.Infow("User action",
    "user_id", userID,
    "action", "login",
    "ip", clientIP,
)
```

### 3. 创建带预设字段的 Logger

```go
// 创建一个带有固定字段的 logger
userLogger := logger.With(
    zap.String("service", "user-service"),
    zap.String("version", "1.0.0"),
)

// 使用时自动包含预设字段
userLogger.Info("Processing request",
    zap.String("request_id", reqID),
)
```

## 日志最佳实践

### 1. 选择合适的日志级别

- **Debug**: 详细的调试信息，仅在开发环境使用
- **Info**: 重要的业务流程、状态变化
- **Warn**: 潜在的问题、不影响功能的错误
- **Error**: 功能性错误、需要关注的异常
- **Fatal**: 程序无法继续运行的错误

### 2. 使用结构化字段

```go
// ✅ 好的做法
logger.Info("User login",
    zap.String("user_id", userID),
    zap.String("ip", clientIP),
    zap.Duration("latency", latency),
)

// ❌ 不好的做法
logger.Info(fmt.Sprintf("User %s logged in from %s with latency %v",
    userID, clientIP, latency))
```

### 3. 添加上下文信息

```go
logger.Debug("Processing request",
    zap.String("method", c.Request.Method),
    zap.String("path", c.Request.URL.Path),
    zap.String("client_ip", c.ClientIP()),
)
```

### 4. 记录错误堆栈

```go
logger.Error("Database operation failed",
    zap.String("operation", "create_user"),
    zap.Error(err),
    zap.Stack("stack"),
)
```

## 部署配置

### Docker 部署

使用 Docker Compose 时，日志目录会自动映射到主机：

```yaml
volumes:
  - ./log:/app/log
```

日志文件将保存在主机的 `./log` 目录下。

### 手动运行

如果手动运行程序，确保创建日志目录：

```bash
mkdir -p log
./whotakesshowers
```

## 日志查看

### 实时查看日志

```bash
# 查看最新日志
tail -f log/app.log

# 查看错误日志
grep "level\":\"error" log/app.log

# 使用 jq 美化输出
tail -f log/app.log | jq '.'
```

### 分析日志

```bash
# 统计错误数量
grep "level\":\"error" log/app.log | wc -l

# 查看特定用户的操作
grep "user_id\":\"xxx" log/app.log

# 查看特定时间范围的日志
grep "2025-01-05T12:" log/app.log
```

## 性能考虑

zap 是高性能日志库，但在使用时仍需注意：

1. **避免过多的 Debug 日志**: 生产环境建议使用 `info` 级别
2. **合理使用字段**: 只记录必要的信息
3. **延迟计算**: 对于昂贵的操作，使用条件判断

```go
// 检查日志级别后再执行昂贵操作
if logger.Get().Core().Enabled(zap.DebugLevel) {
    logger.Debug("Expensive operation result",
        zap.Any("data", expensiveOperation()),
    )
}
```

## 故障排查

### 1. 日志文件未生成

检查：
- 日志目录是否存在：`ls -la log/`
- 配置文件路径是否正确
- 程序是否有写入权限

### 2. 日志不滚动

检查：
- `max_size` 配置是否过大
- 磁盘空间是否充足

### 3. 性能问题

- 生产环境使用 `json` 格式而不是 `console`
- 调整日志级别，减少日志量
- 使用异步日志（zap 支持）

## 更多资源

- [zap 官方文档](https://github.com/uber-go/zap)
- [lumberjack 文档](https://github.com/natefinch/lumberjack)
- [结构化日志最佳实践](https://brandur.org/logfmt)

## 更新日志

- **2025-01-05**: 初始版本，集成 zap + lumberjack 日志系统
