# 管理端重构 - 发现与扫描结果

## 设计令牌现状（src/styles/index.scss）

### 亮色
- `--brand-primary: #2563eb`（Editorial Blue）
- `--brand-primary-hover: #1d4ed8`
- `--brand-primary-light: rgba(37, 99, 235, 0.1)`
- `--brand-tint: rgba(37, 99, 235, 0.08)`
- `--brand-tint-hover: rgba(37, 99, 235, 0.12)`
- `--text-primary: #363636` / `--text-secondary: #4a4a4a` / `--text-tertiary: #7a7a7a` / `--text-placeholder: #b5b5b5`
- `--bg-primary: #ffffff` / `--bg-secondary: #f5f5f5` / `--bg-tertiary: #fafafa` / `--bg-page: #f0eef5` / `--bg-hover: #f5f5f5`
- `--border-color: #dbdbdb` / `--border-color-strong: #b5b5b5`
- `--link-color: #2563eb` / `--link-hover-color: #1d4ed8`
- `--shadow-sm/md/hover` / `--radius-sm/md/lg/xl` / `--space-1..12` / `--text-xs..5xl` / `--transition-fast/base/slow`

### 暗色（[data-theme='dark']）
- `--brand-primary: #60a5fa` / `--brand-primary-hover: #93c5fd`
- `--bg-primary: #1a1a1a` / `--bg-page: #14131a` / `--bg-secondary: #232323` / `--bg-tertiary: #2a2a2a`
- `--text-primary: #f5f5f5` / `--text-secondary: #d5d5d5` / `--text-tertiary: #a0a0a0`

## AdminLayout 已用令牌（参照样板）

`src/layouts/AdminLayout.vue` 已 100% 使用令牌，可作为 admin 页面的参照样板：
- 侧边栏背景 `var(--bg-secondary)` + 边框 `var(--border-color)`
- 菜单 hover `var(--bg-hover)` + active `var(--brand-primary-light)`
- 顶栏背景 `var(--bg-primary)` + 边框 `var(--border-color)`
- 主内容区 `var(--bg-secondary)` + `var(--space-6)`

## 硬编码颜色映射表

| 硬编码 | 出现位置 | 替换为 |
|---|---|---|
| `#667eea` | ArticleEditor/ArticleList/Dashboard/PageConfigEditor/Settings/TagList | `var(--brand-primary)` |
| `#764ba2` | Dashboard | `var(--brand-primary-hover)` |
| `#f093fb` | Dashboard | `var(--brand-tint-hover)` |
| `#43e97b` `#38f9d7` `#4facfe` `#00f2fe` | Dashboard 4 色卡 | 蓝阶：`var(--brand-primary)` / `var(--brand-primary-hover)` / `var(--brand-tint)` / `var(--brand-tint-hover)` |
| `#303133` | 多处文本 | `var(--text-primary)` |
| `#606266` | 多处文本 | `var(--text-secondary)` |
| `#909399` | 多处文本 | `var(--text-tertiary)` |
| `#c0c4cc` `#8c939d` | placeholder | `var(--text-placeholder)` |
| `#e4e7ed` `#dcdfe6` `#d9d9d9` | 边框 | `var(--border-color)` |
| `#f5f7fa` `#f5f5f5` | 背景 | `var(--bg-secondary)` 或 `var(--bg-hover)` |
| `#f0f2f5` `#f0f2ff` | 背景 | `var(--bg-tertiary)` 或 `var(--brand-tint)` |
| `#303133` ↔ `#337ab7` `#23527c` | ArticleList 链接 | `var(--link-color)` / `var(--link-hover-color)` |

## 不在重构范围

- 后端接口契约（admin 页面的 API 调用已走 `src/api/request.ts`，无需改动）
- AdminLayout（已对齐）
- 路由守卫（无样式）
- 业务逻辑（仅替换颜色/字体/间距，不改行为）

## 风险

1. **JS 字符串内联样式**（PageConfigEditor 的 HTML 模板生成）：替换为 `var(--brand-primary)` 后，渲染目标 DOM 必须在 `[data-theme]` 作用域内才能解析变量。验证：admin 页面 body 上有 `data-theme` 属性，OK。
2. **Element Plus 组件内置色**：el-tag / el-card 的某些颜色由 EP 主题决定，本仓未自定义 EP 主题，本次只覆盖 inline style 和 scoped css 里的硬编码，不动 EP 主题文件。
3. **Dashboard ECharts 色板**：`colors` 数组用于图表，改为蓝阶后图表可读性需在浏览器验证。
