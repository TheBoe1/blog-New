# 部署指南（OSS + CDN + ECS）

> 2026-09-04 更新：部署已完全自动化（GitHub Actions）。早期本地脚本方案（`deploy_oss.py` + `.env.oss`）已废弃。

## 部署链路

push `main` 触发 GitHub Actions（`.github/workflows/deploy.yml`）：

1. `npm ci` + `npm run build`（构建时注入 `VITE_API_BASE_URL=https://api.lianlab.top`）
2. js/css/svg 预压缩 gzip（上传带 `Content-Encoding:gzip`，体积约 1/3）
3. 上传 OSS `oss://theboe/main`（CDN 域 `https://oss.lianlab.top/main`，静态资源长缓存 `max-age=31536000,immutable`）
4. `index.html` 单独上传（`no-cache,max-age=0`）+ scp 到 ECS nginx `/root/nginx/html/main/index.html`
5. 刷新阿里云 CDN（`scripts/cdn_refresh.py`，覆盖 `/`、`/index.html`、`/admin`、`/login` 等独立缓存 key）

## 密钥与配置（GitHub Secrets）

| Secret | 用途 |
|---|---|
| `OSS_KEY_ID` / `OSS_KEY_SECRET` | OSS 上传 + CDN 刷新（RAM 子账号，仅 OSS/CDN 权限，建议 3-6 个月轮换） |
| `SSH_PRIVATE_KEY` / `SSH_HOST` / `SSH_USER` | scp index.html 到 ECS |

## 回滚 / 排查

- **回滚**：`git revert` 后重新 push 触发部署即可。
- **404 / 白屏**：`/`、`/index.html`、`/admin` 等 SPA 路由在 CDN 是独立缓存 key，逐个确认 OSS 文件存在 + CDN 缓存已刷新。
- **CDN 刷新失败**：检查 `scripts/cdn_refresh.py` 返回的 `RefreshTaskId`。
- **静态资源缓存不更新**：资源文件名带 hash，旧缓存最多存在到下一版构建。
