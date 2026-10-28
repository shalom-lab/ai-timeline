# AI Timeline 开发与贡献指南

面向数据贡献者与后续 UI 开发者。数据规范正文见 [`DATA.md`](./DATA.md)。

---

## 1. v1 范围与刻意限制

v1（当前 `meta.version` 以 `0.x` / 首个 `1.0` 为目标）明确 **不做** 或 **暂缓**：

| 限制 | 说明 |
| --- | --- |
| 时间下界 | 不收录 `2022-11-30` 之前的事件（无 GPT-3 初代论文日、Copilot 2011/2021 早期节点等） |
| 完整编年史 | 不做「每日新闻」；只收 landmark / 可核验里程碑 |
| 二手推断日 | 禁止用媒体「大约本周」拼凑精确 `date` |
| 未区分阶段 | 禁止把 research preview 写成 GA |
| UI / 部署 | 本阶段以数据层为主；占位 UI + GitHub Actions 部署 Pages（见根 README） |
| 多语言平行库 | 正文默认中文；不维护第二套平行 JSON |
| 自动爬虫入库 | 不接受无人工来源审计的批量抓取结果直接合入 `main` |

允许：补 landmark、修正死链、补充 `relatedIds` / `tags`、在规范内扩展公司词典。

---

## 2. 添加事件清单（Contribution Checklist）

按顺序自检，全部勾选后再开 PR / 提交：

1. **范围**：`date >= 2022-11-30`。
2. **可核验**：至少一条官方 blog / docs / changelog / 官方新闻稿 URL；打不开或需登录墙则换镜像/归档并注明。
3. **不猜日期**：来源未写清公历日 → **整条省略**（不要用 `unverified` 塞进主数据）。
4. **阶段正确**：阅读原文用词（research preview / beta / GA / open source / announcing）映射到 `eventType`（见 §3）。
5. **分类**：一级仅四类，展示序为 **概念 → 大模型 → 产品 → 其他**（`concept` → `model` → `product` → `other`）。模型发权重/API 型号 → `model`；用户可感知产品 → `product` + 合适的 `productSubcategory`；科学突破演示可用 `concept`/`other` 或具名科学模型用 `model`（并打 `ai-for-science` 等 tags）。**不要给 category 加颜色**——色在 `companies[].color`。
5b. **公司色**：事件 `company` 宜对齐词典；新组织须在 `companies[]` 增加 `color`（`#RRGGBB`）与可选 `colorSoft`。
6. **`id` 稳定**：kebab-case，含组织、对象、阶段语义与日期；合并后不随意改名（改名须加迁移说明）。
7. **去重**：检索 `data/timeline.json` 是否已有同日同产品同阶段条目（见 §5）。
8. **文案**：`title` / `summary` 陈述事实；不写未证实的「首个」「颠覆」。
9. **关联**：有明显前序（如 Llama 2 → Llama 3）则填 `relatedIds`。
10. **元数据**：更新 `meta.updatedAt`；若破坏性变更 schema，升 `meta.version` 并改 `DATA.md` + `timeline.ts`。
11. **校验**：本地 `npm install && npm run build`（含类型检查与 JSON 导入）通过。

---

## 3. 日期与 `eventType` 规则

### 3.1 日期

- 采用官方页面标注的发布日（文章顶部日期、changelog 日期）。
- 跨时区以官方页面公历日为准，不自行换算「用户本地日」。
- 仅知「2024 年 3 月」→ 优先继续查证；仍无法精确则 **不收录**（v1 不鼓励 `approximate`）。

### 3.2 `eventType` 映射口诀

| 原文信号 | `eventType` |
| --- | --- |
| research preview / limited research preview | `research_preview` |
| public beta / open beta | `public_beta` |
| generally available / GA / 正式面向某计划全量开放 | `ga` |
| introducing / announcing（尚不可用或仅演示） | `first_announce` |
| 同系列重大能力/交互升级且非全新独立产品线 | `major_upgrade` |
| 开源许可证发布代码或权重 | `open_source` |
| 下线、停止服务 | `discontinued` |
| 品牌/产品名更换 | `rename_rebrand` |

同一自然日若捆绑发布「新模型 + 新工具」，可拆成两条事件，用 `relatedIds` 互指；或在一条 `major_upgrade` / `first_announce` 的 summary 中点出附属能力——**编码工具类里程碑倾向独立成条**，便于按 `productSubcategory` 筛选。

### 3.3 对照例：Claude Code vs Gemini CLI

| | Claude Code | Gemini CLI |
| --- | --- | --- |
| 日期 | **2025-02-24** | **2025-06-25** |
| 官方主来源 | [Claude 3.7 Sonnet and Claude Code](https://www.anthropic.com/news/claude-3-7-sonnet) | [Gemini CLI: your open-source AI agent](https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemini-cli-open-source-ai-agent/) |
| 官方定性 | limited **research preview** | **open-source** AI agent（同时描述为 preview 用量） |
| 本库 `eventType` | `research_preview` | `open_source` |
| `productSubcategory` | `cli` | `cli` |
| 种子 `id` | `anthropic-claude-code-research-preview-2025-02-24` | `google-gemini-cli-open-source-2025-06-25` |

要点：**不要**因为二者都是「终端里的编码 Agent」就共用同一个 `eventType`。生命周期语义以官方自我定性为准；开源许可证发布是独立的一等事件类型。

其他编码向参考（种子内）：

- GitHub Copilot Chat **GA** → `ga` + `ide`（2024-01-11）
- Copilot Workspace **technical preview** → 映射为 `research_preview` + `dev_platform`（2024-04-29）
- Devin **首次公布 / 早鸟** → `first_announce` + `agent`（2024-03-12）

---

## 4. 来源审计（Source Audit）

优先级从高到低：

1. 公司官网 News / Blog / Research  
2. 官方 Docs、Product changelog、GitHub 组织 changelog  
3. 官方开发者平台公告（如云厂商与模型方联合稿中的模型方链接）  
4. 作为辅证的主流科技媒体（不可单独支撑精确日期，除非官方失联且媒体引述可核对）

审计动作：

- 打开 URL，确认标题、日期与事件描述一致。  
- 记录 `publisher` 与 `publishedAt`。  
- 若官方改版死链：替换为新官方 URL 或可靠归档（如 Internet Archive），勿删事件除非事实被撤回。  
- 社交媒体（X/Twitter 等）仅作辅证，不作为唯一 `sources[0]`。

---

## 5. 去重策略（Dedup Policy）

在添加前用以下键做冲突检测（逻辑键，非物理唯一索引）：

```
(company 规范化, series|product, eventType, date)
```

| 情况 | 处理 |
| --- | --- |
| 完全相同逻辑键 | 拒绝新条；可改进有文案/来源的一条 |
| 同产品同日不同阶段表述 | 核对原文：通常只保留最符合官方用词的一条 |
| 同产品不同日的 preview → GA | **两条都保留**，`relatedIds` 互链 |
| 更名 | 新条 `rename_rebrand`；旧名留在历史条，不改写旧 `title` 冒充新名 |
| 模型发布 vs 产品接入 | 可并存：一条 `model`，一条 `product`，互相 `relatedIds` |

`id` 一旦进入 `main`，视为稳定引用；废弃条目应标 `discontinued` 相关新事件，而不是静默删除历史（确属错误录入除外，须在 commit message 说明）。

---

## 6. 本地脚本

```bash
npm install
npm run build      # tsc + vite build，导入 data/timeline.json 做类型检查
npm run validate   # 额外跑 invariants 校验脚本
npm run dev        # 可选：查看占位 UI
```

---

## 7. PR / Commit 建议

- Commit 信息标明：`data: add …` / `docs: …` / `fix: …`。  
- 仅改数据时附上主来源 URL 列表。  
- Schema 变更与数据变更尽量分 commit，便于回滚。

---

## 8. Schema 迁移（0.1 → 0.2）

| 变更 | 说明 |
| --- | --- |
| `Company.color` | 必填 `#RRGGBB`；UI 标记/胶囊取色 |
| `Company.colorSoft` | 可选浅底色 |
| `meta.ui.openingBg` | 开篇 Hero 背景（CSS 渐变优先） |
| `meta.ui.openingFg` | 可选 Hero 文字色 |
| 一级分类展示序 | 文档/UI：概念 → 大模型 → 产品 → 其他（仍仅四类） |
| `meta.version` | `0.2.0` |

校验：`npm run validate` 会强制 `company.color` 与 `meta.ui.openingBg`。
