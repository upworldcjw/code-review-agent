# GitHub PR 代码审查 Agent - 部署指南

本文档介绍如何将代码审查 Agent 部署到远端服务器，通过网页访问。

## 🚀 部署方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Vercel** | 免费、零配置、自动 HTTPS | Serverless 限制、冷启动 | 个人项目、快速演示 |
| **Railway** | 简单、免费额度、持久运行 | 免费额度有限 | 小团队、测试环境 |
| **Docker + 云服务器** | 完全控制、无限制 | 需要运维、成本较高 | 生产环境、企业使用 |
| **Heroku** | 简单易用、生态完善 | 免费计划取消 | 付费用户 |

---

## 1️⃣ Vercel 部署 (推荐 - 最简单)

### 优势
- ✅ 完全免费
- ✅ 零配置部署
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 自动持续部署

### 步骤

#### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

#### 2. 登录 Vercel
```bash
vercel login
```

#### 3. 部署项目
```bash
vercel
```

#### 4. 配置环境变量
在 Vercel Dashboard 中配置：
- `OPENAI_API_KEY`: 你的 OpenAI API Key
- `OPENAI_BASE_URL`: (可选) 通义千问的 Base URL
- `GITHUB_TOKEN`: (可选) GitHub Personal Access Token

或通过命令行：
```bash
vercel env add OPENAI_API_KEY
vercel env add OPENAI_BASE_URL
vercel env add GITHUB_TOKEN
```

#### 5. 生产部署
```bash
vercel --prod
```

完成后会得到类似 `https://your-project.vercel.app` 的访问地址。

---

## 2️⃣ Railway 部署

### 优势
- ✅ 免费 $5/月额度
- ✅ 持久运行（非 Serverless）
- ✅ 自动 HTTPS
- ✅ 简单配置

### 步骤

#### 1. 访问 Railway
前往 https://railway.app

#### 2. 从 GitHub 导入
- 点击 "New Project"
- 选择 "Deploy from GitHub repo"
- 选择本仓库

#### 3. 配置环境变量
在 Railway 项目设置中添加：
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `GITHUB_TOKEN`
- `PORT=8787`

#### 4. 自动部署
Railway 会自动检测 Node.js 项目并部署。

---

## 3️⃣ Docker + 云服务器部署

### 适用于
- ✅ 企业生产环境
- ✅ 需要完全控制
- ✅ 已有云服务器

### 步骤

#### 1. 准备云服务器
推荐配置：
- CPU: 1 核
- 内存: 1GB
- 系统: Ubuntu 22.04 LTS

云服务提供商：
- **阿里云**: https://www.aliyun.com
- **腾讯云**: https://cloud.tencent.com
- **AWS EC2**: https://aws.amazon.com
- **DigitalOcean**: https://www.digitalocean.com

#### 2. 安装 Docker
```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo apt-get install docker-compose -y

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### 3. 克隆项目
```bash
git clone <你的仓库地址>
cd code-review-agent
```

#### 4. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

填入：
```env
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
GITHUB_TOKEN=your-github-token
PORT=8787
```

#### 5. 构建并启动
```bash
# 使用 Docker Compose
docker-compose up -d

# 或手动构建
docker build -t code-review-agent .
docker run -d -p 8787:8787 \
  --env-file .env \
  --name code-review-agent \
  code-review-agent
```

#### 6. 配置 Nginx 反向代理 (可选)
```bash
# 安装 Nginx
sudo apt-get install nginx -y

# 配置 Nginx
sudo vim /etc/nginx/sites-available/code-review
```

添加配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/code-review /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. 配置 HTTPS (使用 Let's Encrypt)
```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com
```

---

## 4️⃣ 其他云平台

### 阿里云 Serverless (函数计算)
1. 访问阿里云函数计算控制台
2. 创建 HTTP 函数
3. 上传代码包
4. 配置环境变量
5. 绑定自定义域名

### 腾讯云 CloudBase
1. 访问腾讯云开发控制台
2. 创建云托管服务
3. 部署容器镜像
4. 配置环境变量

### AWS Lambda + API Gateway
1. 创建 Lambda 函数
2. 配置 API Gateway
3. 设置环境变量
4. 部署到生产环境

---

## 🔒 安全配置建议

### 1. 环境变量保护
- ❌ 不要将 `.env` 文件提交到 Git
- ✅ 使用平台的环境变量管理
- ✅ 定期轮换 API Key

### 2. 访问控制
```javascript
// 在 src/server.js 中添加基础认证
const basicAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.post('/review', basicAuth, async (req, res) => {
  // ...
});
```

### 3. 速率限制
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10, // 限制 10 次请求
});

app.use('/review', limiter);
```

---

## 📊 监控和日志

### 1. 健康检查
服务已内置健康检查接口：`GET /health`

### 2. 日志收集
```bash
# Docker 查看日志
docker logs -f code-review-agent

# 使用 PM2 管理进程
npm install -g pm2
pm2 start src/server.js --name code-review-agent
pm2 logs code-review-agent
```

### 3. 监控服务
推荐使用：
- **UptimeRobot**: https://uptimerobot.com (免费)
- **BetterStack**: https://betterstack.com
- **Prometheus + Grafana**: (自建监控)

---

## 🎯 推荐部署方案

### 个人使用 / 演示
👉 **Vercel** (最简单，完全免费)

### 小团队 / 测试环境
👉 **Railway** (简单部署，免费额度足够)

### 企业生产环境
👉 **Docker + 云服务器** (完全控制，稳定可靠)

---

## ❓ 常见问题

### Q: Vercel 部署后 API 超时？
A: Vercel Serverless 函数有 10s 执行时间限制，LLM 请求可能超时。建议使用 Railway 或 Docker 部署。

### Q: 如何绑定自定义域名？
A: 
- **Vercel**: 在 Dashboard 中添加 Custom Domain
- **Railway**: 在项目设置中添加 Custom Domain
- **自建服务器**: 配置 DNS A 记录指向服务器 IP

### Q: 如何更新部署？
A:
- **Vercel/Railway**: `git push` 即可自动部署
- **Docker**: 重新构建镜像并重启容器

---

## 📞 技术支持

如有问题，请查阅：
- 项目文档: README.md
- 环境配置: .env.example
- API 文档: 查看 server.js 注释
