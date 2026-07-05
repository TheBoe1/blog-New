---
name: 我的博客
description: Design System — 三层 token + Theme Architecture（ADR-002 v3 镜像）
register: brand
---

# Design System

> **Source of Truth**：本文件**描述** `src/styles/index.scss`，不重新设计它。代码是事实来源，文档是它的镜像。两者冲突时以代码为准，并回头修订本文。

> **Stable API Principle**：Semantic Token 是公开 API。不为"命名更统一"而大规模重命名。优先扩展系统，而非破坏稳定接口。

> **Architecture**：ADR-001（三层 Token）+ ADR-002 v3（Theme Architecture）。本文件是两者的实现镜像。

---

## 1. Token Architecture

三层：`Primitive → Semantic → Component`。Semantic 内部按 **Namespace Domain** 组织（ADR-002 §2）。业务组件**禁止**直接消费 Primitive。

```
Primitive (Brand / Secondary / Neutral / Ink / State)
    ↓
Semantic Domains
    Background ⊃ Surface : page / chrome / card / raised / sunken
    Text                 : primary / secondary / muted / placeholder / on-brand
    Border               : default / strong / on-brand
    Brand                : primary / hover / tint
    Feedback             : success / warning / danger / info
    Content              : inline (mark / kbd / code-inline)
                           block (code / quote / callout / table / math / diagram)
    Focus                : ring-width / ring-color / ring-offset
    ↓
Adapter (Integration Layer; Semantic → Third-party, ADR-003)
    ↓
Third-party (md-editor / Element Plus / Monaco / Mermaid / ...)
    ↓
Component (Rule of Three; on-demand)
```

| 层 | 回答 | 谁能用 |
|---|---|---|
| Primitive | 它属于哪个色板？ | 只能被 Semantic 引用 |
| Semantic | 它负责什么角色？ | 业务组件直接用 |
| Component | 谁在用？ | 仅当 ≥2 状态共享时抽（Rule of Three） |

### 1.1 Primitive

- **Brand** `--brand-50..900`（periwinkle `#667eea` 系，`--brand-500` = primary；见 `PRODUCT.md` Brand 节 — Single Source of Truth）
- **Secondary** `--secondary-500`（`#764ba2`；full palette TBD）
- **Neutral** `--neutral-0..950`（含半步 150/450/650/825/850；亮色 surface + 亮色 text）
- **Ink** `--ink-50..950`（cool indigo-gray，暗色专用；亮色暂不用，palette 完整超前建设）
- **State** `--success-500` / `--warning-500` / `--danger-500` / `--info-500`

> Primitive brand-centric（`--brand-500`），不是 color-centric。品牌换色相时，Primitive 名不变，只改值。

### 1.2 Semantic

引用 Primitive（亮色）或换指向（暗色）。组件代码零改动。

- **Background ⊃ Surface**：`--surface-page / chrome / card / raised / sunken`。Surface 是 Background 域子系统（空间层级），不与 Text（信息层级）并列。`--bg-*`（既有 API）路由 `--surface-*`：`--bg-page / primary / secondary / tertiary / hover / navbar / navbar-scrolled / overlay`。
- **Text**：`--text-primary / secondary / muted / placeholder / on-brand`。存**最终色**，不存 alpha（ADR-002 §2）。`--text-tertiary` 为 deprecated alias → `--text-muted`。
- **Border**：`--border-color / strong / on-brand`。opacity-based（`rgba`），自动适配任意 surface。
- **Brand**：`--brand-primary / hover / light / tint / tint-hover`。
- **Feedback**：`--color-success / warning / danger / info`。
- **Content**（namespace `--content-*`）：`--content-code-inline-bg / code-bg / quote-bg`。Markdown 内容域，与 UI `--bg-*` 隔离。Inline/Block 拆分；Code ≠ Quote（API 独立，值暂同源）。其余（mark / kbd / table / math / diagram）Rule of Three 出现再建。
- **Focus**：`--focus-ring-width / color / offset`。Always Visible（§9）。

### 1.3 Component

按 Rule of Three 抽取。现有：`--gradient-brand`（`linear-gradient(135deg, --brand-500, --secondary-500)`，Login + Unauthorized 复用）。

---

## 2. Foundation

### 2.1 Color

见 §1。**禁止在组件里写 `#ffffff` / `#1e1e1e` / `rgba(...)` 原值**——用 Semantic token。白字 on brand 用 `--text-on-brand`，不用 `#fff`。Border 用 `--border-color`（已含 opacity）。Text 存最终色不存 alpha；Border 用 opacity 不用实色（ADR-002 Alternative B / §2）。

### 2.2 Typography

`--text-*` 专属颜色。字号、行高、字重独立：

| 类别 | Token |
|---|---|
| 字号 | `--font-size-xs` (12) / `sm` (14) / `base` (16) / `lg` (18) / `xl` (20) / `2xl` (24) / `3xl` (30) / `4xl` (36) / `5xl` (48) |
| 行高 | `--line-height-tight` (1.2) / `normal` (1.5) / `relaxed` (1.8) |
| 字重 | `--font-weight-normal` (400) / `medium` (500) / `semibold` (600) / `bold` (700) |

### 2.3 Spacing

`--space-1` (4) / `2` (8) / `3` (12) / `4` (16) / `5` (20) / `6` (24) / `8` (32) / `10` (40) / `12` (48) / `16` (64)。**禁止 magic number**。

### 2.4 Radius

`--radius-sm` (4) / `md` (6) / `lg` (8) / `xl` (12)。

### 2.5 Shadow

`--shadow-sm` / `md` / `hover`。暗色下自动加深（见 §3）。Dark 下 shadow 几乎不可见，不靠它分层（ADR-002 §4 Theme Budget 允许 shadow 变化）。

### 2.6 Motion

| Token | 值 | 用途 |
|---|---|---|
| `--motion-fast` | 150ms | 即时反馈 |
| `--motion-normal` | 250ms | 状态变化 |
| `--motion-slow` | 350ms | 布局变化 |
| `--ease-standard` | cubic-bezier(0.16, 1, 0.3, 1) | ease-out-expo |
| `--ease-out-quart` | cubic-bezier(0.25, 1, 0.5, 1) | 平滑减速 |

> `--transition-fast/base/slow` 为 legacy 稳定 API（150/200/300ms）。Interaction（hover/active/focus/selected）是 Behavior，归 Motion + Surface `raised`，**不抽 color token**（ADR-002 §9）。

---

## 3. Theme Mapping

> **Theme = Semantic Mapping.** 亮/暗共享同一套 Semantic API，只换指向。Theme 是 data，不是 stylesheet（未来 `theme/*.ts` → CSS，ADR-002 §3）。

亮色（`:root`）：Surface → Neutral，Text → dark-on-light，Border → black alpha，Brand → `--brand-500`。

暗色（`[data-theme='dark']`）：

| Domain | 亮色 | 暗色 |
|---|---|---|
| Surface page | `#f0eef5`（lavender atmosphere） | `--ink-950` |
| Surface chrome | `--neutral-50` | `--ink-900` |
| Surface card | `--neutral-0` | `--ink-800` |
| Surface raised | `--neutral-100` | `--ink-700` |
| Surface sunken | `--neutral-100` | `--ink-850` |
| Text primary | `--neutral-800` | `#e9eaed` |
| Text secondary | `--neutral-700` | `#b3b5bc` |
| Text muted | `--neutral-500` | `#8a8c95` |
| Text on-brand | `--neutral-0` | `--neutral-0`（不变） |
| Border default | `rgba(0,0,0,.12)` | `rgba(255,255,255,.08)` |
| Brand primary | `--brand-500` | `--brand-400` |

`--bg-*` / `--content-*` / `--gradient-brand` / `--focus-ring-color` 路由 surface/brand，自动跟随，暗色无需重声明。

> 暗色由 `<html data-theme="dark">` + `.dark` 类（Element Plus）激活，`src/stores/theme.ts` 切换。

---

## 4. Theme Budget

Theme 只改 atmosphere，不改 structure（ADR-002 §4）。

| 允许变化 | 禁止变化 |
|---|---|
| Surface / Text / Border / Brand Tint / Shadow | Spacing / Radius / Font / Motion / Component / Layout |

「Dark Mode 顺便改圆角」= scope creep，拒绝。

---

## 5. Component Agnostic

> Components should never know whether they are in Light or Dark mode.

组件一律 `var(--surface-card)` / `var(--text-primary)`，**禁止** `:root.dark .x { ... }` 主题分支。Theme 是 Data，Component 是 Consumer。

---

## 6. Component Foundation

现有：`AppNavbar` / `BlogLayout3Col` / `SidebarLeft` / `SidebarRight` / `BackToTop` / `ThemeToggle` / `GlobalLoading` / `ReadingProgress`。

新增组件优先复用；确实需要新组件时走 §7 Governance。组件样式用 Semantic Token，不直连 Primitive。

---

## 7. Design Governance

新 UI 需求决策流（ADR-001 §5）：

```
新 UI → 有现成 Token? → 用
       ↓ NO
       有现成 Component? → 用
       ↓ NO
       更新 DESIGN.md + styles/index.scss → 改/建 Component → 业务页
```

**禁止**：业务页写 `#ffffff` / `18px` / 新颜色 / 新阴影。先回 Design System。

### Third-party Integration（ADR-003）

第三方组件通过 **Adapter** 接入，**绝不直接塑造 Design System**。

- **Adapter 位置**：`src/styles/adapters/<lib>.scss`（全局生效，不进组件 scoped）。
- **方向**：Semantic → 第三方变量（单向）。第三方消费我方 token，不反向。
- **流程**（接入前必走）：① Visual Inventory → ② Visual Object → Semantic Domain 映射 → ③ Adapter。
- **5-Question 自检**：① 有哪些 Visual Object？② 属于哪个 Semantic Domain？③ 哪些真需覆盖？④ 哪些保持默认？⑤ Adapter 是否只是映射？（否 = 已被第三方牵着走）
- **禁止**：用第三方 theme prop 切外来调色盘；为第三方扩展 Token；组件内 `:deep()` 持颜色映射。
- 换库 → 删 adapter → 写新 adapter，Design System 零改动。

---

## 8. Evolution Rules

- **Rule of Three**：第一次复制 → 复制；第二次 → 观察；第三次 → 抽 Token。
- **新增 Semantic** 需 ≥2 组件用。
- **新增 Component Token** 需 ≥2 状态共享。
- **新增 Primitive** 仅当现有色阶无法满足 Semantic。
- **废弃 Token** 走 deprecate：标记 `@deprecated` + 替代项，留一周期再删。例：`--text-tertiary` → `--text-muted`。
- **Palette 完整可超前**；Semantic / Component 严格 Rule of Three。

---

## 9. Accessibility Constraints

WCAG 是 Architecture Constraint（ADR-002 §7），任何 token 修改不得突破：

| Token | 最低对比度（on `--surface-card`） |
|---|---|
| `--text-primary` | ≥ 7:1（AAA） |
| `--text-secondary` | ≥ 4.5:1（AA） |
| `--text-muted` | ≥ 3:1（仅大字/非关键） |
| Interactive | ≥ 4.5:1 |
| Focus Ring | Always Visible |

`--text-muted` 不用于正文。

---

## 10. Foundation Freeze

ADR-001 冻结 Token 三层；ADR-002 v3 freeze Theme Architecture。Freeze 后不再讨论架构本身，精力转向实现。

Freeze 不是"不能改"，而是"改要走治理"：
- 调 Primitive 值（如品牌换色）→ 改 Primitive，Semantic / 组件不动。
- 新增 Semantic → 走 §8。
- 重命名 Semantic → 默认拒绝；确有必要需强理由 + 全仓 sweep + 文档。

---

## 11. UI Task Review Matrix

UI / Theme / Component / Style 类任务，实现前过一遍：

| 项 | 检查 |
|---|---|
| Product Identity | 符合 `PRODUCT.md` |
| Design Principles | 符合 `PRODUCT.md` |
| Semantic Token | 用 Semantic，没直连 Primitive / 写 hex |
| Foundation | spacing / radius / shadow / motion 用 scale，无 magic number |
| Component | 复用现成组件，不重造 |
| Theme | light / dark 都过；组件无 theme 分支 |
| Accessibility | 对比度 ≥ §9 约束；focus 可见 |
| Theme Budget | 只改 atmosphere 不改 structure |
| Third-party | 走 Adapter（ADR-003），不直接覆盖、不扩展 Token、不用 theme prop 切外来盘 |

全符合才开工。缺 Token / 规范 → 先更 Design System（§7）。

---

## 12. Success Criterion + Manifesto

> **Design System 应该减少决策，而不是增加决策。**

验收：连续做几个功能时，大多数时候只是 `var(--brand-primary)` / `var(--space-4)` / `var(--radius-md)` 拿来用，不新增任何东西。

### 优先级：Reuse > Extend > Redesign

1. **Reuse**：先找现成 Token / 组件。
2. **Extend**：确实没有，走 §7 Governance。
3. **Redesign**：改已有 Token / 组件，最后手段。

> Every abstraction should pay for itself.

### Manifesto（ADR-002 §10）

> **Dark Mode is not Light Mode with inverted colors.** It has its own hierarchy, surface model, and reading rhythm — while sharing the same semantic API.
>
> **Themes express different atmospheres, not different interfaces.**
>
> **A theme changes perception, never structure.**
>
> **Every visual decision should improve readability, hierarchy, or interaction — or it doesn't belong.**

---

## 维护原则

- **地图而非手册**：细节放链接文档，避免上下文膨胀。
- **Bad case 驱动**：AI 每犯一次错，判断是否补规则。
- **同步**：本文与 `ADR-001` / `ADR-002` / `src/styles/index.scss` 一致，改一处同步其余。
