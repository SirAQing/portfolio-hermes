# Hermes RAG + Agent 重构方案

> 把现有 Hermes（DeepSeek 透传）升级为求职作品级的 RAG + ReAct Agent 后端，复用作品集前端，用 WeKnora 的架构模式用 Python 落地。新增登录认证 + 访客配额机制。
>
> 原项目参考：`E:\proCode\6Y\26-WeKnora\WeKnora-main`（Go 后端 + Python docreader/mcp-server）

---

## 0. 设计原则

1. **直接复用优先**：WeKnora 的 Python 组件（docreader、mcp-server、prompt YAML）零修改搬运
2. **架构复用次之**：Go 代码的设计模式用 Python 重新实现（ReAct 引擎、RAG 管线、Tool 系统）
3. **可扩展性**：Provider 抽象 + 接口约定 + 配置驱动，新模型/新向量库/新工具即插即用
4. **登录 gating**：访客 5 次对话配额，超限弹登录；登录用户无限 + 历史会话
5. **YAGNI**：跳过 IM/沙箱/多租户/K8s/桌面端

---

## 1. 原项目直接复用清单

以下文件从 `E:\proCode\6Y\26-WeKnora\WeKnora-main\` 直接复制到 `portfolio-react/hermes/`：

| 来源 | 目标 | 复用方式 |
|------|------|----------|
| `docreader/` 整个目录 | `hermes/docreader/` | Python gRPC 文档解析服务，零修改 |
| `mcp-server/` 整个目录 | `hermes/mcp_server/` | Python MCP Server，零修改 |
| `config/prompt_templates/*.yaml` (11 个) | `hermes/config_files/prompts/` | 提示词模板，微调占位符 |
| `config/config.yaml` | `hermes/config_files/config.yaml` | RAG 参数参考（chunk_size/overlap/top_k） |
| `config/builtin_agents.yaml` | `hermes/config_files/agents.yaml` | Agent 预设参考 |
| `docker/Dockerfile.docreader` | `Dockerfile.docreader` | docreader 镜像构建文件 |

**架构复用清单**（Go → Python 重新实现）：

| Go 源文件 | Python 目标 | 核心设计模式 |
|-----------|------------|-------------|
| `internal/agent/engine.go` | `core/agent/engine.py` | ReAct 循环 + iterOutcome 控制流 |
| `internal/agent/tools/registry.go` | `core/agent/tools/registry.py` | Tool 接口(4方法) + 先到先得注册 + 16KB 截断 |
| `internal/agent/think.go` | `core/agent/think.py` | LLM 调用 + 流式输出 + 重试 |
| `internal/agent/act.go` | `core/agent/act.py` | 并行工具执行(errgroup→asyncio.gather) |
| `internal/agent/observe.go` | `core/agent/observe.py` | 停止条件 + 运行时上下文块 |
| `internal/agent/finalize.go` | `core/agent/finalize.py` | 最终答案组装 + 流式生成 |
| `internal/agent/token/compress.go` | `core/agent/token/compress.py` | 0.8 阈值 + tool_call 组删除 |
| `internal/agent/memory/consolidator.go` | `core/agent/memory/consolidator.py` | 0.5 阈值 + LLM 总结 |
| `internal/infrastructure/chunker/strategy.go` | `core/rag/chunker.py` | 三级策略链 Auto→Heading→Heuristic→Legacy |
| `internal/infrastructure/chunker/splitter.go` | `core/rag/chunker.py` | 递归分割 + 原子单元保护 |
| `internal/application/repository/retriever/sqlite/repository.go` | `core/rag/retriever.py` | 向量检索 + FTS5 BM25 + CJK 二元分词 |
| `internal/application/service/knowledgebase_search_fusion.go` | `core/rag/fusion.py` | RRF 融合公式（~20 行） |
| `internal/models/embedding/embedder.go` | `core/rag/embedder.py` | Embedder 接口(4方法) |
| `internal/models/rerank/reranker.go` | `core/rag/reranker.py` | Reranker 接口(3方法) |
| `internal/middleware/auth.go` | `core/auth/middleware.py` | JWT Bearer 认证模式 |
| `internal/middleware/auth_public_ratelimit.go` | `core/auth/guest_quota.py` | IP 滑窗限流 → 访客配额 |

---

## 2. 目标架构

### 2.1 目录结构

```
portfolio-react/hermes/
├── main.py                     # FastAPI 入口（瘦身，只做装配）
├── config.py                   # 配置（扩展 RAG + Auth 参数）
├── models.py                   # SQLite schema（扩展 KB/Agent/User 表）
├── llm.py                      # LLM 客户端（扩展 function calling）
├── notify.py                   # 通知（不动）
├── requirements.txt            # 扩展依赖
│
├── api/                        # 路由层（从 main.py 拆出）
│   ├── chat.py                 #   对话 SSE → 走 Agent（带配额检查）
│   ├── knowledge.py            #   知识库 CRUD + 文档上传
│   ├── agent.py                #   Agent 会话管理
│   └── auth.py                 #   注册/登录/刷新/登出
│
├── core/                       # 核心业务逻辑
│   ├── auth/                   # 认证与配额（新增）
│   │   ├── jwt_handler.py      #   JWT 签发/验证（PyJWT）
│   │   ├── middleware.py       #   认证中间件 ← auth.go
│   │   ├── guest_quota.py      #   访客配额 ← auth_public_ratelimit.go
│   │   ├── password.py         #   bcrypt 哈希
│   │   └── deps.py             #   FastAPI 依赖注入（current_user/guest）
│   │
│   ├── agent/                  # ReAct 引擎 ← internal/agent/
│   │   ├── engine.py           #   主循环 iterOutcome ← engine.go
│   │   ├── think.py            #   Think ← think.go
│   │   ├── act.py              #   Act（asyncio.gather 并行）← act.go
│   │   ├── observe.py          #   Observe（停止条件）← observe.go
│   │   ├── finalize.py         #   Finalize ← finalize.go
│   │   ├── prompts.py          #   Prompt 构建 + 占位符替换 ← prompts.go
│   │   ├── tools/              #   工具系统
│   │   │   ├── base.py         #     Tool 抽象基类（4 方法）
│   │   │   ├── registry.py     #     ToolRegistry ← registry.go
│   │   │   ├── knowledge_search.py  #  RAG 检索工具
│   │   │   ├── web_search.py   #     网页搜索工具
│   │   │   ├── web_fetch.py    #     网页抓取工具
│   │   │   └── todo_write.py   #     任务规划工具
│   │   ├── skills/             #   Skills 加载 ← agent/skills/
│   │   │   └── loader.py       #     从 YAML 加载 Skill 定义
│   │   ├── token/              #   Token 管理
│   │   │   ├── estimator.py    #     tiktoken 估算 ← estimator.go
│   │   │   └── compress.py     #     0.8 阈值压缩 ← compress.go
│   │   └── memory/
│   │       └── consolidator.py #     0.5 阈值记忆整合 ← consolidator.go
│   │
│   ├── rag/                    # RAG 管线
│   │   ├── chunker.py          #   三级分块链 ← strategy.go + splitter.go
│   │   ├── retriever.py        #   向量+FTS5+CJK二元 ← sqlite/repository.go
│   │   ├── fusion.py           #   RRF 融合 ← search_fusion.go
│   │   ├── reranker.py         #   Reranker 接口 ← reranker.go
│   │   └── embedder.py         #   Embedding Provider 抽象 ← embedder.go
│   │
│   └── mcp/                    # MCP 客户端 ← internal/mcp/
│       └── client.py           #   连接外部 MCP Server，暴露为 Agent 工具
│
├── config_files/               # 配置（从 WeKnora 复用）
│   ├── config.yaml             #   RAG 参数 (chunk_size=512, overlap=50, top_k=30)
│   ├── prompts/                #   ← config/prompt_templates/*.yaml
│   │   ├── agent_system.yaml   #     ReAct 系统提示（pure + rag 两模式）
│   │   ├── rewrite.yaml        #     查询重写
│   │   ├── generate_summary.yaml
│   │   ├── fallback.yaml       #     兜底回复
│   │   └── ...                 #     其余 7 个模板
│   ├── agents.yaml             #   Agent 预设 ← builtin_agents.yaml
│   └── skills/                 #   Skill 定义（YAML）
│
├── docreader/                  # 直接复用 WeKnora（Python gRPC）
│   ├── main.py
│   ├── parser/                 #   PDF/Word/Excel/PPT/HTML/EPUB 解析器
│   ├── proto/
│   └── ...
│
├── mcp_server/                 # 直接复用 WeKnora（Python MCP Server）
│   └── ...
│
└── hermes.db                   # SQLite（扩展 schema）
```

### 2.2 分层架构（可扩展性核心）

```
┌─────────────────────────────────────────────────┐
│  API 层 (api/)                                   │
│  FastAPI 路由 + Pydantic DTO                     │
├─────────────────────────────────────────────────┤
│  认证层 (core/auth/)                             │
│  JWT 中间件 → current_user / guest 判定          │
│  访客配额检查（5 次/IP/天）                       │
├─────────────────────────────────────────────────┤
│  业务层 (core/agent/ + core/rag/)                │
│  AgentEngine ← ToolRegistry ← Tools              │
│  RAG: chunker → retriever → fusion → reranker    │
├─────────────────────────────────────────────────┤
│  Provider 抽象层                                  │
│  LLMProvider | Embedder | Reranker | Retriever  │
│  （接口约定，多实现可切换）                        │
├─────────────────────────────────────────────────┤
│  基础设施 (models.py + docreader + mcp_server)    │
│  SQLite + sqlite-vec + FTS5                      │
└─────────────────────────────────────────────────┘
```

**可扩展性设计**：每层通过抽象接口解耦。新增模型/向量库/工具只需实现接口并注册，不改上层。例如：
- 换 Embedding：实现 `Embedder` 接口，改 config
- 换向量库：实现 `Retriever` 接口（当前 SQLite 实现）
- 加工具：继承 `Tool` 基类，注册到 `ToolRegistry`
- 加 Skill：写 YAML，自动加载

---

## 3. 登录与配额机制

### 3.1 认证流程

```
访客访问 → 无 Token → 标记为 guest（按 IP 识别）
    ↓
对话请求 → guest_quota 检查 → 当日已用次数 < 5 → 允许
                                  ↓ ≥5
                            返回 403 + {need_login: true}
                                  ↓
                     前端弹出登录/注册界面（含"面试官入口"）
                                  ↓
            ┌─────────────────────┼──────────────────────┐
            ↓                     ↓                      ↓
        普通注册登录          演示账号登录            面试官专属登录
        (role=user)        (role=demo)            (role=interviewer)
            ↓                     ↓                      ↓
        签发 JWT → 后续请求带 Bearer
            ↓
        按角色鉴权（见 3.8 权限矩阵）
```

### 3.1.1 角色体系（为个人主产品扩展预留）

| 角色 | 标识 | 定位 | 适用场景 |
|------|------|------|----------|
| `guest` | 未登录访客 | IP 配额 5 次/天 | 任意路人访问 |
| `interviewer` | 面试官/HR | 体验核心功能，只读预设知识库，无管理权限 | 每次求职面试时提供给对方 |
| `demo` | 演示账号 | 可重置的共享体验账号（可选） | 线上公开演示、群发简历时嵌入 |
| `user` | 注册用户 | 无限对话 + 私有知识库管理 | 后续开放注册时的普通用户 |
| `owner` | 个人主账号 | 全部权限 + 管理后台 + 知识库写入 + 用户管理 | 你自己（唯一） |

**设计意图**：`owner` 是唯一的个人主账号，作为后续所有个人产品迭代的"超级管理员"。`interviewer` 角色专为求职场景设计，每次面试可生成独立账号或复用共享账号，体验完可一键重置/禁用。`user`/`demo` 为后续产品化预留，当前 MVP 可不开放注册。

### 3.2 数据库 Schema（认证相关）

```sql
-- 用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,       -- bcrypt
  role TEXT DEFAULT 'user',          -- guest | interviewer | demo | user | owner
  is_active INTEGER DEFAULT 1,
  expires_at TEXT,                   -- 账号过期时间（interviewer/demo 用，NULL=永久）
  created_by TEXT REFERENCES users(id), -- 创建者（owner 创建的 interviewer 账号）
  last_login_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 面试官账号邀请码（owner 为每次面试生成一次性邀请码）
CREATE TABLE interviewer_invites (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,         -- 6-8 位短码，便于口述/扫码
  created_by TEXT NOT NULL REFERENCES users(id),
  company TEXT,                      -- 面试公司（备注用）
  position TEXT,                     -- 面试岗位（备注用）
  interview_date TEXT,               -- 面试日期
  max_uses INTEGER DEFAULT 1,        -- 1=一次性，>1=可多人复用
  used_count INTEGER DEFAULT 0,
  expires_at TEXT NOT NULL,          -- 邀请码过期时间（面试后自动失效）
  linked_user_id TEXT REFERENCES users(id), -- 关联的 interviewer 账号
  created_at TEXT DEFAULT (datetime('now'))
);

-- 访客配额表（按 IP + 日期）
CREATE TABLE guest_quotas (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,             -- SHA256(ip) 避免明文存储
  query_date TEXT NOT NULL,          -- YYYY-MM-DD
  query_count INTEGER DEFAULT 0,
  last_query_at TEXT,
  UNIQUE(ip_hash, query_date)
);

-- 刷新令牌表
CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,          -- SHA256(token)
  expires_at TEXT NOT NULL,
  revoked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 3.3 JWT 设计

```python
# core/auth/jwt_handler.py
ACCESS_TOKEN_EXPIRE = 30 * 60        # 30 分钟
REFRESH_TOKEN_EXPIRE = 7 * 24 * 3600 # 7 天

def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "exp": datetime.utcnow() + timedelta(minutes=30),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=7),
        "jti": str(uuid.uuid4()),  # 用于撤销
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")
```

### 3.4 配额中间件

```python
# core/auth/guest_quota.py
GUEST_DAILY_LIMIT = 5

async def check_guest_quota(request: Request, db) -> tuple[bool, int]:
    """返回 (允许, 剩余次数)。未登录访客每日 5 次。"""
    ip = get_client_ip(request)
    ip_hash = hashlib.sha256(ip.encode()).hexdigest()
    today = datetime.now().strftime("%Y-%m-%d")

    quota = db.execute(
        "SELECT query_count FROM guest_quotas WHERE ip_hash=? AND query_date=?",
        (ip_hash, today)
    ).fetchone()

    used = quota["query_count"] if quota else 0
    remaining = GUEST_DAILY_LIMIT - used
    return (remaining > 0), remaining


async def increment_guest_quota(request: Request, db):
    """对话成功后调用，计数 +1。"""
    ip = get_client_ip(request)
    ip_hash = hashlib.sha256(ip.encode()).hexdigest()
    today = datetime.now().strftime("%Y-%m-%d")
    db.execute("""
        INSERT INTO guest_quotas (id, ip_hash, query_date, query_count, last_query_at)
        VALUES (?, ?, ?, 1, datetime('now'))
        ON CONFLICT(ip_hash, query_date)
        DO UPDATE SET query_count = query_count + 1, last_query_at = datetime('now')
    """, (str(uuid.uuid4()), ip_hash, today))
    db.commit()
```

### 3.5 FastAPI 依赖注入

```python
# core/auth/deps.py
async def get_current_user_or_guest(
    request: Request,
    authorization: str = Header(None),
    db = Depends(get_db)
) -> UserContext:
    """统一入口：有 Token 返回 User，无 Token 返回 Guest。"""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            user = db.execute("SELECT * FROM users WHERE id=?", (payload["sub"],)).fetchone()
            if user and user["is_active"]:
                return UserContext(is_guest=False, user_id=user["id"], role=user["role"])
        except jwt.PyJWTError:
            pass
    return UserContext(is_guest=True, ip=get_client_ip(request))


# 在 chat 路由中使用
@app.post("/api/chat/stream")
async def chat_stream(
    req: ChatRequest,
    ctx: UserContext = Depends(get_current_user_or_guest),
    db = Depends(get_db)
):
    if ctx.is_guest:
        allowed, remaining = await check_guest_quota(req, db)
        if not allowed:
            raise HTTPException(
                status_code=403,
                detail={"need_login": True, "message": "访客每日限 5 次对话，登录后无限制"}
            )
        # 对话成功后 increment
```

### 3.7 认证 API

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/register` | 无 | 注册（email + password + username）|
| POST | `/api/auth/login` | 无 | 登录，返回 access + refresh token |
| POST | `/api/auth/refresh` | refresh | 刷新 access token |
| POST | `/api/auth/logout` | 是 | 撤销 refresh token |
| GET | `/api/auth/me` | 可选 | 返回用户信息或 guest + remaining |
| GET | `/api/auth/warmup` | 无 | 前端探测登录状态 + 配额 |
| POST | `/api/auth/interviewer/redeem` | 无 | 凭邀请码登录面试官账号（免注册）|
| POST | `/api/auth/demo/login` | 无 | 演示账号一键登录（共享只读）|

**owner 专属管理 API**（后续个人产品迭代的基础）：

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/admin/invites` | owner | 生成面试邀请码（含公司/岗位/日期备注）|
| GET | `/api/admin/invites` | owner | 邀请码列表（含使用状态）|
| DELETE | `/api/admin/invites/{id}` | owner | 撤销邀请码 |
| POST | `/api/admin/interviewer/reset` | owner | 重置面试官账号对话历史 |
| GET | `/api/admin/users` | owner | 用户列表（含角色/状态/最后登录）|
| PATCH | `/api/admin/users/{id}` | owner | 修改用户状态（禁用/激活/改角色）|

### 3.8 面试官账号机制（求职专用）

**场景**：每次面试时，owner 生成一个邀请码，HR/面试官凭码登录体验，面试后自动失效。

#### 3.8.1 邀请码流程

```
owner 在管理后台创建邀请
    → 填写：面试公司、岗位、面试日期、有效期（默认面试后 3 天）
    → 生成 6-8 位短码（如 HR-7K3M9X），可生成二维码
    → 短链/口述发给 HR
    ↓
HR 打开网站 → 点"面试官入口" → 输入邀请码
    ↓
后端校验：未过期 + 未用尽 → 自动创建/关联 interviewer 账号 → 签发 JWT
    ↓
HR 体验：对话（无限次）、浏览预设知识库（只读）
    ↓
面试结束 → 邀请码过期 → interviewer 账号自动禁用
    → owner 可一键清除该账号的对话历史
```

#### 3.8.2 面试官体验设计

- **免注册**：凭邀请码直接登录，不要求填邮箱/密码
- **只读知识库**：只能查询 owner 预设的"面试知识库"（简历、项目、技术文章），不能上传/删除
- **无限对话**：不受 5 次访客限制，充分体验 Agent + RAG 能力
- **会话隔离**：每次面试的对话历史独立，不交叉
- **无管理权限**：看不到 `/admin` 后台、用户列表、邀请码管理
- **水印/标记**：HR 看到的界面可标注"面试体验模式"（可选）
- **自动过期**：邀请码到期后账号即失效，防止后续滥用

#### 3.8.3 权限矩阵

| 能力 \ 角色 | guest | interviewer | demo | user | owner |
|------------|:-----:|:-----------:|:----:|:----:|:-----:|
| 对话（Agent + RAG） | 5次/天 | 无限 | 无限 | 无限 | 无限 |
| 浏览公开知识库文章 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 查询预设知识库(RAG) | ✅(限额) | ✅ | ✅ | ✅ | ✅ |
| 上传/管理文档 | ❌ | ❌ | ❌ | ✅(私有) | ✅(全部) |
| 创建知识库 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 管理后台 `/admin` | ❌ | ❌ | ❌ | ❌ | ✅ |
| 生成面试邀请码 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 用户管理 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 查看对话历史 | 当前IP | 仅自己 | 可重置 | 仅自己 | 全部 |
| 系统配置 | ❌ | ❌ | ❌ | ❌ | ✅ |

#### 3.8.4 owner 账号初始化

MVP 首次启动时自动创建 owner 账号（通过环境变量配置）：

```python
# .env
OWNER_EMAIL=lmq0205a@163.com
OWNER_INITIAL_PASSWORD=changeme123  # 首次登录强制改密

# main.py lifespan 启动时
if not get_user_by_email(OWNER_EMAIL):
    create_user(email=OWNER_EMAIL, password=OWNER_INITIAL_PASSWORD, role='owner')
    print("[hermes] Owner account created. Change password on first login.")
```

后续个人产品迭代时，owner 账号是所有新功能的管理入口，无需再造认证体系。

### 3.9 前端登录流程（更新）

`FloatingAssistant.tsx` 改造：

1. 新增 `/api/auth/me` 探测登录状态（返回 user 或 guest + remaining）
2. 访客剩余次数 ≤ 1 时，UI 显示"剩余 N 次，登录解锁无限对话"
3. 收到 403 `{need_login: true}` → 弹出登录模态框，含三个 Tab：
   - **登录**（已注册用户 / owner）
   - **面试官入口**（输入邀请码，免注册）
   - **演示账号**（一键登录，只读体验）
4. 登录成功 → 存 JWT 到 localStorage → 后续请求带 `Authorization: Bearer <token>`
5. owner 登录后显示"管理后台"入口
6. interviewer 登录后显示"面试体验模式"标记

---

## 4. RAG 管线设计

### 4.1 数据库 Schema（RAG 相关）

```sql
CREATE TABLE knowledge_bases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT REFERENCES users(id),  -- 登录用户私有 KB
  is_public INTEGER DEFAULT 0,         -- 是否公开（作品集默认 KB）
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  kb_id TEXT NOT NULL REFERENCES knowledge_bases(id),
  source_type TEXT NOT NULL,      -- 'markdown' | 'upload' | 'web'
  source_path TEXT,
  title TEXT NOT NULL,
  raw_content TEXT,
  status TEXT DEFAULT 'pending',  -- pending|parsing|chunking|embedding|ready|failed
  embedding_model TEXT,           -- 记录用的 embedding 模型（换模型时重建）
  created_at TEXT DEFAULT (datetime('now'))
);

-- sqlite-vec 向量表（维度由 embedding 模型决定）
CREATE VIRTUAL TABLE chunks USING vec0(
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documents(id),
  content TEXT NOT NULL,
  embedding FLOAT[768],           -- text-embedding-3-small = 768
  chunk_index INTEGER,
  token_count INTEGER
);

-- FTS5 关键词检索（CJK 二元分词）
CREATE VIRTUAL TABLE chunks_fts USING fts5(
  chunk_id, content, tokenize='unicode61'
);
```

### 4.2 分块策略链 (`core/rag/chunker.py`)

← `chunker/strategy.go` + `splitter.go`

```
Auto → Heading(按标题) → Heuristic(启发式) → Legacy(递归兜底)
```

- **文档画像**：先分析结构（标题密度、代码块比例），选策略
- **参数**：chunk_size=512, overlap=50（从 config.yaml 读）
- **原子单元保护**：代码块、表格不切断
- **三级链**：Auto 模式按画像选 Heading 或 Heuristic，失败降级到 Legacy 递归分割

### 4.3 混合检索 (`core/rag/retriever.py`)

← `sqlite/repository.go`

- **向量检索**：sqlite-vec 余弦相似度，top_k=30
- **关键词检索**：FTS5 BM25 + CJK 二元分词
  - "知识库" → ["知识", "识库"]（连续中文拆重叠二元组，非 CJK 保持完整）
- **并行执行**，结果按 rank 传给融合层

### 4.4 RRF 融合 (`core/rag/fusion.py`)

← `search_fusion.go`，核心 ~20 行

```python
def rrf_fuse(vector_results, keyword_results, k=60, vw=1.0, kw=1.0):
    scores = {}
    for rank, r in enumerate(vector_results):
        scores[r.id] = scores.get(r.id, 0) + vw / (k + rank)
    for rank, r in enumerate(keyword_results):
        scores[r.id] = scores.get(r.id, 0) + kw / (k + rank)
    return sorted(scores, key=scores.get, reverse=True)
```

### 4.5 Reranker (`core/rag/reranker.py`)

← `rerank/reranker.go`，抽象接口

- 接口：`rerank(query, chunks, top_k) -> chunks`
- MVP 实现：BGE-reranker-v2-m3（本地，中文友好）/ Cohere API
- rerank_top_k=30

### 4.6 Embedder (`core/rag/embedder.py`)

← `embedder.go`，4 方法接口

- `embed(texts) -> vectors` / `dimension()` / `model_name()` / `max_tokens()`
- Provider：OpenAI text-embedding-3-small（768维）/ Ollama nomic-embed（本地）

---

## 5. ReAct Agent 引擎

### 5.1 主循环 (`core/agent/engine.py`)

← `engine.go` 第 378-412 行

```python
class IterOutcome(Enum):
    CONTINUE = "continue"
    STOP = "stop"
    STUCK = "stuck"
    MAX_ITER = "max_iter"

class AgentEngine:
    MAX_ITERATIONS = 20

    async def run(self, query, history, tools) -> AsyncGenerator[Event, None]:
        context = self._build_context(history)
        for iteration in range(self.MAX_ITERATIONS):
            # Think: LLM + function calling
            think_result = await self.think(query, context, tools)
            yield Event(type="think", content=think_result.content, iteration=iteration)

            if not think_result.tool_calls:
                break  # 无工具调用 → 进入 Finalize

            # Act: 并行工具执行
            tool_results = await self.act(think_result.tool_calls)
            for tr in tool_results:
                yield Event(type="tool_call", tool=tr.name, input=tr.input, iteration=iteration)
                yield Event(type="tool_result", tool=tr.name, output=tr.output, iteration=iteration)

            # Observe: 停止条件判断
            outcome = self.observe(think_result, tool_results, iteration)
            if outcome in (IterOutcome.STOP, IterOutcome.STUCK):
                break
            elif outcome == IterOutcome.MAX_ITER:
                # 合成兜底答案
                break

            # Token 压缩检查
            if self._needs_compression(context):
                context = await self.compress(context)

        # Finalize: 流式生成最终答案
        async for chunk in self.finalize(query, context, history):
            yield Event(type="chunk", content=chunk)
        yield Event(type="done", iterations=iteration+1, tokens_used=self._tokens_used)
```

### 5.2 停止条件 (`core/agent/observe.py`)

← `observe.go` 第 69-180 行

1. `finish_reason == "stop"` 且无 tool_calls → 自然停止
2. `finish_reason == "content_filter"` → 内容过滤停止
3. **连续 2 次返回相同内容 → 卡死检测，强制终止**
4. 达到 MaxIterations(20) → 合成兜底答案

### 5.3 工具系统 (`core/agent/tools/`)

← `registry.go`

```python
# base.py
class Tool(ABC):
    @abstractmethod
    def name(self) -> str: ...
    @abstractmethod
    def description(self) -> str: ...
    @abstractmethod
    def parameters_schema(self) -> dict: ...  # JSON Schema for function calling
    @abstractmethod
    async def execute(self, **kwargs) -> str: ...

# registry.py
class ToolRegistry:
    OUTPUT_LIMIT = 16 * 1024  # 16KB 截断

    def __init__(self):
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool):
        name = tool.name()
        if name not in self._tools:  # 先到先得
            self._tools[name] = tool

    async def execute(self, name: str, params: dict) -> str:
        tool = self._tools[name]
        result = await tool.execute(**params)
        return result[:self.OUTPUT_LIMIT]  # 截断
```

**MVP 内置 4 工具**：
- `knowledge_search`：调用 RAG 管线（retriever → fusion → rerank）
- `web_search`：Tavily/SerpAPI 抽象（7 引擎接口预留）
- `web_fetch`：抓取网页内容
- `todo_write`：任务规划（多步任务管理）

### 5.4 Token 管理 (`core/agent/token/`)

← `compress.go`

- **触发**：`total_tokens > max_context * 0.8`
- **策略**：从头部按 tool_call/tool_result 分组整组删除
- **保留**：system prompt + 当前轮次

### 5.5 记忆整合 (`core/agent/memory/`)

← `consolidator.go`

- **触发**：`total_tokens > max_context * 0.5`
- **策略**：LLM 总结旧消息，替换原始历史

### 5.6 Skills 与 MCP

**Skills** (`core/agent/skills/loader.py`)：
- 从 `config_files/skills/` 加载 YAML 定义
- 每个 Skill = 一组工具 + system prompt 片段 + 触发条件
- 运行时按需挂载到 Agent

**MCP** (`core/mcp/client.py`)：
- 连接外部 MCP Server（含复用的 `mcp_server/`），暴露为 Agent 工具
- 支持 stdio/SSE 传输
- OAuth2 Token 管理（可选，MVP 先 stdio）

---

## 6. 文档摄入流程

### 6.1 三种知识来源

1. **现有 Markdown 文章**：扫描 `src/content/articles/{en,zh}/`，自动入库
2. **上传文档**（PDF/Word/Excel/PPT/MD）：gRPC 调 docreader 解析 → Markdown
3. **网页抓取**：输入 URL → web_fetch 抓取 → 解析

### 6.2 异步处理流水线

```
上传/提交 → 写入 documents(status=pending) → 返回 doc_id
    ↓ (后台任务)
docreader 解析 → raw_content(status=parsing)
    ↓
chunker 分块 → chunks(status=chunking)
    ↓
embedder 向量化 → 写入 sqlite-vec(status=embedding)
    ↓
FTS5 索引 → status=ready
    ↓ (失败)
status=failed + error_msg
```

前端轮询 `GET /api/kb/{id}/documents` 查看处理状态。

---

## 7. SSE 协议扩展

现有 `type: conv_id|chunk|done` 基础上增加：

```
type: conv_id      {conversation_id}           // 会话 ID
type: think        {content, iteration}        // 思考过程
type: tool_call    {tool, input, iteration}    // 工具调用
type: tool_result  {tool, output, iteration}   // 工具返回
type: chunk        {content}                   // 最终答案流式
type: done         {iterations, tokens_used}   // 完成
type: quota        {remaining, is_guest}       // 配额状态（访客）
type: error        {code, message}             // 错误（含 need_login）
```

---

## 8. 前端改造

### 8.1 FloatingAssistant.tsx 升级

1. 启动时调用 `/api/auth/warmup` 获取登录状态 + 剩余配额
2. SSE 解析新增事件类型：
   - `think`：思考过程（可折叠面板）
   - `tool_call`/`tool_result`：工具调用展示
   - `quota`：剩余次数提示
   - `error` + `need_login`：弹出登录框
3. 访客剩余 ≤ 1 次：UI 显示"剩余 N 次，登录解锁无限对话"
4. 收到 `need_login`：弹出登录模态框

### 8.2 新增登录模态框

- Tab 切换：登录 / 注册
- 登录：email + password
- 注册：email + username + password
- 成功后存 JWT，关闭模态框，重发对话请求

### 8.3 新增知识库管理页（`#/admin`）

- 需登录（admin 角色或 owner）
- 文档上传（拖拽 PDF/Word/MD）
- URL 抓取入库
- Markdown 直接提交
- 文档列表 + 处理状态
- 检索测试（手动查询，看 RAG 结果）

### 8.4 现有文章页增强

- `#/knowledge/<slug>` 增加"向 AI 提问"按钮
- 针对该文章内容走 RAG 检索

---

## 9. 数据流总览

### 9.1 文档摄入流

```
上传文件/URL/Markdown
    ↓
api/knowledge.py 接收 → 写 documents(status=pending)
    ↓
后台任务: docreader gRPC 解析 → chunker 分块 → embedder 向量化
    ↓
sqlite-vec + FTS5 入库 → status=ready
```

### 9.2 对话流（Agent 模式）

```
用户提问
    ↓
认证中间件: JWT? → User / Guest
    ↓
配额检查: Guest? → check_guest_quota(ip) → <5? : 403 need_login
    ↓
api/chat.py: 构建 AgentEngine
    ↓
[可选] 查询重写 (rewrite.yaml)
    ↓
Agent ReAct 循环:
  Think(LLM + function calling) → 流式 think 事件
    ↓
  Act(并行执行工具: knowledge_search/web_search/...)
    ↓
  Observe(停止条件: 自然停/卡死/上限)
    ↓ (满足条件)
Finalize(流式生成最终答案) → chunk 事件
    ↓
done 事件 + 存储 messages + increment guest_quota
```

---

## 10. 分阶段实施路线

| 阶段 | 内容 | 产出 | 优先级 |
|------|------|------|--------|
| **Phase 1** | 认证系统：JWT + 5 角色体系 + 访客配额 + owner 自动初始化 + 前端登录模态框（含面试官入口） | 可登录、访客 5 次限制、面试官邀请码 | P0 |
| **Phase 2** | RAG 管线：chunker + retriever + RRF + embedder；摄入现有 Markdown；RAG 增强对话 | RAG 检索增强对话 | P0 |
| **Phase 3** | ReAct Agent：engine 主循环 + tool registry + 4 工具 + 停止条件 | 完整 Agent 思考链 | P0 |
| **Phase 4** | Prompt 模板搬运 + Token 压缩 + 记忆整合 | 上下文管理 | P1 |
| **Phase 5** | docreader 集成（PDF/Word 上传）+ 异步任务 | 文档上传 | P1 |
| **Phase 6** | Skills 加载 + MCP 客户端 | 可扩展工具 | P2 |
| **Phase 7** | 前端：Agent 思考 UI + 知识库管理页 | 完整 UI | P1 |
| **Phase 8** | Docker Compose 一键部署（app + docreader） | 工程化交付 | P1 |

**每个 Phase 结束都有可演示成果**：
- Phase 1 完成：登录系统 + 访客限制可演示
- Phase 2 完成：RAG 检索增强对话可演示
- Phase 3 完成：Agent 多步推理 + 工具调用可演示

---

## 11. 技术选型确认

| 层 | 选型 | 理由 |
|----|------|------|
| 后端 | FastAPI（现有）| 岗位要求 |
| LLM | DeepSeek（现有，支持 function calling）| 复用 |
| Embedding | OpenAI text-embedding-3-small / Ollama nomic-embed | 免费/本地 |
| 向量库 | SQLite + sqlite-vec + FTS5 | 零依赖，复用 hermes.db |
| Reranker | BGE-reranker-v2-m3（本地）/ Cohere API | 中文友好 |
| 文档解析 | WeKnora docreader（直接复用）| 支持 PDF/Word/Excel/PPT |
| 认证 | PyJWT + bcrypt | 轻量，无外部依赖 |
| 异步任务 | asyncio 后台任务（MVP）/ Celery+Redis（后续）| 先简后繁 |
| 部署 | Docker Compose | 岗位要求 |

---

## 12. 核心算法速查（可直接翻译为 Python）

### RRF 融合

```
rrf_score = vector_weight / (k + vector_rank) + keyword_weight / (k + keyword_rank)
# 默认 k=60, vector_weight=1.0, keyword_weight=1.0
```

### CJK 二元分词

```
# "知识库" → ["知识", "识库"]
# 连续中文字符拆分为重叠二元组，非 CJK 保持完整
```

### Token 压缩

```
# 触发: total_tokens > max_context_tokens * 0.8
# 策略: 从头部删除旧消息，按 tool_call/tool_result 分组整组移除
# 保留: system prompt + 当前轮次
```

### Agent 停止条件

```
# 1. finish_reason == "stop" 且无 tool_calls → 自然停止
# 2. finish_reason == "content_filter" → 内容过滤停止
# 3. 连续 2 次返回相同内容 → 卡死检测，强制终止
# 4. 达到 MaxIterations (默认 20) → 合成兜底答案
```

### 工具输出截断

```
# 默认截断阈值: 16KB
# 防止过大的工具输出污染上下文窗口
```

---

## 13. 风险与对策

| 风险 | 对策 |
|------|------|
| sqlite-vec 维度固定，换 Embedding 模型要重建 | schema 预留 `embedding_model` 字段，支持多版本共存 |
| DeepSeek function calling 稳定性 | think.py 加重试 + JSON 修复兜底 |
| docreader gRPC 增加部署复杂度 | Phase 5 先用 HTTP 简化版，gRPC 作为优化 |
| Agent 循环可能空转耗 Token | MaxIterations=20 + 卡死检测 + 16KB 截断 |
| 访客配额被 IP 欺骗绕过 | MVP 接受此风险；后续加 Redis + 设备指纹 |
| JWT Secret 泄露 | 环境变量注入，不进代码库；定期轮换 |

---

## 14. 跳过清单（MVP 不需要）

| 模块 | 原因 |
|------|------|
| `internal/im/` (8 个 IM 平台) | 企业级功能 |
| `internal/sandbox/` | Docker 沙箱隔离 |
| `internal/tracing/` | Langfuse 链路追踪 |
| `internal/datasource/` | 外部数据源连接器 |
| `cmd/desktop/` | 桌面应用 |
| `cli/` | CLI 工具 |
| `miniprogram/` | 微信小程序 |
| `helm/` | Kubernetes 部署 |
| 多租户 RBAC | 企业级功能（单用户 owner 即可）|

---

*生成时间：2026-06-28*
