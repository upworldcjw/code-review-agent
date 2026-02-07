const { Octokit } = require('@octokit/rest');

/**
 * GitHub API 服务
 */
class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * 解析 PR URL
   * @param {string} prUrl - PR URL (例如: https://github.com/owner/repo/pull/123)
   * @returns {Object} - { owner, repo, pull_number }
   */
  parsePRUrl(prUrl) {
    const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) {
      throw new Error(`Invalid PR URL: ${prUrl}`);
    }
    return {
      owner: match[1],
      repo: match[2],
      pull_number: parseInt(match[3], 10),
    };
  }

  /**
   * 获取 PR 的文件列表和变更信息
   * @param {string} prUrl - PR URL
   * @returns {Object} - { files, prInfo }
   */
  async getPRFiles(prUrl) {
    const { owner, repo, pull_number } = this.parsePRUrl(prUrl);

    // 获取 PR 基本信息
    const { data: prInfo } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number,
    });

    // 获取 PR 文件列表
    const { data: files } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number,
    });

    return {
      prInfo: {
        title: prInfo.title,
        body: prInfo.body,
        user: prInfo.user.login,
        created_at: prInfo.created_at,
        updated_at: prInfo.updated_at,
        state: prInfo.state,
        additions: prInfo.additions,
        deletions: prInfo.deletions,
        changed_files: prInfo.changed_files,
      },
      files: files.map(file => ({
        filename: file.filename,
        status: file.status, // added, removed, modified, renamed
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch, // unified diff
        previous_filename: file.previous_filename,
      })),
    };
  }

  /**
   * 获取 PR 的完整 diff
   * @param {string} prUrl - PR URL
   * @returns {string} - 完整的 diff 文本
   */
  async getPRDiff(prUrl) {
    const { owner, repo, pull_number } = this.parsePRUrl(prUrl);

    // 获取 PR 的 diff 格式
    const { data: diff } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number,
      mediaType: {
        format: 'diff',
      },
    });

    return diff;
  }
}

module.exports = GitHubService;
