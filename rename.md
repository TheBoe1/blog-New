# 博客项目目录结构分析与重构方案

> 分析日期:2026-09-04 | 分支:`perf-file` | 基线:`main@09f2996`(与 origin/main 同步)
> 重构原则:**长期上线运行、避免硬编码、组件化**

## 一、项目概况

- 定位:个人博客前端(前台 + 管理端一体)
- 技术栈:Vue 3 + TypeScript + Vite 4 + UnoCSS + Element Plus + Pinia + vue-router
- 仓库:`https://github.com/TheBoe1/blog-New.git`(本地 `D:\Stday\PlanProject\我的博客`)
- 部署链路:push `main` → GitHub Actions(`.github/workflows/deploy.yml`)构建 → js/css/svg 预压缩 gzip → 上传阿里云 OSS `oss://theboe/main`(CDN 域 `https://oss.lianlab.top/main`)→ scp `index.html` 到 ECS nginx `/root/nginx/html/main/` → 刷新 CDN(`scripts/cdn_refresh.py`)
- 后端:carbon 应用(ECS 服务器),本地开发代理 `localhost:9090`

## 二、当前目录结构(2026-09-04 快照)

```
我的博客/
├── .github/workflows/deploy.yml    # OSS + CDN + ECS 自动部署工作流
├── .claude/                         # AI 技能与本地配置(git 跟踪,240 个文件,占仓库 70%)
├── adr/                             # 架构决策记录 ×3(design-foundation / theme / third-party)
├── docs/                            # 开发文档 ×5(API手册 / dark-mode / 移动端适配 / 编辑保护 / 401修复)
├── public/                          # 随构建复制的静态资源(favicon.svg / img/avatar.jpg / maps/china.json)
├── scripts/cdn_refresh.py           # CDN 刷新脚本(被 deploy.yml 调用)
├── src/
│   ├── api/                         # 接口层:article / auth / pageConfig / request / stats / index
│   ├── components/                  # 通用组件 ×11(Navbar / 侧栏×2 / MarkdownEditor / DynamicSection ...)
│   ├── composables/                 # 组合式函数 ×3(articleDraftStorage / useEntranceAnim / usePageConfig)
│   ├── data/                        # 前端内置内容(about.md / projects.ts)
│   ├── directives/                  # 自定义指令(lazyImg / scrollAnimate)
│   ├── layouts/                     # 布局(FrontLayout / AdminLayout)
│   ├── router/index.ts              # 路由:懒加载 + 布局嵌套 + 守卫 + 访问统计(组织良好 ✅)
│   ├── stores/                      # Pinia ×6(blog / user / theme / loading / pageConfig / index)
│   ├── styles/                      # 样式:index.scss(CSS 变量令牌)+ variables.scss(遗留 SCSS 变量)+ adapters/
│   ├── types/                       # TS 类型定义
│   ├── utils/                       # 工具(highlight / markdown)
│   └── views/                       # 页面:前台 ×10 + admin ×9
├── tests/articleDraftStorage.test.ts
├── index.html / package.json / vite.config.ts / uno.config.ts / tsconfig.json
├── AGENTS.md / CLAUDE.md            # AI 协作文档(内容除标题行外完全相同,重复维护 ⚠️)
├── DESIGN.md / PRODUCT.md / DEPLOY.md   # 根目录文档(与 docs/ 职责重叠 ⚠️)
├── LICENSE / README.md              # README 仅 20 字节空壳 ⚠️
└── (本地未跟踪:.env* 系列、carbon_*.sql/yml 备份、ruvector.db、node_modules/、dist/)
```

`src/` 内部分层(api / components / composables / data / directives / layouts / router / stores / styles / types / utils / views)是标准且健康的 Vue 3 结构,**问题集中在根目录杂物、配置硬编码、超大组件三块**。

## 三、本轮清理记录(perf-file 分支,2026-09-04)

### 已从 git 移除(git rm)
| 文件/目录 | 删除理由 |
|---|---|
| `TEST.txt` | 10 字节测试残留 |
| `app.js` | 280 字节早期残留,入口实为 `src/main.ts`,无任何引用 |
| `static/` | 仅剩 logo.png,无任何代码/构建引用;生产只部署 `dist/`,死目录 |
| `Git 本地仓库与远程克隆实战.txt` | 个人学习笔记,与项目无关 |
| `findings.md` / `progress.md` / `task_plan.md` | 6-28 管理端令牌化会话规划文件,该计划已基本执行完(剩浏览器验证与提交,对应工作区 WIP 改动),历史可从 git 找回 |

### 已删除本地可再生缓存(未跟踪,磁盘删除)
`dist/`、`vite.config.ts.timestamp-*.mjs`、`.agents/`(仅剩 pycache)、`.ai/`、`.impeccable/`、`.qoder/`、`.swarm/`

### 明确保留(用户决定,勿动)
- `.claude/`(含 240 个 git 跟踪的技能文件)
- `carbon_backup_*.sql`、`carbon_app_*.yml`、`ruvector.db`(本地备份,已 gitignore)

### .gitignore 新增
`memory/`(AI 操作日志,见第六节)、`.agents/`

## 四、问题诊断

### 4.1 硬编码与配置漂移清单(违反"避免硬编码"原则)
| 位置 | 内容 | 建议 |
|---|---|---|
| `vite.config.ts:12` | `base` 硬编码 `'https://oss.lianlab.top/main'` | 改由 env 驱动(如 `VITE_CDN_BASE`),`.env.example` 补说明 |
| `vite.config.ts:74-88` | `http://localhost:9090` 重复 **8 次** | 顶部提取 `const PROXY_TARGET = process.env.VITE_PROXY_TARGET ?? 'http://localhost:9090'` |
| `AppNavbar.vue:8`、`FrontLayout.vue:21`、`SidebarLeft.vue:62` | 头像 fallback `'https://oss.lianlab.top/main/img/avatar.jpg'` 重复 **3 次** | 集中到 `src/config/site.ts` 导出 `DEFAULT_AVATAR`(或改用本地 `public/img/avatar.jpg`) |
| `src/api/request.ts:14-35` | `WHITE_LIST`、`TOKEN_FREE_API_PREFIXES` 策略硬编码在请求层 | 策略与实现分离,移至 `src/config/apiPolicy.ts` |
| `src/data/projects.ts` | OSS 图片/外链 URL 散落 | 内容型数据可接受,但建议集中到 `src/config/content.ts` 或后端 pageConfig 化 |
| `router/index.ts:159` | `'我的博客 - 个人博客'` 标题模板 | 集中到 `src/config/site.ts` 的 `SITE_TITLE` |
| `uno.config.ts:22-49` | UnoCSS 主题色仍是旧品牌紫 `#667eea`/`#764ba2`,与 index.scss 已迁移的 Editorial Blue(`#2563eb`)令牌**双轨不一致** | UnoCSS theme 与 CSS 变量对齐(同一色源),否则 shortcut 类(`btn-primary` 等)渲染旧紫 |
| `.github/workflows/deploy.yml` | `oss://theboe/main`、endpoint、CDN_URL 列表硬编码在步骤内 | 提取到 workflow 顶层 `env:`(或 GitHub Variables),密钥继续保持 secrets |

**做得对的**:`src/api/request.ts:70` 的 `baseURL` 已用 `import.meta.env.VITE_API_BASE_URL` 驱动 ✅;`.env.example` 已有该变量说明 ✅

### 4.2 超大组件(组件化拆分重点,>600 行)
| 文件 | 行数 | 拆分方向 |
|---|---|---|
| `views/admin/Dashboard.vue` | 1136 | 按卡片拆:StatCards / TrendChart / VisitChart 等子组件 |
| `views/admin/PageConfigEditor.vue` | 1085 | 按 section 拆为动态表单子组件 |
| `views/admin/ArticleEditor.vue` | 930 | 编辑器 / 侧边设置栏 / 发布弹窗分离 |
| `views/ArticleDetail.vue` | 833 | 目录 / 正文渲染 / 评论区分离 |
| `views/admin/Settings.vue` | 817 | 按 tab 拆 |
| `components/AppNavbar.vue` | 740 | 移动端抽屉 / 桌面导航 / 搜索分离 |
| `views/Login.vue` | 662 | 表单与 2FA 流程分离 |

### 4.3 文档与仓库卫生
1. **文档三处分散**:根目录(DESIGN/PRODUCT/DEPLOY)+ `docs/`(5 篇)+ `adr/`(3 篇),职责边界不清;`docs/` 内中英文命名混杂
2. **AGENTS.md 与 CLAUDE.md 重复**:仅第一行标题不同,双份维护必然漂移
3. **README.md 空壳**:20 字节,无项目简介/启动/部署指引
4. **`.claude/` 占仓库 70%**:340 个跟踪文件中 240 个是 AI 技能(含 TTF 字体),前端产物被工具文件淹没(用户决定保留,仅记录)

## 五、重构方案(建议,未执行——按顺序分阶段,每阶段独立可验证)

### Phase 2:配置层去硬编码(低风险,先做)
1. 新建 `src/config/site.ts`:`DEFAULT_AVATAR`、`SITE_TITLE` 等站点常量统一出口
2. 新建 `src/config/apiPolicy.ts`:迁移 request.ts 的白名单/免 token 策略
3. `vite.config.ts`:提取 `PROXY_TARGET` 常量;base 改 env 驱动;`.env.example` 同步补 `VITE_PROXY_TARGET`、`VITE_CDN_BASE` 说明
4. `uno.config.ts`:主题色与 index.scss 令牌对齐,消除新旧双轨
5. `deploy.yml`:路径/bucket/CDN 列表提为 workflow 顶层 `env:`
6. 三处头像 fallback 改引 `DEFAULT_AVATAR`

### Phase 3:文档归位与去重
1. ✅ `DEPLOY.md` → `docs/deploy.md`(内容重写为 GH Actions 现状,旧本地脚本方案已废弃);`DESIGN.md` → `docs/design.md`;`PRODUCT.md` → `docs/product.md`;AGENTS.md 及移入文件内部引用全部同步
2. ✅ AGENTS.md 唯一事实源,CLAUDE.md 改为 `@AGENTS.md` 引用(2026-09-04 执行,废弃双份镜像)
3. ✅ README.md 补全;顺手修正 AGENTS.md 三处"后端 Go 服务"→"carbon(Spring Boot)"
4. ⏳ `docs/`、`adr/` 命名统一(中英文混杂待定),加 `docs/README.md` 索引

### Phase 4:组件化拆分(高价值,逐个来)
1. `components/` 分层:`ui/`(无业务通用件)与业务组件分开
2. 按 4.2 表逐个拆分超大视图,子组件放 `views/<page>/components/`(页面私有)或 `src/components/`(跨页面复用)
3. 每拆一个跑一次 `npm run build` + 手工验证,独立提交

### 不做的事
- 不动 `.claude/`、本地备份文件(用户明确要求保留)
- 不引入新框架/状态库,只做结构治理

## 六、维护约定

- **`memory/` 目录**:AI 操作日志,命名 `<具体操作>--<YYYY-MM-DD-HHmm>.md`,已加入 `.gitignore` **不上传 git**;每次结构性修改(删除/移动/重命名/新增配置)必须同步写一条日志
- **rename.md**:重构方案的事实源,每完成一个 Phase 在第五节标记进度
- 修改前先看本文件,避免与既定方案冲突

---
*本文档由 Claude Code 生成于 2026-09-04,`perf-file` 分支清理会话;操作明细见 `memory/`。*
