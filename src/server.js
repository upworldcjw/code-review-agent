require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const GitHubService = require('./services/github');
const LLMService = require('./services/llm');

const app = express();
const PORT = process.env.PORT || 8787;

// 中间件
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public'))); // 静态文件服务

/**
 * 健康检查接口
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * 代码审查接口
 * POST /review
 * Body: { "url": "https://github.com/owner/repo/pull/123" }
 */
app.post('/review', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'Missing required field: url',
        message: 'Please provide a PR URL in the request body',
      });
    }

    // 验证环境变量
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'OPENAI_API_KEY is not configured',
      });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    
    console.log(`[${new Date().toISOString()}] 收到审查请求: ${url}`);

    // 初始化服务
    const githubService = new GitHubService(githubToken);
    const llmService = new LLMService(openaiApiKey, process.env.OPENAI_BASE_URL);

    // 获取 PR 信息
    console.log('正在获取 PR 信息...');
    const { prInfo, files } = await githubService.getPRFiles(url);
    
    console.log(`获取成功: ${files.length} 个文件变更`);

    // 调用 LLM 进行审查
    console.log('正在调用 LLM 进行代码审查...');
    const report = await llmService.reviewCode(prInfo, files);
    
    console.log('审查完成!');

    // 返回结果
    res.json({
      success: true,
      data: {
        prUrl: url,
        prInfo: {
          title: prInfo.title,
          user: prInfo.user,
          state: prInfo.state,
          additions: prInfo.additions,
          deletions: prInfo.deletions,
          changed_files: prInfo.changed_files,
        },
        report,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('审查失败:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * 404 处理
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

/**
 * 错误处理中间件
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Code Review Agent Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Review API: POST http://localhost:${PORT}/review`);
  console.log('\n环境变量检查:');
  console.log(`   - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`   - GITHUB_TOKEN: ${process.env.GITHUB_TOKEN ? '✅ 已配置' : '⚠️ 未配置（公开仓库可选）'}`);
});

module.exports = app;
