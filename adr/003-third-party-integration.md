# ADR-003: Third-party Integration Architecture — Adapter Layer

- **Date**: 2026-07-05
- **Status**: Accepted
- **Extends**: ADR-001, ADR-002

## Decision

第三方组件(md-editor / Element Plus / Monaco / Mermaid / KaTeX / TipTap / CodeMirror / ECharts…)通过 **Adapter 层**接入，**绝不直接塑造 Design System**。

架构流变为：

```
Product → Design → Semantic → Adapter → Third-party → Component
```

Adapter 是 **Integration Layer**——既不属于 Token，也不属于 Component。它是单向映射层：**Semantic → Third-party API**（不是我方去适配第三方，是第三方消费我方 token）。

### 接入流程（任何第三方组件必走）

**① Visual Inventory** — 列组件的视觉对象，与实现无关。不打开源码，先画出来。

```
md-editor 示例:
Toolbar / Footer / Editor / Preview / Divider / Scrollbar
Block code / Inline code / Quote / Table / Link / Heading / Image / TaskList
```

**② Visual Object → Semantic Domain 映射** — 这一步是设计，完全不提第三方。用我方设计语言回答「这个视觉对象属于哪个 Domain」。

| Visual Object | Semantic Domain |
|---|---|
| Toolbar / Footer | Surface → Chrome |
| Editor / Preview | Surface → Card |
| Divider / Frame | Border |
| Scrollbar | Border |
| Block code | Content → Code |
| Inline code | Content → Inline Code |
| Quote | Content → Quote |
| Table | Content → Table |
| Link | Brand |
| Heading / Strong / Em | Text |

**③ Adapter** — 这一步才研究第三方的 CSS 变量 API，写映射。方向固定：Semantic → 第三方变量。

```scss
// adapters/md-editor.scss
.md-editor {
  --md-bk-color: var(--surface-card);          // Surface → Card
  --md-theme-code-bg-color: var(--content-code-bg);  // Content → Code
  --md-theme-link-color: var(--brand-primary);       // Brand
}
```

### 5-Question Review Matrix（接入第三方前必答）

```
① 有哪些 Visual Object？
② 属于哪个 Semantic Domain？
③ 哪些 Domain 真需要覆盖？
④ 哪些保持默认？
⑤ Adapter 是否只是映射？（若否，说明已被第三方牵着走）
```

第五题答「否」= Design System 已输。

### 两条硬性原则

> **Third-party libraries must be integrated through adapters, never directly shape the Design System.**

> **任何第三方组件接入前，先完成 `Visual Object → Semantic Domain` 映射；只有完成映射后，才能编写 Adapter。禁止直接根据第三方库的 CSS Variables 设计或扩展 Token。**

### Adapter 位置

`src/styles/adapters/<lib>.scss`。每库一个：`md-editor.scss` / `element-plus.scss` / `monaco.scss` / `mermaid.scss` / `katex.scss`。换库 → 删 adapter → 写新 adapter，Design System 零改动。

## Context

ADR-002 落地后，接入 md-editor 时两次犯错：

1. **Black-hole**：放任 md-editor 自带 github-theme dark bg（`#0d1117`）比 `--surface-card` 暗，文章区成黑洞。修法：neutralize bg。
2. **theme=dark 偷懒**：编辑器用 `theme="dark"` 切到 md-editor 自带暗色调色盘，**没接入我方 color system**——chrome/preview 用的是 `--md-color-bg` 等外来色，不是 `--surface-*`/`--text-*`。

根因：从「第三方有哪些 CSS Variables」出发（Third-party → Semantic），方向反了。每来一个组件都重新研究其变量表，Design System 被第三方塑造。今天 md-editor，明天 EP/Monaco/Mermaid，无限重蹈。

正解：建立 Adapter 层，流程固定为 Visual Inventory → Semantic Domain 映射 → Adapter。第三方永远是消费者，不是设计者。

## Alternatives Considered

### A. 组件内直接 `:deep()` 覆盖第三方变量

**Rejected**。把颜色映射耦合进组件；组件围着第三方 API 设计；无法复用（MdPreview 与 MdEditor 各写一遍）；换库 = 重写组件。且容易偷懒只覆盖部分变量，残留外来色。

### B. 用第三方 theme prop / 外来调色盘（`theme="dark"`）

**Rejected**。第三方用自带颜色，绕过我方 color system。这是我两次犯的错——「切到 dark」≠「接入我方 token」。CodeMirror 语法高亮等非颜色用途可保留 theme prop，但颜色必须走 Adapter。

### C. 为第三方扩展 Token（加 `--md-*` 进我方 token 体系）

**Rejected**。让第三方塑造 Design System，违反核心原则。我方 token 只回答「我方设计语言的语义」，不回答「第三方要什么变量」。

### D. Adapter 双向（也把第三方变量暴露给我方）

**Rejected**。Adapter 严格单向 Semantic → 第三方。双向 = 我方开始依赖第三方 API 形态，失去替换自由。

## Consequences

- **正向**：换库只重写 adapter，Design System 零改动；第三方永不塑造 token；所有库颜色一致（都消费同一套 Semantic）；新库接入走同一流程，可审计；adapter 集中在 `adapters/`，易盘点。
- **代价**：每库一个 adapter 文件；需纪律不跳过 5-Question 流程；adapter 内变量映射需随第三方版本更新（第三方 breaking change 时）。
- **约束**：
  - Adapter 只在 `src/styles/adapters/` 下，全局生效（不进组件 scoped）。
  - Adapter 方向固定 Semantic → 第三方，禁反向。
  - 接入前必须完成 Visual Object → Semantic Domain 映射，写入 adapter 注释。
  - 组件不持颜色映射，只持 layout（border/radius/size）。
  - 第三方 theme prop 仅用于非颜色用途（如 CodeMirror 语法高亮 light/dark）。

## References

- `ADR-001` — 三层 Token Architecture
- `ADR-002` — Theme Architecture（§5 Component Agnostic 本 ADR 的前置）
- `src/styles/adapters/md-editor.scss` — 首个 adapter（范本）
- `DESIGN.md` — Design System 镜像（将按本 ADR 加 Adapter 层 + 5-Question Review Matrix）
