# ADR-002: Theme Architecture — Semantic Domains + Dark Mode Foundation

- **Date**: 2026-07-05
- **Status**: Accepted (v3 — Frozen)
- **Extends**: ADR-001

## Decision

ADR-001 建立 `Primitive → Semantic → Component` 三层。本 ADR 扩展 Semantic 层：从扁平 token 集重组为 **Namespace Domains**，并建立 Dark Mode 自有的 Surface 模型 + 跨主题约束。架构定格为十条：

### 1. Primitive

Palette 是基础设施，一次建完整，不建半段。

- `Brand 50-900`、`Neutral 0-950`（ADR-001 既有）
- `Ink 50-950`（**新增**，cool indigo-gray，暗色专用；亮色暂留 Neutral，但色阶完整——超前建设可接受）
- `Success / Warning / Danger / Info 500`

> Palette 不带用途：`--ink-900` 是色阶位，不是「page」。「page」是 Semantic 的角色。

### 2. Semantic Domains

Semantic 是 Namespace。每个 Domain 管一类**同维度**角色：

```
Background
  Surface (空间层级) : page / chrome / card / raised / sunken
Text      (信息层级) : primary / secondary / muted / placeholder
Border              : default / strong
Brand               : primary / hover / tint
Feedback            : success / warning / danger / info
Content             : inline (mark / kbd / code-inline)
                      block (code / quote / callout / table / math / diagram)
```

- **Surface 是 Background 域的子系统，不与 Text 并列**。Surface = 空间层级（page/chrome/card/raised/sunken），Text = 信息层级——不同维度，不混。未来 Elevation 扩展（Glass / Overlay / Drawer / Popover / Sheet）归入 Background 域，不新增并列 Domain。
- `--surface-*`：surface 角色。`raised` = 最亮层（hover/active 视觉抬升），`sunken` = 比 card 暗 1 步（code/quote）。
- `--bg-*`（ADR-001 既有 API）路由 `--surface-*`，Stable API 不破。
- `--content-*`：Markdown 内容域，与 UI 组件（Button/Card/Layout）隔离。
- **Interaction 不在此列**（见 §9 Governance）。

### 3. Theme Mapping

> **Theme = Semantic Mapping.**

主题不是 CSS，是「Semantic → Primitive 的指向表」。亮/暗共享同一套 Semantic API，只换指向：

```scss
[data-theme='light'] { --surface-card: var(--neutral-0); ... }
[data-theme='dark']  { --surface-card: var(--ink-800);   ... }
```

未来 GitHub / Dracula / Solarized / Nord / Tokyo Night / Sepia / OLED = 加一个 mapping，组件零修改。**Theme 是 Data，不是 stylesheet。**

> **Future: Theme definitions should remain data-driven.** 当前用 CSS `[data-theme]` 实现；长期方向是 `theme/light.ts` / `theme/dark.ts` → 生成 CSS variables。Theme 越来越像 data，不是 stylesheet。现在不做，但 ADR 锁定方向——避免 Theme CSS 无限膨胀。

### 4. Theme Budget

Theme 只改 atmosphere，不改 structure。

| 允许变化 | 禁止变化 |
|---|---|
| Surface / Text / Border / Brand Tint / Shadow | Spacing / Radius / Font / Motion / Component / Layout |

> 「Dark Mode 顺便把按钮圆角改一下」「Dark Theme 顺便 Header 高一点」= scope creep，拒绝。Theme 是 atmosphere 的映射，不是 layout 的二次设计。GitHub 隐式遵循此约束，本 ADR 显式写出。

### 5. Component Agnostic

> **Components should never know whether they are in Light or Dark mode.**

组件一律 `var(--surface-card)` / `var(--text-primary)`，**禁止** `:root.dark .button { ... }` 这类主题分支。主题切换 100% 在 Semantic mapping 层完成。**Theme 是 Data，Component 是 Consumer。** 未来 Light / Dark / Brand / High-Contrast 全部由 Theme Provider 解决，组件 100% unaware。

### 6. Content Domains

Markdown 内容按渲染形态拆 Inline / Block：

| 形态 | 成员 | 例 |
|---|---|---|
| Inline | mark / kbd / code-inline | 行内高亮、键帽、行内代码 |
| Block | code / quote / callout / table / math / diagram | 代码块、引用、提示框、表格、公式、Mermaid |

- **Code ≠ Quote**：Code 是技术内容，Quote 是阅读辅助，API 分离（即使值暂同源）。
- **Callout 下辖** tip / warning / info / danger；Quote 永远只是引用。
- 按需落地（Rule of Three）：Phase 1 只建 `--content-code-inline-bg` / `--content-code-bg` / `--content-quote-bg`；mark / kbd / table / math / diagram 出现用例再建，namespace 预留。

### 7. Stable API

`--bg-*`（ADR-001 既有公开 API）路由 `--surface-*`，**不重命名、不破坏**：

```scss
--bg-page:    var(--surface-page);
--bg-primary: var(--surface-card);
--bg-navbar:  color-mix(in srgb, var(--surface-chrome) 80%, transparent);
```

组件代码零改动。Semantic rename 默认拒绝（继承 ADR-001 Stable API Principle）。

### 8. Accessibility Constraints

WCAG 是 **Architecture Constraint**，不是「以后再说」。任何 token 修改不得突破：

| Token | 最低对比度（on `--surface-card`） | 级别 |
|---|---|---|
| `--text-primary` | ≥ 7:1 | AAA（正文耐读） |
| `--text-secondary` | ≥ 4.5:1 | AA |
| `--text-muted` | ≥ 3:1 | 仅大字/非关键 |
| Interactive text / icon | ≥ 4.5:1 | AA |
| Focus Ring | **Always Visible** | 不靠颜色单独传达语义 |

> PRODUCT.md 底线 AA；本 ADR 把 Primary 提到 AAA（≥7:1），契合「编辑式专业 / 阅读优先」。`--text-muted` 仅用于非关键大字，**不用于正文**——避免「靠纯灰文字做优雅」反模式。

### 9. Design Governance

继承 ADR-001 §5 Governance + Evolution Rules，并明确：

- 新增 Semantic 需 ≥2 组件用；新增 Component Token 需 ≥2 状态共享（Rule of Three）。
- **Interaction 不走 Color Token**——hover / active / focus / selected 是 **Behavior**，由 Surface 角色（`raised`）+ Motion + Border + Shadow 组合表达，不是单色。Interaction 的 duration / focus-ring / transition / press-scale 归 **Motion Foundation**（`--motion-*` / `--ease-*`，ADR-001 既有）。GitHub 亦如此：`canvas-subtle` / `button-hover` 是角色色，不是 `interaction-hover`。
- Palette 完整可超前；Semantic / Component token 严格 Rule of Three。

### 10. Manifesto

> **Dark Mode is not Light Mode with inverted colors.** It has its own hierarchy, surface model, and reading rhythm — while sharing the same semantic API.
>
> **Themes express different atmospheres, not different interfaces.** Light 与 Dark 同样舒适，但布局、组件、间距、层级全部一致——只有 atmosphere 不同。
>
> **A theme changes perception, never structure.** Theme 可改温度、冷暖、深浅、氛围、阅读感；不可改 padding、radius、typography、spacing、layout。

## Context

ADR-001 落地三层架构后，Dark Mode 暴露三个问题：

1. 暗色 surface 纯灰（`#1a1a1a` / `#232323` / `#2a2a2a`），无冷色温、无层级感，等同「黑+灰+白」。
2. 代码块硬编码 `#1e1e1e`（`src/views/ArticleDetail.vue:555`）、`#d4d4d4`（`:563`），亮暗同色——暗色下与 card 几乎无分层；违反 DESIGN.md §2.1「禁止组件写 hex」。
3. Border 暗色 `#363636` 实色偏重；Text `#f5f5f5` ≈96% 偏亮，长读疲劳。

讨论从「怎么做 Dark Mode」升级到「怎么设计 Theme Architecture」。参考 GitHub Dark 的**设计思想**（非颜色）：Surface hierarchy、never pure black/white、brand sparse、code independent、quiet borders、reading before decoration。结合 `PRODUCT.md`「编辑式专业」定位（正文主角，代码不抢），定出本架构。

v2→v3 修订：Surface 从并列 Domain 改为 Background 域子系统（维度一致性：空间层级 vs 信息层级）；新增 Theme Budget（scope guardrail）；Theme Mapping 锁定 data-driven 长期方向；Manifesto 加「A theme changes perception, never structure」。

## Alternatives Considered

### A. Surface 作为独立 Foundation 层

**Rejected**。`--surface-card` 带角色语义，本就是 Semantic。独立成层引入「Surface 算 Foundation 还是 Semantic」永久歧义。

### B. Text Alpha 抽 Token（`--text-alpha-primary: 0.92` + `rgba(...)`）

**Rejected**。Token 存最终设计决策，非推导过程。alpha 会让文字随 bg 变化（glass / overlay / modal / drawer）飘移。GitHub / Apple / Linear / Vercel 均存最终颜色。

### C. Ink 只定义 700-950（暗色段）

**Rejected**。Palette 是基础设施，一次补齐 50-950。避免以后补 750/850/920 丑色阶。未用色阶不增维护成本。

### D. `--bg-code` / `--bg-callout` 命名

**Rejected**（改 `--content-*` namespace）。未来 table / kbd / mark / selection / math / diagram / terminal 会让 `--bg-*` 膨胀。`--content-*` 隔离 Markdown 内容域。

### E. Code = Quote 共用 `--bg-sunken`

**Rejected**。Code（技术内容）与 Quote（阅读辅助）语义不同，API 分离。即使值暂同源，未来分化无需改组件。

### F. 改 `--neutral-*` 高段为冷调（替代新建 Ink）

**Rejected**。`--neutral-700/800` 亮色也在用，改值会带冷亮色。Ink 独立 Palette，亮色零影响。

### G. Interaction 作为 Semantic Color Domain

**Rejected**。hover / active / focus / selected 不是单色 token，是 Surface + Motion + Border + Shadow 的组合 Behavior。强行抽 `--interaction-hover` 色会与 `--surface-raised` 重复且失真。Interaction 归 Motion Foundation，颜色由 Surface `raised` 角色承担。

### H. Surface 作为与 Text 并列的 Semantic Domain（v2 方案）

**Rejected**（v3 修正）。Surface（空间层级）与 Text（信息层级）不同维度，并列混维。Surface 改为 Background 域子系统；未来 Elevation（Glass / Overlay / Drawer / Popover / Sheet）归入 Background，不新增并列 Domain。

## Consequences

- **正向**：5-10 年稳定 Theme Architecture；新增主题 / 品牌色 / 组件无需改结构；Content namespace 防 `--bg-*` 膨胀；Chrome 统一系统 UI；opacity border 适配任意 surface；final-color text 在 glass / overlay 稳定；组件 theme-agnostic；Theme Budget 防 scope creep；WCAG 约束内置不可突破。
- **代价**：Ink 50-600 暂未用（Palette 基础设施，可接受）；token 数量增加，需文档化；`--bg-*` → `--surface-*` 是一层 indirection（角色解耦的合理代价）。
- **约束**：
  - `--surface-*` = Background 域 spatial 角色；`--content-*` = Markdown 内容；`--bg-*` = 既有 API 路由 surface
  - 亮色留 Neutral，暗色走 Ink；Text 存最终色，不存 alpha
  - 组件禁止 theme 分支；Interaction 不走 color token
  - Theme Budget（§4）：只改 atmosphere 不改 structure
  - WCAG（§8）不可突破
- **分阶段**：
  - **Phase 1**：Ink 全 palette、Background/Surface 域、Content Domain、`--bg-*` 路由、Border opacity、Text final color、Chrome、ArticleDetail 修硬编码、DESIGN.md §1 重写 + manifesto。
  - **Phase 2**：shadow / blur 路由 `--surface-*`（统一 bg + elevation + blur）；`--content-mark` / `--content-kbd` / `--content-table` / `--content-math` / `--content-diagram` 按用例出现再建；Theme data-driven（`theme/*.ts` → CSS）；多主题（Dracula / Solarized 等）按需加 mapping。

## References

- `ADR-001` — 三层 Token Architecture（本 ADR 扩展其 Semantic 层）
- `DESIGN.md` — Design System 描述镜像（§1 将按本 ADR 重写）
- `src/styles/index.scss` — Token 实现（Phase 1 落地）
- `PRODUCT.md` — 「编辑式专业」定位
- `AGENTS.md` / `CLAUDE.md` §0.5 — Design System 治理
