# AI纪年（AI Timeline）

**要干啥：** 把 ChatGPT 公众研究预览上线（2022-11-30）以来的 AI 大事，按时间串成一份可读的「纪年」——看清什么时候出现了哪些大模型、产品与科学突破；另附一张「现在能用啥」的 AI 工具矩阵，方便对照选型。

不是新闻聚合，也不是百科全收录：只收有官方可核日期与链接的里程碑，优先帮人建立时间感。

**在线站点：** https://shalom-lab.github.io/ai-timeline/

## 两页（+ 展厅原型）

1. **纪年** — 左侧时间轴 + 右侧分类 Tab（大模型 / 产品 / 科学）。大模型按公司成列，科学按学科，产品按形态。
2. **AI工具** — 当前可用产品矩阵（模型 / 产品 两个 Tab），单元格链到产品页并带费用摘要，不追溯历史。
3. **3D 展厅**（顶栏 Tab，原型，`#/gallery`）— 与「探索纪年 / AI 工具库」并列；Three.js 第一人称「跑道展板」，数据仍是同一份 `timeline.json`。桌面 WASD + 鼠标锁定；手机虚拟摇杆 + 拖拽转向。

支持搜索、按年折叠、卡片详情、子列/多列图标复制，以及 AI工具页整表复制。

## 数据优先

| 文档 | 内容 |
| --- | --- |
| [`docs/DATA.md`](docs/DATA.md) | 完整数据规范 |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | 贡献清单与审核规则 |
| [`data/timeline.json`](data/timeline.json) | 纪年事件 |
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
- 「最近」为从今天往回的滚动时间窗：1 / 3 / 半年 / 12 个月（每月按 30 天）；点「12个月」可选中并就地改 N。「既往」用月份滑窗浏览完整历史。
- 「最近」按天滚动（每月折合 30 天）；「既往」用双滑块自定义起止月。
- 视觉样式在 `src/design.css`，原有数据与来源保持独立维护。
