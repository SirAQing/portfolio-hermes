# WeKnora → 个人 MVP 复用指南

> 目标：从 WeKnora 开源项目中提取与求职岗位相关的核心架构和代码逻辑，构建一个属于自己的 RAG + AI Agent MVP 产品。
>
> 岗位核心要求：RAG 系统、AI Agent 开发、Prompt Engineering、Python 后端、前端交互、Docker 工程化。

---

## 0. 语言策略决策

WeKnora 后端是 **Go**，但目标岗位要求 **Python (FastAPI/Flask)**。因此采用分层复用策略：

| 策略 | 说明 | 适用部分 |
|------|------|----------|
| **直接复用** | Python 组件零修改迁移 | docreader 文档解析、mcp-server |
| **配置复用** | YAML 模板直接搬运，微调即用 | 提示词模板、RAG 参数、Agent 预设 |
| **架构复用** | 学习 Go 代码的设计模式，用 Python 重新实现 | Agent 引擎、RAG 管线、工具系统 |
| **算法复用** | 核心算法逻辑简单，直接翻译 | RRF 融合、CJK 分词、Token 压缩 |
| **跳过** | MVP 不需要的模块 | IM 渠道、沙箱、多租户、K8s、桌面端 |

---

## 1. 岗位要求 → 项目模块映射

### 1.1 RAG 系统（岗位核心要求）

| 岗位要求 | WeKnora 模块 | 关键文件 | 复用方式 |
|----------|-------------|----------|----------|
| 向量数据库 | `internal/application/repository/retriever/sqlite/` | `repository.go` | 架构复用：SQLite + sqlite-vec + FTS5，零外部依赖 |
| 文档解析 | `docreader/` (Python) | `main.py`, `parser/` | **直接复用**：gRPC 文档解析服务 |
| 文档切片策略 | `internal/infrastructure/chunker/` | `strategy.go`, `splitter.go`, `heading_splitter.go` | 架构复用：三级分块策略链 |
| Embedding 模型选型 | `internal/models/embedding/` | `embedder.go` (接口), `openai.go` | 架构复用：Provider 抽象层设计 |
| Rerank 重排序 | `internal/models/rerank/` | `reranker.go` (接口), `remote_api.go` | 架构复用：Reranker 接口 |
| 混合检索 + 融合 | `internal/application/service/` | `knowledgebase_search_fusion.go` | **算法复用**：RRF 融合公式（~20 行） |
| 检索 Fan-out | `internal/application/service/` | `knowledgebase_search_fanout.go` | 架构复用：并发检索分区策略 |

### 1.2 AI Agent 开发（岗位核心要求）

| 岗位要求 | WeKnora 模块 | 关键文件 | 复用方式 |
|----------|-------------|----------|----------|
| Agent 核心循环 | `internal/agent/` | `engine.go`, `think.go`, `act.go`, `observe.go`, `finalize.go` | **架构复用**：ReAct 循环 (Think→Act→Observe→Finalize) |
| 工具机制设计 | `internal/agent/tools/` | `registry.go`, `definitions.go` | **架构复用**：Tool 接口 (4 方法) + ToolRegistry |
| 任务规划与拆解 | `internal/agent/tools/` | `todo_write.go`, `sequentialthinking.go` | 架构复用：内置工具实现参考 |
| 上下文生命周期 | `internal/agent/token/` | `compress.go`, `estimator.go` | **算法复用**：Token 压缩策略 |
| 记忆管理 | `internal/agent/memory/` | `consolidator.go` | 架构复用：LLM 记忆整合 |
| 多 Agent 协作 | `internal/agent/skills/` | `skills` 目录 | 架构参考：Skills 加载与管理 |
| 外部工具接入 | `internal/agent/tools/` | `web_search.go`, `web_fetch.go`, `data_analysis.go` | 架构复用：工具实现范例 |

### 1.3 Prompt Engineering

| 岗位要求 | WeKnora 模块 | 关键文件 | 复用方式 |
|----------|-------------|----------|----------|
| System Prompt 设计 | `config/prompt_templates/` | `agent_system_prompt.yaml` | **配置复用**：直接搬运，微调占位符 |
| 查询重写 | `config/prompt_templates/` | `rewrite.yaml` | **配置复用** |
| 摘要生成 | `config/prompt_templates/` | `generate_summary.yaml` | **配置复用** |
| 意图识别 | `config/prompt_templates/` | `intent_prompts.yaml` | **配置复用** |
| 关键词提取 | `config/prompt_templates/` | `keywords_extraction.yaml` | **配置复用** |
| 兜底回复 | `config/prompt_templates/` | `fallback.yaml` | **配置复用** |
| 知识图谱抽取 | `config/prompt_templates/` | `graph_extraction.yaml` | **配置复用**（加分项） |

### 1.4 后端架构

| 岗位要求 | WeKnora 模块 | 关键文件 | 复用方式 |
|----------|-------------|----------|----------|
| 高并发 API | `internal/handler/` | `session/` 目录 (SSE 流) | 架构参考：SSE 流式响应实现 |
| 数据库设计 | `internal/application/repository/` | 各仓储文件 | 架构参考：GORM 模型设计 |
| 异步任务 | `internal/stream/` | `stream/` 目录 | 架构参考：Memory/Redis 流管理 |
| 速率限制 | `internal/ratelimit/` | — | 架构参考 |

### 1.5 工程化

| 岗位要求 | WeKnora 模块 | 关键文件 | 复用方式 |
|----------|-------------|----------|----------|
| Docker 部署 | `docker/` | `Dockerfile.app`, `Dockerfile.docreader` | **配置复用**：docreader Dockerfile 直接用 |
| Redis 缓存 | `internal/stream/` | `redis/` 子目录 | 架构参考 |
| 环境配置 | `.env.lite.example` | — | **配置复用**：Lite 模式配置参考 |

### 1.6 加分项

| 岗位要求 | WeKnora 模块 | 复用方式 |
|----------|-------------|----------|
| RAG / 知识库 / 文档解析 / PDF 转 Markdown | `docreader/` | **直接复用** |
| 文档站 | `internal/agent/tools/wiki_*.go` | 架构参考：Wiki 系统设计 |
| To B 交付 | `internal/handler/` (embed_channel, tenant) | 架构参考：嵌入渠道 + 多租户 |

---

## 2. 重点学习路径（按优先级排序）

### P0 — 必须掌握（MVP 核心）

#### 第一步：理解 RAG 完整流程

**阅读顺序：**

1. `config/config.yaml` — 理解 RAG 参数配置（chunk_size=512, overlap=50, top_k=30, rerank_top_k=30）
2. `internal/infrastructure/chunker/splitter.go` — 分块配置结构和递归分割算法（Tier 3 兜底策略）
3. `internal/infrastructure/chunker/strategy.go` — 分块策略选择链（Auto → Heading → Heuristic → Legacy）
4. `internal/infrastructure/chunker/profiler.go` — 文档画像分析（分块前的预处理）
5. `internal/models/embedding/embedder.go` — Embedder 接口定义（4 个核心方法）
6. `internal/application/repository/retriever/sqlite/repository.go` — **重点**：SQLite 向量检索 + FTS5 关键词检索 + CJK 二元分词
7. `internal/application/service/knowledgebase_search_fusion.go` — **重点**：RRF 融合算法（~20 行核心逻辑）
8. `internal/models/rerank/reranker.go` — Reranker 接口定义

**MVP 实现要点：**
- 用 Python + Chroma（或 SQLite + sqlite-vec）实现向量存储
- 实现递归分块（Tier 3）作为 MVP 分块策略
- 实现简单的 RRF 融合（向量 + 关键词混合检索）
- 用 OpenAI 或 Ollama 做 Embedding

#### 第二步：理解 Agent ReAct 循环

**阅读顺序：**

1. `internal/types/agent.go` (第 147-175 行) — **重点**：Tool 接口和 ToolResult 结构体定义
2. `internal/agent/engine.go` (第 34-50 行) — AgentEngine 结构体（理解依赖项）
3. `internal/agent/engine.go` (第 378-412 行) — **重点**：主循环控制流（iterOutcome 枚举）
4. `internal/agent/think.go` — Think 阶段：调用 LLM + 流式输出
5. `internal/agent/act.go` (第 165-255 行) — **重点**：Act 阶段：并行工具执行
6. `internal/agent/observe.go` (第 69-180 行) — **重点**：Observe 阶段：停止条件判断
7. `internal/agent/observe.go` (第 229-276 行) — 运行时上下文块构建
8. `internal/agent/finalize.go` — Finalize 阶段：最终答案生成
9. `internal/agent/tools/registry.go` — **重点**：ToolRegistry 注册和执行流程
10. `internal/agent/tools/definitions.go` — 内置工具清单

**MVP 实现要点：**
- 用 LangChain 或 LangGraph 实现 ReAct Agent
- 定义 Python 版 Tool 接口：`name()`, `description()`, `parameters_schema()`, `execute()`
- 实现至少 3 个工具：knowledge_search、web_search、todo_write
- 实现停止条件：自然停止 / 迭代上限 / 卡死检测

#### 第三步：复用 Prompt 模板

**阅读顺序：**

1. `config/prompt_templates/agent_system_prompt.yaml` — **重点**：Pure Agent + Progressive RAG Agent 两种模式
2. `config/prompt_templates/rewrite.yaml` — 查询重写模板
3. `config/prompt_templates/generate_summary.yaml` — 摘要生成模板
4. `internal/agent/prompts.go` (第 329-375 行) — System Prompt 构建逻辑和占位符替换

**MVP 实现要点：**
- 直接搬运 YAML 模板，适配到你的 Python 项目
- 实现占位符替换：`{{knowledge_bases}}`, `{{current_time}}`, `{{language}}`
- 实现运行时上下文块注入

### P1 — 建议掌握（MVP 增强）

#### 第四步：Token 管理与记忆

1. `internal/agent/token/estimator.go` — Token 估算（tiktoken cl100k_base）
2. `internal/agent/token/compress.go` — **重点**：简单压缩策略（0.8 阈值触发，按 tool_call 组删除）
3. `internal/agent/memory/consolidator.go` — **重点**：LLM 记忆整合（0.5 阈值触发，总结旧消息）
4. `internal/agent/observe.go` (第 375-404 行) — 历史检索结果脱敏

**MVP 实现要点：**
- 实现简单 Token 估算（用 tiktoken 库）
- 实现第一层压缩（按 tool_call 组删除旧消息）
- 第二层记忆整合可选（需要额外 LLM 调用）

#### 第五步：部署 docreader

1. `docreader/main.py` — gRPC 服务入口
2. `docreader/proto/docreader.proto` — gRPC 接口定义
3. `docreader/parser/registry.py` — 解析器注册
4. `docker/Dockerfile.docreader` — Docker 构建文件

**MVP 实现要点：**
- 直接用 Docker 部署 docreader
- Python 后端通过 gRPC 客户端调用文档解析
- 或简化为 HTTP 接口（不用 gRPC）

### P2 — 可选学习（加分项）

| 模块 | 文件 | 学什么 |
|------|------|--------|
| 知识图谱 | `config/prompt_templates/graph_extraction.yaml` | 实体/关系抽取提示词 |
| Wiki 系统 | `internal/agent/tools/wiki_*.go` | 自动 Wiki 生成 |
| 数据分析 | `internal/agent/tools/data_analysis.go` | DuckDB 集成 |
| MCP 协议 | `mcp-server/weknora_mcp_server.py` | MCP 工具暴露 |
| 嵌入渠道 | `internal/handler/embed_channel.go` | To B 嵌入式部署 |
| 多租户 | `internal/handler/tenant*.go` | RBAC 角色矩阵 |

---

## 3. MVP 建议架构

### 推荐技术栈

| 层 | 技术 | 理由 |
|----|------|------|
| 后端框架 | FastAPI (Python) | 岗位明确要求 |
| RAG 框架 | LangChain + LlamaIndex | 岗位明确要求 |
| 向量数据库 | Chroma（开发）/ SQLite + sqlite-vec（生产） | Chroma 简单易用，sqlite-vec 零依赖 |
| Embedding | OpenAI text-embedding-3-small / Ollama nomic-embed | 有免费额度 / 本地部署 |
| LLM | OpenAI GPT-4o-mini / Anthropic Claude | 岗位要求 Function Calling |
| 文档解析 | **WeKnora docreader**（直接复用） | 支持 PDF/Word/Excel/PPT/HTML/EPUB |
| 前端 | Vue 3 + Vite（或 React + Next.js） | 岗位要求 React/Vue3 |
| 部署 | Docker + Docker Compose | 岗位要求 Docker |
| 异步任务 | Celery + Redis | 岗位明确要求 |
| 数据库 | PostgreSQL / SQLite | 岗位要求 PostgreSQL |

### MVP 模块划分

```
my-rag-agent/
├── backend/                    # Python FastAPI 后端
│   ├── main.py                 # FastAPI 入口
│   ├── api/                    # API 路由
│   │   ├── chat.py             # 对话接口（SSE 流）
│   │   ├── knowledge.py        # 知识库 CRUD
│   │   └── agent.py            # Agent 接口
│   ├── core/                   # 核心逻辑（从 WeKnora 架构复用）
│   │   ├── agent/              # Agent 引擎（P0 第二步）
│   │   │   ├── engine.py       #   ReAct 循环 ← engine.go
│   │   │   ├── tools/          #   工具系统 ← tools/registry.go
│   │   │   └── prompts.py      #   提示词构建 ← prompts.go
│   │   ├── rag/                # RAG 管线（P0 第一步）
│   │   │   ├── chunker.py      #   分块策略 ← chunker/strategy.go
│   │   │   ├── retriever.py    #   向量+关键词检索 ← sqlite/repository.go
│   │   │   ├── fusion.py       #   RRF 融合 ← search_fusion.go
│   │   │   └── reranker.py     #   重排序 ← rerank/reranker.go
│   │   ├── memory/             # 记忆管理（P1 第四步）
│   │   │   ├── compressor.py   #   Token 压缩 ← token/compress.go
│   │   │   └── consolidator.py #   记忆整合 ← memory/consolidator.go
│   │   └── models/             # 模型抽象
│   │       ├── embedder.py     #   Embedding ← embedding/embedder.go
│   │       └── llm.py          #   LLM 对话 ← models/chat/
│   ├── config/                 # 配置（从 WeKnora 复用）
│   │   ├── config.yaml         #   ← config/config.yaml
│   │   └── prompts/            #   ← config/prompt_templates/*.yaml
│   ├── tasks/                  # Celery 异步任务
│   │   └── document.py         #   文档处理异步任务
│   └── requirements.txt
│
├── docreader/                  # 直接复用 WeKnora 的 docreader
│   └── (从 WeKnora-main/docreader/ 复制)
│
├── frontend/                   # Vue 3 / React 前端
│   ├── src/
│   │   ├── views/chat/         #   聊天界面（SSE 流式显示）
│   │   ├── views/knowledge/    #   知识库管理
│   │   └── api/                #   API 调用
│   └── package.json
│
├── docker-compose.yml          # 编排文件
├── Dockerfile.backend          # 后端镜像
└── Dockerfile.docreader        # ← docker/Dockerfile.docreader（直接复用）
```

### MVP 核心功能清单

**必须实现（P0）：**
1. 文档上传 → docreader 解析 → 分块 → Embedding → 存入向量库
2. 用户提问 → 向量检索 + 关键词检索 → RRF 融合 → Rerank → 返回答案
3. Agent 模式：ReAct 循环（Think→Act→Observe→Finalize）+ 3 个工具
4. SSE 流式响应（前端实时显示思考过程和回答）
5. Web UI（聊天界面 + 知识库管理）

**建议实现（P1）：**
6. Token 压缩（上下文窗口管理）
7. 查询重写（提升检索召回率）
8. Celery 异步文档处理
9. Docker 一键部署

**加分实现（P2）：**
10. 知识图谱抽取
11. 多 Agent 协作
12. 嵌入式 Widget（可嵌入第三方网站）

---

## 4. 直接复用清单

以下文件/目录可以直接复制到你的项目中使用：

| 来源 | 目标 | 复用方式 |
|------|------|----------|
| `docreader/` 整个目录 | `my-rag-agent/docreader/` | Python gRPC 服务，零修改 |
| `docker/Dockerfile.docreader` | `my-rag-agent/Dockerfile.docreader` | Docker 构建文件 |
| `config/prompt_templates/*.yaml` (11 个文件) | `backend/config/prompts/` | 提示词模板，微调占位符 |
| `config/config.yaml` | `backend/config/config.yaml` | RAG 参数参考 |
| `config/builtin_agents.yaml` | `backend/config/agents.yaml` | Agent 定义参考 |
| `.env.lite.example` | `.env.example` | 环境变量模板参考 |

---

## 5. 架构复用清单

以下 Go 代码需要理解架构后用 Python 重新实现，但设计模式可以直接参考：

| Go 源文件 | Python 目标 | 核心设计模式 |
|-----------|------------|-------------|
| `internal/agent/engine.go` | `backend/core/agent/engine.py` | ReAct 循环 + iterOutcome 控制流 |
| `internal/agent/tools/registry.go` | `backend/core/agent/tools/registry.py` | Tool 接口(4方法) + 先到先得注册 + 输出截断 |
| `internal/agent/think.go` | `backend/core/agent/think.py` | LLM 调用 + 流式输出 + 重试 |
| `internal/agent/act.go` | `backend/core/agent/act.py` | 并行工具执行(errgroup→asyncio.gather) |
| `internal/agent/observe.go` | `backend/core/agent/observe.py` | 停止条件 + 运行时上下文块 |
| `internal/agent/finalize.go` | `backend/core/agent/finalize.py` | 最终答案组装 + 流式生成 |
| `internal/agent/token/compress.go` | `backend/core/memory/compressor.py` | 0.8 阈值 + tool_call 组删除 |
| `internal/agent/memory/consolidator.go` | `backend/core/memory/consolidator.py` | 0.5 阈值 + LLM 总结 |
| `internal/infrastructure/chunker/strategy.go` | `backend/core/rag/chunker.py` | 三级策略链 Auto→Heading→Heuristic→Legacy |
| `internal/infrastructure/chunker/splitter.go` | `backend/core/rag/chunker.py` | 递归分割 + 原子单元保护 |
| `internal/application/repository/retriever/sqlite/repository.go` | `backend/core/rag/retriever.py` | 向量检索 + FTS5 BM25 + CJK 二元分词 |
| `internal/application/service/knowledgebase_search_fusion.go` | `backend/core/rag/fusion.py` | RRF 融合公式 |
| `internal/models/embedding/embedder.go` | `backend/core/models/embedder.py` | Embedder 接口(4方法) |
| `internal/models/rerank/reranker.go` | `backend/core/models/reranker.py` | Reranker 接口(3方法) |

---

## 6. 核心算法速查（可直接翻译为 Python）

### RRF 融合算法

```
# WeKnora: knowledgebase_search_fusion.go
rrf_score = vector_weight / (k + vector_rank) + keyword_weight / (k + keyword_rank)
# 默认 k=60, vector_weight=1.0, keyword_weight=1.0
# 按排名融合，不依赖原始分数尺度
```

### CJK 二元分词

```
# WeKnora: sqlite/repository.go tokenizeCJKBigram()
# "知识库" → ["知识", "识库"]
# 连续中文字符拆分为重叠二元组，非 CJK 保持完整
# 最大化中文检索召回率
```

### Token 压缩策略

```
# WeKnora: token/compress.go
# 触发: total_tokens > max_context_tokens * 0.8
# 策略: 从头部删除旧消息，按 tool_call/tool_result 分组整组移除
# 保留: system prompt + 当前轮次
```

### Agent 停止条件

```
# WeKnora: observe.go analyzeResponse()
# 1. finish_reason == "stop" 且无 tool_calls → 自然停止
# 2. finish_reason == "content_filter" → 内容过滤停止
# 3. 连续 2 次返回相同内容 → 卡死检测，强制终止
# 4. 达到 MaxIterations (默认 20) → 合成兜底答案
```

### 工具输出截断

```
# WeKnora: tools/registry.go
# 默认截断阈值: 16KB
# 防止过大的工具输出污染上下文窗口
```

---

## 7. 跳过清单（MVP 不需要）

以下模块对 MVP 不必要，建议直接跳过：

| 模块 | 原因 |
|------|------|
| `internal/im/` (8 个 IM 平台) | 企业级功能，MVP 不需要 |
| `internal/sandbox/` | Docker 沙箱隔离，复杂度高 |
| `internal/tracing/` | Langfuse 链路追踪，非核心 |
| `internal/datasource/` | 外部数据源连接器（飞书/Notion/语雀/RSS） |
| `cmd/desktop/` | 桌面应用，MVP 只需 Web |
| `cmd/desktop/` | Wails 桌面端 |
| `cli/` | CLI 工具 |
| `miniprogram/` | 微信小程序 |
| `helm/` | Kubernetes 部署 |
| `internal/application/repository/retriever/` (非 sqlite) | 其他 8 种向量库后端 |
| 多租户 RBAC | 企业级功能 |
| `internal/infrastructure/docparser/` | Go 端文档解析封装（已有 Python docreader） |
| `internal/mcp/` | MCP 客户端（可后期加） |
| `internal/ratelimit/` | 速率限制（可后期加） |
| `internal/event/` | 事件总线（可简化） |

---

*生成时间：2026-06-27*
