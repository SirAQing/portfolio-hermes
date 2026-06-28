# Portfolio 项目全面梳理与重设计分析报告

> 分析日期：2026-06-20 | 最后更新：2026-06-20（Hero 入场动画 + 滚动引导箭头） | 分析对象：portfolio-react（前端 React SPA + Hermes AI 后端）

---

## 一、项目结构图

### 1.1 目录结构树

```
portfolio-react/
├── index.html                        # Vite 入口 HTML
├── package.json                      # 前端依赖清单
├── vite.config.ts                    # Vite 构建配置 + /api 代理 → localhost:8000
├── tailwind.config.js                # Tailwind 主题映射（CSS 变量 → 工具类）
├── postcss.config.js                 # PostCSS 插件链（Tailwind + Autoprefixer）
├── tsconfig.json                     # TypeScript 根配置
├── tsconfig.app.json                 # 应用 TS 配置（浏览器端）
├── tsconfig.node.json                # Node 环境 TS 配置（Vite 构建脚本）
├── eslint.config.js                  # ESLint 规则（flat config）
├── .env                              # 运行时环境变量（API 密钥、Webhook URL，不入 git）
├── .env.example                      # 环境变量模板
├── .gitignore                        # Git 忽略规则
├── docker-compose.yml                # 双服务编排（hermes-api + portfolio）
├── README.md                         # 项目说明
├── docs/                             # 项目文档
│   ├── project-analysis-report.md    # 本分析报告
│   └── data-flow.mermaid             # 数据流向 Mermaid 图
│
├── public/                           # Vite 静态资源
│   ├── favicon.svg                   # 站点图标
│   └── icons.svg                     # SVG 图标精灵
│
├── src/                              # ── 前端源码 ──
│   ├── main.tsx                      # React 入口，StrictMode + createRoot
│   ├── App.tsx                       # 根组件：I18nProvider 包裹 + 页面组装
│   │                                 #   内联定义 ContactSection + Footer
│   ├── i18n.tsx                      # 自研国际化系统（Context + ~125 翻译 key，en/zh）
│   ├── index.css                     # CSS 变量设计系统（light/dark 双主题变量）
│   ├── assets/
│   │   └── avatar.jpg                # 个人头像（Matrix 风格像素画）
│   └── components/
│       ├── HeroSection.tsx           # Hero 区：头像 + 打字机动画 + 徽章 + 专利 + CTA
│       ├── ExperienceSection.tsx     # 工作经验区：6 个能力标签 + 2 段经历时间线
│       ├── ProjectsSection.tsx       # 项目展示区：4 个项目卡片（2 列网格）
│       ├── MiscSections.tsx          # 复合文件，导出 3 个组件：
│       │                             #   EducationSection（教育背景）
│       │                             #   CertificationsSection（专利展示）
│       │                             #   SkillsSection（技能栈）
│       ├── SidebarNav.tsx            # 左侧固定导航（IntersectionObserver 滚动高亮）
│       ├── HeaderActions.tsx         # 右上角控制栏（主题切换 + 语言切换）
│       ├── FloatingAssistant.tsx     # 右下角 AI 聊天浮窗（SSE 流式对话）
│       └── shared/
│           └── SectionTitle.tsx      # 统一区块标题组件（icon + number + title + subtitle）
│
└── hermes/                           # ── 后端 AI 助理服务 ──
    ├── config.py                     # 配置中心（dotenv 加载 .env）
    ├── main.py                       # FastAPI 主入口（5 个端点 + 定时汇总任务）
    ├── models.py                     # SQLite 数据层（conversations + messages CRUD）
    ├── llm.py                        # DeepSeek LLM 调用（流式 SSE + 非流式）
    ├── notify.py                     # 通知服务（飞书 Webhook + PushPlus 微信推送）
    ├── requirements.txt              # Python 依赖
    ├── Dockerfile                    # 后端容器构建
    └── hermes.db                     # SQLite 数据库文件（运行时生成）
```

### 1.2 模块依赖关系

```
前端依赖图（→ 表示 "import"）：

main.tsx → App.tsx → I18nProvider (i18n.tsx)
                  → HeaderActions
                  → SidebarNav → i18n
                  → HeroSection → i18n, framer-motion, lucide-react, avatar.jpg
                  → ExperienceSection → i18n, lucide-react, shared/SectionTitle
                  → ProjectsSection → i18n, lucide-react, shared/SectionTitle
                  → MiscSections (3个) → i18n, lucide-react, shared/SectionTitle
                  → FloatingAssistant → i18n, framer-motion, lucide-react, avatar.jpg, /api/chat/stream
                  → ContactSection (内联于 App.tsx) → i18n
                  → Footer (内联于 App.tsx)

后端依赖图：

main.py → config.py (环境变量配置)
        → models.py (SQLite 数据库 CRUD)
        → llm.py → config.py (DeepSeek API 密钥)
        → notify.py → config.py (Webhook URL), models.py (查询未通知消息)

前端 ↔ 后端：Vite dev proxy（/api → localhost:8000）
```

**不存在循环依赖。** 所有依赖方向清晰单向，前端通过 HTTP 调用后端，后端模块间无环。

### 1.3 技术栈清单

| 层级 | 技术 | 版本 | 备注 |
|------|------|------|------|
| 前端框架 | React | 19.2.6 | 函数组件 + Hooks |
| 类型系统 | TypeScript | ~6.0.2 | |
| 构建工具 | Vite | 8.0.12 | dev server + 生产构建 |
| CSS 框架 | Tailwind CSS | 3.4.19 | class-based dark mode |
| 动画库 | Framer Motion | 12.40.0 | Hero 打字机 + 浮窗出入场 |
| 图标库 | Lucide React | 1.20.0 | |
| 国际化 | 自研 Context 方案 | — | I18nProvider + CustomEvent 广播，~125 key |
| 后端框架 | FastAPI | 0.115.0 | ASGI + SSE StreamingResponse |
| ASGI 服务器 | Uvicorn | 0.30.0 | |
| HTTP 客户端 | httpx | 0.27.0 | trust_env=False 绕过本地代理 |
| 数据验证 | Pydantic | 2.9.0 | ChatRequest / ChatResponse |
| 数据库 | SQLite | raw sqlite3 | WAL 模式 |
| LLM 接口 | DeepSeek API | OpenAI 兼容格式 | 流式 + 非流式 |
| 容器化 | Docker Compose | — | hermes-api + portfolio 双服务 |
| 通知 | 飞书 Webhook + PushPlus | — | 实时通知 + 定时汇总 |

### 1.4 现存结构问题

| 问题 | 严重度 | 说明 |
|------|--------|------|
| ContactSection + Footer 内联在 App.tsx | 中 | 与其他 Section 组件（各自独立文件）不一致，应抽取为独立组件 |
| MiscSections.tsx 职责杂糅 | 中 | 一个文件导出 Education + Certifications + Skills 三个独立 Section，粒度不一致 |
| ProjectsSection 项目描述硬编码英文 | 中 | 4 个项目的 title 和 description 是组件内英文字符串，未走 i18n，中文模式仍显示英文 |
| i18n 残留空 key | 低 | `share.*` 系列 key 值为空字符串（旧 SharingSection 残留），`hero.bio.1~4` 未被组件使用 |
| dist/ 磁盘残留 | 低 | .gitignore 已包含 dist，但磁盘上仍存在构建产物目录 |
| Dockerfile.frontend 缺失 | 低 | docker-compose.yml 引用了 Dockerfile.frontend 但项目中不存在 |

---

## 二、UI 布局分析

### 2.1 页面/视图清单

这是一个**单页面应用（SPA）**，无路由，所有内容垂直堆叠在一个长页面中：

| 视图 | 对应组件 | 功能定位 |
|------|----------|----------|
| 顶部控制栏 | HeaderActions | 固定右上角，语言切换（EN/中）+ 主题切换（亮/暗） |
| 左侧导航 | SidebarNav | 大屏（lg:）固定显示，小屏隐藏，滚动高亮当前章节 |
| Hero 区 | HeroSection | 首屏：头像 + 打字机标题 + 徽章 + 专利 + 一行亮点 + 3 个 CTA |
| 工作经验区 | ExperienceSection | 6 个核心能力卡片 + 2 段工作经历时间线 |
| 项目展示区 | ProjectsSection | 4 个项目卡片（2 列网格布局） |
| 教育 + 专利区 | EducationSection + CertificationsSection | 1 条教育记录 + 2 项发明专利 |
| 技能栈区 | SkillsSection | 语言能力进度条 + 7 个软技能标签 + 6 组技术栈 |
| 联系区 | ContactSection（内联） | 邮件联系按钮 |
| 页脚 | Footer（内联） | 一行版权信息 |
| AI 聊天浮窗 | FloatingAssistant | 右下角头像按钮 → 展开 SSE 流式聊天窗口 |

### 2.2 布局结构图

```
┌──────────────────────────────────────────────────────────────────────┐
│                       浏览器视口 (viewport)                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐   ┌───────────────────────────────────────┐  ┌─────┐ │
│  │ SidebarNav│   │         HeaderActions (fixed)         │  │     │ │
│  │ (fixed    │   │         [🌐 EN] [🌙/☀️]              │  │     │ │
│  │  left,    │   └───────────────────────────────────────┘  │     │ │
│  │  lg:only) │                                               │     │ │
│  │           │   ┌───────────────────────────────────────┐  │     │ │
│  │  ● Exp    │   │             HeroSection               │  │     │ │
│  │  ● Proj   │   │                                       │  │     │ │
│  │  ● Edu    │   │   ┌──────┐  Hi, I'm @刘明青            │  │     │ │
│  │  ● Skills │   │   │avatar│  AI × 数据工程师             │  │     │ │
│  │  ● Contact│   │   └──────┘  with ETL... (打字机动画)    │  │     │ │
│  │           │   │                                       │  │     │ │
│  │           │   │   [Data Engineer] [AI Practitioner]    │  │     │ │
│  │           │   │                                       │  │     │ │
│  │           │   │   PATENTS: CN119...  CN120...          │  │     │ │
│  │           │   │                                       │  │     │ │
│  │           │   │   4 年锂电行业 · 10+ 数据系统 · 2 项专利 │  │     │ │
│  │           │   │                                       │  │     │ │
│  │           │   │   [My Path] [What I Build] [Ask Me]   │  │     │ │
│  │           │   └───────────────────────────────────────┘  │     │ │
│  │           │                                               │     │ │
│  │           │   ┌───────────────────────────────────────┐  │     │ │
│  │           │   │         ExperienceSection              │  │     │ │
│  │           │   │                                       │  │     │ │
│  │           │   │  [AI Native] [AI Apps] [ETL] ... ×6   │  │     │ │
│  │           │   │                                       │  │     │ │
│  │           │   │  ● 江苏天合储能  2023-Present          │  │     │ │
│  │           │   │  │ 软件开发工程师                      │  │     │ │
│  │           │   │  │ ETL Platform, Kettle, Docker...    │  │     │ │
│  │           │   │  │                                    │  │     │ │
│  │           │   │  ● 江苏天合储能  2022-2023             │  │     │ │
│  │           │   │    研发工程师助理                      │  │     │ │
│  │           │   └───────────────────────────────────────┘  │     │ │
│  │           │                                               │     │ │
│  │           │   ┌───────────────────────────────────────┐  │ 🟢  │ │
│  │           │   │          ProjectsSection               │  │头像 │ │
│  │           │   │  ┌──────────┐  ┌──────────┐          │  │浮窗 │ │
│  │           │   │  │ ETL 平台  │  │ 报表自动化 │          │  │     │ │
│  │           │   │  └──────────┘  └──────────┘          │  │     │ │
│  │           │   │  ┌──────────┐  ┌──────────┐          │  │     │ │
│  │           │   │  │ LLM 平台  │  │ NL2SQL   │          │  │     │ │
│  │           │   │  └──────────┘  └──────────┘          │  │     │ │
│  │           │   └───────────────────────────────────────┘  │     │ │
│  │           │                                               │     │ │
│  │           │   ... Education + Patents + Skills + Contact  │     │ │
│  │           │                                               │     │ │
│  │           │   ┌───────────────────────────────────────┐  │     │ │
│  │           │   │  Footer: © 2026 刘明青                 │  │     │ │
│  │           │   └───────────────────────────────────────┘  │     │ │
│  └──────────┘                                               └─────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 组件层级图

```
App
├── I18nProvider (Context)
│   └── AppContent
│       ├── [fixed] HeaderActions              ← 主题 + 语言控制
│       ├── [fixed] SidebarNav                 ← 左侧锚点导航（5 个 section）
│       ├── [fixed bg] hero-glow-1 / hero-glow-2  ← 装饰性渐变背景
│       ├── <main>
│       │   ├── HeroSection
│       │   │   ├── AnimatedRoleText           ← 打字机效果（index, displayedText, isDeleting）
│       │   │   ├── RoleBadge × 2              ← 角色徽章（Data Engineer, AI Practitioner）
│       │   │   ├── NavCTA × 2                 ← 锚点导航 CTA（My Path, What I Build）
│       │   │   ├── PrimaryCTA × 1             ← 打开聊天浮窗（Ask Me → dispatch 'open-chat'）
│       │   │   └── ScrollArrow × 1            ← 向下引导箭头（ChevronDown 浮动动画，点击滚动到 #experience）
│       │   ├── ExperienceSection
│       │   │   ├── SectionTitle (shared)      ← 统一区块标题
│       │   │   ├── SkillTag × 6              ← 核心能力卡片（flex 布局）
│       │   │   └── ExperienceCard × 2         ← 工作经历时间线（含技术标签）
│       │   ├── ProjectsSection
│       │   │   ├── SectionTitle (shared)
│       │   │   └── ProjectCard × 4            ← 项目卡片（2 列网格）
│       │   │       └── StatusBadge            ← 状态标签（Production / Personal / Enterprise）
│       │   ├── <div#education>
│       │   │   ├── EducationSection
│       │   │   │   ├── SectionTitle (shared)
│       │   │   │   └── EduCard × 1
│       │   │   └── CertificationsSection
│       │   │       ├── SectionTitle (shared)
│       │   │       └── 专利卡片 × 2
│       │   ├── <div#skills>
│       │   │   └── SkillsSection
│       │   │       ├── SectionTitle (shared)
│       │   │       ├── 语言进度条 × 2（中文 100%, 英语 50%）
│       │   │       ├── 软技能标签 × 7
│       │   │       └── StackGroup × 6         ← 技术栈分组标签
│       │   └── ContactSection (inline)        ← 联系区块（邮件按钮）
│       ├── Footer (inline)                    ← 页脚（版权信息）
│       └── FloatingAssistant                  ← AI 聊天浮窗
│           ├── [float] 头像按钮（fixed bottom-right）
│           └── [panel] 聊天窗口（AnimatePresence 动画）
│               ├── ChatHeader（头像 + 名称 + 副标题）
│               ├── MessageList（滚动区域）
│               │   ├── QuickActions × 4       ← 快捷问题按钮（点击自动发送）
│               │   └── MessageBubble × N      ← 用户/AI 消息气泡
│               └── InputBar（输入框 + 发送按钮）
```

### 2.4 交互流程图

```
访客打开页面
    │
    ├── 浏览首屏 → 阅读 Hero 区（元素错落入场动画 ~1.2s）
    │       │
    │       ├── 头像 + 打字机动画（3 句循环：ETL / LLM / AI-Native）
    │       ├── 阅读一行亮点（4 年 · 10+ 系统 · 2 项专利）
    │       │
    │       ├── 点击 [My Path] → 平滑滚动到 #experience
    │       ├── 点击 [What I Build] → 平滑滚动到 #projects
    │       ├── 点击 [Ask Me] → 打开 FloatingAssistant 聊天浮窗
    │       └── 点击 [↓] 滚动箭头 → 平滑滚动到 #experience
    │
    ├── 向下滚动 → SidebarNav 高亮跟随
    │       │
    │       ├── 工作经验区 → 阅读 6 个能力标签 + 2 段时间线
    │       ├── 项目展示区 → 阅读 4 个项目卡片
    │       ├── 教育/专利区 → 阅读学历 + 2 项专利信息
    │       ├── 技能栈区 → 阅读语言进度条 + 软技能 + 技术栈
    │       └── 联系区 → 点击邮件按钮 → 打开邮件客户端
    │
    ├── 切换语言 → 点击右上角 [🌐 EN/中]
    │       └── dispatch('languageChange') → I18nProvider 更新 → 全页面文案切换
    │
    ├── 切换主题 → 点击右上角 [🌙/☀️]
    │       └── document.documentElement.classList.toggle('dark') → Tailwind 变量切换
    │
    └── AI 聊天 → 点击右下角头像按钮
            │
            ├── 聊天窗口弹出（Framer Motion AnimatePresence 动画）
            ├── 显示欢迎消息 + 4 个快捷问题按钮
            ├── 点击快捷按钮 → 自动发送消息（handleSendDirect）
            ├── 输入消息 → POST /api/chat/stream → SSE 流式接收 AI 回复
            ├── 流式渲染：逐 token 显示 + 闪烁光标动画
            ├── 多轮对话（conversation_id 自动管理，首次为 null → 后端生成）
            └── 后台通知：飞书 Webhook + PushPlus 微信推送给网站主
```

### 2.5 现存 UI 痛点

**布局问题：**

1. **Hero 区信息密度仍较高** — 首屏堆叠了头像、打字机标题、2 个徽章、2 个专利号、一行数字亮点、3 个 CTA 按钮。虽然已从原始版本精简（去掉了 Let's Talk CTA 和多段 bio），但专利和徽章区域仍占据不少视觉空间。

2. **教育/专利区内容单薄** — EducationSection 只有 1 条记录（一个学校），CertificationsSection 只有 2 条专利。两个 section 各自 `py-24` 留白过多，视觉上显得空洞。

3. **Footer 过于简陋** — 只有一行版权文字 `© 2026 刘明青`，缺少社交链接、快速导航或二次联系入口。

**交互问题：**

4. **SidebarNav 小屏完全隐藏** — 移动端和中等屏幕（< lg: breakpoint）下没有任何导航指示器，访客不知道页面有哪些章节可跳转。

5. **项目卡片无交互反馈** — ProjectCard hover 只有背景色微变（`hover:bg-bg-card-hover`），没有进入详情页或展开更多信息的交互。4 个项目的描述是硬编码英文，切换中文后仍显示英文。

6. **打字机删除效果生硬** — 删除阶段 300ms 后文本一次性消失，而非逐字符删除，视觉上不够自然。

---

## 三、数据流向图

### 3.1 数据来源清单

| 数据 | 来源 | 消费组件 |
|------|------|----------|
| 翻译文本（~125 keys） | i18n.tsx 硬编码字典（en/zh） | 所有 Section 组件（通过 `useI18n().t(key)`） |
| 头像图片 | src/assets/avatar.jpg（静态资源） | HeroSection, FloatingAssistant |
| 主题偏好 | localStorage('theme') + prefers-color-scheme | HeaderActions → Tailwind dark class |
| 语言偏好 | localStorage('lang') + languageChange CustomEvent | HeaderActions → I18nProvider |
| 滚动位置 | IntersectionObserver（浏览器 API） | SidebarNav |
| 聊天消息 | POST /api/chat/stream（SSE 响应） | FloatingAssistant |
| 会话 ID | SSE 响应中 conv_id 事件 → 组件 state | FloatingAssistant |
| AI 回复内容 | DeepSeek API（via Hermes 后端流式传输） | 后端 → 前端 SSE → 前端渲染 |
| 对话记录 | SQLite hermes.db（conversations + messages 表） | 后端 models.py |
| 飞书通知 | 飞书 Open API Webhook | 后端 notify.py |
| 微信推送 | PushPlus API | 后端 notify.py |

### 3.2 状态管理流

```
┌─────────────────────────────────────────────────────────────────┐
│                        状态管理架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  全局状态（React Context 分发）：                                  │
│  ┌──────────────────────────────────────┐                      │
│  │  I18nProvider (i18n.tsx)             │                      │
│  │  state: lang ('en' | 'zh')           │ ← localStorage 初始化 │
│  │  method: t(key) → string             │                      │
│  │  listener: languageChange event      │ ← HeaderActions 触发  │
│  └──────────────────────────────────────┘                      │
│           │ useI18n() hook                                      │
│           ▼                                                     │
│  所有组件消费 { t, lang }                                        │
│                                                                 │
│  主题状态（不走 React，直接操作 DOM）：                             │
│  ┌──────────────────────────────────────┐                      │
│  │  HeaderActions                       │                      │
│  │  state: isDark (boolean)             │                      │
│  │  副作用: documentElement              │                      │
│  │    .classList.add/remove('dark')     │                      │
│  │  持久化: localStorage('theme')       │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  组件局部状态（不共享）：                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SidebarNav        → activeSection (string)              │   │
│  │  HeroSection       → AnimatedRoleText:                   │   │
│  │                      index, displayedText, isDeleting     │   │
│  │  FloatingAssistant → isOpen, messages[], inputValue,     │   │
│  │                      isSending, convId                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  后端状态（独立 Python 进程）：                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SQLite DB: conversations[], messages[]                  │   │
│  │  定时任务: scheduled_summary_loop (8:00 / 12:00 / 17:00) │   │
│  │  外部 API: DeepSeek, Feishu Webhook, PushPlus            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 核心数据流：AI 聊天完整链路

```
用户输入消息
    │
    ▼
FloatingAssistant.handleSendDirect(text)
    │  POST /api/chat/stream
    │  body: { conversation_id: convId | null, message: text }
    │
    ▼
Vite Dev Proxy (/api → localhost:8000)
    │
    ▼
FastAPI: chat_stream(req, background_tasks)
    │
    ├── 1. 获取或创建会话 → models.create_conversation()
    │       └── INSERT INTO conversations → SQLite
    │
    ├── 2. 存储访客消息 → models.add_message(conv_id, "visitor", text)
    │       └── INSERT INTO messages → SQLite
    │
    ├── 3. 检查紧急关键词 → notify.check_urgent_keywords()
    │       └── 命中 → mark_urgent() + asyncio.create_task(send_urgent_notification)
    │
    ├── 4. 构建 LLM 历史 → models.get_conversation_messages(limit=20)
    │       └── llm._build_messages() 将 "visitor" 角色标准化为 "user"
    │
    ├── 5. SSE event_generator():
    │       │
    │       ├── yield conv_id 事件
    │       │
    │       ├── async for chunk in llm.get_response_stream(messages):
    │       │       │
    │       │       ▼
    │       │   httpx.AsyncClient(trust_env=False)
    │       │       → DeepSeek API POST /v1/chat/completions (stream=true)
    │       │       │
    │       │       ├── 逐 chunk yield → SSE data 事件
    │       │       └── 前端 ReadableStream reader 逐 token 渲染
    │       │
    │       ├── models.add_message(conv_id, "assistant", full_reply)
    │       │
    │       ├── yield done 事件
    │       │
    │       └── await send_realtime_notification()
    │               │
    │               ├── httpx → 飞书 Webhook（interactive card 格式）
    │               └── httpx → PushPlus API（HTML 模板推送）
    │
    └── 前端 SSE reader 循环结束 → setIsSending(false)
```

### 3.4 副作用处理

| 副作用 | 处理方式 | 潜在问题 |
|--------|----------|----------|
| 主题切换 | 直接操作 DOM classList + localStorage 持久化 | 不走 React 状态管理，首次加载时初始化逻辑在 HeaderActions 的 useEffect 中，可能有一帧闪烁 |
| 语言切换 | CustomEvent 广播 + localStorage 持久化 | HeaderActions dispatch → I18nProvider addEventListener。首次加载时 dispatch 时机依赖 useEffect 执行顺序（React 不保证） |
| SSE 流式通信 | fetch + ReadableStream 手动解析 | 无重试/断线重连机制，网络中断后直接显示错误消息 |
| 定时汇总 | asyncio.create_task 后台循环 | scheduled_summary_loop 按 8:00/12:00/17:00 触发，进程重启后重置；DB notified_at 字段防止重复发送 |
| 实时通知（每条对话） | 在 SSE generator 内直接 await | 保证通知送达，但略微增加流式响应的首 token 延迟 |
| 紧急通知（关键词命中） | asyncio.create_task fire-and-forget | 不阻塞 SSE 流，但如果 httpx 请求失败只有 print 日志，无持久化重试 |

### 3.5 现存数据问题

1. **语言切换依赖 CustomEvent** — HeaderActions 通过 `window.dispatchEvent(new CustomEvent('languageChange', { detail }))` 广播，I18nProvider 通过 `window.addEventListener` 监听。这种跨组件通信方式脆弱，首次加载的语言可能因 useEffect 执行顺序不正确而不一致。

2. **翻译 key 与组件硬编码混合** — ProjectsSection 的 4 个项目描述是组件内硬编码英文字符串，只有 status 字段走了 i18n。切换中文后项目描述仍显示英文。

3. **后端通知无重试机制** — 飞书/PushPlus 推送失败只打印日志，没有持久化到 DB 等待重试。网络瞬时故障时通知会永久丢失。

4. **hermes.db 路径不一致** — 本地开发时 DB 在 `hermes/hermes.db`，Docker 中通过 volume 挂载到 `/app/data/hermes.db`。开发时可能误操作生产数据。

---

## 四、重设计建议

### 4.1 UI/UX 重设计方向

#### A. Hero 区优化 — "3 秒法则" ✅ 已完成

**已实现：**
- ✅ 一行数字亮点（"4 年锂电行业 · 10+ 数据系统 · 2 项发明专利"）
- ✅ CTA 从 4 个减为 3 个（My Path, What I Build, Ask Me）
- ✅ 滚动引导箭头：ChevronDown 图标 + 1.5s 循环浮动动画，hover 显示 "SCROLL"，点击平滑滚动到 #experience
- ✅ 首屏错落入场动画：两个 `motion.div` 容器，`staggerChildren: 0.12s`，头像 fadeIn + 文字/专利/亮点/CTA/箭头依次 fadeUp，总时长 ~1.2s

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ┌──────┐                                          │
│   │avatar│  Hi, I'm @刘明青        ← fadeIn 入场     │
│   └──────┘  AI × 数据工程师        ← fadeUp 入场     │
│             with ETL... (打字机)                     │
│                                                     │
│   [Data Engineer]  [AI Practitioner]                 │
│                                                     │
│   4 年锂电行业 · 10+ 数据系统 · 2 项发明专利          │
│                                                     │
│   [My Path]  [What I Build]  [Ask Me]               │
│                                                     │
│          ↓                          ← 新增滚动引导   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**仍可优化：**
- 专利区域可考虑折叠到展开面板，进一步减轻首屏信息量
- 清理 i18n 中未被使用的 `hero.bio.*` 残留 key

#### B. 教育 + 专利合并

将 EducationSection 和 CertificationsSection 合并为 "背景与资质" section，减少留白：

```
┌─────────────────────────────────────────────────────┐
│  📜 背景与资质                                       │
│                                                     │
│  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │ 🎓 教育              │  │ 📋 专利               │ │
│  │ 常州信息职业技术学院   │  │ CN119166678A 第一发明人│ │
│  │ 2019-2022           │  │ CN120045414A 第三发明人│ │
│  └─────────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### C. Footer 增强

```
┌─────────────────────────────────────────────────────┐
│  © 2026 刘明青          [GitHub] [Email] [飞书]      │
│  Built with React + Tailwind · Powered by Hermes    │
└─────────────────────────────────────────────────────┘
```

#### D. 交互优化重点

| 优化项 | 状态 | 说明 |
|--------|------|------|
| 滚动引导箭头 | ✅ 已完成 | ChevronDown + 1.5s 浮动动画 + 点击 scrollToView |
| 首屏入场动效 | ✅ 已完成 | Framer Motion stagger 0.12s，头像 fadeIn + 其余 fadeUp |
| 移动端导航 | 待实现 | lg: 以下完全隐藏 → 添加汉堡菜单或底部 Tab 栏 |
| 项目卡片 | 待实现 | 仅 hover 变色 → 添加展开/折叠详情或跳转锚点 |
| 打字机删除 | 待实现 | 300ms 一次性消失 → 逐字符删除更自然 |
| 项目描述 i18n | 待实现 | 硬编码英文 → 迁移到 i18n 字典，支持中英文切换 |

#### E. 视觉风格建议

- **一致性**：统一所有 section 的间距节奏（当前 ExperienceSection `py-24`、HeroSection `py-32`，节奏不一致）
- **层级感**：Hero 区已用大字号 + 渐变色；内容区建议用卡片式布局 + 微妙阴影增强层级
- **响应式**：在 `md:` 断点添加顶部水平导航条，填补 `lg:` SidebarNav 隐藏后的导航空白
- **动效克制**：Framer Motion 用在 Hero 区入场动画、打字机效果和 FloatingAssistant 出入场，其他 section 用 CSS transition 即可

### 4.2 功能新增规划

| 功能 | 扩展位置 | 集成方式 | 优先级 |
|------|----------|----------|--------|
| **博客/技术文章区** | 新增 `BlogSection.tsx` + MDX 渲染 | 独立路由 `/blog`（需引入 React Router） | 高 |
| **项目详情页** | 新增 React Router + `ProjectDetail.tsx` | 从 ProjectsSection 卡片点击进入 | 高 |
| **访客统计** | 后端新增 `/api/analytics` 端点 | Hermes 后端记录 IP/UA/访问时间 | 中 |
| **留言表单** | ContactSection 中嵌入表单 | 后端新增 `/api/contact` 端点 + 飞书通知 | 中 |
| **简历 PDF 下载** | Hero 区或 Contact 区添加按钮 | 静态 PDF 放 public/ 目录 | 中 |
| **暗黑模式过渡动画** | 主题切换时 CSS transition | CSS `transition: color, background-color` | 低 |
| **多语言项目描述** | ProjectsSection 项目数据走 i18n | 扩展 translations 字典 | 低 |
| **微信推送配置** | .env 填入 PushPlus Token | 已有代码支持，只需配置 Token | 低 |

**低耦合集成建议：**

- **博客**：MDX + 静态文件，新增 `/blog` 路由（引入 React Router），不改动现有单页结构
- **项目详情**：在 PROJECTS 数组中为每个项目添加 `details` 字段，点击卡片展开/折叠，无需路由改动
- **留言表单**：ContactSection 改为双栏布局（左侧邮件按钮 + 右侧表单），后端新增一个简单 POST 端点

### 4.3 重构风险提示

#### 高影响改动（需谨慎）

| 改动 | 影响范围 | 风险 |
|------|----------|------|
| 引入 React Router | 全局：App.tsx + 所有组件 + SidebarNav | 当前纯单页，引入路由需重构所有 `href="#section"` 锚点链接和 SidebarNav 导航逻辑 |
| 替换 i18n 方案 | 全局：所有消费 useI18n 的组件 | ~125 个翻译 key 需迁移，可能影响语言切换逻辑和 CustomEvent 广播机制 |
| 重构 index.css 设计系统 | 全局：所有使用 Tailwind 语义色的组件 | CSS 变量名变更会导致所有组件样式失效 |
| 拆分 MiscSections 为独立文件 | 中：App.tsx 导入路径变更 | 低风险，但需更新所有引用 |

#### 建议渐进式改造路径

1. **Phase 1 — 抽取 ContactSection / Footer**：从 App.tsx 内联抽取为独立组件文件，保持与其他 section 一致的文件粒度。

2. **Phase 2 — 合并教育/专利**：EducationSection + CertificationsSection 合并为一个 "背景与资质" section，减少页面长度和留白。

3. **Phase 3 — 项目描述 i18n**：将 ProjectsSection 的 4 个项目硬编码英文描述迁移到 i18n 字典，确保中英文完整切换。

4. **Phase 4 — 交互增强**：添加移动端导航（汉堡菜单或底部 Tab）、项目卡片展开/折叠详情、打字机逐字符删除效果。

5. **Phase 5 — 功能扩展**：博客区、留言表单、简历下载（按需引入 React Router）。

#### 需要提前准备的兼容/迁移

- **引入 React Router 前**：先把所有 `href="#section"` 改为统一的 `scrollToSection()` 工具函数，后续替换路由时只改一处
- **替换 i18n 前**：先把 ProjectsSection 的硬编码描述迁移到 i18n 字典，确保所有文案都在字典中
- **部署前**：`.env` 已在 `.gitignore` 中（✅），`hermes.db` 也在忽略列表中（✅）
- **Docker 部署前**：需补充 `Dockerfile.frontend`（docker-compose.yml 引用了但不存在），建议用 nginx 静态服务 + 反向代理 `/api` 到 hermes-api 容器
