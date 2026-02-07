require('dotenv').config();
const GitHubService = require('../src/services/github');
const LLMService = require('../src/services/llm');

/**
 * Vercel Serverless Function Handler
 */
module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 健康检查
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // 代码审查接口
  if (req.method === 'POST') {
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
    return res.status(200).json({
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
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
  }

  // 404 处理
  return res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
  });
};
