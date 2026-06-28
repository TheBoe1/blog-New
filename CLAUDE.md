# CLAUDE.md

> 本文件是 `AGENTS.md` 的镜像。编辑请修改 `AGENTS.md`，然后运行 `cat AGENTS.md | sed "1s/AGENTS.md/CLAUDE.md/" > CLAUDE.md` 同步。
> 给 AI Coding Agent 的项目指令。地图而非手册——核心信息在此，细节看链接。

## 0. 工作流（自动触发，无需用户手动指定）

**任何任务——包括"改一行样式""删一个属性"——AI 都必须先输出签名块再动手。签名块是唯一证明你读了 AGENTS.md 的证据。没有签名 = 你没有读 = 你会犯错。**

### 签名块（强制，所有任务必须输出）

```
┌──────────────────────────────────────────┐
│ 🔖 引用清单                              │
│                                          │
│ 已读取知识库:                            │
│   ✅ project-map.json                    │
│   ✅ component-index.json               │
│   ✅ architecture.json                  │
│   ✅ patterns.json                       │
│                                          │
│ 本任务引用:                              │
│   Pattern:  [Card-001 / 无 / ...]       │
│   Component: [ThemeToggle / BackToTop / .]│
│   Layer:    [components → stores / ...] │
│                                          │
│ 禁止项:                                  │
│   ❌ 新颜色:      无                    │
│   ❌ 组件调 api:  无                    │
│   ❌ 跨层 import: 无                    │
│                                          │
│ 任务等级: 🔴重 🟡中 🟢轻               │
└──────────────────────────────────────────┘
```

### 分级执行（按任务等级决定后续步骤）

| 等级 | 判定标准 | 签名 | 审查 | 记忆 | 验证 |
|------|---------|:--:|:--:|:--:|:--:|
| 🟢 轻 | 改样式/CSS/文案，不新增文件，不动逻辑 | ✅ | ❌ 跳过 | ❌ 跳过 | ❌ 跳过 |
| 🟡 中 | 修改逻辑，或新增 ≤2 个文件 | ✅ | ✅ 口头自检 | ❌ 跳过 | ✅ build |
| 🔴 重 | 新增 Store/路由/组件，或修改 ≥3 个文件 | ✅ | ✅ deviation-report | ✅ 写入 memory | ✅ build |

> 你的任务等级由你自己在签名块中判定。误判为轻导致 bug = 下次此任务类型升级一档。

### 用户自检

```bash
ls -lt .ai/memory/ .ai/knowledge/ | head -5   # 最近产出时间戳
```

> 如果 AI 的回复中**没有签名块**，说"你漏了引用清单"。
> 与 `CLAUDE.md` 内容等价，已通过软链/同步保持一致。

## 1. 项目概述

个人博客系统，**前后端分离单仓**：本仓为前端（Vue 3 + TS + Vite），后端为独立 Go 服务（不在本仓中，dev 阶段通过 Vite 代理访问 `http://localhost:9090`）。

- **前端技术栈**：Vue 3.3 (Composition API) + TypeScript 5.2 + Vite 4.5
- **UI**：Element Plus 2.4 + UnoCSS 0.57 + SCSS
- **状态**：Pinia 2.1 + `pinia-plugin-persistedstate`
- **路由**：Vue Router 4 (history mode, 路由级代码分割)
- **HTTP**：Axios，统一封装在 `src/api/request.ts`
- **编辑器**：WangEditor（后台文章编辑）、md-editor-v3（前台 Markdown 渲染）
- **图标**：`@iconify/json`，ep / carbon / mdi 三个集合，`<IconEpName />` 语法
- **主色**：primary `#667eea` / secondary `#764ba2`（见 `uno.config.ts`）

## 2. 快速命令

```bash
npm run dev      # 启动 dev server，端口 5175，代理 /api 等 → localhost:9090
npm run build    # 生产构建（vite build）
npm run preview  # 预览生产构建
npm run lint     # ESLint --fix（.vue/.js/.ts/.tsx 等）
```

- **无测试框架**：项目未配置测试脚本，无测试文件。
- **类型检查**：`npx vue-tsc --noEmit`（构建未串联 type-check，需手动跑）。
- **环境变量**：`.env`（gitignored）配置 `VITE_API_BASE_URL`；未设置时走相对路径，由 Vite proxy 兜底。
- **生产 base**：`https://oss.lianlab.top/main`（见 `vite.config.ts:12`，构建时静态资源前缀）。
- **部署**：见 `DEPLOY.md` 与 `deploy.sh` / `deploy.bat` / `deploy_oss.py`。

## 3. 仓库结构

```
我的博客/
├── index.html
├── vite.config.ts          # 端口 5175、proxy、别名 @→src、生产 base
├── uno.config.ts           # UnoCSS shortcuts / theme / safelist
├── tsconfig.json
├── package.json
├── DEPLOY.md               # 部署指南
├── DESIGN.md / PRODUCT.md  # 设计与产品文档
├── docs/
│   ├── API开发手册.md            # 后端接口约定（响应格式、错误码、端点）
│   └── 管理端接口401错误修复指南.md # 401 鉴权排查手册
├── deploy.sh / deploy.bat / deploy_oss.py
└── src/
    ├── api/                # request.ts 封装 axios；article/auth/stats/pageConfig
    ├── components/         # 全局组件（unplugin-vue-components 自动导入）
    ├── composables/        # useEntranceAnim / usePageConfig
    ├── data/               # 静态数据 (projects.ts)
    ├── directives/         # 自定义指令
    ├── layouts/            # FrontLayout.vue / AdminLayout.vue
    ├── router/index.ts     # 路由 + beforeEach 鉴权守卫
    ├── stores/             # Pinia: user / blog / pageConfig / loading
    ├── styles/             # variables.scss / index.scss
    ├── types/              # TS 接口（index.ts）
    ├── utils/              # markdown.ts / highlight.ts
    ├── views/              # 前台页面 + admin/ 后台页面
    ├── auto-imports.d.ts   # 自动生成，勿手改
    ├── components.d.ts     # 自动生成，勿手改
    └── main.ts
```

**别名**：`@` → `src/`（`vite.config.ts` + `tsconfig.json`）。

## 4. 前端架构

### 路由分层（`src/router/index.ts`）

- `/` → **FrontLayout**：Home / Articles / ArticleDetail / Category / About / Projects / ProjectDetail
- `/admin` → **AdminLayout**（`meta.requiresAuth: true`）：Dashboard / ArticleList / ArticleEditor / CategoryList / TagList / Settings / PageConfigEditor
- `/login`、`/unauthorized`、`/:pathMatch(.*)*`（NotFound）独立路由

鉴权守卫：`router.beforeEach` 检查 `meta.requiresAuth` + `useUserStore().isLoggedIn`；`/login` 已登录且为 admin 时跳 `/admin`。

### API 层（`src/api/request.ts`）

- Axios 单例，`baseURL = import.meta.env.VITE_API_BASE_URL || ''`，`timeout: 30000`
- **请求拦截器**：附加 `Authorization: Bearer <token>`、显示全局 loading
- **响应拦截器**统一处理：
  - `code === 401` → 调 `handleTokenExpired`：非白名单 URL 触发 `userStore.logout()` + 跳 `/login`
  - `code === 403` → 跳 `/unauthorized`
  - `code === 0 || 200` → 返回 `data.data`，或 `{ rows, total }`（分页）
  - 其他 → `ElMessage.error(msg)` 并 reject
- **白名单**（不触发 401 跳转）：`/login`、`/logout`、`/register`、`/captchaImage`、`/api/articles`、`/api/categories`、`/api/tags`、`/api/settings`、`/api/stats/visit`、`/api/page-config`
- 导出 `request.get/post/put/delete/upload<T>`，**所有调用必须带显式泛型**
- 后端响应约定：`{ code: 0|200, data?, rows?, total?, msg? }` —— 详见 `docs/API开发手册.md`

### 状态管理（`src/stores/`）

- `useUserStore`：token（persisted）、userInfo、`login` / `logout` / `fetchUserInfo` / `isAdmin`
- `useBlogStore`：文章 / 分类 / 标签缓存
- `usePageConfigStore`：动态页面配置
- `useLoadingStore`：全局 loading overlay

### 自动导入（`vite.config.ts`）

- `unplugin-auto-import`：vue / vue-router / pinia / @vueuse/core API 自动导入
- `unplugin-vue-components`：Element Plus 组件 + `src/components/` 下组件自动导入
- `unplugin-icons`：`<IconEpName />` / `<IconCarbonName />` / `<IconMdiName />`
- 生成物 `src/auto-imports.d.ts`、`src/components.d.ts` **自动生成，勿手改**

## 5. 关键约定（硬性规则）

违反会直接导致 bug，写代码前必须遵守：

1. **组件一律 `<script setup lang="ts">`**，禁止 Options API。
2. **API 调用必须走 `src/api/request.ts`**，禁止在组件里直接 `axios.get(...)`；调用必须带显式泛型 `request.get<User>(...)`。
3. **鉴权由拦截器统一处理**，组件内不要手动判断 401/403 或自己跳登录页。
4. **管理端路由必须 `meta.requiresAuth: true`**；新增 admin 路由时勿忘。
5. **类型定义放 `src/types/`**，使用 `interface`（对象）+ `type`（联合/别名）；导入用 `import type { ... }`。
6. **命名**：组件 PascalCase（`ArticleDetail.vue`）；store `useXxxStore`；API 模块 `xxxApi.method()`；CSS 类 kebab-case；路由 name PascalCase。
7. **样式**：优先用 UnoCSS shortcuts（`flex-center` / `flex-between` / `card-base` / `btn-primary` / `input-base`）；组件内样式 `<style scoped lang="scss">`；穿透 Element Plus 用 `:deep()`。
8. **`auto-imports.d.ts` 与 `components.d.ts` 不要手改**——改了也会被覆盖。
9. **生产 base 已硬编码为 OSS 域名**（`vite.config.ts:12`），改 base 走配置而非代码拼接。
10. **后端响应格式假设**：`code === 0 || 200` 才算成功；分页用 `rows + total`；不要在组件里重新实现这套判断。

## 6. 本地开发与验证流程

闭环：**改 → lint → dev 启动 → 浏览器验证 → （涉及接口时）curl 验证后端**。

### 启动

```bash
npm install        # 首次
npm run dev        # http://localhost:5175
```

前置依赖：**后端 Go 服务必须在 `localhost:9090` 运行**，否则所有 `/api/*` 请求 502/网络错误。后端不在本仓，需独立启动。

### 验证清单

- **页面渲染**：访问 `/`、`/articles`、`/article/:id`、`/admin`（需登录）
- **接口联通**：devtools Network 看 `/api/articles` 等 200 返回
- **登录闭环**：`/login` → 输入凭证 → 跳 `/admin`；token 持久化刷新页面仍在
- **401 行为**：手动清 localStorage token → 访问 `/admin` → 应跳 `/login`
- **类型检查**：`npx vue-tsc --noEmit` 0 error
- **lint**：`npm run lint` 无 error

### curl 验证模板（每条独立执行，用临时文件传数据）

```bash
# 1. 登录，结果写文件
curl -s -X POST http://localhost:9090/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"xxx"}' > /tmp/login.json

# 2. 提取 token
python -c "import json;print(json.load(open('/tmp/login.json'))['data']['token'])" > /tmp/token.txt

# 3. 调管理端接口
TOKEN=$(cat /tmp/token.txt)
curl -s http://localhost:9090/api/admin/articles \
  -H "Authorization: Bearer $TOKEN" > /tmp/articles.json
```

> 后端接口字段、错误码、端点清单详见 `docs/API开发手册.md`；401 排查见 `docs/管理端接口401错误修复指南.md`。

## 7. 质量检查

| 检查项 | 命令 | 说明 |
|---|---|---|
| Lint | `npm run lint` | ESLint --fix |
| 类型 | `npx vue-tsc --noEmit` | 全量类型检查 |
| 构建 | `npm run build` | 生产构建（不会跑 type-check，需手动） |

> 项目无自动化分层依赖检查、无测试。新增跨层依赖（如组件直接调 axios 绕过 request.ts）依赖 review 把关。

## 8. 参考项目约定

本仓为纯前端，**后端 Go 服务不在本仓**。需要后端上下文时：

- 接口契约：`docs/API开发手册.md`
- 鉴权细节：`docs/管理端接口401错误修复指南.md`
- 路由/字段以实际后端响应为准；如发现文档与实际不符，以代码运行为准并回头修订文档

## 9. 文档导航

| 文档 | 用途 |
|---|---|
| `CLAUDE.md` | Claude Code 入口（本文件镜像，`cat AGENTS.md \| sed "1s/AGENTS.md/CLAUDE.md/" > CLAUDE.md` 同步） |
| `PRODUCT.md` | 产品需求与功能说明：目标用户、品牌定位、设计原则 |
| `DESIGN.md` | UI/UX 设计系统：颜色调色板、字体层级、组件规范、Do/Don't |
| `DEPLOY.md` | 部署流程与安全最佳实践 |
| `docs/API开发手册.md` | 后端接口契约（响应格式、错误码、端点） |
| `docs/管理端接口401错误修复指南.md` | 401 鉴权排查手册 |
| `.ai/capabilities/` | AI 开发流水线（8 个能力定义，按编号执行） |
| `.ai/skills/index.md` | 社区 Skill/MCP/工具索引（15+ 已验证仓库） |
| `.ai/workflow/` | 常见工作流模板（feature/bug-fix/refactor/ui-replication） |
| `.ai/knowledge/` | 结构化项目知识（project-map / component-index / architecture） |
| `.ai/memory/` | 持久记忆（patterns / decisions / exceptions） |
| `.claude/skills/` | 集成的 UI/UX 设计技能（ui-ux-pro-max / design / design-system / ui-styling） |

---

## 维护原则

- **地图而非手册**：~200 行以内，细节放链接文档，避免上下文膨胀稀释关键规则。
- **Bad case 驱动**：AI 每犯一次错，判断是否补一条规则到此或子文档。
- **改这里 vs 改 docs/**：违反会写出错误代码 → 改本文；只是写得不够好 → 改 docs/。
- **同步**：本文与 `CLAUDE.md` 保持内容等价，改一处同步另一处（或用软链 `ln -s AGENTS.md CLAUDE.md`）。
