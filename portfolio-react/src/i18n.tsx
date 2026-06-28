import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'zh';

interface I18nContextType {
  lang: Language;
  t: (key: string) => string;
  toggleLang: () => void;
}

const translations = {
  en: {
    // Hero
    'hero.greeting': 'Hi, I\'m',
    'hero.title.1': 'AI × Data Engineer',
    'hero.title.2.1': 'with ETL architecture & scheduling platforms',
    'hero.title.2.2': 'with private LLM deployment & Dify application development',
    'hero.title.2.3': 'with AI-native development workflow',
    'hero.badge.builder': 'Data Engineer',
    'hero.badge.operator': 'AI Practitioner',
    'hero.press': 'PATENTS',
    'hero.bio.1.1': '4 years in lithium battery & energy storage data development.',
    'hero.bio.1.2': 'Led 10+ standardized data systems to production.',
    'hero.bio.1.3': '2 invention patents filed. 5,000+ man-hours saved.',
    'hero.bio.2.1': 'Deep user of Claude Code, Codex, and Hermes Agent.',
    'hero.bio.2.2': 'AI is embedded in every step:',
    'hero.bio.2.3': 'requirements, design, coding, debugging, testing, and docs — 60M+ tokens/day.',
    'hero.bio.3': 'Solid foundation in ETL, data cleaning, scheduling, modeling, and automated reporting — combined with AI application capabilities from private LLM deployment and RAG knowledge bases to workflow orchestration and agent scenario validation.',
    'hero.bio.4.1': 'What drives me:',
    'hero.bio.4.2': 'connecting data and AI to solve real business problems.',
    'hero.bio.4.3': 'End-to-end, from architecture to production.',
    'hero.cta.path': 'My Path',
    'hero.cta.projects': 'What I Build',
    'hero.cta.ask': 'Ask Me',
    'hero.stat.1.num': '4+',
    'hero.stat.1.label': 'Years in Lithium Battery',
    'hero.stat.2.num': '10+',
    'hero.stat.2.label': 'Data Systems Built',
    'hero.stat.3.num': '2',
    'hero.stat.3.label': 'Patents Filed',
    'hero.stat.4.num': '60M+',
    'hero.stat.4.label': 'Daily AI Tokens',
    'hero.trust': 'LITHIUM BATTERY · ENERGY STORAGE · ETL · DATA GOVERNANCE · AI APPLICATIONS · DOCKER · CLAUDE CODE · CODEX',
    'hero.story.lead': '4 years ago, manual Excel. Today, 50GB daily throughput, 99.9% success rate — the biggest variable was AI.',
    'hero.story.p1': '4 years ago, I was still cross-checking cell testing data manually in Excel, revising each report three times. Today, the ETL platform I built processes 50GB of data daily with a 99.9% scheduling success rate — and the biggest variable in that transformation wasn\'t experience, it was AI.',
    'hero.story.p2': 'From Claude Code accelerating development cycles, to Dify + RAG knowledge bases turning team\'s tacit knowledge into searchable assets, to NL2SQL Agent letting business users "query data in plain language" — AI didn\'t just boost efficiency, it redefined where I start when solving problems. I\'ve grown convinced: AI doesn\'t replace engineers, it pushes out the boundary of what an engineer can do. Next, I want to go beyond just using AI well — I want to bring this "AI-Native" way of working into real enterprise business scenarios, so more teams can experience the productivity leap that comes from AI embedded in every step of R&D.',
    'hero.patent.inventor.1': '1st Inventor',
    'hero.patent.inventor.3': '3rd Inventor',
    'hero.alt': 'Liu Mingqing',

    // Nav
    'nav.experience': 'Experience',
    'nav.projects': 'Projects',
    'nav.education': 'Education',
    'nav.skills': 'Skills & Stack',
    'nav.contact': 'Contact',

    // Experience
    'exp.title': 'Work Experience',
    'exp.subtitle': 'End-to-end ownership of data products — from requirements research and architecture design to development, deployment, and iteration.',
    'exp.tag.1.title': 'AI-Native Development',
    'exp.tag.1.desc': 'Claude Code, Codex, Hermes Agent deeply integrated into requirements analysis, code generation, refactoring, debugging, testing, and documentation — 60M+ tokens/day',
    'exp.tag.2.title': 'AI Applications & Agents',
    'exp.tag.2.desc': 'Private LLM deployment, Dify platform, RAG knowledge base, Workflow orchestration, NL2SQL Agent prototyping — end-to-end from infrastructure to scenario delivery',
    'exp.tag.3.title': 'ETL Architecture',
    'exp.tag.3.desc': 'ETL pipelines, data cleaning & transformation, scheduling orchestration, data modeling, quality control — 4-layer standardized architecture',
    'exp.tag.4.title': 'Domain Expertise',
    'exp.tag.4.desc': 'Deep knowledge in lithium battery testing & energy storage labs — cycle life, thermal runaway, safety testing',
    'exp.tag.5.title': 'Measurable Impact',
    'exp.tag.5.desc': 'Up to 35x data processing speedup, 99.9% scheduling success rate, 50GB daily peak throughput, 1500+ hrs/year saved',
    'exp.tag.6.title': 'Standardization & Enablement',
    'exp.tag.6.desc': 'Standardized development docs, SOPs, and business rule abstraction — empowering 20+ R&D and testing staff',
    'exp.job.1.role': 'Software Development Engineer',
    'exp.job.1.desc': 'Led the full data lifecycle for lithium battery testing — built ETL platforms and automated reporting systems. Drove scheduling success rate from 85% to 99.9%, deployed enterprise LLM and Dify AI applications. 2 patents filed, 20+ staff enabled.',
    'exp.job.2.role': 'R&D Engineer Assistant',
    'exp.job.2.desc': 'Full-cycle data processing for thermal runaway experiments — 500+ core datasets/month at 100% cleaning accuracy. Built production line data tracking, improved defect closure rate from 82% to 98%, established 12 standardized business rules for ETL automation.',
    'exp.company': 'Trina Storage',
    'exp.location': 'Changzhou',

    // Projects
    'proj.title': 'Projects',
    'proj.status.enterprise': 'Enterprise',
    'proj.status.personal': 'Personal Project',
    'proj.status.production': 'In Production',
    'proj.status.opensource': 'Open Source',
    'proj.status.live': 'Live + Open Source',
    'proj.etl.title': 'ETL Data Integration & Scheduling Platform',
    'proj.etl.desc': 'Fully automated 4-layer ETL pipeline for lithium battery testing data. DolphinScheduler + Kettle + Docker Compose. 99.9% success rate, 50GB daily peak, deployment cut from 4hrs to 15min.',
    'proj.report.title': 'Lab Test Report Automation Platform',
    'proj.report.desc': 'End-to-end automated report generation for 5000+ test channels. Reduced batch report time from 4-6hrs to 8 minutes (35x speedup). Patented core algorithm. 100K+ cells processed.',
    'proj.llm.title': 'Private LLM & Dify AI Platform',
    'proj.llm.desc': 'Enterprise-grade local LLM deployment with Dify application platform. RAG knowledge base, Chatflow, Workflow — serving lithium testing standards query, customer testing delegation processing, and internal knowledge retrieval.',
    'proj.nl2sql.title': 'NL2SQL Agent Platform',
    'proj.nl2sql.desc': 'AI-driven NL2SQL query platform with LangGraph state machine, RAG schema retrieval, and multi-layer security. End-to-end from natural language to SQL + data quality scoring + optimization suggestions. 58% inference speedup.',
    'proj.portfolio.title': 'Personal Portfolio & AI Assistant',
    'proj.portfolio.desc': 'Personal brand website with bilingual support, knowledge base CMS, and floating AI chat assistant. AI chat messages sync in real-time to Feishu & WeChat, with scheduled daily summaries. Live at liumingqing.com, open source on GitHub.',
    'proj.wechat.title': 'WeChat Formatter — Chrome Extension',
    'proj.wechat.desc': 'Markdown-to-WeChat rich text Chrome extension. DOM injection bypasses clipboard filtering, one-click sync from Markdown to WeChat editor. Open source with AI rewrite and template features.',
    'proj.detail.background': 'Background',
    'proj.detail.work': 'Key Contributions',
    'proj.detail.results': 'Impact',
    'proj.etl.background': 'Faced with manual ETL execution, cumbersome cross-environment deployment, and lack of monitoring in the lithium battery industry, built a fully automated ETL integration and scheduling platform for end-to-end data pipeline automation from raw files to structured storage.',
    'proj.etl.work': 'Designed a 4-layer standardized ETL architecture: CSV → DolphinScheduler → Kettle → MySQL; Fully parameterized KTR jobs with multi-environment switching and Docker Compose one-click deployment; Built automated deployment scripts for unattended environment detection, container startup, and health checks; Developed Excel pre-processing tool with format standardization and anomaly filtering, forming an end-to-end data closed loop; Deeply integrated Claude Code / Codex / Hermes Agent into the ETL workflow, improving key module efficiency by ~35%.',
    'proj.etl.results': 'Covers 6+ lithium battery data sources, 99.9% scheduling success rate, 50GB daily peak; Deployment time reduced from 4 hours to 15 minutes, ETL reuse rate up 80%; Pre-processing tool saves 90%+ manual conversion, handling 1200+ Excel files/day, downstream error rate down 75%.',
    'proj.report.background': 'Facing massive daily raw data from 5000+ lab test channels, addressed low manual processing efficiency, high error rates, and inconsistent metric definitions by building an automated platform covering data cleaning, metric calculation, storage analysis, and report generation.',
    'proj.report.work': 'Standardized 8 core R&D metrics and designed an end-to-end automated closed-loop process; Built core data processing engine and report generation framework, auto-generating 7 professional trend charts; Connected to MySQL via ADO interface for one-click historical data retrieval and peer benchmarking; Established full-chain operation logs and QR code traceability to meet CNAS lab audit requirements.',
    'proj.report.results': 'Batch report time for 100 cells reduced from 4-6 hours to 8 minutes — 35x speedup, human error rate down to 0; Covers 5000+ test channels, 100K+ cells processed, supporting 15+ cell product formulations; Saves 1500+ hours/year, core solution included in patent (1st inventor).',
    'proj.llm.background': 'To address sensitive lab data that cannot leave the premises, inefficient standards lookup, high report interpretation barriers, and repetitive customer testing delegation requirements sorting, built an on-premise LLM and Dify application environment within the enterprise intranet.',
    'proj.llm.work': 'Deployed Ollama privately on Linux production servers with Docker, configuring model storage, port mapping, auto-restart, and API access; Set up Dify platform connected to local LLM, forming a reusable enterprise AI application base; Led knowledge curation of lithium testing standards, SOPs, historical cases, and report samples — document cleaning, chunking optimization, and retrieval strategy tuning; Delivered multiple Dify applications: standards query assistant, customer testing delegation processing assistant, and enterprise knowledge base Q&A assistant.',
    'proj.llm.results': 'Established the full pipeline: local model deployment → Dify platform → knowledge base governance → scenario go-live, forming a standardized enterprise AI implementation blueprint; Standards lookup reduced from manual document search to sub-second response; Requirements documentation shortened from 30+ minutes to a few minutes.',
    'proj.nl2sql.background': 'Addressing the high barrier to natural language database querying, SQL reliance on manual expertise, and lack of business context in query results, built an AI-driven intelligent data query platform achieving a closed loop from user questions to SQL generation, execution validation, and result interpretation.',
    'proj.nl2sql.work': 'Designed a LangGraph state machine workflow: intent parsing → SQL generation → syntax validation → parameterized execution → result interpretation; Built schema RAG retrieval with HuggingFace Embedding + ChromaDB for context-aware SQL generation; Designed lithium-industry-specific SQL prompts with domain terminology mapping, business rules, and few-shot examples; Implemented multi-layer security: SQL syntax checks, dangerous operation interception, parameterized queries, injection prevention; Continuously used AI coding tools throughout development, validating the VibeCoding paradigm.',
    'proj.nl2sql.results': 'Reduced end-to-end query latency from 48s+ to ~20s — 58% speedup; Achieved a demonstrable closed-loop prototype from natural language to query results, data quality scoring, and optimization suggestions.',
    'proj.portfolio.background': 'Traditional resumes and portfolios offer weak static display, struggle to demonstrate AI capabilities and content depth. Designed and developed a personal website integrating AI assistant, knowledge base CMS, and bilingual display to enhance online presence and communication efficiency.',
    'proj.portfolio.work': 'Built frontend with React + TypeScript + Vite, supporting responsive layout and bilingual switching; Designed a knowledge base CMS with Markdown + manifest article management, tree-nav TOC, scroll positioning, and reading progress; Developed a floating AI assistant with quick actions, conversation context, and SSE streaming replies; Implemented Hermes backend with FastAPI for session management, message persistence, streaming output, connected to Ollama local models; Deployed with Docker Compose, bound custom domain.',
    'proj.portfolio.results': 'Consolidated resume, projects, technical articles, and AI capabilities into a single online presence; Completed the closed loop: portfolio display + AI interaction + knowledge content + real-time notifications + scheduled summaries; Accumulated full-stack practice spanning React frontend, FastAPI backend, Ollama integration, and SSE streaming.',
    'proj.wechat.background': 'Facing WeChat Official Account editor formatting loss and unreliable copy-paste, developed a Chrome extension for one-click Markdown-to-WeChat rich text synchronization.',
    'proj.wechat.work': 'Built Chrome extension on Manifest V3, triggering formatting and content injection directly within the WeChat editor; Converts Markdown to WeChat-compatible inline-style HTML covering headings, body text, blockquotes, lists, and code blocks; Bypasses clipboard paste pipeline via chrome.scripting.executeScript DOM injection, avoiding platform HTML filtering; Designed tech writing theme templates and style rules; added standalone page mode as a fallback.',
    'proj.wechat.results': 'Compressed the "Markdown writing → WeChat formatting → editor sync" pipeline into a single click; Delivered a practically useful open-source productivity tool, accumulating engineering practice in browser extension development and DOM injection.',

    // Education
    'edu.title': 'Education',
    'edu.1.degree': 'Photovoltaic Power Generation Technology',
    'edu.1.note': 'Top 5-10% · National Scholarship',
    'edu.1.org': 'Changzhou College of Information Technology',
    'edu.1.year': '2019 – 2022',

    // Certs
    'cert.title': 'Patents',
    'cert.patent.1.name': 'Method, Device and Storage Medium for Generating Cell Data Report',
    'cert.patent.1.issuer': 'CN119166678A · 1st Inventor',
    'cert.patent.1.status': 'Under Examination',
    'cert.patent.2.name': 'Method and Electronic Device for Generating Energy Storage Equipment Test Report',
    'cert.patent.2.issuer': 'CN120045414A · 3rd Inventor',
    'cert.patent.2.status': 'Under Examination',

    // Skills
    'skills.title': 'Skills',
    'skills.lang': 'Languages',
    'skills.lang.es': 'Chinese (Mandarin)',
    'skills.lang.es.level': 'Native',
    'skills.lang.en': 'English',
    'skills.lang.en.level': 'Reading technical docs',
    'skills.soft': 'Soft Skills',
    'skills.tech': 'Tech Stack',
    'skills.soft.1': 'Requirements Analysis',
    'skills.soft.2': 'Architecture Design',
    'skills.soft.3': 'End-to-End Ownership',
    'skills.soft.4': 'Problem Solving',
    'skills.soft.5': 'Documentation & SOP',
    'skills.soft.6': 'Cross-team Collaboration',
    'skills.soft.7': 'AI-Native Workflow',

    // Contact
    'contact.title': 'Let\'s Talk?',
    'contact.desc': 'I build data systems and AI applications in production. Reach me via email or X — happy to connect.',
    'contact.email': 'lmq0205a@163.com',
    'contact.x': 'liumingqingoh',

    // Chat
    'chat.welcome': 'Hi! I\'m Hermes, Liu\'s AI assistant. How can I help you?',
    'chat.subtitle': 'Ask me about my experience',
    'chat.placeholder': 'Type your question...',
    'chat.error.network': 'Sorry, connection error. Please try again later.',
    'chat.connecting': 'Connecting...',
    'chat.warming': 'AI is waking up — thanks for your patience...',
    'chat.name': 'Mingqing Liu',
    'chat.action.exp': 'AI experience',
    'chat.action.projects': 'Featured projects',
    'chat.action.why': 'Why hire me?',
    'chat.action.contact': 'Contact info',

    // Header
    'header.knowledge': 'Knowledge Base',

    // Footer
    'footer.copyright': '© 2026 Mingqing Liu',

    // Knowledge Base
    'kb.home': 'Home',
    'kb.title': 'Knowledge Base',
    'kb.subtitle': 'Technical articles and learning notes — documenting the journey.',
    'kb.articles': 'articles',
    'kb.categories': 'categories',
    'kb.tags': 'tags',
    'kb.latest': 'Latest',
    'kb.startReading': 'Start Reading',
    'kb.source': 'Source',
    'kb.toc': 'Contents',
    'kb.backToList': 'Back to Knowledge Base',
    'kb.articleNotFound': 'Article not found',
    'kb.copyright.prefix': 'Copyright Notice:',
    'kb.copyright.from': 'This article is adapted from',
    'kb.copyright.belong': 'The original belongs to the',
    'kb.copyright.license': 'open-source project. Please cite the source when reprinting.',
  },
  zh: {
    // Hero
    'hero.greeting': '你好，我是',
    'hero.title.1': 'AI × 数据工程师',
    'hero.title.2.1': 'ETL 全链路架构与调度平台建设',
    'hero.title.2.2': '私有化大模型部署与Dify应用开发',
    'hero.title.2.3': 'AI Native 开发工作流实践者',
    'hero.badge.builder': '数据工程师',
    'hero.badge.operator': 'AI 应用实践者',
    'hero.press': '发明专利',
    'hero.bio.1.1': '4 年新能源锂电行业数据开发经验。',
    'hero.bio.1.2': '主导 10+ 套标准化数据系统落地。',
    'hero.bio.1.3': '沉淀 2 项发明专利，节省 5000+ 工时。',
    'hero.bio.2.1': '长期深度使用 Claude Code、Codex、Hermes Agent。',
    'hero.bio.2.2': 'AI 已融入需求分析、方案设计、',
    'hero.bio.2.3': '编码、调试、测试与文档沉淀的全流程 — 日均 Token 消耗超 60M。',
    'hero.bio.3': '具备 ETL、数据清洗转换、调度编排、入库建模、报表自动化全链路开发能力，同时拥有从私有化大模型部署、RAG 知识库、Workflow 编排到 Agent 场景验证的完整 AI 应用实践。',
    'hero.bio.4.1': '我关注的核心问题：',
    'hero.bio.4.2': '让数据和 AI 解决真实的业务问题。',
    'hero.bio.4.3': '端到端，从架构设计到生产上线。',
    'hero.cta.path': '我的经历',
    'hero.cta.projects': '我的项目',
    'hero.cta.ask': '向我提问',
    'hero.stat.1.num': '4+',
    'hero.stat.1.label': '年锂电行业',
    'hero.stat.2.num': '10+',
    'hero.stat.2.label': '套数据系统',
    'hero.stat.3.num': '2',
    'hero.stat.3.label': '项发明专利',
    'hero.stat.4.num': '60M+',
    'hero.stat.4.label': '日均 AI Token',
    'hero.trust': '锂电池 · 储能系统 · ETL · 数据治理 · AI 应用 · Docker · Claude Code · Codex',
    'hero.story.lead': '4 年前手工 Excel，今天 50GB 日吞吐、99.9% 成功率——最大的变量是 AI。',
    'hero.story.p1': '4 年前，我还在用 Excel 手工核对电芯测试数据，一个报表要改三遍。今天，我主导搭建的 ETL 平台每天吞吐 50GB 数据，调度成功率 99.9%——这中间最大的变量，不是经验积累，而是 AI。',
    'hero.story.p2': '从 Claude Code 辅助编码大幅压缩开发周期，到 Dify + RAG 知识库把团队的隐性经验变成可检索资产，再到 NL2SQL Agent 让业务方"用人话查数据"——AI 没有只是提效，而是重新定义了我解决问题的起点。我越来越确信：AI 不是替代工程师，而是把工程师的能力边界向外推。下一阶段，我想做的不只是用好 AI，而是把这种"AI Native"的工作方式，带进企业的真实业务场景，让更多团队真正感受到"AI 参与研发全流程"带来的生产力跃迁。',
    'hero.patent.inventor.1': '第一发明人',
    'hero.patent.inventor.3': '第三发明人',
    'hero.alt': '刘明青',

    // Nav
    'nav.experience': '工作经历',
    'nav.projects': '项目',
    'nav.education': '教育背景',
    'nav.skills': '技能与技术栈',
    'nav.contact': '联系方式',

    // Experience
    'exp.title': '工作经历',
    'exp.subtitle': '数据产品全生命周期管理 — 从需求调研、架构设计到开发部署与运维迭代。',
    'exp.tag.1.title': 'AI Native 开发方式',
    'exp.tag.1.desc': 'Claude Code、Codex、Hermes Agent 深度融入需求拆解、代码生成、重构调优、日志排查、测试补全与文档输出 — 日均 Token 消耗超 60M',
    'exp.tag.2.title': 'AI 应用与 Agent 场景',
    'exp.tag.2.desc': '本地大模型部署、Dify 平台搭建、RAG 知识库治理、Workflow 编排、NL2SQL Agent 原型开发 — 端到端从底座到场景落地',
    'exp.tag.3.title': 'ETL 架构设计',
    'exp.tag.3.desc': 'ETL 开发、数据清洗转换、调度编排、入库建模、数据质量管控 — 四层标准化架构',
    'exp.tag.4.title': '新能源垂直业务',
    'exp.tag.4.desc': '深耕锂电测试与储能实验室场景，熟悉循环寿命、热失控、安全测试等核心流程',
    'exp.tag.5.title': '量化结果导向',
    'exp.tag.5.desc': '数据处理效率最高提升 35 倍，调度成功率 99.9%，单日数据峰值 50GB，年节省 1500+ 工时',
    'exp.tag.6.title': '标准化与赋能',
    'exp.tag.6.desc': '标准化开发文档与 SOP 输出，业务规则抽象与系统化建设，赋能 20+ 名研发测试人员',
    'exp.job.1.role': '软件开发工程师',
    'exp.job.1.desc': '主导锂电测试数据全链路治理体系搭建，研发自动化数据处理工具与标准化 ETL 流程。将调度成功率从 85% 提升至 99.9%，推动私有化大模型与 Dify AI 应用在生产场景落地。沉淀 2 项发明专利，赋能 20+ 名研发测试人员。',
    'exp.job.2.role': '研发工程师助理',
    'exp.job.2.desc': '参与电芯热失控实验全流程数据处理，月均处理 500+ 组核心实验数据，清洗准确率达 100%。建立产线数据跟踪机制，推动制程异常闭环率从 82% 提升至 98%，沉淀 12 项业务规则与统一计算口径，为后续 ETL 自动化奠定基础。',
    'exp.company': '江苏天合储能',
    'exp.location': '常州',

    // Projects
    'proj.title': '项目',
    'proj.status.enterprise': '企业项目',
    'proj.status.personal': '个人项目',
    'proj.status.production': '生产环境',
    'proj.status.opensource': '开源项目',
    'proj.status.live': '已上线 + 开源',
    'proj.etl.title': 'ETL 数据集成与调度平台',
    'proj.etl.desc': '面向锂电测试数据的全自动化四层 ETL 管线。DolphinScheduler + Kettle + Docker Compose。调度成功率 99.9%，单日峰值 50GB，部署时长从 4 小时压缩至 15 分钟。',
    'proj.report.title': '实验室测试报告自动化平台',
    'proj.report.desc': '面向 5000+ 测试通道的端到端报告自动生成。单批次报告从 4-6 小时压缩至 8 分钟（35 倍提速）。核心算法已申请专利。累计处理 10 万+ 支电芯数据。',
    'proj.llm.title': '私有化大模型部署与 Dify 应用建设',
    'proj.llm.desc': '企业级本地大模型部署 + Dify 应用平台。RAG 知识库、Chatflow、Workflow——服务锂电检测标准查询、客户测试委托需求处理与内部知识检索。',
    'proj.nl2sql.title': 'NL2SQL Agent 智能数据查询平台',
    'proj.nl2sql.desc': '基于 LangGraph 状态机的 AI 自然语言转 SQL 平台，集成 RAG Schema 检索与多层安全防护。从自然语言到 SQL + 数据质量评分 + 优化建议端到端闭环。推理提速 58%。',
    'proj.portfolio.title': '个人作品集官网与 AI 访客助手',
    'proj.portfolio.desc': '个人品牌官网，支持中英双语、知识库 CMS、浮动 AI 聊天助手。AI 对话实时同步飞书与微信，每日定时汇总推送。已上线 liumingqing.com，GitHub 开源。',
    'proj.wechat.title': 'WeChat Formatter — 公众号排版助手',
    'proj.wechat.desc': 'Markdown 一键转公众号富文本的 Chrome 插件。DOM 注入绕过剪贴板过滤。已开源，持续迭代 AI 改写与模板库功能。',
    'proj.detail.background': '项目背景',
    'proj.detail.work': '核心工作',
    'proj.detail.results': '量化成果',
    'proj.etl.background': '针对锂电行业 ETL 任务手工执行、跨环境部署繁琐、缺乏监控告警等问题，搭建全自动化 ETL 集成调度平台，实现测试数据从原始文件到结构化入库的全流程自动化。',
    'proj.etl.work': '设计"CSV 数据层 → DolphinScheduler 调度层 → Kettle 转换层 → MySQL 存储层"四层标准化 ETL 架构，完成全流程开发；完成 KTR 作业全量参数化改造，支持多环境灵活切换，Docker Compose 一键部署；开发自动化部署脚本，实现环境检测、容器启动、健康检查全流程无人值守；自研 Excel 前置处理工具，内置格式标准化、异常数据过滤等规则，与 ETL 平台形成端到端数据闭环；将 Claude Code / Codex / Hermes Agent 深度融入 ETL 开发工作流，关键模块效率提升约 35%。',
    'proj.etl.results': '覆盖 6+ 类锂电业务数据源，调度成功率 99.9%，单日峰值 50GB；部署时长从 4 小时压缩至 15 分钟，ETL 流程复用率提升 80%；前置工具节省 90%+ 人工转换成本，单日处理 1200+ 个 Excel 文件，下游报错率降低 75%。',
    'proj.report.background': '面向实验室 5000+ 台测试通道日均产出的海量原始数据，解决人工处理效率低、出错率高、指标口径不统一等问题，搭建覆盖数据清洗、指标计算、入库分析和报告输出的自动化平台。',
    'proj.report.work': '梳理并固化 8 项研发级核心指标计算口径，设计端到端自动化闭环流程；搭建核心数据处理引擎与报告生成框架，自动生成 7 张专业趋势图表与标准化研发报告；通过 ADO 数据接口打通 MySQL 业务库，支持历史数据一键调取、同批次电芯性能对标分析；建立全链路操作日志与二维码追溯体系，满足 CNAS 实验室审计要求。',
    'proj.report.results': '单批次 100 支电芯报告生成时长由 4-6 小时压缩至 8 分钟，效率提升 35 倍，人为出错率降至 0；覆盖全实验室 5000+ 台测试通道，累计处理 10万+ 支电芯数据，支撑 15+ 款电芯产品配方优化；年节省人工工时 1500+ 小时，核心方案纳入发明专利（第一发明人）。',
    'proj.llm.background': '围绕实验室敏感数据不能外发、标准规范查询低效、报告解读门槛高、客户测试委托需求整理重复等问题，建设企业内网可用的本地大模型与 Dify 应用环境，并推动多个 AI 场景在生产环境落地。',
    'proj.llm.work': '在 Linux 生产服务器基于 Docker 完成 Ollama 私有化部署，规划模型存储挂载、端口映射、服务自启与 API 调用方案；搭建 Dify 应用环境并打通本地大模型接口，形成企业内网可复用的 AI 应用底座；主导锂电检测标准、SOP、历史案例、报告样本等资料的知识化整理，完成文档清洗、切片优化与检索策略调优；基于 Dify 落地锂电检测标准查询助手、客户测试委托需求受理助手、企业知识库问答助手等多个业务应用。',
    'proj.llm.results': '打通"本地模型部署 → Dify 平台搭建 → 知识库治理 → 场景应用上线"全链路，形成企业级 AI 应用标准化实施方案；标准查询从人工翻文档缩短至秒级响应；需求整理与初版方案输出时间从 30 分钟以上缩短至数分钟。',
    'proj.nl2sql.background': '面向自然语言查询数据库门槛高、SQL 编写依赖人工经验、查询结果缺乏业务解释等问题，搭建 AI 驱动的智能数据查询平台，实现从用户提问到 SQL 生成、执行校验、结果解读的闭环。',
    'proj.nl2sql.work': '基于 LangGraph 设计"意图解析 → SQL 生成 → 语法校验 → 参数化执行 → 结果解读"状态机工作流，构建 NL2SQL Agent；基于 HuggingFace Embedding + ChromaDB 构建表结构 RAG 检索，结合 Schema 语义与业务上下文生成更精准的 SQL；设计面向锂电行业的 SQL 生成提示词，补充专业术语映射、业务规则说明与 Few-shot 示例；构建多层安全防护：SQL 语法校验、危险操作拦截、参数化查询、防注入控制；持续使用 AI 编码工具参与开发全流程，验证 VibeCoding 范式的实际提效价值。',
    'proj.nl2sql.results': '查询链路总耗时从 48s+ 优化至约 20s，整体提速 58%；实现从自然语言提问到查询结果、数据质量评分、优化建议输出的端到端闭环，形成可演示的 AI Agent 数据查询原型。',
    'proj.portfolio.background': '针对传统简历与作品集静态展示能力弱、难以体现 AI 能力与内容沉淀深度的问题，自主设计并开发个人网站，集成 AI 助手、知识库文章系统和中英双语展示，提升在线展示与沟通效率。',
    'proj.portfolio.work': '基于 React + TypeScript + Vite 完成前端开发，支持响应式布局与中英双语切换；设计知识库内容系统，基于 Markdown + manifest 管理文章，支持目录树导航、滚动定位与阅读进度；开发浮动 AI 访客助手组件，支持快捷提问、对话上下文维护与 SSE 流式回复；基于 FastAPI 实现 Hermes 后端，完成会话管理、消息存储、流式输出，打通 Ollama 本地模型；基于 Docker Compose 完成前后端一体化部署，上线并绑定独立域名。',
    'proj.portfolio.results': '将个人简历、项目作品、技术文章和 AI 能力整合为统一线上入口；完成"官网展示 + AI 交互 + 知识内容沉淀 + 实时通知 + 定时汇总"闭环设计；沉淀 React 前端、FastAPI 后端、Ollama 接入与 SSE 流式交互的一体化全栈实践。',
    'proj.wechat.background': '面向微信公众号编辑器排版样式丢失、复制粘贴不稳定等问题，开发 Chrome 插件实现 Markdown 到公众号富文本的一键同步。',
    'proj.wechat.work': '基于 Manifest V3 构建 Chrome 插件，支持在公众号后台编辑器直接触发格式化与内容注入；将 Markdown 转换为适配微信公众号编辑器的内联样式 HTML，覆盖标题、正文、引用、列表、代码块等结构；绕过传统剪贴板粘贴链路，通过 chrome.scripting.executeScript 直接注入编辑器 DOM，规避平台对粘贴 HTML 的过滤与重写；设计技术写作主题模板与样式规则，补充独立页面模式作为非插件场景的兜底方案。',
    'proj.wechat.results': '将"Markdown 写作 → 公众号排版 → 编辑器同步"链路压缩为一键操作，显著降低技术文章发布前的重复排版成本；形成具备实际使用价值的开源效率工具，补充了浏览器插件开发、DOM 注入与内容编辑器适配方面的工程实践。',

    // Education
    'edu.title': '教育背景',
    'edu.1.degree': '光伏发电技术与应用',
    'edu.1.note': '专业前 5-10% · 国家励志奖学金',
    'edu.1.org': '常州信息职业技术学院',
    'edu.1.year': '2019 – 2022',

    // Certs
    'cert.title': '专利',
    'cert.patent.1.name': '电芯数据报表的生成方法、设备和存储介质',
    'cert.patent.1.issuer': 'CN119166678A · 第一发明人',
    'cert.patent.1.status': '实审中',
    'cert.patent.2.name': '一种储能设备测试报告生成方法及电子设备',
    'cert.patent.2.issuer': 'CN120045414A · 第三发明人',
    'cert.patent.2.status': '实审中',

    // Skills
    'skills.title': '技能',
    'skills.lang': '语言',
    'skills.lang.es': '中文（普通话）',
    'skills.lang.es.level': '母语',
    'skills.lang.en': '英语',
    'skills.lang.en.level': '技术文档阅读',
    'skills.soft': '软技能',
    'skills.tech': '技术栈',
    'skills.soft.1': '需求分析',
    'skills.soft.2': '架构设计',
    'skills.soft.3': '端到端交付',
    'skills.soft.4': '问题诊断',
    'skills.soft.5': '文档与 SOP',
    'skills.soft.6': '跨团队协作',
    'skills.soft.7': 'AI 原生工作流',

    // Contact
    'contact.title': '聊聊吗？',
    'contact.desc': '我在生产环境中构建数据系统和 AI 应用。欢迎通过邮件或 X 平台联系我。',
    'contact.email': 'lmq0205a@163.com',
    'contact.x': 'liumingqingoh',

    // Chat
    'chat.welcome': '你好！我是刘明青的 AI 助理 Hermes。有什么可以帮你的？',
    'chat.subtitle': '了解我的经验',
    'chat.placeholder': '输入消息...',
    'chat.error.network': '抱歉，网络连接出错了。请稍后再试。',
    'chat.connecting': '连接中...',
    'chat.warming': 'AI 正在唤醒中，感谢耐心等待...',
    'chat.name': '刘明青',
    'chat.action.exp': 'AI 落地经验',
    'chat.action.projects': '精选项目',
    'chat.action.why': '为什么雇佣我？',
    'chat.action.contact': '联系方式',

    // Header
    'header.knowledge': '知识库',

    // Footer
    'footer.copyright': '© 2026 刘明青',

    // Knowledge Base
    'kb.home': '首页',
    'kb.title': '知识库',
    'kb.subtitle': '技术文章与学习笔记，记录成长轨迹。',
    'kb.articles': '篇文章',
    'kb.categories': '个分类',
    'kb.tags': '个标签',
    'kb.latest': '最新',
    'kb.startReading': '开始阅读',
    'kb.source': '原文',
    'kb.toc': '章节目录',
    'kb.backToList': '返回知识库',
    'kb.articleNotFound': '文章未找到',
    'kb.copyright.prefix': '版权声明：',
    'kb.copyright.from': '本文转载自',
    'kb.copyright.belong': '原文属于',
    'kb.copyright.license': '开源项目。如需转载请注明出处。',
  }
};

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  t: (key: string) => key,
  toggleLang: () => {},
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang) {
      setLang(savedLang);
      document.documentElement.lang = savedLang;
    } else {
      localStorage.setItem('lang', 'en');
      document.documentElement.lang = 'en';
    }
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'zh' : 'en';
    setLang(newLang);
    document.documentElement.lang = newLang;
    localStorage.setItem('lang', newLang);
  };

  const t = (key: string): string => {
    // @ts-ignore
    return translations[lang][key] || translations['en'][key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
