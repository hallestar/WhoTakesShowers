# WhoTakesShowers - Claude 上下文文档

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

## 最近完成的功能（2025-01-03）

### 📝 自定义候选人称呼

新增功能，允许用户自定义"候选人"这个关键词在整个应用中的显示：

#### 实现方式
1. **设置页面新增**：
   - 添加输入框允许用户自定义称呼（最多10个字符）
   - 提供快速选择按钮：候选人、机灵鬼、小伙伴、幸运儿、勇士、挑战者
   - 实时预览效果

2. **工具函数**：
   - 创建 `frontend/src/utils/candidateTerm.ts`
   - 提供 `getCandidateTerm()` 函数从localStorage读取自定义称呼
   - 默认返回"候选人"

3. **全局应用**：
   - 所有页面导入并使用 `getCandidateTerm()`
   - 添加state存储当前称呼：`const [candidateTerm, setCandidateTerm] = useState(() => getCandidateTerm())`
   - 监听localStorage变化，实时更新UI
   - 使用自定义事件 `localStorageUpdated` 通知所有页面更新

4. **修改的页面**：
   - `App.tsx` - 导航栏"候选人"文字动态显示
   - `Settings.tsx` - 添加自定义称呼设置
   - `Candidates.tsx` - 替换所有"候选人"文字（标题、提示、按钮等）
   - `Home.tsx` - 替换"候选人"为动态称呼
   - `ProjectDetail.tsx` - 替换"候选人"为动态称呼

#### 使用效果
- 用户设置"机灵鬼"后，整个应用的"候选人"都会变成"机灵鬼"
- 包括：导航栏、页面标题、按钮文字、提示信息、标签等
- 保存后立即生效，无需刷新页面
- 实时同步到所有页面

#### 快捷选项编辑功能
- **✏️ 编辑按钮**：点击进入编辑模式
- **添加选项**：在编辑模式下，输入新选项并点击"➕ 添加"
  - 最多8个快捷选项
  - 每个选项最多10个字符
  - 支持回车键快速添加
- **删除选项**：编辑模式下每个选项旁边显示"✕"删除按钮
  - 至少保留1个选项
  - 防止重复选项
- **计数显示**：显示当前数量 "快速选择 (6/8)"
- **自动保存**：点击"保存设置"时一起保存到localStorage

#### 恢复默认设置功能
- **🔄 恢复默认按钮**：与"保存设置"并排显示
- **确认对话框**：防止误操作，弹出确认提示
- **全面恢复**：
  - 随机头像：关闭
  - 默认配色：淡紫色
  - 默认表情：😀
  - 自定义称呼：候选人
  - 快捷选项：恢复为默认6个选项
- **清除存储**：删除所有相关的localStorage项
- **即时生效**：恢复后立即触发`localStorageUpdated`事件

### 📸 候选人相册系统

这是最近实现的主要功能，包括：

#### 1. 数据库层
- 新增 `CandidatePhoto` 模型表
- 字段：id, candidate_id, photo_url, is_avatar, created_at
- 支持每个候选人拥有多张照片
- 文件位置：`backend/internal/model/models.go`

#### 2. 后端API
新增4个API端点：

```go
GET    /api/candidates/:id/photos           // 获取候选人的所有照片
POST   /api/candidates/:id/photos           // 上传多张照片
PUT    /api/candidates/:id/avatar           // 设置某张照片为头像
DELETE /api/candidates/:id/photos/:photo_id // 删除单张照片
```

文件位置：
- Store层：`backend/internal/store/candidate_photo.go`
- Handler层：`backend/internal/handler/candidate_photo.go`
- 路由注册：`backend/internal/handler/routes.go`

#### 3. 前端功能

**相册展示**：
- 每个候选人卡片下方显示3x2照片网格
- 最多显示6张缩略图，超过显示"+N"
- 当前头像显示"头像"标签
- 点击照片打开全屏查看

**照片上传**：
- 支持多文件选择（`multiple`属性）
- 一次性上传多张照片
- 自动为无头像的候选人设置第一张为头像

**照片模态框**：
- 大图展示区域（左侧）
- 操作面板（右侧，200px宽）
- 导航按钮：上一张/下一张
- 照片计数器
- ⭐ 设为头像按钮（非头像照片显示）
- ✅ 当前头像标识（已是头像的照片显示）
- ✖️ 关闭按钮
- 点击外部区域关闭

**批量删除功能**：
- ☑️ 批量删除按钮（切换选择模式）
- 点击照片进行多选
- 选中照片显示粉色边框和✓标记
- 显示"已选 N 张"计数
- 🗑️ 删除选中按钮（批量删除）
- 确认对话框防止误删
- 选择模式下禁用导航和设为头像功能

**显著入口**：
- 候选人卡片中央大按钮："📸 添加照片"或"📸 查看相册 (N)"
- 渐变色背景（无照片：粉橙色，有照片：蓝绿色）
- 悬停放大效果
- 保留头像上的小📷按钮作为快捷入口

**重要代码位置**：
```typescript
// 前端主文件
frontend/src/pages/Candidates.tsx

// 关键状态管理
const [candidatePhotos, setCandidatePhotos] = useState<Record<string, CandidatePhoto[]>>({});
const [showPhotoModal, setShowPhotoModal] = useState(false);
const [modalPhotos, setModalPhotos] = useState<CandidatePhoto[]>([]);
const [selectionMode, setSelectionMode] = useState(false);
const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

// 关键函数
loadCandidatePhotos(candidateId)        // 加载候选人照片
handlePhotoUpload(id, files)            // 上传多张照片
handleBatchDelete()                     // 批量删除
togglePhotoSelection(photoId)           // 切换照片选择状态
```

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
│   │   │   ├── candidate_photo.go   # 照片API（新增）
│   │   │   ├── project.go           # 项目API
│   │   │   ├── history.go           # 历史API
│   │   │   └── routes.go            # 路由注册
│   │   ├── model/
│   │   │   └── models.go            # 数据模型（包含CandidatePhoto）
│   │   └── store/
│   │       ├── db.go                # 数据库初始化
│   │       ├── candidate.go         # 候选人数据层
│   │       ├── candidate_photo.go   # 照片数据层（新增）
│   │       ├── project.go           # 项目数据层
│   │       └── history.go           # 历史数据层
│   ├── data/
│   │   └── whotakesshowers.db       # SQLite数据库
│   └── uploads/                     # 上传的文件存储目录
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Avatar.tsx           # 头像组件
    │   ├── pages/
    │   │   ├── Home.tsx             # 首页
    │   │   ├── Candidates.tsx       # 候选人管理（相册功能）
    │   │   ├── History.tsx          # 历史记录
    │   │   ├── ProjectDetail.tsx    # 项目详情
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
   - 随机选择功能

3. **历史记录**
   - 记录每次选择结果
   - 查看历史记录

4. **设置**
   - 默认头像配置
   - 随机头像开关

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
    &model.CandidatePhoto{},  // 新增照片表
)
```

## 重要提示

1. **文件上传路径**
   - 前端上传到后端时需要使用 `FormData`
   - 后端将文件保存在 `./uploads/` 目录
   - 访问时通过 `/uploads/` 路径前缀

2. **照片URL处理**
   - 前端显示照片时需要拼接完整URL：`http://localhost:8080${photo_url}`
   - photo_url 存储的是相对路径，如 `/uploads/uuid_filename.jpg`

3. **状态管理**
   - 项目使用 React hooks 进行状态管理
   - 照片数据存储在 `candidatePhotos` 对象中，key为candidateId

4. **批量操作**
   - 使用 `Set<string>` 存储选中的照片ID
   - 批量删除时循环调用单张删除API

## 最近修复的问题

1. **TypeScript类型错误**
   - 修复了 `fontFamily` 属性的引号问题
   - 移除了未使用的 `index`、`navigate`、`winnerIndex` 变量

2. **用户体验优化**
   - 移除了"移除照片"按钮，改用相册管理
   - 增大了相册入口按钮，使其更显眼
   - 添加了批量删除功能

## 未来可能的改进

- [ ] 照片拖拽排序
- [ ] 照片标签/分类功能
- [ ] 照片编辑功能（裁剪、滤镜）
- [ ] 照片分享功能
- [ ] 导出候选人照片集
- [ ] 照片压缩优化
- [ ] 批量上传进度显示

## 开发注意事项

1. **后端Go代码**
   - 使用 `uuid.UUID` 作为主键类型
   - 所有API都使用 `store.GetDefaultUserID()` 获取默认用户
   - 文件上传使用 `c.SaveUploadedFile()` 保存

2. **前端React代码**
   - 所有样式使用内联 style 对象
   - 保持街机风格的一致性
   - 使用 async/await 处理异步操作
   - 错误处理使用 try-catch + alert

3. **调试**
   - 后端日志：Gin框架会自动打印请求日志
   - 前端调试：使用浏览器开发者工具
   - 数据库位置：`backend/data/whotakesshowers.db`（可用DB Browser查看）

---

**最后更新**: 2025-01-03
**Claude Session**:
- 相册功能完整实现（上传、查看、设置头像、批量删除）
- 自定义候选人称呼功能（全局动态替换）
- 快捷选项编辑功能（自定义、添加、删除）
- 恢复默认设置功能
