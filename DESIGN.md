---
name: 我的博客
description: 个人技术博客，编辑式专业的写作与实践笔记
colors:
  editorial-blue: "#2563eb"
  editorial-blue-hover: "#1d4ed8"
  editorial-blue-soft: "#2563eb1a"
  ink: "#111827"
  ink-secondary: "#6b7280"
  ink-tertiary: "#9ca3af"
  paper: "#ffffff"
  paper-secondary: "#f9fafb"
  paper-tertiary: "#f3f4f6"
  paper-hover: "#f3f4f6"
  rule: "#e5e7eb"
  rule-strong: "#d1d5db"
  success: "#16a34a"
  warning: "#ca8a04"
  danger: "#dc2626"
  info: "#0891b2"
typography:
  display:
    fontFamily: "Inter, 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Inter, 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
components:
  button-primary:
    backgroundColor: "{colors.editorial-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.editorial-blue-hover}"
  button-secondary:
    backgroundColor: "{colors.paper-tertiary}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.rule}"
  input-base:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  card-article:
    backgroundColor: "{colors.paper-secondary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-article-hover:
    backgroundColor: "{colors.paper-secondary}"
  chip-tag:
    backgroundColor: "{colors.editorial-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  nav-item-active:
    textColor: "{colors.ink}"
    fontWeight: 500
---

# Design System: 我的博客

## 1. Overview

**Creative North Star: "The Lab Notebook"**

这套系统是一本可重读的工程现场笔记。冷静、精确，文字与代码是主角，排版不争抢注意力。每一页都应该让人感觉是"这一个人写的"，不是任何一个开发者博客都成立的模板。

系统建立在克制之上：颜色少（一个强调色 + 中性灰阶），字体少（单一 Inter 家族靠字重对比建立层级），装饰少（无渐变、无玻璃拟态、无侧边色条）。深度靠排版与留白传达，不靠阴影。组件边缘清晰，圆角克制（最大 12px），交互反馈用边框颜色变化与极轻阴影，不用放大与位移。

明确拒绝：AI 生成感 SaaS（Tailwind 默认蓝主色、indigo→violet 渐变、居中堆叠 hero、Lucide 图标卡网格）、传统博客装饰（侧边栏、标签云、推荐卡墙）、终端黑客风（纯黑白 + monospace 正文）、活泼可爱风（emoji、卡通、大圆角）。详见 PRODUCT.md 的 Anti-references。

**Key Characteristics:**
- 单一强调色，中性灰阶为骨，纸张白为底
- 单一 Inter 家族，字重 400/500/600/700 四档对比建立层级
- 1px 描边优先于阴影；hover 仅强化边框，不位移
- 圆角 4-12px，克制不圆润
- 间距阶梯 4-64px，节奏靠间距变化而非装饰

## 2. Colors

调色板是一个克制的编辑式系统：一个强调色（Editorial Blue）承担所有交互高亮，中性灰阶从墨色到纸张白构成骨络，状态色仅用于反馈不用于装饰。

### Primary

- **Editorial Blue** (`#2563eb`): 唯一的强调色。用于主按钮、链接、active 状态、tag 背景、focus ring。其稀缺性是它的力量。**注：此色为 Tailwind blue-600，是 PRODUCT.md 反对的"AI 生成感 SaaS"标志色之一， slated for replacement in a future colorize pass。** 在替换前，新表面不要继续扩展此色的高饱和用法。
- **Editorial Blue Hover** (`#1d4ed8`): 主按钮 hover 与 active 链接。比 primary 深 1 档。
- **Editorial Blue Soft** (`#2563eb1a`): 10% 透明蓝，用于 primary 的浅背景 tint（focus ring 底色、选中态背景）。

### Neutral

- **Ink** (`#111827`): 正文文字、标题、图标默认色。对比度 16.5:1 on Paper。
- **Ink Secondary** (`#6b7280`): 副标题、次要描述、未激活态。对比度 4.6:1 on Paper，刚好过 AA。
- **Ink Tertiary** (`#9ca3af`): 元信息（日期、阅读时长、分隔符点）。对比度 2.8:1 on Paper，仅用于装饰性小字，不可用于正文。
- **Paper** (`#ffffff`): 主背景。
- **Paper Secondary** (`#f9fafb`): 卡片背景、二级表面。
- **Paper Tertiary** (`#f3f4f6`): 图标背景块、hover 背景、三级表面。
- **Paper Hover** (`#f3f4f6`): 导航与卡片 hover 背景（与 Paper Tertiary 同值，语义上区分）。
- **Rule** (`#e5e7eb`): 1px 分隔线、卡片描边。
- **Rule Strong** (`#d1d5db`): hover 后的描边、需要强调的分隔。

### Status (仅反馈，不装饰)

- **Success** (`#16a34a`), **Warning** (`#ca8a04`), **Danger** (`#dc2626`), **Info** (`#0891b2`): 仅用于 ElMessage、表单校验、操作反馈。不用于品牌表达。

### Named Rules

**The One Accent Rule.** Editorial Blue 是唯一的强调色，且在任何单屏上覆盖面积 ≤10%。其稀缺性是它的力量。任何想加第二个强调色的冲动都应该被压制。

**The No-Gradient Rule.** 禁止任何渐变（背景渐变、文字渐变、按钮渐变）。强调通过字重与尺寸，不通过颜色过渡。

**The Tertiary Floor Rule.** Ink Tertiary (`#9ca3af`) 仅用于装饰性元信息（日期、分隔点），正文与可读描述最低必须用 Ink Secondary (`#6b7280`)。2.8:1 对比度不足以承载信息。

## 3. Typography

**Display Font:** Inter (`'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif` 回退)
**Body Font:** Inter（同上）
**Label/Mono Font:** 无独立 mono 字体；代码块由 md-editor-v3 / highlight.js 自带等宽字体处理。

**Character:** 单一 Inter 家族靠字重对比（400/500/600/700）建立层级。负字距（-0.02em ~ -0.03em）让大字号标题更紧凑、更现代。中文回退到系统 PingFang SC / Noto Sans SC，与 Inter 的 x-height 匹配度可接受。

### Hierarchy

- **Display** (700, `clamp(2rem, 4vw, 3.25rem)`, 1.15, `-0.03em`): Hero 标题专用。一页最多一处。`text-wrap: balance` 让换行均匀。
- **Headline** (700, 2.25rem, 1.2, `-0.02em`): 二级页面标题、旧 Hero 标题。当前 Hero 已用 Display 替代。
- **Title** (600, 1.25rem, 1.5): 区块标题（"最新文章"、"分类"）、特写卡标题。
- **Body** (400, 1rem, 1.6): 正文、卡片摘要、描述。行宽 ≤65-75ch。
- **Label** (400, 0.75rem, 1.5): 元信息（日期、阅读时长、分类标签前缀）。Ink Tertiary 色。

### Named Rules

**The Single Family Rule.** 全站只用 Inter 一个字族。字重对比建立层级，不靠换字体。任何想引入第二个字体的冲动（包括衬线 display 字）都需要先质疑：是否真的需要，还是想用字体解决排版问题。

**The Tracking Floor Rule.** Display 与 Headline 的 letter-spacing ≥ -0.03em。再紧就拥挤，再松就松散。

## 4. Elevation

这套系统**默认扁平**。深度靠描边与表面色阶（Paper / Paper Secondary / Paper Tertiary）传达，不靠阴影。阴影仅在 hover 状态作为"轻微抬起"的反馈出现，且极轻。

### Shadow Vocabulary

- **Ambient Hover** (`box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)`): 卡片 hover 时的反馈阴影。仅 hover，不静止。
- **Resting Border**: 1px Rule (`#e5e7eb`) 描边是静止状态的默认深度表达。hover 时描边升级到 Rule Strong。

### Named Rules

**The Flat-By-Default Rule.** 表面静止时扁平，无阴影。阴影仅作为 hover 状态反馈出现，且永远是 `0 2px 8px rgba(0,0,0,0.08)` 这一档，不存在更重的阴影。

**The Border-First Rule.** 区分两个表面，优先用 1px 描边，不用阴影。嵌套卡片永远错误（card-in-card 是禁区）。

## 5. Components

组件哲学：**Refined and Restrained**。按钮不争抢，卡片安静，输入克制。交互反馈用边框颜色变化与极轻阴影，不用位移、不用放大、不用渐变。

### Buttons

- **Shape:** 圆角 `{rounded.lg}` = 8px
- **Primary:** Editorial Blue 背景 (`#2563eb`) + Paper 白字，padding `8px 16px`。用于每页唯一的主动作（Hero 的"读最新一篇 →"、登录页提交）。
- **Hover / Focus:** 背景变 Editorial Blue Hover (`#1d4ed8`)，无位移。focus ring 由 Element Plus 默认提供（2px Editorial Blue 透明蓝底）。
- **Secondary / Ghost:** Paper Tertiary 背景 + Ink Secondary 文字，hover 背景 Rule。用于次要动作（"查看全部 →"链接式按钮）。
- **Link Button:** 无背景无描边，Editorial Blue 文字 + `→` 后缀。用于导航性 CTA。

### Chips / Tags

- **Style:** Editorial Blue 背景 + Paper 白字，圆角 `{rounded.sm}` = 4px，padding `2px 8px`。Element Plus `el-tag` with `effect="plain"` + 自定义 color。
- **State:** 文章卡内最多 3 个标签，超出截断。

### Cards / Containers

- **Corner Style:** 圆角 `{rounded.lg}` = 8px
- **Background:** Paper Secondary (`#f9fafb`)
- **Shadow Strategy:** 静止 1px Rule 描边；hover 升级 Rule Strong 描边 + Ambient Hover 阴影。详见 Elevation。
- **Border:** 1px solid Rule (`#e5e7eb`)
- **Internal Padding:** `{spacing.5}` = 20px（文章卡），`{spacing.4}` = 16px（分类卡）
- **Nested cards prohibited.** 卡片内不再嵌卡片，需要分组时用分隔线或标题。

### Inputs / Fields

- **Style:** 1px Rule 描边 + Paper 背景，圆角 `{rounded.lg}` = 8px，padding `8px 12px`。Element Plus `el-input` 默认样式，全局覆盖圆角。
- **Focus:** 2px Editorial Blue ring + 透明蓝底，描边透明。
- **Search Input:** Header 内 200px 宽，移动端 140px。

### Navigation

- **Style:** 顶部 sticky header，64px 高。Logo + 横向 nav-menu + 右侧 search + 用户头像。
- **Nav Item:** 透明背景 + Ink Secondary 文字，padding `8px 16px`，圆角 `{rounded.md}` = 6px。hover 背景 Paper Hover，active 状态 Ink + font-weight 500。
- **Mobile:** 768px 以下隐藏 nav-menu，仅保留 logo + search + avatar。

### Featured Card (Hero signature component)

- **Shape:** 与文章卡同构（圆角 8px + 1px Rule 描边 + Paper Secondary 背景），但更大。
- **Layout:** 4:3 封面图（`aspect-ratio: 4/3`）+ 下方 padding 20px 的元信息+标题+摘要+"继续阅读 →"链接。
- **Hover:** 描边 Rule Strong + Ambient Hover 阴影，"继续阅读 →" 变 Editorial Blue Hover。
- **Empty state:** 无封面图时 `v-if` 隐藏图片区，仅显示文字，仍是编辑式。

## 6. Do's and Don'ts

### Do:

- **Do** 用单一 Inter 家族 + 字重对比建立层级，不引入第二个字体。
- **Do** 用 1px 描边表达深度，hover 时升级描边色 + 极轻阴影 (`0 2px 8px rgba(0,0,0,0.08)`)。
- **Do** 让 Editorial Blue 保持稀缺：每屏覆盖 ≤10%，仅用于主 CTA、链接、active 状态。
- **Do** 用 `text-wrap: balance` 处理 H1-H3 换行，`text-wrap: pretty` 处理长正文孤儿。
- **Do** 在 Hero 标题用陈述句，不用口号（"把工程现场写成可以重读的笔记" 优于 "记录思考 分享成长"）。
- **Do** 移动端退化用单列布局，保留信息优先级，不强行保持桌面端非对称网格。

### Don't:

- **Don't** 使用 Tailwind 默认蓝 (`#2563eb`) 作为新表面的主色。当前 primary 是该色，属于历史遗留，PRODUCT.md 已明确反对，slated for replacement。新增表面先用中性灰，等 colorize pass 统一替换。
- **Don't** 使用任何渐变（背景、文字、按钮）。这是 AI 生成感 SaaS 的核心标志。强调用字重或尺寸。
- **Don't** 在卡片内嵌套卡片。嵌套卡片永远错误，用分隔线或标题分组。
- **Don't** 使用侧边色条（`border-left > 1px` 作为彩色装饰）。Impeccable 明确禁区。
- **Don't** 在每节标题上方加 `01 ·` `02 ·` 编号 eyebrow 或全大写 tracked eyebrow。这是 2023-2026 最饱和的 AI 模板语法。
- **Don't** 用居中堆叠 hero + 两个按钮 + stats 横排。这是 SaaS 默认模板，博客套用第一眼就像 AI 生成。
- **Don't** 使用 emoji 当图标、卡通插画、过度圆润的大圆角（>12px）。与"编辑式专业"完全相反。
- **Don't** 用 Ink Tertiary (`#9ca3af`) 写正文或可读描述。2.8:1 对比度不够，最低用 Ink Secondary (`#6b7280`)。
- **Don't** 使用纯黑白 + monospace 等宽字正文。这是终端黑客风，不是个人博客。
- **Don't** 使用左右双栏 + 侧边栏塞满热门文章/标签云/分类目录的传统博客装饰。信息密度低，装饰密度高。
