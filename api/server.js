require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const GitHubService = require('../src/services/github');
const LLMService = require('../src/services/llm');

const app = express();

// 中间件
app.use(bodyParser.json());

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
    message: 'The requested endpoint does not exist',
  });
});

// 导出 Express app 而不是启动服务器
module.exports = app;
