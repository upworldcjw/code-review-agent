// DOM 元素
const prUrlInput = document.getElementById('prUrl');
const reviewBtn = document.getElementById('reviewBtn');
const parsedInfo = document.getElementById('parsedInfo');
const reportSection = document.getElementById('reportSection');
const errorSection = document.getElementById('errorSection');
const togglePromptBtn = document.getElementById('togglePrompt');
const promptPreview = document.getElementById('promptPreview');

// 按钮状态
let isReviewing = false;

// 绑定事件
reviewBtn.addEventListener('click', handleReview);
togglePromptBtn.addEventListener('click', togglePrompt);

// 支持回车键提交
prUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !isReviewing) {
    handleReview();
  }
});

/**
 * 处理审查请求
 */
async function handleReview() {
  const prUrl = prUrlInput.value.trim();
  
  if (!prUrl) {
    showError('请输入 PR URL');
    return;
  }

  // 验证 URL 格式
  if (!prUrl.match(/github\.com\/[^/]+\/[^/]+\/pull\/\d+/)) {
    showError('无效的 PR URL 格式。正确格式: https://github.com/owner/repo/pull/123');
    return;
  }

  // 隐藏之前的结果
  hideAllSections();
  setReviewingState(true);

  try {
    // 调用后端 API
    const response = await fetch('/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: prUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || '审查失败');
    }

    // 显示识别信息
    displayParsedInfo(data.data);
    
    // 显示审查报告
    displayReport(data.data.report);

  } catch (error) {
    console.error('审查失败:', error);
    showError(`审查失败: ${error.message}`);
  } finally {
    setReviewingState(false);
  }
}

/**
 * 显示 PR 识别信息
 */
function displayParsedInfo(data) {
  const { prInfo, prUrl, report } = data;

  // 更新 PR 基本信息
  document.getElementById('prTitle').textContent = prInfo.title || '(无标题)';
  document.getElementById('prAuthor').textContent = prInfo.user || '-';
  document.getElementById('prState').textContent = prInfo.state || '-';
  document.getElementById('prFiles').textContent = prInfo.changed_files || '0';
  document.getElementById('prAdditions').textContent = `+${prInfo.additions || 0}`;
  document.getElementById('prDeletions').textContent = `-${prInfo.deletions || 0}`;

  // 显示文件列表（需要重新获取，这里暂时不显示详细文件）
  const filesList = document.getElementById('filesList');
  filesList.innerHTML = `
    <div class="files-summary">
      <p>共 ${prInfo.changed_files} 个文件变更</p>
      <p>新增 ${prInfo.additions} 行，删除 ${prInfo.deletions} 行</p>
    </div>
  `;

  // 构建 Prompt 预览（模拟后端生成的 prompt）
  const promptText = buildPromptPreview(prInfo, prUrl);
  promptPreview.textContent = promptText;

  // 显示识别信息区域
  parsedInfo.style.display = 'block';
}

/**
 * 构建 Prompt 预览
 */
function buildPromptPreview(prInfo, prUrl) {
  return `你是一位资深的代码审查专家。请对以下 Pull Request 进行全面的代码审查。

## PR 信息
- **标题**: ${prInfo.title || '(无标题)'}
- **描述**: ${prInfo.body || '(无描述)'}
- **作者**: ${prInfo.user}
- **创建时间**: ${prInfo.created_at || '-'}
- **状态**: ${prInfo.state}
- **变更统计**: +${prInfo.additions} -${prInfo.deletions} (${prInfo.changed_files} 个文件)

## 文件变更详情
[此处包含所有文件的 diff 内容，已省略...]

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
...`;
}

/**
 * 显示审查报告
 */
function displayReport(reportMarkdown) {
  const reportContent = document.getElementById('reportContent');
  
  // 使用 marked.js 渲染 Markdown
  reportContent.innerHTML = marked.parse(reportMarkdown);
  
  // 显示报告区域
  reportSection.style.display = 'block';
  
  // 滚动到报告区域
  reportSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * 显示错误信息
 */
function showError(message) {
  const errorContent = document.getElementById('errorContent');
  errorContent.textContent = message;
  errorSection.style.display = 'block';
}

/**
 * 隐藏所有结果区域
 */
function hideAllSections() {
  parsedInfo.style.display = 'none';
  reportSection.style.display = 'none';
  errorSection.style.display = 'none';
}

/**
 * 设置审查状态
 */
function setReviewingState(reviewing) {
  isReviewing = reviewing;
  reviewBtn.disabled = reviewing;
  
  const btnText = reviewBtn.querySelector('.btn-text');
  const btnLoading = reviewBtn.querySelector('.btn-loading');
  
  if (reviewing) {
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    reviewBtn.classList.add('loading');
  } else {
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    reviewBtn.classList.remove('loading');
  }
}

/**
 * 切换 Prompt 预览显示
 */
function togglePrompt() {
  if (promptPreview.style.display === 'none') {
    promptPreview.style.display = 'block';
    promptPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    promptPreview.style.display = 'none';
  }
}
