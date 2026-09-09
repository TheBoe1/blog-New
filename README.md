# 我的博客（my-blog）

个人博客前端：前台 + 管理端一体。

- **线上**：https://lianlab.top（管理端 `/admin`）
- **后端**：carbon（Spring Boot，独立仓库，dev 经 Vite 代理到 `localhost:9090`）

## 技术栈

Vue 3 (Composition API) + TypeScript + Vite 4 + UnoCSS + Element Plus + Pinia + Vue Router 4

## 快速开始

```bash
npm install
npm run dev          # http://localhost:5175
npm run build        # 生产构建
npx vue-tsc --noEmit # 类型检查（构建未串联，需手动跑）
```

环境变量：`.env`（gitignored）配置 `VITE_API_BASE_URL`；未设置时走相对路径，由 Vite proxy 兜底。

## 部署

push `main` 自动部署（GitHub Actions：build → OSS + CDN → ECS nginx → CDN 刷新）。详见 [docs/deploy.md](docs/deploy.md)。

## 文档导航

| 文档 | 内容 |
|---|---|
| [AGENTS.md](AGENTS.md) | AI 协作规则（签名块、Design System 治理、硬性约定） |
| [docs/design.md](docs/design.md) | Design System（三层 token、Theme、Governance） |
| [docs/product.md](docs/product.md) | 产品定位、品牌与设计原则 |
| [docs/deploy.md](docs/deploy.md) | 部署指南（OSS + CDN + ECS） |
| [docs/](docs/) | 开发文档（API 手册、401 排查、dark-mode、移动端适配、编辑进度保护） |
| [adr/](adr/) | 架构决策记录（ADR-001/002/003） |
