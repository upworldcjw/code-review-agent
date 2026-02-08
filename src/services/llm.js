/**
 * LLM 代码审查服务
 */
class LLMService {
  constructor(apiKey, baseURL = null) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.client = null;
  }

  /**
   * 初始化 OpenAI 客户端（动态导入）
   */
  async initialize() {
    if (!this.client) {
      const OpenAI = (await import('openai')).default;
      const config = { apiKey: this.apiKey };
      if (this.baseURL) {
        config.baseURL = this.baseURL;
      }
      this.client = new OpenAI(config);
    }
  }

  /**
   * 生成代码审查提示词
   * @param {Object} prInfo - PR 基本信息
   * @param {Array} files - 文件变更列表
   * @returns {string} - 审查提示词
   */
  buildReviewPrompt(prInfo, files) {
    const filesInfo = files.map(file => {
      return `
### 文件: ${file.filename}
**状态**: ${file.status}
**变更**: +${file.additions} -${file.deletions}

\`\`\`diff
${file.patch || '(无 patch 信息)'}
\`\`\`
`;
    }).join('\n');

    return `你是一位资深的代码审查专家。请对以下 Pull Request 进行全面的代码审查。

## PR 信息
- **标题**: ${prInfo.title}
- **描述**: ${prInfo.body || '(无描述)'}
- **作者**: ${prInfo.user}
- **创建时间**: ${prInfo.created_at}
- **状态**: ${prInfo.state}
- **变更统计**: +${prInfo.additions} -${prInfo.deletions} (${prInfo.changed_files} 个文件)

## 文件变更详情
${filesInfo}

## 审查要求
请从以下几个维度对代码进行审查，并以 Markdown 格式输出报告：

1. **代码质量**
   - 代码是否遵循最佳实践
   - 是否有代码重复或冗余
   - 命名是否清晰、一致
   - 代码可读性和可维护性

2. **潜在问题**
   - 可能的 bug 或逻辑错误
   - 性能问题
   - 安全隐患
   - 内存泄漏或资源管理问题

3. **架构设计**
   - 代码结构是否合理
   - 是否符合设计模式
   - 模块化和解耦是否合理

4. **测试覆盖**
   - 是否需要添加测试
   - 现有测试是否充分

5. **文档和注释**
   - 是否需要添加或更新文档
   - 注释是否清晰、必要

## 输出格式
请以以下 Markdown 格式输出审查报告：

# 代码审查报告

## 概述
[简要总结本次 PR 的主要变更和整体评价]

## 详细审查

### ✅ 优点
[列举代码的优点和亮点]

### ⚠️ 需要改进的地方
[按文件列出具体的改进建议]

### 🐛 潜在问题
[列出发现的潜在 bug 或问题]

### 💡 建议
[提供优化建议和最佳实践建议]

## 总结
[总结审查结果，给出是否建议合并的意见]
`;
  }

  /**
   * 调用 LLM 生成代码审查报告
   * @param {Object} prInfo - PR 基本信息
   * @param {Array} files - 文件变更列表
   * @returns {string} - Markdown 格式的审查报告
   */
  async reviewCode(prInfo, files) {
    await this.initialize();
    const prompt = this.buildReviewPrompt(prInfo, files);

    try {
      const completion = await this.client.chat.completions.create({
        model: 'qwen-plus', // 通义千问模型
        messages: [
          {
            role: 'system',
            content: '你是一位资深的代码审查专家，擅长发现代码中的问题并提供建设性的改进建议。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // 降低温度，使输出更确定性
        max_tokens: 4096,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('LLM API 调用失败:', error);
      throw new Error(`代码审查失败: ${error.message}`);
    }
  }
}

module.exports = LLMService;
