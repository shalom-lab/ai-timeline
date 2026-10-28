# AI Timeline

从 **ChatGPT 公众研究预览上线（2022-11-30）** 起的 AI 里程碑时间线。

本仓库当前优先交付 **数据规范与种子数据**；UI 仅为可类型检查的占位页。技术栈预定：TypeScript + React + Vite。

## 为何先做数据

用户与维护约定：**先设计数据规范与数据结构，再做界面。** 权威说明：

| 文档 | 内容 |
| --- | --- |
| [`docs/DATA.md`](docs/DATA.md) | 完整数据规范（中文说明 + 英文字段名） |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | v1 边界、贡献清单、日期/`eventType` 规则、来源审计、去重策略 |
| [`src/types/timeline.ts`](src/types/timeline.ts) | TypeScript 类型 |
| [`data/timeline.json`](data/timeline.json) | 已核验来源的种子事件 |

## 本地开发

```bash
npm install
npm run validate   # JSON 不变式校验
npm run build      # tsc + Vite build（导入种子数据做类型检查）
npm run dev        # 占位 UI
```

## 如何添加事件

1. 阅读 [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) 清单。  
2. 确认官方来源与精确日期；无法核实则 **整条省略**。  
3. 区分 `research_preview` / `public_beta` / `ga` / `open_source` 等（示例：Claude Code 2025-02-24 = 研究预览；Gemini CLI 2025-06-25 = 开源引入）。  
4. 在 `data/timeline.json` 追加事件，更新 `meta.updatedAt`。  
5. 运行 `npm run validate && npm run build`。

## 脚本

| 脚本 | 作用 |
| --- | --- |
| `npm run validate` | 校验 id、日期范围、枚举、来源、relatedIds 等 |
| `npm run build` | TypeScript 项目引用构建 + 生产打包 |
| `npm run typecheck` | 仅类型检查 |
| `npm run dev` | Vite 开发服务器 |
| `npm run preview` | 预览 production build |

## 下一步（未做）

- 正式时间线可视化 UI  
- **GitHub Pages 尚未配置**（有意延后）  
- 筛选、搜索、按 `company` / `eventType` / `productSubcategory` 视图  

## License

文档与种子数据的许可证待定；贡献前请先开 issue 对齐。
