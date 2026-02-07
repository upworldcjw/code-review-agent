# 🤖 Code Review Agent (GitHub PR)

一个用于 **GitHub Pull Request** 的智能代码审查 Agent：输入 PR 链接，自动拉取变更文件与 patch/diff，调用 LLM 生成专业的审查报告（Markdown）。

## ✨ 功能特性

- 🖥️ **Web 界面**：现代化 UI，可视化展示 PR 信息和审查报告
- 💻 **CLI 工具**：`review <prUrl>` 生成 `report.md`
- 🌐 **HTTP API**：`POST /review` 传 PR 链接，返回 Markdown 报告
- 🔗 **GitHub 集成**：使用 `GITHUB_TOKEN` 拉取 PR files/patch
- 🧠 **LLM 驱动**：支持 OpenAI / 通义千问等多种 LLM
- 📊 **Prompt 预览**：可视化展示发送给模型的完整输入

## PR 链接格式

- `https://github.com/<owner>/<repo>/pull/<number>`

> 你给的 `https://github.com/upworldcjw` 是个人主页，不是 PR 链接；需要具体 PR 链接才能审查。

## 环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

- `OPENAI_API_KEY`：必需
- `GITHUB_TOKEN`：建议（私有仓库必需；公开仓库也建议配置，避免限流）
- `PORT`：HTTP服务端口，默认 `8787`

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 API Keys
```

### 3. 启动服务

```bash
npm start
# 访问 http://localhost:8787
```

## 💻 CLI 使用

```bash
node src/cli.js review https://github.com/{owner}/{repo}/pull/{number} --out report.md
```

**常用参数：**
- `--out <file>` 输出文件（默认 `report.md`）
- `--json` 同时输出JSON到stdout（便于接入流水线）

## 🌐 HTTP API 使用

### 启动服务器
```bash
npm start
# 默认 http://localhost:8787
```

### 调用 API
```bash
curl -X POST http://localhost:8787/review \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://github.com/{owner}/{repo}/pull/{number}"}'
```

### 健康检查
```bash
curl http://localhost:8787/health
```

## 🖥️ Web 界面使用

1. 启动服务：`npm start`
2. 访问：http://localhost:8787
3. 输入 PR URL，点击"开始审查"
4. 查看识别信息和审查报告
5. 可展开查看发送给模型的 Prompt

## 🐳 Docker 部署

```bash
# 构建镜像
docker build -t code-review-agent .

# 运行容器
docker run -d -p 8787:8787 \
  -e OPENAI_API_KEY=your-api-key \
  -e OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1 \
  -e GITHUB_TOKEN=your-github-token \
  --name code-review-agent \
  code-review-agent

# 或使用 Docker Compose
docker-compose up -d
```

## 🌍 远程部署

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署到 Vercel（推荐）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录并部署
vercel login
vercel

# 配置环境变量
vercel env add OPENAI_API_KEY
vercel env add OPENAI_BASE_URL
vercel env add GITHUB_TOKEN

# 生产部署
vercel --prod
```

支持的部署平台：
- ✅ **Vercel** (推荐 - 免费、零配置)
- ✅ **Railway** (简单部署、免费额度)
- ✅ **Docker + 云服务器** (完全控制)
- ✅ 阿里云 / 腾讯云 / AWS 等

## 📚 通义千问配置

使用阿里云通义千问：

1. 访问百炼平台：https://bailian.console.aliyun.com
2. 获取 API Key
3. 配置环境变量：

```env
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

## 📖 更多文档

- [部署指南](./DEPLOYMENT.md) - 详细的远程部署教程
- [API 文档](./src/server.js) - HTTP API 接口说明
- [环境变量配置](./.env.example) - 所有可配置项
