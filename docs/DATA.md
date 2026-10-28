# AI Timeline 数据规范

本文定义 **AI Timeline** 的权威数据结构与字段语义。字段名使用英文（与 TypeScript / JSON 一致）；说明使用中文。实现以 `src/types/timeline.ts` 与 `data/timeline.json` 为准。

**原则：先规范与数据，后 UI。** 任何界面层只能消费本规范下的数据，不得在前端硬编码「另一套」分类或日期规则。

---

## 1. 范围与目标

| 项 | 约定 |
| --- | --- |
| 时间下界 | `meta.scopeStart` = `2022-11-30`（ChatGPT 公众研究预览上线日）。**不得收录更早事件。** |
| 内容焦点 | 大模型、面向大众/开发者的 AI 产品、关键概念落地节点；优先「可核验的公开发布」。 |
| 日期诚实性 | 宁可少收，不可臆造日期。无法用官方或等价一级来源核实则 **不收录**。 |
| 预览 vs 正式 | `research_preview` / `public_beta` / `ga` 必须分开记；同一产品不同阶段用不同 `id` 与 `eventType`。 |

根对象类型为 `TimelineData`：

```ts
interface TimelineData {
  meta: TimelineMeta
  companies: Company[]
  events: TimelineEvent[]
}
```

---

## 2. `meta`（数据集元信息）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | 是 | 数据集名称，如 `"AI Timeline"` |
| `version` | `string` | 是 | 语义化版本，数据破坏性变更需升 major |
| `scopeStart` | `string` | 是 | 时间线起点，固定 `"2022-11-30"` |
| `updatedAt` | `string` | 是 | 本文件最近修订日，`YYYY-MM-DD` |
| `locale` | `string` | 是 | 正文默认语言标签，当前 `"zh-CN"`（字段名仍为英文） |
| `ui` | `TimelineUiMeta` | 否（v0.2 种子必填 `openingBg`） | 开篇/Hero 等展示元数据 |

#### `meta.ui`（`TimelineUiMeta`）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `openingBg` | `string` | 是（校验脚本要求） | 开篇/Hero 背景：优先 CSS 渐变，也可为图片 URL |
| `openingFg` | `string` | 否 | Hero 文字色，`#RRGGBB` |

---

## 3. `companies`（公司/组织词典）

用于规范化展示名、别名检索与 **品牌色**；**不是**事件必填外键（事件里写可读的 `company` 字符串，宜与本表 `name` 对齐）。

**颜色映射属于公司，不属于一级分类**——`category` 无 `color` 字段；UI 应按 `companies[]` 的 `name`/`id`/`aliases` 解析事件的 `company` 字符串后取色。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 稳定 kebab id，如 `openai`、`anthropic`、`xai` |
| `name` | `string` | 是 | 规范显示名 |
| `aliases` | `string[]` | 否 | 曾用名、品牌别称，便于搜索与去重 |
| `color` | `string` | 是 | 主品牌色 `#RRGGBB`，用于时间线标记与公司胶囊 |
| `colorSoft` | `string` | 否 | 浅底 tint `#RRGGBB`，用于胶囊背景等 |

---

## 4. `events`（时间线条目）— `TimelineEvent`

### 4.1 标识与时间

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 全局唯一 kebab-case。推荐：`{org}-{product-or-topic}-{eventType 缩写或语义}-{YYYY-MM-DD}`。例：`openai-chatgpt-research-preview-2022-11-30`、`anthropic-claude-code-research-preview-2025-02-24` |
| `date` | `string` | 是 | 事件日，`YYYY-MM-DD`，且 `date >= meta.scopeStart` |
| `dateStatus` | `'exact' \| 'approximate' \| 'unverified'` | 是 | 见下表。**种子数据只允许 `exact`；`unverified` 不得进入主数据集** |

`dateStatus`：

| 值 | 含义 | 收录策略 |
| --- | --- | --- |
| `exact` | 官方公告/文档写明或可唯一对应的公历日 | 默认可收录 |
| `approximate` | 仅知月/周，取代表日并在 `summary` 说明 | v1 谨慎使用；须在摘要中标明约数 |
| `unverified` | 传闻或二手且无法回源 | **禁止入库**；应省略事件 |

### 4.2 文案

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 短标题（中文为主），避免营销口号堆砌 |
| `summary` | `string` | 是 | 1–3 句事实摘要：发生了什么、对谁开放、处于何种阶段 |

### 4.3 分类体系

#### `category`（一级）

仅保留四个一级分类，**不增设第五个**。文档与 UI **展示顺序**（先概念/想法，再模型，再产品，最后其他）：

| 展示序 | 枚举值 | 中文标签 | 用法 |
| --- | --- | --- | --- |
| 1 | `concept` | 概念 | 行业共识性概念的「公开落地/命名」节点；亦可标注 AI 求解科学问题等跨产品范式节点（慎用） |
| 2 | `model` | 大模型 | 基础/对话/多模态等模型权重或 API 模型本身的发布（含 AlphaFold 等科学模型） |
| 3 | `product` | 产品 | 面向用户或开发者的产品、客户端、工具、平台能力 |
| 4 | `other` | 其他 | 无法归入以上三类时；应尽量少用 |

> 一级分类 **没有** 颜色字段；色值只写在 `companies[].color`。

#### `productSubcategory`（产品二级，`category === 'product'` 时宜填写）

| 枚举值 | 中文标签 |
| --- | --- |
| `ide` | 编程 IDE |
| `cli` | CLI |
| `work_assistant` | 工作助手 |
| `research_assistant` | 研究助手 |
| `search` | 搜索 |
| `image` | 图像 |
| `video` | 视频 |
| `voice` | 语音 |
| `agent` | 自动化 Agent |
| `dev_platform` | 开发平台 |
| `chat` | 对话产品 |
| `other_product` | 其他产品 |

说明：编码类工具按形态区分——编辑器内嵌能力用 `ide`，终端代理用 `cli`，端到端软件工程智能体可用 `agent` 或 `dev_platform`（见 DEVELOPMENT 示例）。

#### `eventType`（生命周期/动作）

| 枚举值 | 中文标签 | 典型场景 |
| --- | --- | --- |
| `research_preview` | 研究预览 | 官方明确 research / limited research preview |
| `public_beta` | 公测 | 公开 beta / 开放注册但仍标 beta |
| `ga` | 正式开放 | Generally Available / 正式对某客群开放 |
| `first_announce` | 首次公布 | 首次公开演示或宣布，未必可立即使用 |
| `major_upgrade` | 重要升级 | 同产品线重大能力跃迁（新一代模型进产品、关键新交互等） |
| `open_source` | 开源 | 权重、代码或完整工具以开源许可证发布 |
| `discontinued` | 停用 | 官方宣布下线或终止 |
| `rename_rebrand` | 更名 | 产品或品牌更名（如 Bard → Gemini） |
| `other` | 其他 | 无法归类时；须在 summary 说清性质 |

**强制区分预览与正式：** 例如 ChatGPT 2022-11-30 为 `research_preview`，不可标成 `ga`。Claude Code 2025-02-24 为 `research_preview`；Gemini CLI 2025-06-25 以开源引入为主，标 `open_source`（即便同期处于 preview 用量策略，也以「开源发布」为该条主事件类型，细节写入 `summary` / `tags`）。

### 4.4 归属与关联

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `company` | `string` | 是 | 主责任组织显示名 |
| `series` | `string` | 否 | 产品线/系列，如 `ChatGPT`、`Claude`、`Gemini` |
| `product` | `string` | 否 | 更细的产品或型号名 |
| `relatedIds` | `string[]` | 否 | 相关事件 `id`（前序版本、同日捆绑发布中的另一条等） |
| `tags` | `string[]` | 否 | 自由小写短标签，便于筛选；不替代正式枚举 |

### 4.5 `sources`（来源，至少 1 条）

```ts
interface Source {
  title: string
  url: string
  publisher?: string
  publishedAt?: string // YYYY-MM-DD
}
```

| 字段 | 说明 |
| --- | --- |
| `title` | 来源标题（多为原文标题） |
| `url` | 优先官方 blog / docs / changelog；避免仅社交媒体截图 |
| `publisher` | 发布方，如 `OpenAI`、`Anthropic`、`Google` |
| `publishedAt` | 来源页标注的发布日（可与 `event.date` 相同） |

一条事件可挂多条来源；**第一条应为最权威的一级来源**。

---

## 5. 不变式（Invariants）

校验脚本 / `npm run build` 类型检查应假定并尽量强制：

1. 每个 `events[].id` 唯一。
2. 每个 `events[].date >= meta.scopeStart`。
3. `date` / `publishedAt` / `updatedAt` / `scopeStart` 匹配 `^\d{4}-\d{2}-\d{2}$`。
4. `sources.length >= 1`，且 `url` 为 `http:` 或 `https:`。
5. `category === 'product'` 时推荐存在 `productSubcategory`。
6. `dateStatus !== 'unverified'`（主数据集）。
7. `relatedIds` 若存在，须指向同文件内已有 `id`。
8. 每个 `companies[]` 必须有合法 `#RRGGBB` 的 `color`；`colorSoft` 若存在同为 hex。
9. `meta.ui.openingBg` 必须非空（开篇背景）。

---

## 6. 与类型文件的关系

| 产物 | 路径 |
| --- | --- |
| 本规范 | `docs/DATA.md` |
| TypeScript 类型 | `src/types/timeline.ts` |
| 种子数据 | `data/timeline.json` |
| 贡献与审核流程 | `docs/DEVELOPMENT.md` |

变更枚举或必填字段时：**先改本文与 `timeline.ts`，再改 JSON，并在 `DEVELOPMENT.md` 记录迁移说明。** 本仓库 v0.1 未对上游 schema 做偏离；若未来有偏离，须在本节显式列出。

### Schema 偏离记录（当前）

相对 v0.1：`Company` 增加必填 `color` 与可选 `colorSoft`；`TimelineMeta` 增加可选 `ui`（`TimelineUiMeta.openingBg` / `openingFg`）。一级 `Category` 仍为四值，文档展示序改为 概念 → 大模型 → 产品 → 其他。版本 `0.2.0`（加性字段）。

---

## 7. 最小示意

```json
{
  "id": "anthropic-claude-code-research-preview-2025-02-24",
  "date": "2025-02-24",
  "dateStatus": "exact",
  "title": "Anthropic 发布 Claude Code 研究预览",
  "summary": "……有限研究预览……终端智能体编码工具……",
  "category": "product",
  "productSubcategory": "cli",
  "company": "Anthropic",
  "series": "Claude Code",
  "product": "Claude Code",
  "eventType": "research_preview",
  "sources": [
    {
      "title": "Claude 3.7 Sonnet and Claude Code",
      "url": "https://www.anthropic.com/news/claude-3-7-sonnet",
      "publisher": "Anthropic",
      "publishedAt": "2025-02-24"
    }
  ]
}
```

对照：Google Gemini CLI（2025-06-25）同为终端编码向工具，但主事实是 **Apache 2.0 开源发布**，故 `eventType` 为 `open_source`，而非 `research_preview`。细节见 `docs/DEVELOPMENT.md`。
