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
- [x] 照片上传功能
- [x] 候选人相册系统
- [x] 自定义称呼
- [x] 批量删除照片
- [ ] 多用户支持
- [ ] 数据导出功能

## 🚀 部署到生产环境

本项目支持使用 rsync 通过内网快速部署到生产服务器。

### 快速部署

```bash
# 1. 一键部署（推荐）
./deploy-all.sh

# 2. 或分步部署
./build-production.sh  # 先构建
./deploy.sh            # 再部署
```

### 首次部署

详细步骤请参考 [部署指南 (DEPLOYMENT.md)](./DEPLOYMENT.md)

简要步骤：

1. **初始化服务器**
   ```bash
   # 在服务器上运行
   sudo bash init-server.sh
   ```

2. **配置免密登录**
   ```bash
   ssh-copy-id whotakesshowers@<服务器IP>
   ```

3. **修改部署配置**
   ```bash
   vim deploy.config.sh
   # 设置服务器IP和路径
   ```

4. **一键部署**
   ```bash
   ./deploy-all.sh
   ```

### 部署架构

```
开发机 ──rsync──> 内网服务器
                       ├─ /var/www/whotakesshowers (前端)
                       ├─ /opt/whotakesshowers (后端)
                       └─ Nginx (反向代理)
```

### 部署文件

- `deploy.config.sh` - 部署配置
- `deploy.sh` - 部署脚本
- `build-production.sh` - 构建脚本
- `deploy-all.sh` - 一键部署脚本
- `init-server.sh` - 服务器初始化
- `DEPLOYMENT.md` - 详细部署文档
- `deploy/` - 服务器配置文件目录

## License

MIT
