---
name: 我的博客
description: Design System — 三层 token 架构 + 治理规则
register: brand
---

# Design System

> **Source of Truth**：本文件**描述** `src/styles/index.scss`，不重新设计它。代码是事实来源，文档是它的镜像。两者冲突时以代码为准，并回头修订本文。

> **Stable API Principle**：Semantic Token 是公开 API。不为"命名更统一"而大规模重命名。优先扩展系统，而非破坏稳定接口。

---

## 1. Token Architecture

三层架构。业务组件**禁止**直接消费 Primitive Token。

```
Primitive Token   →  Semantic Token   →   Component Token（按需）
（原始色板）          （语义/角色）          （谁在用）
--brand-600          --brand-primary       --button-bg（出现重复再抽）
--neutral-800        --text-primary
--neutral-0          --bg-primary
```

| 层 | 回答 | 谁能用 |
|---|---|---|
| Primitive | 它属于哪个色板？ | 只能被 Semantic 引用 |
| Semantic | 它负责什么角色？ | 业务组件直接用 |
| Component | 谁在用？ | 仅当 ≥2 状态共享时才抽（Rule of Three） |

### 1.1 Primitive

`--brand-50..900`（蓝色色阶）、`--neutral-0..950`（含半步 150/450/650/825 保留历史设计值）、`--success-500` / `--warning-500` / `--danger-500` / `--info-500`。

> Primitive 是 brand-centric（`--brand-600`），不是 color-centric（`--blue-500`）。品牌换色相时，Primitive 名不变，只改值。

### 1.2 Semantic

引用 Primitive。暗色模式只换 Semantic 指向的 Primitive，组件代码零改动。

- Brand：`--brand-primary` / `--brand-primary-hover` / `--brand-primary-light` / `--brand-tint` / `--brand-tint-hover`
- State：`--color-success` / `--color-warning` / `--color-danger` / `--color-info`
- Text（颜色）：`--text-primary` / `--text-secondary` / `--text-tertiary` / `--text-placeholder`
- Background：`--bg-primary` / `--bg-secondary` / `--bg-tertiary` / `--bg-page` / `--bg-hover` / `--bg-navbar` / `--bg-navbar-scrolled` / `--bg-overlay`
- Border：`--border-color` / `--border-color-strong`
- Link/Tag：`--link-color` / `--link-hover-color` / `--tag-default-color`

> 例外：`--bg-page: #f0eef5`（亮色）是品牌调色的页面底，未走 neutral 色阶，保留 raw 值。

### 1.3 Component

**默认为空**。仅在出现重复时按 Rule of Three 抽取（如 `--button-bg`、`--card-bg`）。不要预建。

---

## 2. Foundation

### 2.1 Color

见 §1。Semantic Color 全部引用 Primitive。**禁止在组件里写 `#ffffff` / `#333333` / `rgba(...)` 原值**——用 `var(--bg-primary)` / `var(--text-primary)` / `var(--brand-tint)`。

### 2.2 Typography

`--text-*` 专属颜色。字号、行高、字重独立：

| 类别 | Token |
|---|---|
| 字号 | `--font-size-xs` (12) / `sm` (14) / `base` (16) / `lg` (18) / `xl` (20) / `2xl` (24) / `3xl` (30) / `4xl` (36) / `5xl` (48) |
| 行高 | `--line-height-tight` (1.2) / `normal` (1.5) / `relaxed` (1.8) |
| 字重 | `--font-weight-normal` (400) / `medium` (500) / `semibold` (600) / `bold` (700) |

> 历史命名 `--text-xs..5xl` 已改名（与 `--text-primary` 颜色重名），全仓 sweep 完成。

### 2.3 Spacing

`--space-1` (4) / `2` (8) / `3` (12) / `4` (16) / `5` (20) / `6` (24) / `8` (32) / `10` (40) / `12` (48) / `16` (64)。**禁止 magic number**（`18px` / `22px` / `37px`）。

### 2.4 Radius

`--radius-sm` (4) / `md` (6) / `lg` (8) / `xl` (12)。

### 2.5 Shadow

`--shadow-sm` / `md` / `hover`。暗色下自动加深（见 `styles/index.scss` `[data-theme='dark']`）。

### 2.6 Motion

| Token | 值 | 用途 |
|---|---|---|
| `--motion-fast` | 150ms | 即时反馈（按钮、toggle） |
| `--motion-normal` | 250ms | 状态变化（菜单、tooltip） |
| `--motion-slow` | 350ms | 布局变化（手风琴、抽屉） |
| `--ease-standard` | cubic-bezier(0.16, 1, 0.3, 1) | 通用 ease-out-expo |
| `--ease-out-quart` | cubic-bezier(0.25, 1, 0.5, 1) | 平滑减速 |

> `--transition-fast/base/slow` 为 legacy 稳定 API（150/200/300ms，原值保留），新代码用 `--motion-*`。

---

## 3. Theme Mapping

亮色 / 暗色共享同一套 Semantic Token，只切换其 Primitive 指向。组件代码零改动。

```
[data-theme='dark'] {
  --text-primary: var(--neutral-100);   // 亮色是 --neutral-800
  --bg-primary:   var(--neutral-900);   // 亮色是 --neutral-0
  --brand-primary: var(--brand-400);    // 亮色是 --brand-600
  ...
}
```

暗色由 `<html data-theme="dark">` + `.dark` 类（Element Plus 暗色）激活，由 `src/stores/theme.ts` 切换。

---

## 4. Component Foundation

现有：`AppNavbar` / `BlogLayout3Col` / `SidebarLeft` / `SidebarRight` / `BackToTop` / `ThemeToggle` / `GlobalLoading` / `ReadingProgress`。

新增组件优先复用上述；确实需要新组件时，遵循 §5 Governance。组件样式用 Semantic Token，不直连 Primitive。

---

## 5. Design Governance

新 UI 需求的决策流：

```
新 UI
  ↓
有现成 Token？ ─ YES → 用
  ↓ NO
有现成 Component？ ─ YES → 用
  ↓ NO
更新 DESIGN.md（本文件） + styles/index.scss（加 Token/规范）
  ↓
改/建 Component
  ↓
业务页面使用（永远在最后）
```

**禁止**：直接在业务页写 `#ffffff` / `18px` / 新颜色 / 新阴影。先回 Design System。

---

## 6. Evolution Rules

Token 的新增与废弃遵循以下规则，避免过早抽象与僵尸 Token。

### 6.1 Rule of Three

> 第一次复制 → 复制。第二次 → 观察。第三次 → 抽 Token。

不要看到一次重复就抽 Component Token。

### 6.2 新增 Semantic

必须至少有 **2 个组件**使用，否则继续复用已有 Semantic。

### 6.3 新增 Component Token

必须至少有 **2 个状态共享**（如 `--button-bg` 被 default + hover 复用），否则继续用 Semantic。

### 6.4 新增 Primitive

仅在现有 Primitive 色阶无法满足 Semantic 需求时新增；新增后立即被至少一个 Semantic 引用。

### 6.5 废弃 Token

废弃走 deprecate：先在文档标记 `@deprecated` 并给替代项，留一个发布周期后再删。不偷偷删。

---

## 7. Foundation Freeze

Stage 1 冻结后，Token 体系的改动必须走 §5 Governance + §6 Evolution Rules，**不允许直接改组件绕过系统**。

Freeze 不是"不能改"，而是"改要走治理"：

- 调整 Primitive 值（如品牌换色）→ 改 Primitive，Semantic/组件不动。
- 新增 Semantic → 走 §6.2。
- 重命名 Semantic → 默认拒绝（Stable API Principle）；确有必要需强理由 + 全仓 sweep + 文档说明。

---

## 8. UI Task Review Matrix

每个 UI / Theme / Component / Style 类任务，在实现前过一遍：

| 项 | 检查 |
|---|---|
| Product Identity | 符合 `PRODUCT.md` 定位 |
| Design Principles | 符合 `PRODUCT.md` 设计原则 |
| Semantic Token | 用 Semantic，没直连 Primitive / 写 hex |
| Foundation | spacing / radius / shadow / motion 用 scale，无 magic number |
| Component | 复用现成组件，不重造 |
| Theme | light / dark 都过 |
| Accessibility | 文本对比度 ≥ 4.5:1（大字 ≥ 3:1） |

全符合才开工。缺 Token/规范 → 先更 Design System（§5）。

---

## 9. Success Criterion

> **Design System 应该减少决策，而不是增加决策。**

验收标准不是文档多详尽，而是连续做几个功能时——新增页面 / Card / Dialog / 设置页 / Dark Mode——大多数时候只是 `var(--brand-primary)` / `var(--space-4)` / `var(--radius-md)` 拿来用，不新增任何东西。

- 如果每个 UI 都要回本文件加规则 → 系统还不够成熟，按 §5 / §6 补。
- 如果大多数只是复用已有 Token / 组件 → 投入开始产生长期回报。

判断 Design System 是否成功的标准：它是否减少了做 UI 时的决策，而不是增加了。

### 优先级：Reuse > Extend > Redesign

面对新 UI 需求，优先级固定：

1. **Reuse**：先在系统里找现成 Token / 组件，有就用。
2. **Extend**：确实没有，走 §5 Governance（先更 DESIGN.md + styles，再组件，最后业务页）。
3. **Redesign**：改已有 Token / 组件，最后手段，需强理由（Semantic 改名默认拒绝）。

> Every abstraction should pay for itself. 抽象要自己挣回成本——不要反过来从"规范"推导"抽象"。
