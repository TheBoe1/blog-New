# Dark Mode Migration — Implementation Checklist (Phase 0)

> Phase 0 产出。架构已 freeze 于 ADR-002 v3。本文档列出 **改什么 / 改哪里 / 什么顺序**，Phase 1-3 执行时不再重新决策。

## 0. Supreme Principle

> **Every visual decision should answer one question: does it improve readability, hierarchy, or interaction? If it improves none of them, it probably doesn't belong.**

每个视觉决策必须明确提升阅读、层级、交互中的至少一项——否则不该进入系统。新颜色 / 新阴影 / 新渐变 / 新边框都要回答「提升了什么」；答案只是「更酷」= 拒绝。已补入 ADR-002 §10 Manifesto。

## 1. Migration Phases（review 后重排）

| Phase | 内容 | 产出 |
|---|---|---|
| **1 Foundation** | `index.scss` 新 Token + Theme Mapping；`DESIGN.md` 同步镜像 | token 系统 + 文档一致 |
| **2 Migration** | 逐组件替换硬编码（照 §3 audit） | 组件零 hex |
| **3 Validation** | build + WCAG 实测 + 亮暗浏览器对比 + Regression Checklist | 验收通过 |

> **顺序原则**：`index.scss` → `DESIGN.md`（同步，防 drift）→ 组件迁移 → 浏览器 review。DESIGN.md 是 styles 的镜像，两者必须同步，不允许短暂 drift 窗口。
>
> **每 Batch 必 review**：Foundation → review → Batch A → review → Batch B → review → Batch C → review。**不堆积到最后**——否则发现问题无法定位是哪批造成。

## 2. Token System Gaps（audit 揭示）

Phase 1 必须补的 token：

| 新 Token | 类型 | 理由 |
|---|---|---|
| `--text-on-brand` | Semantic（Text 域） | 白字 on brand/colored bg，audit 出现 ≥8 处（Login / Unauthorized / Articles / Home / Dashboard / GlobalLoading / SidebarLeft / AppNavbar）。现无 token，全用 `#fff`。 |
| `--gradient-brand` | Component（Rule of Three ✓） | `linear-gradient(135deg, #667eea, #764ba2)` 重复 2 处（Login:168/183、Unauthorized:43）。 |

**Pre-existing flag（不在本次 scope）**：
- **Brand palette drift**：`index.scss` `--brand-600: #2563eb`（Tailwind blue）≠ CLAUDE.md / `uno.config.ts` `#667eea`（periwinkle）。组件硬编码 `#667eea`（Login / Unauthorized / DynamicSection）用的是「真品牌色」，token 系统却是另一套。**需单独决策**：brand Primitive 统一到 `#667eea` 还是维持 `#2563eb`。本次 migration 不改 brand 值，只确保组件改用 token。

## 3. Hardcoded Color Audit（全仓扫描）

> 扫描范围：`src/` 下 `#[0-9a-fA-F]{3,8}` + `rgba?()` + `hsla?()`，排除 `styles/index.scss`（Primitive 定义，hex 合法）、`styles/variables.scss`（仅 layout 变量，无色）、`uno.config.ts`（独立 theme palette，见 §2 flag）。

### 3.1 前台组件

| 文件 | 行 | 当前 | → Token | 优先级 |
|---|---|---|---|---|
| ArticleDetail.vue | 555 | `#1e1e1e` (code bg) | `var(--content-code-bg)` | 🔴 P0 |
| ArticleDetail.vue | 563,565 | `#d4d4d4` (code text) | `var(--text-primary)` | 🔴 P0 |
| ArticleDetail.vue | 578 | `$grad-brand-soft` (blockquote) | `var(--content-quote-bg)` | 🔴 P0 |
| ArticleDetail.vue | 251 | `'#ffffff'` (md-editor config) | 评估：config 字符串，可能留 | 🟡 |
| ArticleDetail.vue | 608,632,652,712,819,835 | `rgba(0,0,0,.08/.1)` shadow | `var(--shadow-sm/md)` | 🟡 P1 |
| ArticleDetail.vue | 638 | `#fff` | `var(--text-on-brand)` | 🟡 P1 |
| DynamicSection.vue | 102,156 | `#606266` | `var(--text-secondary)` | 🟡 P1 |
| DynamicSection.vue | 108 | `#303133` | `var(--text-primary)` | 🟡 P1 |
| DynamicSection.vue | 120,139 | `#667eea` | `var(--brand-primary)` | 🟡 P1 |
| MarkdownEditor.vue | 117,122 | `#e4e7ed` border | `var(--border-color)` | 🟡 P1 |
| GlobalLoading.vue | 35,50 | `rgba(255,255,255,.7/.9)` overlay | `var(--bg-overlay)` ⚠️ 暗色白底 bug | 🔴 P0 |
| GlobalLoading.vue | 52 | `rgba(64,158,255,.1)` shadow | `var(--shadow-sm)` | 🟡 |
| GlobalLoading.vue | 67 | `#79bbff` stroke | `var(--brand-primary-light)` | 🟡 |
| GlobalLoading.vue | 75 | `#409eff` | `var(--brand-primary)` | 🟡 |
| BackToTop.vue | 140,161 | `rgba(0,0,0,...)` shadow | `var(--shadow-sm/hover)` | 🟡 P1 |
| BackToTop.vue | 174,177 | `rgba(50,115,220,.7)` ripple | `color-mix(var(--brand-primary) ...)` | 🟡 P1 |
| AppNavbar.vue | 181,186,357,441,446 | `rgba(0,0,0,...)` shadow | `var(--shadow-*)` | 🟡 P1 |
| AppNavbar.vue | 425 | `rgba(0,0,0,.4)` overlay | `var(--bg-overlay)` | 🟡 P1 |
| SidebarLeft.vue | 76 | `rgba(255,255,255,.6)` border | 评估：avatar 边框，需 theme-aware | 🟡 |

### 3.2 前台页面

| 文件 | 行 | 当前 | → Token | 优先级 |
|---|---|---|---|---|
| Home.vue | 176 | `rgba(50,115,220,.3)`（≠brand） | `color-mix(var(--brand-primary) 30%, transparent)` | 🟡 P1 |
| Home.vue | 305 | 彩虹 `linear-gradient(#ff6b6b...)` | 评估：装饰性，留或抽 `--gradient-rainbow` | 🟢 decision |
| Home.vue | 342 | `rgba(255,255,255,.3)` shimmer | 评估：暗色下白 shimmer 是否 OK | 🟢 decision |
| Home.vue | 353,408 | `rgba(0,0,0,...)` shadow | `var(--shadow-*)` | 🟡 P1 |
| Home.vue | 406 | `#fff` | `var(--text-on-brand)` | 🟡 P1 |
| Articles.vue | 208,264 | `#fff` | `var(--text-on-brand)` | 🟡 P1 |
| CategoryArticles.vue | 198,244 | `rgba(50,115,220,.3)`（≠brand） | `color-mix(var(--brand-primary) ...)` | 🟡 P1 |
| Login.vue | 168,183 | `linear-gradient(#667eea,#764ba2)` | `var(--gradient-brand)` | 🟡 P1 |
| Login.vue | 176 | `rgba(0,0,0,.3)` shadow | `var(--shadow-hover)` | 🟡 |
| Login.vue | 199 | `rgba(255,255,255,.2)` glass | 评估：on brand gradient，白 tint 双主题 OK？ | 🟢 decision |
| Login.vue | 257 | `#303133` | `var(--text-primary)` | 🟡 P1 |
| Login.vue | 274 | `#dcdfe6` border | `var(--border-color)` | 🟡 P1 |
| Login.vue | 281 | `#f5f7fa` bg | `var(--bg-secondary)` | 🟡 P1 |
| Login.vue | 291,302 | `#909399` | `var(--text-tertiary)` | 🟡 P1 |
| ProjectDetail.vue | 118,153,181 | `#303133` | `var(--text-primary)` | 🟡 P1 |
| ProjectDetail.vue | 127,186 | `#909399` | `var(--text-tertiary)` | 🟡 P1 |
| ProjectDetail.vue | 156,225 | `#e4e7ed` border | `var(--border-color)` | 🟡 P1 |
| ProjectDetail.vue | 161,197 | `#606266` | `var(--text-secondary)` | 🟡 P1 |
| ProjectDetail.vue | 176,210 | `#f5f7fa` bg | `var(--bg-secondary)` | 🟡 P1 |
| Projects.vue | 66,115 | `#303133` | `var(--text-primary)` | 🟡 P1 |
| Projects.vue | 72,141 | `#909399` | `var(--text-tertiary)` | 🟡 P1 |
| Projects.vue | 96 | `linear-gradient(#f5f7fa,#e4e7ed)` | `var(--bg-secondary)` / gradient token | 🟡 P1 |
| Projects.vue | 100 | `#c0c4cc` | `var(--text-placeholder)` | 🟡 P1 |
| Projects.vue | 121 | `#606266` | `var(--text-secondary)` | 🟡 P1 |
| Unauthorized.vue | 5 | `color="#f56c6c"`（template） | `var(--color-danger)` | 🟡 P1 |
| Unauthorized.vue | 43 | `linear-gradient(#667eea,#764ba2)` | `var(--gradient-brand)` | 🟡 P1 |
| Unauthorized.vue | 54 | `rgba(0,0,0,.3)` shadow | `var(--shadow-hover)` | 🟡 |
| Unauthorized.vue | 71 | `#303133` | `var(--text-primary)` | 🟡 P1 |
| Unauthorized.vue | 77 | `#606266` | `var(--text-secondary)` | 🟡 P1 |
| Unauthorized.vue | 84 | `#909399` | `var(--text-tertiary)` | 🟡 P1 |

### 3.3 后台

| 文件 | 行 | 当前 | → Token | 优先级 |
|---|---|---|---|---|
| admin/Dashboard.vue | 399 | `rgba(255,255,255,.8)` | `var(--text-on-brand)` | 🟡 P1 |
| admin/PageConfigEditor.vue | 234,413 | placeholder 文本含 hex | 留（placeholder 字符串，非颜色用） | ⚪ skip |
| admin/PageConfigEditor.vue | 767 | 生成 HTML 含 `#ddd` | 评估：动态 page-config HTML 输出，低优 | 🟢 P2 |

### 审计汇总

- **🔴 P0（本次必改）**：ArticleDetail 代码块/引用（4 处）、GlobalLoading 白底 overlay（2 处，暗色 bug）
- **🟡 P1（Phase 2 逐组件改）**：EP 色字面量 + shadow + brand 硬编码，~40 处，跨 12 文件
- **🟢 decision / P2**：装饰性渐变、生成 HTML，留 TODO
- **⚪ skip**：placeholder 字符串

## 4. Migration Rules

```
禁止新增（组件里）:
  #ffffff / #1e1e1e / 任何 hex / rgb() / rgba()

统一替换映射:
  background (surface)     → var(--bg-*)        [路由 --surface-*]
  background (code/quote)  → var(--content-*)
  color (正文/层级)         → var(--text-*)
  color (on brand/colored) → var(--text-on-brand)
  border                   → var(--border-color)  // 已含 rgba alpha
  box-shadow               → var(--shadow-sm / md / hover)
  brand gradient           → var(--gradient-brand)
  brand tint               → var(--brand-tint) / color-mix(var(--brand-primary) ...)
```

> 例外：Primitive 定义在 `styles/index.scss` 用 hex（合法）；`uno.config.ts` theme palette（独立，见 §2 flag）。

## 5. Phase 1 Foundation Scope

### 5.1 `src/styles/index.scss`

1. **Primitive**：加 `--ink-50..950` 全 palette（cool indigo-gray）。
2. **Semantic — Background 域**：
   - `--surface-page / chrome / card / raised / sunken`（亮 Neutral / 暗 Ink）
   - `--bg-*` 路由 `--surface-*`（Stable API 不破）
3. **Semantic — Text 域**：
   - `--text-primary / secondary / muted / placeholder` 存最终色（亮 0.80 系 / 暗 0.92 系，per-theme）
   - 新增 `--text-on-brand`（亮 `--neutral-0` / 暗 `--neutral-0`，白字 on brand）
4. **Semantic — Border 域**：`rgba(0,0,0,.12/.20)`（亮）/ `rgba(255,255,255,.08/.14)`（暗）
5. **Semantic — Content 域**：
   - `--content-code-inline-bg` / `--content-code-bg` / `--content-quote-bg`
   - 映射到 `--surface-sunken` 等（暂同源，API 独立）
6. **Component**：`--gradient-brand`（135deg brand → secondary）
7. **暗色 `[data-theme='dark']`**：Surface → Ink，Text → 暗色最终色，Border → 白 alpha

### 5.2 `DESIGN.md`（同步镜像，改完 index.scss 立即同步）

- §1 重写为 v3 架构：Primitive / Semantic Domains（Background ⊃ Surface）/ Content（Inline/Block）
- §3 暗色映射表更新
- 新增 Theme Budget 节
- 新增 WCAG Constraints 节（ADR §7 表）
- Manifesto 加 supreme principle
- 标记 `--text-on-brand` / `--gradient-brand` 新 token

## 6. Phase 2 Migration Scope

按 §3 audit 逐文件改。建议批次：

- **Batch A（P0）**：ArticleDetail、GlobalLoading——修 bug + 主目标
- **Batch B（P1 前台高频）**：Home、Articles、CategoryArticles、Projects、ProjectDetail、Login、Unauthorized、DynamicSection、MarkdownEditor、AppNavbar、BackToTop、SidebarLeft
- **Batch C（P1 后台）**：Dashboard
- **Batch D（decision）**：Home:305 彩虹、shimmer、glass——单独决策（过 supreme principle 检验）

## 7. Phase 3 Validation

### 7.1 自动检查
- [ ] `npx vue-tsc --noEmit` 0 error
- [ ] `npm run build` 通过
- [ ] WCAG 实测：Primary ≥7:1 / Secondary ≥4.5:1 / Muted ≥3:1（on `--surface-card`，亮暗各测）
- [ ] 无残余 hex in components（重跑 §3 扫描，仅剩 Primitive / uno.config / placeholder）

### 7.2 Browser Review Focus（每个 Batch 后必过，人工 5 分钟）

**① Surface Hierarchy**——Page 沉下去？Card 浮起？Code 不像黑洞？Hover 只提升一点？Navbar 不跟 Card 混？
**② Reading**——长文滚两分钟：正文发光？Secondary 抢正文？Code 抢节奏？Quote 像广告？（GitHub 秘诀：阅读时感觉不到设计）
**③ Brand**——按钮 / 链接 / Tag / Focus / Hover 统一成 `#667eea` 系？Brand 不抢戏？
**④ Chrome**——Navbar / Sidebar / Search / Dropdown 属于一个系统？Chrome 不比内容亮？
**⑤ Motion**——切主题 / Hover / Button / Card：有无突然太快 / 太慢？

### 7.3 Theme Regression Checklist（每次 Theme 改动必过，人工 3 分钟）

```
□ Light / Dark 切换无闪烁
□ 首页 Hero 正常
□ 文章阅读正常
□ Markdown Code 正常
□ Navbar 正常
□ Sidebar 正常
□ Search 正常
□ Login 正常
□ Loading Overlay 正常
□ Hover 正常
□ Focus Ring 正常
```

## 8. Design Regression Checklist（每次 Theme 改动必过，人工 3 分钟）

```
□ 首页 Home
□ Navbar（含滚动态）
□ Hero
□ Card（列表 + hover）
□ Markdown 正文
□ Code block（块 + 行内）
□ Table
□ Blockquote
□ Link（hover / active）
□ Form（input / focus）
□ Dialog
□ Footer
□ Mobile（≤768px）
□ 亮 ↔ 暗切换（无闪烁、无白底 bug）
```

## 9. Out-of-Scope / Flags

1. **Brand palette drift**（`#2563eb` vs `#667eea`）——单独决策，本次不改 brand 值。
2. **`uno.config.ts` theme palette** 独立于 CSS vars——未来是否统一（uno 引用 CSS vars）另议。
3. **Home 彩虹 gradient / shimmer / Login glass**——装饰性，Phase 2 单独决策去留（过 supreme principle 检验）。
4. **md-editor-v3 默认样式覆盖**——ArticleDetail:944/963 注释提及 `#73d13d`，是覆盖第三方默认色，非业务色。评估是否纳入 token。
