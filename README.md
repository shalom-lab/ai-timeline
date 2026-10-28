# AI Timeline

从 **ChatGPT 公众研究预览上线（2022-11-30）** 起的 AI 里程碑时间线。

本仓库优先交付 **数据规范与种子数据**；UI 为可类型检查的占位页（含开篇 Hero 与公司品牌色标记）。技术栈：TypeScript + React + Vite。

**站点（GitHub Pages）：** https://shalom-lab.github.io/ai-timeline/

## 为何先做数据

用户与维护约定：**先设计数据规范与数据结构，再做界面。** 权威说明：

| 文档 | 内容 |
| --- | --- |
| [`docs/DATA.md`](docs/DATA.md) | 完整数据规范（中文说明 + 英文字段名） |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | v1 边界、贡献清单、日期/`eventType` 规则、来源审计、去重策略 |
| [`src/types/timeline.ts`](src/types/timeline.ts) | TypeScript 类型 |
| [`data/timeline.json`](data/timeline.json) | 已核验来源的种子事件 |

要点：

- 一级分类仅四个，**展示序**：概念 → 大模型 → 产品 → 其他（`concept` → `model` → `product` → `other`）
- **颜色映射在公司**（`companies[].color` / `colorSoft`），分类无色值
- 开篇背景在 `meta.ui.openingBg`（CSS 渐变优先）

## 本地开发

```bash
npm install
npm run validate   # JSON 不变式校验（含 company.color、openingBg）
npm run build      # tsc + Vite build（base=/ai-timeline/）
npm run dev        # 占位 UI
```

## 如何添加事件

1. 阅读 [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) 清单。  
2. 确认官方来源与精确日期；无法核实则 **整条省略**。  
3. 区分 `research_preview` / `public_beta` / `ga` / `open_source` 等。  
4. 新公司须写入 `companies[]` 并设置可读的 `#RRGGBB` 品牌色。  
5. 在 `data/timeline.json` 追加事件，更新 `meta.updatedAt`。  
6. 运行 `npm run validate && npm run build`。

## 脚本

| 脚本 | 作用 |
| --- | --- |
| `npm run validate` | 校验 id、日期范围、枚举、来源、company.color、openingBg、relatedIds 等 |
| `npm run build` | TypeScript 项目引用构建 + 生产打包 |
| `npm run typecheck` | 仅类型检查 |
| `npm run dev` | Vite 开发服务器 |
| `npm run preview` | 预览 production build |

## GitHub Pages

- 工作流：[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)  
  - `push` 到 `main` 或 `workflow_dispatch`  
  - `npm ci` → `npm run validate` → `npm run build` → 上传 `dist/` → `actions/deploy-pages`  
- Vite `base` 为 `/ai-timeline/`（项目页路径）。  
- **首次部署前**请在仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**（若尚未设置）。  
- 预期 URL：https://shalom-lab.github.io/ai-timeline/

## 下一步

- 正式时间线可视化与筛选（按公司色、一级分类展示序等）  
- 持续扩充可核验的 landmark（含 AI for science）

## License

文档与种子数据的许可证待定；贡献前请先开 issue 对齐。
