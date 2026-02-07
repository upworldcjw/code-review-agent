# Code Review Agent (GitHub PR)

一个用于 **GitHub Pull Request** 的代码审查 Agent：输入 PR 链接，自动拉取变更文件与 patch/diff，调用 LLM 生成审查报告（Markdown）。

## 功能

- CLI：`review <prUrl>` 生成 `report.md`
- HTTP：`POST /review` 传 PR 链接，返回 Markdown 报告
- GitHub API：使用 `GITHUB_TOKEN` 拉取 PR files/patch
- LLM：默认 OpenAI（使用 `OPENAI_API_KEY`）

## PR 链接格式

- `https://github.com/<owner>/<repo>/pull/<number>`

> 你给的 `https://github.com/upworldcjw` 是个人主页，不是 PR 链接；需要具体 PR 链接才能审查。

## 环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

- `OPENAI_API_KEY`：必需
- `GITHUB_TOKEN`：建议（私有仓库必需；公开仓库也建议配置，避免限流）
- `PORT`：HTTP服务端口，默认 `8787`

## CLI 使用

```bash
npm i
npm run build
node dist/cli.js review https://github.com/\{owner\}/\{repo\}/pull/\{number\} --out report.md
```

常用参数：
- `--out <file>` 输出文件（默认 `report.md`）
- `--json` 同时输出JSON到stdout（便于接入流水线）

## HTTP 使用

```bash
npm i
npm run build
node dist/server.js
# 默认 http://localhost:8787

curl -s -X POST http://localhost:8787/review \
  -H 'content-type: application/json' \
  -d '{"url":"https://github.com/{owner}/{repo}/pull/{number}"}'
```

## Docker

```bash
docker build -t code-review-agent .
docker run --rm -p 8787:8787 \
  -e OPENAI_API_KEY=*** \
  -e GITHUB_TOKEN=*** \
  code-review-agent
```


通义千问百炼：
https://bailian.console.aliyun.com/cn-beijing/?tab=model#/model-usage/free-quota
