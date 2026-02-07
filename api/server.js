require('dotenv').config();
const GitHubService = require('../src/services/github');
const LLMService = require('../src/services/llm');

/**
 * 解析请求体（处理 Vercel 环境）
 */
async function parseBody(req) {
  // Vercel 可能已经解析了 body
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  // 如果没有，手动解析
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Vercel Serverless Function Handler
 */
module.exports = async (req, res) => {
  try {
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
      // 解析请求体
      const body = await parseBody(req);
      const { url } = body;

      if (!url) {
        return res.status(400).json({
          error: 'Missing required field: url',
          message: 'Please provide a PR URL in the request body',
        });
      }

      // 验证环境变量
      const openaiApiKey = process.env.OPENAI_API_KEY;
      const openaiBaseUrl = process.env.OPENAI_BASE_URL;
      const githubToken = process.env.GITHUB_TOKEN;
      
      console.log(`[${new Date().toISOString()}] 收到审查请求: ${url}`);
      console.log('环境变量检查:');
      console.log(`  OPENAI_API_KEY: ${openaiApiKey ? '✅ 已配置' : '❌ 未配置'}`);
      console.log(`  OPENAI_BASE_URL: ${openaiBaseUrl || '未设置（使用默认）'}`);
      console.log(`  GITHUB_TOKEN: ${githubToken ? '✅ 已配置' : '⚠️ 未配置'}`);
      
      if (!openaiApiKey) {
        return res.status(500).json({
          error: 'Configuration error',
          message: 'OPENAI_API_KEY is not configured',
        });
      }

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
    }

    // 404 处理
    return res.status(404).json({
      error: 'Not found',
      message: 'The requested endpoint does not exist',
    });
  } catch (error) {
    console.error('Serverless Function Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify({
      message: error.message,
      name: error.name,
      code: error.code,
    }));
    
    return res.status(500).json({
      success: false,
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
};
