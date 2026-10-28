# AI纪年（AI Timeline）

从 **ChatGPT 公众研究预览上线（2022-11-30）** 起的 AI 里程碑时间线。

技术栈：TypeScript + React + Vite。数据规范优先；纪年页为 **4 个 Tab**（大模型 / 产品 / 科学 / 能力边界）+ 左侧时间轴轨；「能力边界」仅展示 capability-frontier 月末快照（不混入时间线事件卡）。另有独立 **AI工具** 矩阵页（`#/tools`，Tab：**模型 | 产品**）。支持搜索、按年折叠时间轴与卡片原地详情浮层；系列 chips 支持多选。站点品牌标：`public/brand/mark.svg` / `public/favicon.*`。

**站点（GitHub Pages）：** https://shalom-lab.github.io/ai-timeline/

## 界面要点

- 顶栏：品牌「AI纪年」（`meta.ui.openingBg` 作紧凑 banner）、搜索、紧凑事件类型图例（无主题切换、无顶部年份 chips）
- 左侧时间轴轨（略加宽）：按年分组，点击年标题可**折叠/展开**该年日期；**年内按日历日比例**纵向定位，密集处保证最小间距；标签为 `MM-DD`，悬停看完整日期与标题；**点击**节点滚动并钉住同日横线+灰白（卡片与该节点以下轨段），悬停仅虚线不灰白；Esc / 再点 / 点空白取消钉住
- 左侧时间轴层级：年份行左对齐（折叠三角 + 年 + 数量）；日期为缩进子级，竖线只串该年日期圆点
- 分类 Tab（短矩形、轻微圆角，非胶囊）在右侧主栏顶部、公司 chips 之上（与 chips/卡片同列起点，不压左侧时间轴）：**大模型 | 产品 | 科学 | 能力边界**（默认大模型）；每次只展示一个面板。能力边界 Tab 仅月末工作流快照（`FrontierColumn`）。已移除列「独占」。
- Header 页面切换（纪年 / AI工具）同为短矩形 Tab 样式。
- Tab 内按公司（大模型）、`productSubcategory`（产品）、`scienceDiscipline`（科学）再分子列；系列 chips **多选**（并集），「全部」清空选择；列标题与 Tab 重复故省略，chips 紧贴分类 Tab 下。子列标题与 chips 行右侧均为 **图标复制**（剪贴板 icon）：列头复制该列，chips 行右侧复制当前可见各子列年表（多列时按列分段，日期+标题）
- 卡片：整卡背景取公司 `colorSoft`；日期 + 公司标记（按 `companies[]` 的 name/id/aliases 解析）；左侧主图标块 + 标题/摘要、`eventType` pill、来源外链；**点击顶部条（日期/公司）**打开详情浮层，**点击主区域**钉住同日横线+灰白（与左侧时间轴节点相同）；来源外链等图标独立处理
- `science`：AI 在科学领域的发现/突破（如 AlphaFold 3），不是普通产品发布
- 原「概念」列已取消：MCP / Agent Skills / Agent Harness 等已迁入 `product`（如 MCP→`dev_platform`，Harness/Skills→`agent`）
- **AI工具** 页：顶下 **模型 | 产品** Tab（短矩形，对齐纪年 board tabs）；模型列为 公司+语言模型/图像/视频/其他，产品列为 公司+对话/编程办公/API；无双层 group 表头；列头旁小 icon，单元格旁产品/公司 logo；空行按 Tab 过滤；hash `#/tools/models` / `#/tools/products`

## 数据文档

| 文档 | 内容 |
| --- | --- |
| [`docs/DATA.md`](docs/DATA.md) | 完整数据规范 |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | 贡献清单与审核规则 |
| [`src/types/timeline.ts`](src/types/timeline.ts) | TypeScript 类型 |
| [`data/timeline.json`](data/timeline.json) | 种子事件 |
| [`data/capability-frontier.json`](data/capability-frontier.json) | 能力边界月末快照 |
| [`src/types/capability.ts`](src/types/capability.ts) | 能力边界类型 |

颜色映射在公司（`companies[].color` / `colorSoft`），不在一级分类。

## 本地开发

```bash
npm install
npm run validate
npm run build
npm run dev
```

## GitHub Pages

- 工作流：`.github/workflows/deploy-pages.yml`（push `main` → validate → build → Pages）
- Vite `base`：`/ai-timeline/`
- URL：https://shalom-lab.github.io/ai-timeline/

## License

文档与种子数据的许可证待定；贡献前请先开 issue 对齐。
