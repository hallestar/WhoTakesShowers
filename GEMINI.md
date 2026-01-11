# WhoTakesShowers - Gemini 上下文文档

## 项目概述

这是一个有趣的随机选择工具，用于在多人之间随机选择一个人（例如决定谁去洗澡）。项目采用前后端分离架构，具有鲜明的街机风格UI设计。

## 技术栈

### 前端
- **框架**: React 18 + TypeScript + Vite
- **路由**: React Router v6
- **HTTP客户端**: Axios
- **样式**: 内联样式 + CSS变量（街机风格设计）
- **构建工具**: Vite

### 后端
- **语言**: Go
- **Web框架**: Gin
- **数据库**: SQLite (GORM)
- **文件上传**: multipart/form-data

## 最近完成的功能（2026-01-10）

### 🎰 赌场轮盘随机选择模式

新增轮盘风格的随机选择界面，完美复刻赌场轮盘效果：

#### 实现方式
1. **组件文件**：`frontend/src/components/RouletteWheel.tsx`

2. **核心特性**：
   - **交替颜色条纹扇形**：使用 `conic-gradient` 实现扇形内交替条纹效果
   - **8种赌场配色**：红(#FF1744)、金(#FFD700)、蓝(#1E90FF)、绿(#32CD32)、粉(#FF1493)、橙(#FF8C00)、紫(#9400D3)、青(#00CED1)
   - **金色装饰环**：外层金色边框（12px）带发光效果
   - **白色中心圆**：显示当前候选人数，金色渐变文字
   - **顶部指针**：红色三角形指针指向轮盘
   - **金色按钮**：带悬停动画效果

3. **动画效果**：
   - 旋转时间：5秒
   - 完整旋转：8圈
   - 缓动函数：easeOutQuart（四次方缓出）
   - 音效：每个扇区切换时播放滴答声（Web Audio API）
   - 实时显示当前指向的候选人

4. **头像定位**：
   - 位置：扇区中心（半径40%）
   - 反向旋转：`-(currentRotation + index * segmentAngle + segmentAngle / 2)` 保持头像朝向
   - 响应式尺寸：根据候选人数自适应（≤3人: 70px, ≤6人: 62px, >6人: 54px）

5. **模式切换**：
   - 在 `ProjectDetail.tsx` 中添加UI模式选择器
   - 支持"卡片网格模式"和"轮盘模式"切换
   - 轮盘模式先调用后端API确定获胜者，再播放动画

#### 关键代码片段
```typescript
// 头像位置计算（极坐标）
const angle = (index * segmentAngle + segmentAngle / 2) * (Math.PI / 180);
const radius = 40; // 距离中心的百分比
const x = 50 + radius * Math.cos(angle);
const y = 50 + radius * Math.sin(angle);

// 反向旋转保持头像朝向
const finalRotation = -(currentRotation + index * segmentAngle + segmentAngle / 2);

// 扇形条纹效果
background: `
  conic-gradient(
    from ${index * segmentAngle}deg at 50% 50%,
    ${colors} 0deg ${segmentAngle * 0.6}deg,
    ${nextColors} ${segmentAngle * 0.6}deg ${segmentAngle * 0.6}deg,
    ${colors} ${segmentAngle * 1.2}deg ${segmentAngle * 1.4}deg,
    ${nextColors} ${segmentAngle * 1.4}deg ${segmentAngle * 1.4}deg,
    ${colors} ${segmentAngle * 1.8}deg ${segmentAngle * 2}deg
  )
`
```

### 📝 自定义候选人称呼

允许用户自定义"候选人"这个关键词在整个应用中的显示。

### 📸 候选人相册系统

完整的照片管理功能，包括上传、查看、设置头像、批量删除。

## 项目结构

```
WhoTakesShowers/
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go              # 后端入口
│   ├── internal/
│   │   ├── handler/
│   │   │   ├── candidate.go         # 候选人API
│   │   │   ├── candidate_photo.go   # 照片API
│   │   │   ├── project.go           # 项目API
│   │   │   ├── history.go           # 历史API
│   │   │   └── routes.go            # 路由注册
│   │   ├── model/
│   │   │   └── models.go            # 数据模型
│   │   └── store/
│   │       ├── db.go                # 数据库初始化
│   │       ├── candidate.go         # 候选人数据层
│   │       ├── candidate_photo.go   # 照片数据层
│   │       ├── project.go           # 项目数据层
│   │       └── history.go           # 历史数据层
│   ├── data/
│   │   └── whotakesshowers.db       # SQLite数据库
│   └── uploads/                     # 上传的文件存储目录
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Avatar.tsx           # 头像组件
    │   │   └── RouletteWheel.tsx    # 轮盘组件（新增）
    │   ├── pages/
    │   │   ├── Home.tsx             # 首页
    │   │   ├── Candidates.tsx       # 候选人管理
    │   │   ├── History.tsx          # 历史记录
    │   │   ├── ProjectDetail.tsx    # 项目详情（支持轮盘模式）
    │   │   └── Settings.tsx         # 设置页面
    │   └── App.tsx                  # 路由配置
    ├── public/
    └── package.json
```

## 核心功能

1. **候选人管理**
   - 创建、编辑、删除候选人
   - 上传头像照片
   - 管理候选人相册
   - 批量删除照片

2. **项目管理**
   - 创建项目
   - 为项目添加候选人
   - 随机选择功能（卡片网格 / 轮盘模式）

3. **历史记录**
   - 记录每次选择结果
   - 查看历史记录

4. **设置**
   - 默认头像配置
   - 随机头像开关
   - 自定义候选人称呼

## UI设计风格

项目采用**街机风格（Arcade Style）**设计：

- **颜色变量**：
  - `--deep-purple`: 深紫色（主色调）
  - `--electric-blue`: 电蓝色
  - `--neon-pink`: 霓虹粉色
  - `--minty-fresh`: 薄荷绿
  - `--soft-lilac`: 柔和淡紫
  - `--peachy`: 桃色
  - `--sunset-orange`: 日落橙
  - `--lime-green`: 青柠绿

- **设计元素**：
  - 圆角边框 + 阴影效果（`boxShadow: '2px 2px 0 var(--deep-purple)'`）
  - 动画效果：slideInUp、bounce、pulse
  - 字体：'Fredoka One', cursive
  - 悬停交互：缩放、旋转效果

## 如何运行项目

### 启动后端
```bash
cd backend
go run cmd/server/main.go
```
后端运行在 `http://localhost:8080`

### 启动前端
```bash
cd frontend
npm run dev
```
前端运行在 `http://localhost:5173`

### 构建前端
```bash
cd frontend
npm run build
```

## 数据库迁移

数据库使用 GORM 的 AutoMigrate 功能，自动创建/更新表结构。

新增表时会自动在 `backend/internal/store/db.go` 的 `AutoMigrate` 中添加：
```go
db.AutoMigrate(
    &model.CandidatePhoto{},
)
```

## 重要提示

1. **文件上传路径**
   - 前端上传到后端时需要使用 `FormData`
   - 后端将文件保存在 `./uploads/` 目录
   - 访问时通过 `/uploads/` 路径前缀

2. **照片URL处理**
   - 使用 `getPhotoUrl()` 函数拼接完整URL
   - photo_url 存储的是相对路径，如 `/uploads/uuid_filename.jpg`
   - 支持开发环境和生产环境自动切换

3. **API配置**
   - 开发环境：`http://localhost:8080/api`
   - 生产环境：`/api`（相对路径）
   - 通过环境变量 `VITE_API_BASE_URL` 配置

4. **状态管理**
   - 项目使用 React hooks 进行状态管理
   - 照片数据存储在 `candidatePhotos` 对象中，key为candidateId

5. **Docker部署**
   - GitHub Actions 在推送 version tag 时自动构建
   - Node.js 版本：22-alpine
   - 前端构建时设置 `VITE_API_BASE_URL=/api`

## 后端API端点

### 候选人相关
```
GET    /api/candidates              # 获取所有候选人
POST   /api/candidates              # 创建候选人
GET    /api/candidates/:id          # 获取单个候选人
PUT    /api/candidates/:id          # 更新候选人
DELETE /api/candidates/:id          # 删除候选人
```

### 候选人照片相关
```
GET    /api/candidates/:id/photos           # 获取候选人的所有照片
POST   /api/candidates/:id/photos           # 上传多张照片
PUT    /api/candidates/:id/avatar           # 设置某张照片为头像
DELETE /api/candidates/:id/photos/:photo_id # 删除单张照片
```

### 项目相关
```
GET    /api/projects                # 获取所有项目
POST   /api/projects                # 创建项目
GET    /api/projects/:id            # 获取项目详情
PUT    /api/projects/:id            # 更新项目
DELETE /api/projects/:id            # 删除项目
```

### 随机选择
```
POST   /api/randomize               # 随机选择（传入project_id）
```

### 历史记录
```
GET    /api/history                 # 获取历史记录（可传project_id和limit参数）
```

## 前端工具函数

### `frontend/src/api.ts`
```typescript
getPhotoUrl(photoPath: string)      // 拼接完整照片URL
getServerBaseUrl()                  // 获取服务器基础URL
apiClient                           // API客户端对象
```

### `frontend/src/utils/auth.ts`
```typescript
getToken()                          // 获取存储的Token
setToken(token)                     // 保存Token
removeToken()                       // 删除Token
getApiBaseUrl()                     // 获取API基础URL
```

### `frontend/src/utils/candidateTerm.ts`
```typescript
getCandidateTerm()                  // 获取自定义候选人称呼
```

## 开发注意事项

### 后端Go代码
- 使用 `uuid.UUID` 作为主键类型
- 所有API都使用 `store.GetDefaultUserID()` 获取默认用户
- 文件上传使用 `c.SaveUploadedFile()` 保存

### 前端React代码
- 所有样式使用内联 style 对象
- 保持街机风格的一致性
- 使用 async/await 处理异步操作
- 错误处理使用 try-catch + alert
- 轮盘组件使用 `requestAnimationFrame` 实现流畅动画

### TypeScript注意
- 未使用的参数用 `_` 表示：`candidates.map((_, index) => ...)`
- 处理可能为 undefined 的属性：`candidate.photo_url || ''`

### 调试
- 后端日志：Gin框架会自动打印请求日志
- 前端调试：使用浏览器开发者工具
- 数据库位置：`backend/data/whotakesshowers.db`（可用DB Browser查看）

## 最近修复的问题

1. **TypeScript类型错误**
   - 修复了 `fontFamily` 属性的引号问题
   - 移除了未使用的变量
   - 使用 `_` 标记未使用的参数

2. **轮盘头像显示问题**
   - 修复头像URL处理（使用 `getPhotoUrl()`）
   - 修复头像定位（半径从68%调整到40%）
   - 修复头像旋转（实现反向旋转保持朝向）

3. **Docker构建问题**
   - Node.js版本升级到22
   - 设置 `VITE_API_BASE_URL=/api` 用于生产环境

## 未来可能的改进

- [ ] 照片拖拽排序
- [ ] 照片标签/分类功能
- [ ] 照片编辑功能（裁剪、滤镜）
- [ ] 照片分享功能
- [ ] 导出候选人照片集
- [ ] 照片压缩优化
- [ ] 批量上传进度显示
- [ ] 轮盘动画自定义选项（旋转速度、圈数）

---

**最后更新**: 2026-01-10
**Gemini Session**:
- 赌场轮盘随机选择模式完整实现
- 交替颜色条纹扇形效果
- 头像定位和反向旋转
- 音效和动画效果
