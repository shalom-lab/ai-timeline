# Logo sources (`public/logos/`)

All marks are third-party brand assets (not invented geometry).

| file | source |
| --- | --- |
| openai.svg | Simple Icons v15 (`openai`) — CDN jsDelivr |
| anthropic.svg | Simple Icons v16 (`anthropic`) |
| google.svg | Simple Icons v16 (`google`) |
| deepmind.svg | **Fallback:** same as `google.svg` (Simple Icons). No official DeepMind constellation in Simple Icons / Commons usable mark; do not invent dots. |
| meta.svg | Simple Icons v16 (`meta`) |
| microsoft.svg | Wikimedia Commons `Microsoft_logo.svg` |
| github.svg | Simple Icons v16 (`github`) |
| xai.svg | Simple Icons v16 (`x`) — closest public mark; xAI-specific glyph not in Simple Icons |
| deepseek.svg | Simple Icons v16 (`deepseek`) |
| alibaba.svg | **Qwen** mark (通义千问) — Simple Icons (`qwen`), brand fill `#6950EF`. Not Alibaba.com shopping logo. CDN: https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/qwen.svg · https://cdn.simpleicons.org/qwen |
| tencent.svg | Simple Icons v13 (`tencentqq`) |
| bytedance.png | **Doubao** official character avatar (卡通圆形头像) — ByteDance Doubao CDN `doubao-icon.1c7a2027.png` (360×360). NOT the geometric ribbon / Lobe `doubao-color` mark. https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/desktop_online_web/static/image/doubao-icon.1c7a2027.png · also favicon https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/chat/favicon-doubao.png |
| moonshot.svg | Simple Icons v16 (`moonshotai`) |
| minimax.svg | Simple Icons v16 (`minimax`) |
| cursor.svg | Simple Icons v16 (`cursor`), tinted `#7C3AED` |
| zhipu.svg | **清言 (Qingyan)** brand mark — blue linked/overlapping double-ring (∞-like), Lobe Icons `qingyan-color.svg` fills `#3762FF` / `#1041F3`. Not Z.ai black plate. https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/qingyan-color.svg · product https://chatglm.cn |
| cognition / openclaw / qoder | *missing* — letter avatar fallback in UI |


## Brand tint

Simple Icons ships monochrome paths. For single-color marks we set `fill` to the **product** brand hex so card icons keep original brand color (not black, not a parent-corp substitute). **Google / DeepMind / Microsoft / Doubao (PNG avatar) / 清言** keep true multi-color or photographic marks.

## File types

`CompanyLogoImg` resolves `public/logos/{id}.{png|svg}` via `COMPANY_LOGO_EXT` in `src/lib/icons.tsx` (PNG preferred when the official asset is raster, e.g. Doubao).
