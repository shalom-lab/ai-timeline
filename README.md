# AI纪年（AI Timeline）

从 **ChatGPT 公众研究预览上线（2022-11-30）** 起的 AI 里程碑时间线。

技术栈：TypeScript + React + Vite。数据规范优先；界面为五列看板（大模型 / 产品 / 概念 / 科学 / 其他），支持搜索、左侧按年折叠时间轴轨与卡片原地详情浮层。无数据的列自动隐藏；系列 chips 支持多选。

**站点（GitHub Pages）：** https://shalom-lab.github.io/ai-timeline/

## 界面要点

- 顶栏：品牌「AI纪年」（`meta.ui.openingBg` 作紧凑 banner）、搜索、紧凑事件类型图例（无主题切换、无顶部年份 chips）
- 左侧时间轴轨（略加宽）：按年分组，点击年标题可**折叠/展开**该年日期；**年内按日历日比例**纵向定位，密集处保证最小间距；标签为 `MM-DD`，悬停看完整日期与标题；点击滚动到对应卡片
- 主区五列：大模型 | 产品 | 概念 | 科学 | 其他；**无匹配事件的列不展示**。列头为中性底 + 细强调色顶边与图标着色；**独占** / **退出独占** 为图标按钮（`title`/`aria-label` 含文案）。无折叠/窄条收起
- 列内按 `productSubcategory`（产品）或 `series`（大模型 / 科学）或主题 tags（概念/其他）再分子列；系列 chips **多选**（并集），「全部」清空选择
- 卡片：整卡背景取公司 `colorSoft`；日期 + 公司标记（按 `companies[]` 的 name/id/aliases 解析）；左侧主图标块 + 标题/摘要、`eventType` pill、来源外链；点击在卡片位置弹出详情浮层
- `science`：AI 在科学领域的发现/突破（如 AlphaFold 3），不是普通产品发布
- `concept`：可核验的概念落地（如 MCP、Agent Skills、Agent Harness）

## 数据文档

| 文档 | 内容 |
| --- | --- |
| [`docs/DATA.md`](docs/DATA.md) | 完整数据规范 |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | 贡献清单与审核规则 |
| [`src/types/timeline.ts`](src/types/timeline.ts) | TypeScript 类型 |
| [`data/timeline.json`](data/timeline.json) | 种子事件 |

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
