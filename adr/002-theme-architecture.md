# ADR-002: Theme Architecture — Semantic Domains + Dark Mode Foundation

- **Date**: 2026-07-05
- **Status**: Accepted
- **Extends**: ADR-001

## Decision

将 Semantic 层从「扁平 token 集」重组为 **Namespace Domains**，并建立 Dark Mode 自有的 Surface 模型。三层架构（ADR-001）不变，Semantic 内部按 Domain 划分：

```
Primitive (Brand / Neutral / Ink / State)
    ↓
Semantic (Namespace Domains)
    ├── Surface     : page / chrome / card / raised / sunken
    ├── Text        : primary / secondary / muted / placeholder
    ├── Border      : default / strong
    ├── Brand       : primary / hover / tint
    ├── Feedback    : success / warning / danger / info
    ├── Interaction : hover / active / focus / selected
    └── Content     : code / quote / callout / table / selection / mark
    ↓
Component (Rule of Three)
    ↓
Page
```

七条核心决策：

1. **Surface 是 Semantic Domain，不是独立层**。`--surface-page/chrome/card/raised/sunken` 带角色语义，本就属于 Semantic。独立成层会产生「Surface 算 Foundation 还是 Semantic」的永久歧义。
2. **Content Domain 独立，namespace `--content-*`**。Markdown 内容（code/quote/callout/table/mark/selection）与 UI 组件（Button/Card/Layout）分离，避免 `--bg-*` 膨胀。
3. **Code ≠ Quote**。Code 是技术内容，Quote 是阅读辅助，API 分离（即使值暂同源）。Callout 下辖 tip/warning/info/danger；Quote 永远只是引用。
4. **Chrome 是 Surface 角色**。Navbar / Sidebar / Search / Command Palette / Dropdown 统一 `--surface-chrome`，独立于 Page 与 Card。
5. **Border = opacity，不是实色**。`rgba(255,255,255,.08)`（暗）/ `rgba(0,0,0,.12)`（亮），自动适配任意 surface，安静不割裂。
6. **Text 存最终颜色，不存 alpha**。`--text-primary` 持最终 color，不持 `--text-alpha-*`。Token 保存「最终设计决策」，不保存推导过程——alpha 会在 bg 变化时（glass / overlay / modal / drawer）让文字飘移。参考 GitHub Primer / Apple / Linear / Vercel。
7. **Ink 一次建完整 Palette（50-950）**。Palette 是基础设施，可超前——避免以后补 750/850/920 这种丑色阶。亮色暂不用 Ink（留在 Neutral），但色阶完整。

**Manifesto**（写入 DESIGN.md）：

> Dark Mode is not Light Mode with inverted colors. Dark Mode has its own hierarchy, surface model, and reading rhythm — while sharing the same semantic API.

## Context

ADR-001 建立三层架构后，Dark Mode 暴露三个问题：

1. 暗色 surface 是纯灰（`#1a1a1a` / `#232323` / `#2a2a2a`），无冷色温、无层级感，等同「黑+灰+白」。
2. 代码块硬编码 `#1e1e1e`（`src/views/ArticleDetail.vue:555`）、`#d4d4d4`（`:563`），亮暗同色——暗色下与 card `#1a1a1a` 几乎无分层；且违反 DESIGN.md §2.1「禁止组件写 hex」。
3. Border 暗色 `#363636` 实色偏重；Text `#f5f5f5` ≈96% 偏亮，长时间阅读疲劳。

讨论从「怎么做 Dark Mode」升级到「怎么设计 Theme Architecture」。参考 GitHub Dark 的**设计思想**（非颜色）：Surface hierarchy、never pure black/white、brand sparse、code independent、quiet borders、reading before decoration。结合 `PRODUCT.md`「编辑式专业」定位（正文是主角，代码不抢），定出本架构。

## Alternatives Considered

### A. Surface 作为独立 Foundation 层（Primitive → Surface → Semantic → …）

**Rejected**。`--surface-card` 已带角色语义，本就是 Semantic。独立成层引入「Surface 算 Foundation 还是 Semantic」的永久歧义。Surface = Semantic 的一个 Domain。

### B. Text Alpha 抽 Token（`--text-alpha-primary: 0.92` + `rgba(255,255,255, var(...))`）

**Rejected**。Token 应保存最终设计决策，非推导过程。alpha 会让文字随 bg 变化（glass / overlay / modal / drawer）而飘移。GitHub / Apple / Linear / Vercel 均存最终颜色。Material 风格的 alpha 推导在 Web Design 收益不足。

### C. Ink 只定义 700-950（暗色段）

**Rejected**。Palette 是基础设施，应一次补齐 50-950。避免以后补 750/850/920 等丑色阶。未用色阶不增维护成本——超前建设 Palette 是合理的，因为它不会增加日常决策负担。

### D. `--bg-code` / `--bg-callout` 命名

**Rejected**（改用 `--content-*` namespace）。未来 table / kbd / mark / selection / math / diagram / terminal 会让 `--bg-*` 膨胀混乱。`--content-*` 一眼可知是 Markdown 内容域，与 Button / Card / Layout 的 `--bg-*` 隔离。

### E. Code = Quote 共用 `--bg-sunken`

**Rejected**。Code（技术内容）与 Quote（阅读辅助）语义不同，API 分离。Callout 下辖 tip / warning / info / danger，Quote 永远只是引用。即使值暂同源，API 独立以便未来分化无需改组件。

### F. 改 `--neutral-*` 高段为冷调（替代新建 Ink）

**Rejected**。`--neutral-700/800` 亮色也在用（text-secondary / border），改值会带冷亮色。Ink 独立 Palette，亮色零影响，dark/light 解耦。

## Consequences

- **正向**：5 年稳定的 Theme Architecture；新增主题 / 品牌色 / 组件无需改结构；Content / Interaction Domain 防止 `--bg-*` 膨胀；Chrome 统一系统 UI；opacity border 适配任意 surface；final-color text 在 glass / overlay 稳定；亮暗共享 Semantic API，只换指向。
- **代价**：Ink 50-600 暂未用（Palette 基础设施，可接受）；token 数量增加，需文档化；`--bg-*` → `--surface-*` 路由是一层 indirection（角色解耦的合理代价）。
- **约束**：
  - `--surface-*` = surface 角色（page / chrome / card / raised / sunken）
  - `--content-*` = Markdown 内容域（code / quote / callout / table / mark / selection）
  - `--interaction-*` = 交互状态（hover / active / focus / selected）
  - `--bg-*` = 既有公开 API，路由 `--surface-*`，Stable API 不破（组件零改动）
  - 亮色留 Neutral，暗色走 Ink；Text 存最终色，不存 alpha
- **分阶段**：
  - **Phase 1**：Ink 全 palette、Surface / Content / Interaction Domain、`--bg-*` 路由、Border opacity、Text final color、Chrome、ArticleDetail 修硬编码、DESIGN.md §1 重写 + manifesto。
  - **Phase 2**：shadow / blur 路由 `--surface-*`（统一 bg + elevation + blur）；`--content-mark` / `--content-table` / `--content-selection` 等按 Rule of Three 出现再建。

## References

- `ADR-001` — 三层 Token Architecture（本 ADR 扩展其 Semantic 层）
- `DESIGN.md` — Design System 描述镜像（§1 将按本 ADR 重写）
- `src/styles/index.scss` — Token 实现（Phase 1 落地）
- `PRODUCT.md` — 「编辑式专业」定位（正文主角，代码不抢）
- `AGENTS.md` / `CLAUDE.md` §0.5 — Design System 治理
