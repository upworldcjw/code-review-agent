#!/usr/bin/env node

require('dotenv').config();
const { Command } = require('commander');
const fs = require('fs');
const GitHubService = require('./services/github');
const LLMService = require('./services/llm');

const program = new Command();

program
  .name('code-review-agent')
  .description('GitHub PR 代码审查工具')
  .version('1.0.0');

program
  .command('review')
  .description('审查指定的 GitHub PR')
  .argument('<pr-url>', 'PR URL (例如: https://github.com/owner/repo/pull/123)')
  .option('-o, --out <file>', '输出文件路径', 'report.md')
  .option('--json', '同时输出 JSON 格式到 stdout')
  .action(async (prUrl, options) => {
    try {
      console.log('🔍 开始审查 PR:', prUrl);

      // 初始化服务
      const githubToken = process.env.GITHUB_TOKEN;
      const openaiApiKey = process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        console.error('❌ 错误: 未设置 OPENAI_API_KEY 环境变量');
        process.exit(1);
      }

      const githubService = new GitHubService(githubToken);
      const llmService = new LLMService(openaiApiKey, process.env.OPENAI_BASE_URL);

      // 获取 PR 信息
      console.log('📥 正在获取 PR 信息...');
      const { prInfo, files } = await githubService.getPRFiles(prUrl);
      
      console.log(`✅ 获取成功: ${files.length} 个文件变更`);
      console.log(`   - 标题: ${prInfo.title}`);
      console.log(`   - 作者: ${prInfo.user}`);
      console.log(`   - 变更: +${prInfo.additions} -${prInfo.deletions}`);

      // 调用 LLM 进行审查
      console.log('\n🤖 正在调用 LLM 进行代码审查...');
      const report = await llmService.reviewCode(prInfo, files);
      
      console.log('✅ 审查完成!');

      // 写入 Markdown 文件
      fs.writeFileSync(options.out, report, 'utf8');
      console.log(`\n📝 报告已保存到: ${options.out}`);

      // 输出 JSON（如果指定）
      if (options.json) {
        const jsonReport = {
          prUrl,
          prInfo,
          files: files.map(f => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
          })),
          report,
          timestamp: new Date().toISOString(),
        };
        console.log('\n📊 JSON 报告:');
        console.log(JSON.stringify(jsonReport, null, 2));
      }

      console.log('\n✨ 审查完成!');
    } catch (error) {
      console.error('\n❌ 审查失败:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();
