# AI纪年（AI Timeline）数据规范

本文定义 **AI Timeline** 的权威数据结构与字段语义。字段名使用英文（与 TypeScript / JSON 一致）；说明使用中文。实现以 `src/types/timeline.ts`、`data/timeline.json`，以及独立的 `src/types/capability.ts` / `data/capability-frontier.json`（能力边界）为准。

**原则：先规范与数据，后 UI。** 任何界面层只能消费本规范下的数据，不得在前端硬编码「另一套」分类或日期规则。

---

## 1. 范围与目标

| 项 | 约定 |
| --- | --- |
| 时间下界 | `meta.scopeStart` = `2022-11-30`（ChatGPT 公众研究预览上线日）。**不得收录更早事件。** |
| 内容焦点 | 大模型、面向大众/开发者的 AI 产品、AI 科学突破；优先「可核验的公开发布」。 |
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
| `name` | `string` | 是 | 数据集名称，如 `"AI纪年"` |
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

四个一级分类。文档与看板 **展示顺序**：大模型 → 产品 → 科学 → 其他。

| 展示序 | 枚举值 | 中文标签 | 用法 |
| --- | --- | --- | --- |
| 1 | `model` | 大模型 | 基础/对话/多模态/文生图·视频等 **foundation model** 权重或 API 型号本身的发布；看板内按 **公司** 分组 |
| 2 | `product` | 产品 | 面向用户或开发者的产品、客户端、工具、平台能力 |
| 3 | `science` | 科学 | **AI 在科学领域的发现/突破**：用 AI 攻克（或显著推进）科学难题的可核验节点，如蛋白质结构、材料、药物发现演示、气候/天气模型、数学证明等。**不是**普通消费级产品上线。例：AlphaFold 3。看板内按 **`scienceDiscipline`（学科）** 分组；卡片仍展示公司。可保留 `ai-for-science` 等 tags |
| 4 | `other` | 其他 | 无法归入以上三类时（如开放协议、工程实践文）；应尽量少用 |

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

#### `scienceDiscipline`（科学二级，`category === 'science'` 时宜填写）

看板「科学」列按 **学科** 分 chips/子列，**不按** `series`（GraphCast系列等）。卡片 header 仍展示 `company`（如 Google DeepMind）。

| 枚举值 | 中文标签 | 覆盖 |
| --- | --- | --- |
| `life` | 生命科学 | 医学/基因组/蛋白/抗生素/合成生物等 |
| `math` | 数学 | 奥数、算法发现、偏数学的理论计科 |
| `materials` | 材料 | 晶体/材料发现等 |
| `earth` | 地球科学 | 天气/气候/Aurora/GraphCast 等 |
| `other` | 其他 | 仅当实在不归类 |

`series` / `product` 可保留供检索与详情；UI 分组键为 `scienceDiscipline`。缺省时实现可从 tags 回退推断，但种子应显式填写。

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
| `capabilities` | `ModelCapability[]` | 否 | **仅** `category === 'model'`：该次发布实际具备的模态/能力芯片。不确定则省略，勿臆造 |

#### `capabilities`（大模型能力芯片）

枚举（展示序固定）：

| 值 | 中文 tooltip | 含义 |
| --- | --- | --- |
| `chat` | 对话 | 文本对话 / 指令跟随 |
| `reasoning` | 思考 | 显式长链推理（o1 / R1 / extended thinking 等） |
| `image` | 图像 | 文生图 / 图像生成 |
| `video` | 视频 | 文生视频 / 视频生成 |
| `vision` | 视觉 | 图像理解 / 视觉输入（非生成） |
| `audio` | 语音 | 原生语音输入或输出 |

UI：大模型 EventCard **底部**显示小图标行；产品等其他一级分类不渲染此行。

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
5b. `category === 'science'` 时推荐存在 `scienceDiscipline`（`life` / `math` / `materials` / `earth` / `other`）。
6. `dateStatus !== 'unverified'`（主数据集）。
7. `relatedIds` 若存在，须指向同文件内已有 `id`。
8. 每个 `companies[]` 必须有合法 `#RRGGBB` 的 `color`；`colorSoft` 若存在同为 hex。
9. `meta.ui.openingBg` 必须非空（开篇背景）。
10. `capabilities` 若存在：须为上述枚举子集、无重复；非 `model` 事件不得带非空 `capabilities`。

---

## 6. 与类型文件的关系

| 产物 | 路径 |
| --- | --- |
| 本规范 | `docs/DATA.md` |
| TypeScript 类型 | `src/types/timeline.ts` |
| 种子数据 | `data/timeline.json` |
| 能力边界类型 | `src/types/capability.ts` |
| 能力边界种子 | `data/capability-frontier.json` |
| 贡献与审核流程 | `docs/DEVELOPMENT.md` |

变更枚举或必填字段时：**先改本文与 `timeline.ts`，再改 JSON，并在 `DEVELOPMENT.md` 记录迁移说明。** 本仓库 v0.1 未对上游 schema 做偏离；若未来有偏离，须在本节显式列出。

### Schema 偏离记录（当前）

相对 v0.1：`Company` 增加必填 `color` 与可选 `colorSoft`；`TimelineMeta` 增加可选 `ui`（`TimelineUiMeta.openingBg` / `openingFg`）。版本 `0.2.0`。

相对 v0.2：一级 `Category` 曾增至五值，新增 `science`（科学：AI 科学发现/突破，非普通产品发布）；当时看板序为 大模型 → 产品 → 概念 → 科学 → 其他。版本 `0.3.0`。

相对 v0.5：新增独立数据集 **能力边界**（`capability-frontier.json`）；扩充 foundation model 种子；`Google DeepMind` 从 Google 词典中拆出独立 `companies[].id = deepmind`。时间线 `meta.version` `0.6.0`。

相对 v0.6：

- **大模型列分组键改为公司**（`companies[].id` / `name`），不再按 `series` 拆开（OpenAI 的 GPT/o1/o3、DeepSeek 与 DeepSeek-R1、腾讯混元等各自成一组）。多选 chips 同步按公司过滤。
- **图像/生成式基础模型**归入 `category: model`（例：DALL·E 3、Sora）；ChatGPT 对话产品、Cursor IDE、Claude.ai 等仍为 `product`。
- 新增 `companies[].id = bytedance`（字节跳动）及已核验的豆包大模型节点（2024-05-15 家族发布、2025-01-22 Doubao-1.5-pro）。
- 公司标识改为 `public/logos/{id}.svg` 实标（Simple Icons / Wikimedia），不再使用自造几何 SVG。

时间线 `meta.version` `0.7.0`。

相对 v0.7：补录 Codex / 智谱 GLM / Cursor / Grok iOS / OpenClaw / QoderWork / WorkBuddy 等可核验节点；概念列取消强制主题 chips。`meta.version` `0.7.2`。

相对 v0.7.3：`TimelineEvent` 新增可选 `capabilities?: ModelCapability[]`（仅大模型卡片底部能力图标：对话/思考/图像/视频/视觉/语音）；种子按发布事实 best-effort 标注。时间线 `meta.version` `0.7.4`。

相对 v0.10：**移除一级分类 `concept`（概念列整体取消）**。看板四列：大模型 → 产品 → 科学 → 其他。原概念节点迁入 `product`（如 Agent Skills）或 `other`（如 MCP、Agent Harness）。`Category` / 校验 / UI 同步删除 `concept`。时间线 `meta.version` `0.11.0`。

相对 v0.14.1：**科学列分组键改为 `scienceDiscipline`（学科）**，chips 为 生命科学 / 数学 / 材料 / 地球科学 / 其他；不再按 `series`（GraphCast系列等）。`series`/`product` 仍保留；卡片 header 公司展示不变。时间线 `meta.version` `0.14.2`。

能力边界数据集 `0.2.0`：`workflows` → `new[]` 工作场景；UI 累积「既往已具备」默认折叠。

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

---

## 8. 能力边界（Capability Frontier）— 独立数据集

**与事件时间线分离。** 能力边界不是 `events[]` 的一种 category，也不混入 `timeline.json`。

| 对比 | 时间线事件 (`timeline.json`) | 能力边界 (`capability-frontier.json`) |
| --- | --- | --- |
| 粒度 | 可核验的发布/开源/更名等节点 | **月末快照**：截止该月末普通人+AI 已能做的**工作场景**（当月新增 + 既往累积） |
| 重复 | 历史节点保留 | **new[] 只记当月新增**；既往场景由 UI 累积展示 |
| 用途 | 编年史 / 看板四列 | 判断自己是否「落后于前沿」 |
| UI | 大模型/产品/科学/其他 | 独立轨道「能力边界」（品红强调色，可独占） |

根对象：

```ts
interface CapabilityFrontierData {
  meta: {
    name: string // "能力边界"
    version: string
    scopeStart: string // "2022-11"
    updatedAt: string // YYYY-MM-DD
    locale: string
  }
  months: CapabilityMonth[]
}

interface CapabilityMonth {
  month: string // YYYY-MM
  summary: string // 截止该月末，普通人+AI 已能做的事（口语）
  new: CapabilityScenario[] // 当月新增工作场景
}

interface CapabilityScenario {
  id: string // global unique kebab（首次出现月登记）
  emoji?: string
  before: string // 之前：没有这项能力时怎么干（短句）
  after: string // 之后：有了 AI 后已能做的具体工作场景
  detail?: string // 可选 how / 注意点
  enabledBy?: string[] // timeline event ids
  tags?: string[]
}
// UI：每张卡「之前 → 之后」对比；既往已具备 = 本月之前所有 new 的累积（默认折叠）
```

不变式（`npm run validate` 一并校验）：

1. `workflow.id` **全局唯一**（跨月）。
2. `months` 按 `month` **升序**。
3. `month >= meta.scopeStart` 且 `>= 2022-11`。
4. 每条 `enabledBy` 若存在，须指向 `timeline.json` 已有 `id`。
5. 无新增则 **省略该月**，不要写空 `workflows`。

贡献规则：**只追加**新月或新 scenario 到 `new[]`；不要把旧场景再写进后续月的 `new[]`（既往由 UI 折叠展示）。文案用「之前/之后」对比短句 + emoji，避免产品发布腔；`after` 写具体工作场景。

路径：`docs/DATA.md`（本节）· `src/types/capability.ts` · `data/capability-frontier.json`。

相对 v0.3：场景改为 `before` / `after` 对比字段（原 `title` 迁入 `after`）；UI 用前后对比卡展示能力跃迁。frontier `meta.version` `0.4.0`。

---

## 9. AI工具矩阵（`ai-tools.json`）— 独立数据集

**不是历史时间线。** 只记录**当前仍可用**的产品形态一览；公司行复用 `timeline.json` 的 `companies[].id`（色与 logo 同源）。

路由：客户端 hash `#/tools`（默认模型 Tab；亦可 `#/tools/models` / `#/tools/products`；纪年看板为 `#/`），适配 GitHub Pages，无服务端路由。

根对象：

```ts
interface AiToolsData {
  meta: {
    name: string // "AI工具"
    version: string
    updatedAt: string // YYYY-MM-DD
    locale: string
    disclaimer?: string
  }
  columns: { id: ToolColumnId; label: string }[]
  rows: ToolRow[]
}

/** UI tabs (single-group matrix each): 模型 | 产品 */
type ToolColumnId =
  | 'llm'      // 语言模型（大模型）
  | 'image'    // 图像（大模型）
  | 'video'    // 视频（大模型）
  | 'other'    // 其他：embedding / 语音 / 新形态等（大模型）
  | 'chat'     // 对话（产品）
  | 'coding'   // 编程办公（产品）
  | 'api'      // API（产品）

interface ToolProduct {
  name: string
  url: string          // 产品主页
  pricing: string      // 高层费用提示（免费档 / Plus 价 / API 按量）
  pricingUrl?: string  // 官方定价页
  note?: string
  /** Optional public/logos/{key} id; UI shows logos in both 模型/产品 cells */
  logo?: string
}

interface ToolRow {
  companyId: string // = timeline companies[].id
  /** Single brand label — no "A / B" slashes */
  displayName?: string
  cells: Partial<Record<ToolColumnId, ToolProduct | ToolProduct[]>>
}
```

不变式（`npm run validate`）：

1. `rows[].companyId` 必须存在于 `timeline.json` `companies[]`。
2. `columns[].id` 为上述枚举；无重复。顺序建议：大模型四列 → 产品三列。
3. 每个 cell 产品须有非空 `name` / `pricing`，且 `url`（及可选 `pricingUrl`）为 http(s)；可选 `logo` 为 kebab-case 键。
4. `displayName` 若存在，不得含 `/`（公司列只用单一品牌名）。
5. 每行至少 1 个产品；种子不少于约 5 家主要公司。
6. UI 以 Tab 切换 `TOOL_COLUMN_GROUPS`（模型 | 产品），每次只展示一组子列；无两级 group thead。隐藏当前 Tab 下无单元格的公司行；可隐藏整列为空的形态列。模型与产品单元格均在名称旁显示小 logo（`logo` 键或行公司标）；列头旁配简洁形态 icon。

路径：`docs/DATA.md`（本节）· `src/types/tools.ts` · `data/ai-tools.json`。

相对 v0.13：工具矩阵去掉扁平 `agent` 列，迁入 coding/chat/other；新增 `other`；Cursor 行并入 xAI/Grok；产品列显示产品 logo。

相对 v0.15：AI工具页改为 **模型 / 产品** 两个 Tab（不再用大模型|产品双层表头）；模型单元格也显示 logo；列头配形态 icon；hash 可记 Tab。

