# 博客与管理端移动体验：第一批改动与后续清单

日期：2026-10-09。分支：`feat/mobile-uiux`。

## 范围与边界

只修改博客前端及管理员界面，不改 Carbon 后端，不操作 ECS、安全组、OSS 或 EasyTier 服务。EasyTier 暂不纳入功能接入与发布；没有添加可下载的配置或公开凭证。

本批解决导航、搜索和管理文章列表的具体使用问题，不代表全站 UI/UX 重构完成。

## 使用与维护决策

| 场景 | 本批处理 | 维护约束 |
| --- | --- | --- |
| 手机进入后台、打开账户菜单 | 原生按钮、明确名称、48px 主点击区域 | 复用已有布局与图标；不引入新组件库 |
| 手机导航与前台搜索 | Element Plus Drawer/Dialog，焦点回收、Escape、背景滚动锁定 | 沿用现有 Semantic → vendor adapter |
| 手机管理长标题文章 | 卡片、换行、文字状态、可点操作 | 桌面仍用表格；同一份分页数据与操作处理 |
| 搜索后几页/多条件筛选 | 筛选回第一页，后端真实分页 | `keyword` 映射后端 `title`，`page` 映射 `pageNum`；不改 API 协议 |
| 加载失败/首次空数据/筛选无结果 | 分别显示重试、创建、清除筛选 | 错误不再经过吞异常的文章 Store 路径；401/403 仍由拦截器统一处理 |
| 快速切换筛选 | 请求序号防旧结果覆盖新结果 | 未增加通用请求管理层 |
| 删除/删除末页最后一条 | 明确确认、取消不请求、删除中防重复、重载并回退到有效页 | 删除接口沿用既有 Store |
| 手机地址栏、系统安全区域 | 后台 `dvh` + `vh` 回退及底部 safe-area | 不锁定缩放、不修改主题结构 |
| 减少动画 | 第三方标签/弹层也遵循减少动画偏好 | vendor 行为规则放 adapter，不散落业务页 |

参考：[W3C 弹窗交互模式](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)要求圈定焦点、Escape 和关闭后焦点回到触发入口；[W3C Reflow 说明](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)建议窄屏内容重排，数据表格虽有例外，仍应减少不必要的横向滚动。本项目因此采用手机卡片、桌面表格，而不是隐藏全部列或缩小整页。

## Design System 自检与偏差

- Product Identity：保留编辑式、内容优先的博客定位，不新增装饰性配色、字体、Hero 或导航层级。
- Token：本批新增样式使用现有 Semantic/Foundation。没有新增或重命名颜色 token；48px 点击区域复用 `--space-12`。
- Component/Theme：复用组件；既有 Element Plus adapter 管理视觉映射；本批不新增按主题分支的业务 CSS。
- Architecture：文章列表使用 API 模块 + 独立页内数据，避免与前台文章缓存相互覆盖；组件不直接 axios、不处理 401/403。
- 已存在的 `project-map.json`、`component-index.json`、`architecture.json`、`patterns.json` 均缺失。未声称已读取，也未用猜测生成索引；本批依据实际代码、`product.md`、`design.md`。
- 既有任意标签颜色、品牌色小字及 vendor 深色变量映射没有做完整对比度审计。因此本批不宣称全站达到 WCAG AA，后续应先测量实际前景/背景，再按设计治理修复，不在单页随意覆盖颜色。
- 未替换后台桌面/手机两份菜单声明；导航数据单一来源应在后续集中处理，以免新增入口漏同步。

## 验证方式与限制

本地运行 `npm run build`、`./node_modules/.bin/vue-tsc --noEmit`、`git diff --check`。

本批最终结果：三项均通过；浏览器检查 `status: passed, checks: 19`。深浅主题不是仅传测试参数，测试同时断言实际 `html[data-theme]`。截图检查发现并修正了空白菜单图标与减少动画下标签的中间帧问题。生产构建仍有既有大 chunk 警告，未把资源拆分纳入本批。

可重复 UI 检查：

```bash
# 先启动本地 Vite；Playwright 可用已安装的包或应用自带包。
PLAYWRIGHT_MODULE_PATH=/absolute/path/to/playwright \
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/absolute/path/to/chrome \
node scripts/check-mobile-uiux.cjs
```

测试强制 localhost，拦截 API、外部网络和所有删除动作，只使用隔离浏览器中的虚拟账号。覆盖 320/375/768/1024/1440px、812×375 横屏、深浅主题及减少动画；导航键盘操作、日志默认折叠、搜索焦点/关闭/提交、文章分页/重置、删除取消/确认、失败重试及筛选空状态。截图和结果默认写到 `/tmp/blog-mobile-uiux-results`。

真实后端验证未完成：本机 `9090` 未监听；未绕过该边界连接生产数据库。项目没有可用的本地 ESLint 可执行文件和配置，未运行会全仓 `--fix` 的 lint 命令。浏览器矩阵是桌面 Chromium 视口模拟，不等于真机 Safari/Android、软键盘及辅助技术验收。

## 下一批：从具体任务走查，不做泛化“美化”

1. 前台阅读：长代码/表格、目录定位、返回阅读位置、从外部链接进入文章、搜索无结果与请求失败。
2. 写作流程：核查已有草稿恢复和离开保护，测试手机软键盘、图片上传失败、保存/发布中断、重复点击和后台返回。
3. 后台其余页面：分类/标签/设置的手机表单、日志长行及筛选、MySQL 备份/定时任务的运行中/失败/空状态和危险操作确认。
4. 状态保持：列表筛选/页码写入 URL，编辑或预览返回恢复状态；需同步处理 AdminLayout 的 `route.fullPath` key，不能只加 query 导致反复重挂载。
5. 维护：菜单单一数据源、令牌对比度和 adapter 暗色映射、实际后端错误/鉴权、真机/200% 字号验收。

上述项目尚未验收，不能以本批结果代替。第一批开发验收结束时尚未合并或推送；2026-10-09 用户随后授权同步开发分支并合并、推送 main，按现有流水线发布。最终提交与部署结果以 Git 历史和对应 Actions 记录为准，不将发布成功当成全站验收完成。
