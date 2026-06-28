# 管理端系统化重构计划

## 目标
将 `src/views/admin/` 下 7 个页面对齐前台已完成的 Editorial Blue 设计系统（`src/styles/index.scss` 令牌 + `src/layouts/AdminLayout.vue` 已有用法），消除硬编码颜色，统一卡片/标题/动效语言。

## 现状盘点（2026-06-28）

### 已对齐层
- `src/styles/index.scss` — Editorial Blue 令牌已就位（`--brand-primary: #2563eb` 等）
- `src/layouts/AdminLayout.vue` — 已全面使用令牌，无需改动

### 待重构层（7 文件，零令牌使用）

| 文件 | 硬编码 # | 主要问题 |
|---|---|---|
| Dashboard.vue | ~20+ | 4 色卡片用旧渐变 `#667eea/#764ba2/#f093fb/#4facfe/#43e97b`；统计卡渐变；快捷入口色块；el-card 大量 `#303133/#909399/#f5f7fa/#f0f2f5` |
| PageConfigEditor.vue | ~15+ | 拖拽区 hover `#667eea`；HTML 预览模板 `#667eea` 硬编码；大量 `#303133/#909399/#e4e7ed` |
| ArticleEditor.vue | ~15+ | 上传区 `#667eea`；toolbar `#e4e7ed`；文本色 `#303133/#909399/#8c939d` |
| ArticleList.vue | ~5+ | 标签默认色 `#667eea`；链接色 `#337ab7/#23527c` |
| CategoryList.vue | 少量 | 表格样式硬编码 |
| TagList.vue | ~5+ | 标签默认色 `#667eea` ×4；表单 `#667eea` |
| Settings.vue | ~10+ | 上传区 `#667eea`；表单色 `#303133/#909399` |

### 共性硬编码模式（按出现频次）
1. **旧品牌紫** `#667eea` / `#764ba2` / `#f093fb` — 应全部替换为 `var(--brand-primary)` / `var(--brand-primary-hover)` / `var(--brand-tint)`
2. **绿/青残留** `#43e97b` / `#38f9d7` / `#4facfe` / `#00f2fe`（Dashboard 卡片色板）— 应改为以 `--brand-primary` 为主色的同色系阶梯
3. **Element Plus 默认灰阶** `#303133` `#606266` `#909399` `#c0c4cc` `#e4e7ed` `#f5f7fa` `#f0f2f5` — 应映射到 `--text-primary/secondary/tertiary/placeholder` `--border-color` `--bg-secondary/tertiary`
4. **链接蓝** `#337ab7` / `#23527c` — 应改 `--link-color` / `--link-hover-color`
5. **渐变背景** `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` — 应改 `var(--brand-primary)` 纯色或 `var(--brand-tint)` 软底

## 阶段划分

### 阶段 0：基础对齐（轻量，1 文件）
- [x] 0.1 `ArticleList.vue` — 标签默认色 + 链接色 → 令牌
- **完成标志**：ArticleList 无 `#` 硬编码 ✅

### 阶段 1：单页表单类（3 文件，独立可并行）
- [x] 1.1 `CategoryList.vue` — 表格样式令牌化（扫描发现已无硬编码，跳过）
- [x] 1.2 `TagList.vue` — 标签默认色 ×4 + 表单色令牌化
- [x] 1.3 `Settings.vue` — 上传区 + 表单色令牌化
- **完成标志**：3 文件零硬编码品牌色/灰阶 ✅

### 阶段 2：富交互页面（2 文件）
- [x] 2.1 `ArticleEditor.vue` — 上传区 + toolbar + 文本色令牌化
- [x] 2.2 `PageConfigEditor.vue` — 拖拽区 + 预览模板（JS 字符串内的 `#667eea` 已换）+ 表单色
- **完成标志**：2 文件零硬编码 ✅

### 阶段 3：Dashboard（独立最重，1 文件）
- [x] 3.1 4 色统计卡渐变 → 同色系蓝阶
- [x] 3.2 快捷入口 4 色块 → 蓝阶
- [x] 3.3 标签/分类色板数组 → 蓝阶
- [x] 3.4 el-card 灰阶 → 令牌
- **完成标志**：Dashboard 零硬编码 ✅

### 阶段 4：验证与提交
- [x] 4.1 `npm run build` 通过 (21.72s)
- [x] 4.2 全 admin 目录 grep 扫描：零硬编码残留
- [ ] 4.3 浏览器抽样验证（待用户确认）
- [ ] 4.4 分阶段提交 git + push

## 决策

### D1: Dashboard 4 色卡片如何处理？
**决策**：放弃多彩，全部改用蓝色系阶梯（primary / primary-hover / tint / tint-hover）。理由：
- 前台已统一 Editorial Blue 单色系，admin 应一致
- 多彩卡片是 SaaS cliché（impeccable bans: "Identical card grids"）
- 同色系阶梯仍能区分卡片，但更克制

### D2: JS 字符串内的 `#667eea`（如 PageConfigEditor HTML 模板）如何处理？
**决策**：直接替换为 `var(--brand-primary)`，因为模板字符串最终作为 inline style 注入到 DOM，CSS 变量在该上下文同样生效。

### D3: 标签默认色（TagList/ArticleList 里的 `tag.color || '#667eea'`）？
**决策**：改为 `tag.color || 'var(--brand-primary)'`，让用户未设色的标签自然继承品牌色。

## 遇到的错误
| 错误 | 尝试次数 | 解决方案 |
|---|---|---|
| （暂无） | | |
