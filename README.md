# AI纪年（AI Timeline）

**要干啥：** 把 ChatGPT 公众研究预览上线（2022-11-30）以来的 AI 大事，按时间串成一份可读的「纪年」——看清什么时候出现了哪些大模型、产品与科学突破，普通人+AI 的能力边界又推进到哪一步；另附一张「现在能用啥」的 AI 工具矩阵，方便对照选型。

不是新闻聚合，也不是百科全收录：只收有官方可核日期与链接的里程碑，优先帮人建立时间感与能力感。

**在线站点：** https://shalom-lab.github.io/ai-timeline/

## 两页

1. **纪年** — 左侧时间轴 + 右侧分类 Tab（大模型 / 产品 / 科学 / 能力边界）。大模型按公司成列，科学按学科，产品按形态；能力边界是月末「之前 → 之后」工作流快照，不混时间线事件卡。
2. **AI工具** — 当前可用产品矩阵（模型 / 产品 两个 Tab），单元格链到产品页并带费用摘要，不追溯历史。

支持搜索、按年折叠、卡片详情、子列/多列图标复制，以及 AI工具页整表复制。

## 数据优先

| 文档 | 内容 |
| --- | --- |
| [`docs/DATA.md`](docs/DATA.md) | 完整数据规范 |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | 贡献清单与审核规则 |
| [`data/timeline.json`](data/timeline.json) | 纪年事件 |
| [`data/capability-frontier.json`](data/capability-frontier.json) | 能力边界月末快照 |
| [`data/ai-tools.json`](data/ai-tools.json) | AI工具矩阵 |

技术栈：TypeScript + React + Vite。类型见 `src/types/`。

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

## 界面与浏览

- 纪年以公司分栏呈现，卡片日期栏打开详情，卡片正文与时间轴可定位同日事件。
- 「当月」匹配所有年份的当前月份，例如 10 月显示历年 10 月记录；「既往」恢复完整历史。
- 能力边界采用并排的「原来的方式 / 新的可能」对比，默认最新月份在前，可切换为从起点开始。
- 「既往已具备」根据完整历史累计，不受搜索和月份筛选截断；关联事件会清除筛选并定位到对应卡片。
- 视觉样式在 `src/design.css`，原有数据与来源保持独立维护。

- 既往模式支持近 3 / 6 / 12 个月和自定义起止日期。近期窗口含本月至今天；月度能力按月份交集展示。
- 能力边界左侧显示当月新增，右侧独立滚动浏览此前累计能力，两侧均为前后对比。历史累计不会被时间窗截断。
