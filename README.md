# AI纪年（AI Timeline）

**要干啥：** 把 ChatGPT 公众研究预览上线（2022-11-30）以来的 AI 大事，按时间串成一份可读的「纪年」——看清什么时候出现了哪些大模型、产品与科学突破；另附「现在能用啥」的 AI 工具库，方便查找官网和费用。

不是新闻聚合，也不是百科全收录：只收有官方可核日期与链接的里程碑，优先帮人建立时间感。

**在线站点：** https://shalom-lab.github.io/ai-timeline/

## 浏览

1. **时间线**：打开即读。桌面年份索引可跳转；同日事件共用日期标记，可按分类、年份、机构筛选。卡片展开后可直达一手出处，事件链接为 `#/event/<id>`。
2. **分栏对照**（`#/compare`）：独立的左侧时间轴可按月、按日跳转，右侧机构、产品类型或学科按日期对齐，整页连续滚动，桌面保留列名与时间轴；可选择至多四列，按年份或近 90 天筛选，筛出跨列同日事件，并复制当前结果。手机改为按日分组的单列阅读。
3. **AI 工具库**：按用途筛选并搜索工具卡片，查看官方入口和定价说明。旧工具表格链接也会打开工具库。
4. **里程碑展**（`#/gallery`）：用四个专题串起公开对话、智能体、开放权重与科学研究。展品和时间线共享数据，点任何节点可打开原事件及出处。不需要 WebGL。

## 数据优先

| 文档 | 内容 |
| --- | --- |
| [`docs/DATA.md`](docs/DATA.md) | 完整数据规范 |
| [`docs/DATA-AUDIT.md`](docs/DATA-AUDIT.md) | 已核查的内容与仍待复核的范围 |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | 贡献清单与审核规则 |
| [`data/timeline.json`](data/timeline.json) | 纪年事件 |
| [`data/ai-tools.json`](data/ai-tools.json) | AI工具矩阵 |

技术栈：TypeScript + React + Vite。类型见 `src/types/`。

## 增量线索与收录

- GitHub Actions 的 [Discover AI timeline candidates](https://github.com/shalom-lab/ai-timeline/actions/workflows/discover-candidates.yml) 在北京时间每周一、四约 10:27 扫描最近 14 天，也可手动运行。每次输出待审候选与来源连通性报告，不改正式数据，不部署。
- [交叉核验规则](docs/EDITORIAL-REVIEW.md)会随候选报告一起打包。
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
