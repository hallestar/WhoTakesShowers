# 家庭争端解决器

一个有趣的 Web 应用，通过随机选择帮助家长解决多个小孩都不愿先完成某项任务的争端。

## 功能特点

- 🎲 随机选择：通过动画效果随机选择一个候选人
- 👥 候选人管理：添加、编辑、删除候选人，支持上传照片
- 📜 历史记录：查看所有历史选择记录
- 🎉 庆祝动画：选择完成后的彩纸庆祝效果
- 🎨 YouTube Kids 风格界面：鲜艳明快、适合儿童

## 技术栈

### 后端
- Go 1.25
- Gin Web 框架
- GORM
- SQLite

### 前端
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Axios

## 快速开始

### 1. 启动后端

```bash
cd backend

# 安装依赖
go mod download

# 运行服务器
go run cmd/server/main.go
```

后端服务将在 `http://localhost:8080` 启动

### 2. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 `http://localhost:5173` 启动

## 使用说明

1. **添加候选人**：进入"候选人"页面，添加家庭成员（如小孩的名字）
2. **创建项目**：在首页点击"添加新项目"，创建一个随机项目（如"谁先洗澡"）
3. **配置候选人**：编辑项目，选择参与此项目的候选人
4. **开始随机选择**：点击项目卡片，进入项目详情页，点击"开始"按钮

## 项目结构

```
WhoTakesShowers/
├── backend/           # Go 后端
│   ├── cmd/
│   │   └── server/    # 主程序入口
│   ├── internal/      # 内部包
│   │   ├── handler/   # HTTP 处理器
│   │   ├── model/     # 数据模型
│   │   ├── service/   # 业务逻辑
│   │   └── store/     # 数据库操作
│   ├── data/          # SQLite 数据库文件
│   └── uploads/       # 上传的照片文件
├── frontend/          # React 前端
│   ├── src/
│   │   ├── components/ # React 组件
│   │   ├── pages/      # 页面组件
│   │   └── api.ts      # API 客户端
│   └── ...
└── docs/              # 项目文档
```

## API 文档

### 项目相关
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

### 候选人相关
- `GET /api/candidates` - 获取候选人列表
- `POST /api/candidates` - 创建候选人
- `GET /api/candidates/:id` - 获取候选人详情
- `PUT /api/candidates/:id` - 更新候选人
- `DELETE /api/candidates/:id` - 删除候选人
- `POST /api/candidates/:id/photo` - 上传候选人照片

### 历史记录相关
- `GET /api/history` - 获取历史记录

### 随机选择
- `POST /api/randomize` - 执行随机选择

## 开发计划

- [x] 用户系统（基础版）
- [x] 候选人管理（CRUD）
- [x] 项目管理（CRUD）
- [x] 随机选择动画
- [x] 历史记录查看
- [ ] 照片上传功能（后端已支持，前端待实现）
- [ ] 多用户支持
- [ ] 数据导出功能

## License

MIT
