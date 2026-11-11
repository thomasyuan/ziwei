# 紫微斗数排盘与研究站点（自建）

一个可自部署的紫微斗数网站：**开源安星引擎起盘 + 自建的 13 维论断库 + 格局目录 + 古籍原文阅读 + 合盘规则分析 + 可选 AI 追问**。

排盘与规则解读不需要任何 API Key，也不做账号系统。**默认亮色（宣纸暖底）**，导航条右侧可切暗色，选择记在浏览器 localStorage。

## 线上功能一览

| 页面 | 内容 |
|---|---|
| `/` | 首页：速起表单、能力介绍、十四主星入口、数据统计 |
| `/chart` | 排盘工作台：出生表单（省份城市、真太阳时、时辰不详）、4×4 命盘、点宫看三方四正连线、大限/流年四化叠层、13 维解读面板、格局卡片、命盘摘要、AI 追问、分享卡（含导出图片）、名人盘深链 |
| `/heming` | 合盘：双表单 → 规则引擎双盘联参（夫妻宫互参、四化互落、命宫合冲、福德田宅）→ 1–5 星评分；接大模型做自由问答；双盘可切换查看 |
| `/knowledge` | 知识库：14 主星 × 13 主题 = 182 篇静态页，每篇含定调 / 核心论断 / 命盘依据 / 经典出处 / 应用建议；SEO + JSON-LD + 内链 |
| `/patterns` | 格局目录：70 种格局（上格/中格/平格/需防），含必须条件、加分项、破格项与古籍出处，由排盘引擎扫 11,088 张盘收集 |
| `/library` | 古籍原文：《紫微斗数全书》《紫微斗数全集》《骨髓赋》全文，章节阅读、全文检索、段落锚点（公版原文） |
| `/guides` | 入门指南：安星五步、四化表（十干全表）、十二宫职责、读盘顺序、时辰对照与常见误区 |
| `/famous` | 名人命盘对照（公开出生日期 + 估算时辰），按时辰地支索引直接起盘 |
| `/about` | 本站的排盘口径、论断库构成、技术栈与自部署说明、许可与来源标注 |
| `/privacy` `/terms` | 隐私与条款（无账号、无收费；写明 AI Key 存在你自己的浏览器、命盘摘要会送到厂商接口） |
| `/sitemap.xml` `/robots.txt` | 自动生成，含 182 篇知识库页与全部古籍章节页 |

## 排盘与解读口径（与上游仓库一致）

- 安星：iztro + `lib/ziwei/algorithm.ts`（纳音五行局、命宫逆数生时、身宫顺数生时）
- 年柱换年：**正月初一**（主流派口径，非立春换年）
- 星曜亮度：默认《紫微斗数全书》表（24 处覆写修正），可切流派
- 四化：生年四化、宫干自化、大限宫干四化、流年四化叠层；**只写四化表里真实存在的组合**（紫微无化禄/化忌，天府/天相/七杀无四化）
- 真太阳时：出生地经度差 + 均时差；中国 1986–1991 夏令时只判定、不自动扣除
- 晚子时换日：按**真太阳时**判定（东经 100° 钟表 23:30 = 真太阳时 22:10 亥时，留在当日）
- 格局识别：不用宫干自化、来因宫等飞星派工具

## 论断库（本站原创，仓库里没有）

开源仓库的 `lib/ziwei/db-analysis.ts` 里 `STAR_DB` 是空占位，「画得出盘，给不出解读」。本站补齐了内容层：

| 模块 | 条目 |
|---|---|
| `lib/interpret/stars-1..4.ts` | 14 主星 × 12 宫，每格四层（定调 / 核心论断 / 命盘依据 / 建议）= 168 条；亮度四档论断；可发生的四化共 26 条 |
| `lib/interpret/aux-1.ts` | 六吉六煞 + 禄存天马 × 12 宫 = 168 条 |
| `lib/interpret/aux-2.ts` | 红鸾、天喜、天姚、咸池、华盖、阴煞、孤辰、寡宿、天刑、天月、大耗、破碎 × 12 宫 = 144 条；另有 30 种杂曜短评 |
| `lib/interpret/combos.ts` | 21 种双星组合（紫府、紫相、紫杀、紫破、机巨、机阴、机梁、日巨、日梁、武府、武相、武杀、武破、同阴、同巨、同梁、廉府、廉贪、廉杀、廉破、廉相）+ 昌曲辅弼四化 |
| `lib/interpret/generate.ts` | 13 维解读生成器：本宫 → 四化（含自化）→ 辅煞 → 三方四正 → 格局 → 大限 → 流年 → 古籍引证 → 建议；健康维另加「脏腑取法」（取杀星最集中之宫的地支对应） |
| `lib/interpret/pattern-catalog.ts` | 70 种格局目录（扫 11,088 张盘收集），构建时零成本；`npm run gen:catalog` 重生成 |
| `lib/interpret/heming.ts` | 合盘规则引擎：夫妻宫星性相性矩阵、四化互落、命宫合冲、福德田宅煞星，输出 1–5 星评分与逐条依据 |
| `lib/interpret/knowledge.ts` | 把论断库装配成 182 篇 SEO 内容（四段 markers + 建议），引文逐字可查 |

**确定性生成**：同一张盘恒得同一份解读，不经 AI；AI 面板只做追问，且把规则解读作为上下文送入模型。

## 部署方式（见下方 A/B/C）

## 跑起来

```bash
cd site
npm install
npm run dev          # http://localhost:3000
npm run build        # 生产构建（226 页静态生成）
npm run typecheck
npm test             # 21 条回归：排盘铁律、夏令时、立春边界、时辰索引、
                     # 论断库四化合法性、知识库引文逐字核对、合盘 prompt 跟随表单、
                     # 浏览器直连 SSE 逐字节切分、Key 存储与「Key 不进日志」…
node scripts/tools/checkai.mjs   # iPhone 视口端到端：Key 只落浏览器、请求只到厂商接口
```

AI 追问用**你自己的 Key，存在浏览器里**（GitHub Pages 没有后端，Key 也不经本站服务器）：
排盘页 / 合盘页的「设置 Key」面板填 DeepSeek（或 OpenAI / Moonshot / 通义的 OpenAI 兼容接口）→
Key 写进本页的 `localStorage`（勾「记住」）或 `sessionStorage`（不勾 = 关掉标签页即失效）→
浏览器带着它直连厂商接口。不填 Key 时排盘与 13 维规则解读照常完整可用，AI 段只留一行说明。

```bash
cp .env.example .env.local
# 站点根地址（sitemap / canonical / OG 用）
NEXT_PUBLIC_SITE_URL=https://your-domain
# 站长平台验证（可选）
NEXT_PUBLIC_GOOGLE_VERIFICATION=
NEXT_PUBLIC_BING_VERIFICATION=
# AI Key **不在这里配**：在页面的「设置 Key」里填，只存进你自己的浏览器（见上）
```

部署：标准 Next.js 应用，`next build` + `next start`，或推到 Vercel（需要环境变量）。无数据库、无外部服务依赖；`gen-catalog.mjs` 只在重生成格局目录时跑（约 4 分钟）。

## 许可与来源

- `LICENSE`（MIT）与排盘引擎、格局识别、真太阳时、城市经度、古籍数据等代码来自 [Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu)，安星库来自 [iztro](https://github.com/SylarLong/iztro)。二次使用请保留 MIT 声明并标注来源。
- `lib/interpret/*` 的论断文字为本站原创编纂，建议按 **CC BY 4.0** 使用（转载注明来源）。
- `lib/classics/*` 古籍原文为公版（《紫微斗数全书》《紫微斗数全集》《骨髓赋》）。
- 六亲（父母、兄弟、子女）判断在斗数中历来偏弱，这三段内容在页面上标注「仅供参考」，不构成医疗、法律、投资建议。

## 目录结构

```
site/
  app/            页面（静态导出后没有服务端 API）
    api/reading   POST 命盘 JSON → 格局 + 13 维解读（只在 Docker/VPS 模式下存在；排盘页在浏览器里直接调 lib/*，不走这条）
    chart / heming / knowledge(+182 SSG) / library / patterns / guides / famous / about / privacy / terms
  components/     Header, Footer, BirthForm, ChartBoard, PalaceCell, TimeNav,
                  ReadingPanel（13 维面板）, AiPanel（追问）, AiKeySettings（Key 面板）,
                  PatternsCard, ChartSummary, StarDetailPanel, ShareModal + ShareCardCanvas,
                  StarField, ThemeProvider
  lib/
    ai/         providers（厂商预设 + 实测的浏览器直连 CORS 标记）、settings（Key 存浏览器，
                打码显示、记住/不记住、清除）、browser（直连流式调用 + 测试连接）、
                sse（逐字节切分的 SSE 解析）、requests（prompt 装配，与已删的服务端路由逐字一致）、
                prompts（system 口径）
    ziwei/      排盘内核（沿用开源仓库）：algorithm, sihua, patterns, cities,
                true-solar-time, dst-cn, clock-adjust, lunar-solar, school-*,
                shier-shen, yunxian-context, famous, heming-knowledge, history,
                db-analysis（接本站论断库）
    interpret/  论断库 + 13 维生成器 + 合盘规则 + 格局目录 + SEO 装配
    classics/   三部古籍全文与检索（公版）
    nihai/      天纪/地纪/人纪资料模块
    seo/        知识库 helper 与 slug 表
  scripts/regression/ 21 条回归测试
  scripts/tools/  检查脚本：checkai（iPhone 视口端到端 + Key/请求落点）、checklayout、checkheader、
                  checkbg、checkfull、checkscroll、checkmargin、checktheme、checktoggle、
                  staticserve（本地验 out/）、gen-catalog、mkchart
```

## 可以继续做的方向

- 用 Releases 里的 13 维解读数据集 v4.0（67.5 万盘 × 13 维）做「盘 → 预生成解读」查询，按 CC BY 4.0 标注来源；本站的规则引擎是逐条生成，不依赖数据集。
- 加流年流月流日流时四层面板（`lib/ziwei/sihua.ts` 已支持四化，`shier-shen.ts` 已支持十二神煞）。
- 加命盘历史与收藏（本地 storage，无账号）。
- 加「准/不准」反馈闭环，用于论断库迭代（哪些断语在真实盘上不准，改条件与分档）。
## 部署方式

### A) Docker 镜像（含服务端，`/api/reading` 可用；AI 走浏览器直连）

镜像已构建并推送到 Docker Hub：**`thomasyuan/ziwei:1.0.0`**（`linux/amd64`，约 360 MB，非 root 用户，带健康检查）。

```bash
docker pull thomasyuan/ziwei:1.0.0
docker run -d --name ziwei -p 9999:3000 --restart unless-stopped thomasyuan/ziwei:1.0.0
# 局域网访问：http://<宿主机IP>:9999
```

- AI Key 不在容器里配：排盘页 / 合盘页的「设置 Key」填了之后由浏览器直连厂商接口，容器不碰 Key。
- 容器内监听 `0.0.0.0:3000`（`HOSTNAME=0.0.0.0`、`PORT=3000` 已在镜像里设好）；`-p 9999:3000` 发布在宿主机所有网卡（`0.0.0.0`）。
- `NEXT_PUBLIC_SITE_URL` 是**构建时**注入的（sitemap/canonical/OG 用），运行时改环境变量无效；重新构建时传：
  `docker build --build-arg NEXT_PUBLIC_SITE_URL=https://your-domain -t thomasyuan/ziwei:1.0.0 .`
- 用 compose：`docker compose up -d`（见 `compose.yaml`）。
- 本地构建：`docker build -t thomasyuan/ziwei:1.0.0 .`（多阶段，产物只含 `node:23-alpine` + standalone）。

### B) GitHub Pages / 纯静态托管（AI 追问与 AI 深挖都可用）

排盘、13 维解读、合盘规则、格局目录、古籍阅读与搜索**全在浏览器里运行**（论断库与格局识别是纯函数，动态导入做代码分割），所以可以静态导出：

```bash
# 根路径部署（如 Cloudflare Pages / Vercel 静态 / nginx 静态目录）
npm run build:static          # 产出 out/
# GitHub Pages 项目站（https://<user>.github.io/<repo>/）
npm run build:pages           # 带 basePath=/ziwei（把 /ziwei 换成你的仓库名）
```

`out/` 里已带 `public/.nojekyll`；部署到 Pages 时用 `out/` 作为发布目录。

- AI 追问在静态站可用：用户在页面里填自己的 Key（存本机浏览器），浏览器直连厂商接口，本站不经手、不留日志。
- 规则解读与合盘评分在静态模式下完全可用（本来就不依赖 AI）。
- `out/` 里没有 API 路由（`/api/reading` 不参与静态导出，排盘页本来也不调它）。
- 本地预览静态产物：`npm run serve:static`（http://127.0.0.1:3996）；`node scripts/tools/checkai.mjs` 用 iPhone 视口验一遍 Key 与请求落点。

### C) VPS / Vercel（standalone，含 `/api/reading`）

`npm run build`（standalone 产物）+ `node .next/standalone/server.js`；或推 Vercel。AI Key 同样不在服务端配：由用户在页面里填，浏览器直连厂商接口。
