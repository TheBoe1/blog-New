# ADR-001: Design Foundation — 三层 Token Architecture

- **Date**: 2026-07-04
- **Status**: Accepted

## Decision

建立 **Primitive → Semantic → Component** 三层 Token Architecture。

- Primitive 用 brand-centric 命名（`--brand-50..900`、`--neutral-0..950`、`--success|warning|danger|info-500`）。
- Semantic 引用 Primitive（`--brand-primary: var(--brand-600)`），暗色只换 Semantic 指向。
- Component Token 默认空，按 Rule of Three 按需抽取。
- Semantic Token 视为公开 API，不重命名（Stable API Principle）。

## Context

项目已有 83 个 CSS 变量（`src/styles/index.scss`），但为一层结构——Semantic 直接持有 raw hex，无 Primitive 层、无 Component 层。存在三个问题：

1. 品牌换色相时，Semantic 里的 raw hex 要逐处改。
2. DESIGN.md 用 `editorial-blue` / `ink` / `paper`，代码用 `--brand-primary` / `--text-primary` / `--bg-primary`——文档与实现 drift。
3. Typography 的 `--text-xs`（字号）与 `--text-primary`（颜色）重名，语义混乱。

## Alternatives Considered

### A. Tailwind 色名（`--blue-500`）

**Rejected**。Color-centric——品牌从蓝换紫时，`--blue-500` 实际变紫，token 名失效。Primitive 必须 brand-centric。

### B. 全量 `--color-*` 前缀 rename（`--color-primary` / `--color-text-primary`）

**Rejected**。现有 Semantic 名已 brand-centric，满足核心诉求；rename 是 200+ 处 churn，低 ROI。Stable API Principle：Semantic 是公开 API，不为命名统一而大规模重命名。

### C. 预建 Component Token（`--button-bg` / `--card-bg` 等）

**Rejected**。过早抽象。Rule of Three：第三次重复才抽，不预建。

### D. 拆分 `styles/index.scss` 为 `tokens/` 多文件

**Deferred**。83 个 token 单文件足够；待 200+ 且单文件难维护时再做。

## Consequences

- **正向**：暗色模式只换 Semantic 指向，组件代码零改动；品牌换色相只改 Primitive 值，token 名不变；Typography `--text-*` 专属颜色，字号用 `--font-size-*`，消解重名。
- **代价**：neutral 色阶含半步（150/450/650/825）以保历史精确值，色阶不完全均匀——可后续整理。
- **约束**：业务组件禁止直连 Primitive；新增 Token 走 Governance（DESIGN.md §5）；新增 Design Rule 需解决真实出现过 ≥2 次的问题（避免规范膨胀）。

## References

- `DESIGN.md` — Design System 描述镜像
- `src/styles/index.scss` — Token 实现
- `AGENTS.md` / `CLAUDE.md` §0.5 — Design System 治理（Token 铁律 + Review Matrix）
