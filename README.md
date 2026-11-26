# AI纪年（AI Timeline）

**要干啥：** 把 ChatGPT 公众研究预览上线（2022-11-30）以来的 AI 大事，按时间串成一份可读的「纪年」——看清什么时候出现了哪些大模型、产品与科学突破；另附一张「现在能用啥」的 AI 工具矩阵，方便对照选型。

不是新闻聚合，也不是百科全收录：只收有官方可核日期与链接的里程碑，优先帮人建立时间感。

**在线站点：** https://shalom-lab.github.io/ai-timeline/

## 三页（含 3D 展厅）

1. **时间线**：打开即读，按年份和日期从新到旧浏览；同日事件共用日期标记。可按分类、年份、机构筛选，点开事件查看阶段和来源。原看板保留在「分栏对照」（`#/compare`）。
2. **AI工具** — 当前可用产品矩阵（模型 / 产品 两个 Tab），单元格链到产品页并带费用摘要，不追溯历史。
3. **3D 展厅**（顶栏 Tab，`#/gallery`）— Three.js 第一人称跑道展厅，数据仍是同一份 `timeline.json`。三条跑道（大模型 / 产品 / 科学）都按**最新在前**排列，**W 向里走 = 更早**。展板是横版品牌卡：公司浅色底 + 主题色 + 真实 logo；近距自动切换高清纹理，远距回退低清。

展厅操作：点击展板相机飞过去并打开右侧详情；`1 / 2 / 3` 切跑道，`[` / `]` 前一块 / 后一块，`Home` / `End` 最新 / 最早，`WASD` 漫游，`E` 准心拾取；底部控制条提供等价按钮。手机端保留虚拟摇杆与点按展板。

事件详情提供 `#/event/<id>` 链接，重新打开会定位并展开。分栏对照保留日期滑窗、列复制和同日定位；工具库保留整表复制。浏览器无法运行 3D 时，可返回时间线阅读同批内容。

## 数据优先

| 文档 | 内容 |
| --- | --- |
| [`docs/DATA.md`](docs/DATA.md) | 完整数据规范 |
| [`docs/DATA-AUDIT.md`](docs/DATA-AUDIT.md) | 已核查的内容与仍待复核的范围 |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | 贡献清单与审核规则 |
| [`data/timeline.json`](data/timeline.json) | 纪年事件 |
| [`data/ai-tools.json`](data/ai-tools.json) | AI工具矩阵 |

技术栈：TypeScript + React + Vite + Three.js。类型见 `src/types/`。

## 增量线索与收录

- GitHub Actions 的 [Discover AI timeline candidates](https://github.com/shalom-lab/ai-timeline/actions/workflows/discover-candidates.yml) 在北京时间每周一、四约 10:27 扫描最近 14 天，也可手动运行。每次输出待审候选与来源连通性报告，不改正式数据，不部署。
- [来源表](config/discovery-sources.json) 将官方发布、平台、周报和媒体分开。周报帮忙找线索，转载日和简报日期不作为事件日期。同一篇公告可能涉及多条发布，链接去重只缩小人工候选列表。
- 入库先确定它是否改变了能力、可用性或科研结论；再核对原始公告、变更日志、论文或官方代码仓库，区分首次公布、预览、正式开放、权重开放和退役。不要把预印本当正式发表、把厂商测评当独立评测。按机构＋产品＋阶段＋日期检查重复；缺少可靠日期就留待核查。
- 工具库回答「现在能不能用」，停用项从工具库移除，但历史事件保留。修改数据后执行 `npm run validate`，通过后再进入发布流程。


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
