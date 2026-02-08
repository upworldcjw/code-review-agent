# 🎬 演示指南

## 在线演示

**体验地址**: [https://code-review-agent-delta.vercel.app](https://code-review-agent-delta.vercel.app)

---

## 使用步骤

### 1️⃣ 访问 Web 界面

打开浏览器访问: https://code-review-agent-delta.vercel.app

### 2️⃣ 输入 PR 信息

- **PR URL**: 默认已填充 `https://github.com/upworldcjw/JWKeyWordFilter/pull/1`
- **GitHub Token** (可选): 用于访问私有仓库

### 3️⃣ 开始审查

点击 **"开始审查"** 按钮，系统将：

1. 解析 PR URL，获取仓库和 PR 号
2. 调用 GitHub API 拉取文件变更
3. 将代码 diff 发送给 LLM
4. 生成专业的代码审查报告

### 4️⃣ 查看结果

- **PR 识别信息**: 标题、作者、状态、变更统计
- **文件变更列表**: 显示修改的文件数量
- **Prompt 预览**: 查看发送给 LLM 的完整输入
- **审查报告**: Markdown 格式的专业审查报告

---

## 功能亮点

### 🔐 自定义 GitHub Token

支持用户提供自己的 GitHub Token：

**使用场景**:
- 访问私有仓库
- 绕过 API 速率限制
- 审查组织内部代码

**安全保障**:
- Token 仅用于本次请求
- 不会存储到任何地方
- 密码框隐藏输入内容

### 📊 Prompt 可视化

点击 **"显示/隐藏 Prompt"** 按钮，查看：

- PR 基本信息
- 文件变更详情
- 审查要求说明
- 输出格式规范

### ⏱️ 支持大型 PR

- **超时时间**: 3 分钟
- **内存配置**: 1024MB
- 适合审查大规模代码变更

---

## 录制演示视频

### 推荐工具

**macOS**:
```bash
# 使用系统自带的屏幕录制
Cmd + Shift + 5 → 录制所选区域
```

**Windows**:
- Xbox Game Bar (Win + G)
- OBS Studio

**跨平台**:
- [ScreenToGif](https://www.screentogif.com/) - 直接生成 GIF
- [Kap](https://getkap.co/) - macOS 专用

### 录制步骤

1. **打开浏览器** - 访问演示地址
2. **输入 PR URL** - 使用默认或自定义
3. **点击审查** - 展示审查过程
4. **查看结果** - 滚动查看完整报告
5. **展开 Prompt** - 展示透明度

### GIF 优化

```bash
# 使用 gifsicle 压缩 GIF
gifsicle -O3 --colors 256 demo.gif -o demo-optimized.gif
```

---

## API 演示

### 使用 curl 调用

```bash
curl -X POST https://code-review-agent-delta.vercel.app/review \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/upworldcjw/JWKeyWordFilter/pull/1"
  }'
```

### 使用自定义 Token

```bash
curl -X POST https://code-review-agent-delta.vercel.app/review \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/your-org/private-repo/pull/1",
    "githubToken": "ghp_xxxxxxxxxxxx"
  }'
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "prUrl": "https://github.com/upworldcjw/JWKeyWordFilter/pull/1",
    "prInfo": {
      "title": "Initial commit",
      "user": "upworldcjw",
      "state": "open",
      "additions": 150,
      "deletions": 0,
      "changed_files": 5
    },
    "report": "# 代码审查报告\n\n## 概述\n...",
    "timestamp": "2026-02-08T08:46:00.146Z"
  }
}
```

---

## 常见问题

### Q: 为什么需要 GitHub Token？

**A**: 
- 公开仓库可以不填（使用服务端默认 Token）
- 私有仓库必须填写
- 自定义 Token 可以避免速率限制

### Q: Token 会被保存吗？

**A**: 
- ❌ 不会！Token 仅在请求时使用
- 不存储到数据库或本地存储
- 每次审查都需要重新输入

### Q: 支持哪些 PR？

**A**:
- ✅ 公开仓库 PR
- ✅ 私有仓库 PR（需提供 Token）
- ✅ Fork 的 PR
- ✅ 任何状态的 PR (open/closed/merged)

### Q: 审查需要多久？

**A**:
- 小型 PR (< 10 文件): 10-30 秒
- 中型 PR (10-50 文件): 30-90 秒
- 大型 PR (> 50 文件): 1-3 分钟

---

## 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **后端**: Node.js + Express (Serverless)
- **部署**: Vercel Serverless Functions
- **LLM**: 通义千问 (qwen-plus)
- **API**: GitHub REST API v3
- **Markdown**: marked.js

---

## 下一步

1. ⭐ [Star 本项目](https://github.com/upworldcjw/code-review-agent)
2. 🍴 Fork 并自定义审查规则
3. 🚀 一键部署到你的 Vercel 账号
4. 📖 查看[部署文档](../DEPLOYMENT.md)了解更多
