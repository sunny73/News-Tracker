# 📰 News Tracker — 新闻简报 & 追踪器

> 聚合全网热榜，自定义追踪关键词和来源，AI 智能生成新闻简报，定时推送邮箱。

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black)

## ✨ 功能特性

### 📊 首页热榜聚合
- 一站式聚合 **6 大平台** 热榜：知乎 / 微博 / 百度 / 今日头条 / 抖音 / 哔哩哔哩
- 支持 **10 个新闻源**：额外覆盖 36氪、IT之家、澎湃新闻、网易新闻
- Tab 快速切换单源 / 全源视图
- TOP 3 排名红色高亮，点击直达原文
- 数据 10 分钟自动缓存，支持手动刷新

### 🔍 简报追踪
- **自定义追踪器**：设置名称、关键词（多个）、新闻来源
- **AI 智能摘要**：基于 DeepSeek V3 自动生成结构化新闻简报
  - 核心摘要
  - 热点事件 TOP 5
  - 趋势洞察
- **灵活频率**：每小时 / 每 6 小时 / 每天 8:00 / 12:00 / 20:00 / 8:00&20:00
- **一键生成**：手动触发抓取 → 过滤 → 去重 → 摘要 → 推送
- **简报历史**：自动保存最近 100 条简报记录

### 📧 邮件推送
- 基于 Resend 发送精美 HTML 邮件
- 包含 AI 摘要 + 完整新闻列表
- 支持追踪器启用 / 暂停控制

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 |
| 样式 | TailwindCSS 4 + shadcn/ui |
| 图标 | Lucide React |
| 热榜数据 | [DailyHot API](https://api.vvhan.com/) |
| AI 摘要 | DeepSeek V3 |
| 邮件推送 | Resend |
| 数据存储 | JSON 文件（MVP）→ 后续迁移 Supabase |
| 部署 | Vercel |

## 📦 项目结构

```
news-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 全局布局 + 导航栏
│   │   ├── page.tsx            # 首页（热榜聚合）
│   │   ├── brief/
│   │   │   └── page.tsx        # 简报追踪页
│   │   └── api/
│   │       ├── hotlist/
│   │       │   └── route.ts    # 热榜数据 API
│   │       ├── trackers/
│   │       │   └── route.ts    # 追踪器 CRUD API
│   │       └── briefs/
│   │           ├── route.ts    # 简报历史 API
│   │           └── [action]/
│   │               └── route.ts # 简报生成 API
│   ├── components/
│   │   ├── navbar.tsx           # 导航栏
│   │   ├── hot-list-client.tsx  # 热榜页客户端组件
│   │   ├── brief-client.tsx     # 简报追踪页客户端组件
│   │   └── ui/                  # shadcn/ui 组件
│   └── lib/
│       ├── data.ts              # 数据层（类型、API 调用、AI 摘要、邮件）
│       ├── store.ts             # 存储层（JSON 文件 CRUD）
│       └── utils.ts             # 工具函数
├── data/                        # 运行时数据（JSON 文件，gitignore）
├── .env.local                   # 环境变量
└── package.json
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd news-tracker
npm install
```

### 2. 配置环境变量

复制 `.env.local` 并填入 API Key：

```env
# DeepSeek API Key（AI 摘要，去 https://platform.deepseek.com 获取）
DEEPSEEK_API_KEY=sk-xxx

# Resend API Key（邮件推送，去 https://resend.com 获取）
RESEND_API_KEY=re_xxx
```

> 💡 两个 Key 都是可选的：未配置 DeepSeek 会降级为本地模板摘要，未配置 Resend 则跳过邮件推送。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用指南

### 创建追踪器

1. 点击导航栏「简报追踪」
2. 点击「新建追踪器」
3. 填写：
   - **名称**：如「AI 行业动态」
   - **关键词**：如 `AI, 大模型, DeepSeek`（逗号分隔）
   - **来源**：点选 Badge 选择新闻源（不选则追踪全部）
   - **频率**：选择更新时间
   - **邮箱**：接收简报的邮箱地址
4. 点击「创建追踪器」

### 生成简报

- 在追踪器卡片上点击「立即生成」
- 系统会自动：抓取各源热榜 → 关键词过滤 → 去重 → AI 生成摘要 → 保存到历史 → 推送邮件

### 查看热榜

- 首页默认展示 6 大平台热榜
- 点击顶部 Badge 切换单源视图
- 点击新闻标题跳转原文

## 🔌 API 文档

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/hotlist?source=zhihu` | 获取指定源热榜数据 |
| `GET` | `/api/trackers` | 获取所有追踪器 |
| `POST` | `/api/trackers` | 创建追踪器 |
| `PUT` | `/api/trackers` | 更新追踪器 |
| `DELETE` | `/api/trackers?id=xxx` | 删除追踪器 |
| `POST` | `/api/briefs/generate?trackerId=xxx` | 生成简报 |
| `GET` | `/api/briefs?trackerId=xxx` | 获取简报历史 |

## 🗺️ 路线图

- [x] 首页热榜聚合
- [x] 简报追踪器 CRUD
- [x] AI 智能摘要（DeepSeek V3）
- [x] 邮件推送（Resend）
- [ ] Vercel Cron 定时自动生成
- [ ] 用户系统（NextAuth.js）
- [ ] 数据迁移到 Supabase
- [ ] RSSHub 自定义源支持
- [ ] 暗色模式
- [ ] PWA 离线支持
- [ ] 简报导出 PDF

## 📄 License

MIT
