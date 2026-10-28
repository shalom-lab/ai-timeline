# AI Timeline

从 **ChatGPT 公众研究预览上线（2022-11-30）** 起的 AI 里程碑时间线。

技术栈：TypeScript + React + Vite。数据规范优先；界面为四列看板（大模型 / 产品 / 概念 / 其他），支持筛选、时间轴轨与详情抽屉。

**站点（GitHub Pages）：** https://shalom-lab.github.io/ai-timeline/

## 界面要点

- 顶栏：品牌（`meta.ui.openingBg` 作紧凑 banner）、搜索、年份 chips、公司 / 一级分类 / 产品大类 / 事件类型筛选、事件类型图例
- 左侧时间轴轨：按年/月排列，圆点取 `companies[].color`
- 主区四列（可纵向折叠）：点击列头收起为窄竖条；展开列 `flex-grow` 占满空间；**双击列**可「只看本列」
- 列内按 `productSubcategory`（产品）或 `series`（大模型）或主题 tags（概念/其他）再分子列，并有 chips 过滤
- 卡片：公司色左边条、日期、摘要、`eventType` pill、来源外链；点击打开右侧详情（含上下条）

## 数据文档

| 文档 | 内容 |
| --- | --- |
| [`docs/DATA.md`](docs/DATA.md) | 完整数据规范 |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | 贡献清单与审核规则 |
| [`src/types/timeline.ts`](src/types/timeline.ts) | TypeScript 类型 |
| [`data/timeline.json`](data/timeline.json) | 种子事件 |

颜色映射在公司（`companies[].color`），不在一级分类。

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
