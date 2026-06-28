## Hermes AI Chat — 架构设计

### 系统全景

```
┌──────────────── Docker Compose ──────────────────────┐
│                                                       │
│  ┌────────────┐   HTTP    ┌────────────┐            │
│  │  Portfolio │──────────▶│ Hermes API │──▶ Ollama  │
│  │  (Vite)    │◀──────────│ (FastAPI)  │◀── (LLM)   │
│  │  :5173     │   /api/*  │  :8000     │   :11434   │
│  └────────────┘           └─────┬──────┘            │
│                                 │                     │
│                          ┌──────▼──────┐             │
│                          │   SQLite    │             │
│                          │ conversations│            │
│                          └─────────────┘             │
│                                                       │
└──────────────────┬────────────────┬──────────────────┘
                   │                │
              POST ▼           POST ▼
         ┌──────────────┐  ┌──────────────┐
         │ 飞书 Webhook │  │ PushPlus API │
         │  (群/个人)   │  │  (→ 微信)    │
         └──────────────┘  └──────────────┘
```

### 消息流

```
访客发消息 → Hermes API 收到
    ├─ 1. 存入 SQLite（conversation_id, visitor_id, messages[]）
    ├─ 2. 带系统 Prompt 发给 Ollama → 拿到 AI 回复
    ├─ 3. AI 回复返回给访客（流式 SSE）
    └─ 4. 汇总通知（后台定时任务）
              ├─ 飞书：Webhook POST → 飞书群/个人
              └─ 微信：PushPlus API POST → 微信公众号推送
```

### 核心设计决策

1. **AI 先回 + 汇总通知**：访客每条消息都由 AI 即时回复，后台每隔 N 分钟（或积累 M 条新消息）汇总一次通知你。通知内容包含：访客信息、对话摘要、AI 回复摘要、是否需要你介入。

2. **通知策略**：
   - 新对话开始 → 立即通知（有人来了）
   - 对话进行中 → 每 10 分钟或每 5 条新消息汇总一次
   - 访客提到"联系本人"/"人工"等关键词 → 立即通知 + 标记紧急

3. **数据模型**（SQLite）：
   - `conversations`: id, visitor_id, started_at, last_active, summary, is_urgent
   - `messages`: id, conversation_id, role (visitor/ai), content, created_at

4. **前端 Chat Widget**：右下角浮动按钮，点击展开聊天窗口，支持 SSE 流式显示 AI 回复。

### 技术栈

| 层 | 选型 |
|---|---|
| 前端 Widget | React + Tailwind（与现有项目一致） |
| 后端 | FastAPI + SQLite + httpx |
| LLM | Ollama（qwen2.5 或 llama3） |
| 飞书通知 | 飞书群机器人 Webhook |
| 微信通知 | PushPlus（pushplus.plus）— 一个 token 搞定 |
| 部署 | Docker Compose（3 个服务） |

### 文件结构

```
portfolio-react/
├── src/
│   ├── components/
│   │   ├── ChatWidget.tsx      # 前端聊天组件
│   │   └── ...（现有组件）
│   └── ...
├── hermes/                      # 后端服务（新增目录）
│   ├── main.py                 # FastAPI 入口
│   ├── llm.py                  # Ollama 调用封装
│   ├── notify.py               # 飞书+微信通知
│   ├── models.py               # SQLite 数据模型
│   ├── config.py               # 环境变量配置
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── .env.example                # Webhook URL、PushPlus Token 等
```

### 你需要准备的

- [ ] 飞书群机器人的 Webhook URL
- [ ] PushPlus 的 Token（pushplus.plus 注册获取，用于微信推送）
- [ ] Ollama 想用哪个模型？（推荐 qwen2.5:7b 或 llama3:8b）
