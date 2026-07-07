# Hermes RAG + Agent 重构 — 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将现有 Hermes（DeepSeek 透传）升级为带登录认证 + 访客配额 + 面试官角色的 RAG + ReAct Agent 后端，复用作品集前端。

**Architecture:** FastAPI 分层架构（API → 认证 → 业务 → Provider 抽象 → 基础设施）。SQLite + sqlite-vec + FTS5 作为存储。ReAct 引擎复用 WeKnora Go 设计模式，Python 重写。docreader/mcp-server/prompt YAML 直接从 WeKnora 复制。

**Tech Stack:** FastAPI, PyJWT, bcrypt, sqlite-vec, tiktoken, httpx, DeepSeek API, React + TypeScript

**设计文档:** `docs/plans/2026-06-28-rag-agent-refactoring.md`

**参考项目:** `E:\proCode\6Y\26-WeKnora\WeKnora-main\`

---

## 项目约定

- **后端工作目录**: `portfolio-react/hermes/`
- **前端工作目录**: `portfolio-react/`
- **测试框架**: 后端 pytest，前端不强制 TDD（UI 改动手动验证）
- **Commit 规范**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- **每个 Task 完成后 commit 一次**
- **Python 异步**: 统一 `async/await`，不用同步阻塞
- **数据库**: 复用 `hermes.db`，schema 迁移用 `init_db()` 幂等创建

---

## Phase 1: 认证系统 + 角色体系 + 访客配额

**目标**: JWT 认证、5 角色体系、访客 5 次/天配额、owner 自动初始化、面试官邀请码、前端登录模态框

### Task 1.1: 扩展配置和依赖

**Files:**
- Modify: `portfolio-react/hermes/requirements.txt`
- Modify: `portfolio-react/hermes/config.py`
- Modify: `portfolio-react/.env`

**Step 1: 添加依赖**

在 `requirements.txt` 追加：
```
pyjwt==2.9.0
bcrypt==4.2.0
python-multipart==0.0.12
```

**Step 2: 安装依赖**

Run: `pip install -r portfolio-react/hermes/requirements.txt`
Expected: 成功安装

**Step 3: 扩展 config.py**

在 `config.py` 末尾追加认证相关配置：
```python
# ── Authentication ──
import secrets

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Owner account (auto-created on first startup)
OWNER_EMAIL = os.getenv("OWNER_EMAIL", "lmq0205a@163.com")
OWNER_INITIAL_PASSWORD = os.getenv("OWNER_INITIAL_PASSWORD", "changeme123")

# Guest quota
GUEST_DAILY_LIMIT = int(os.getenv("GUEST_DAILY_LIMIT", "5"))
```

**Step 4: 扩展 .env**

在 `.env` 追加：
```
# Auth
JWT_SECRET_KEY=
OWNER_EMAIL=lmq0205a@163.com
OWNER_INITIAL_PASSWORD=changeme123
GUEST_DAILY_LIMIT=5
```

**Step 5: Commit**

```bash
git add portfolio-react/hermes/requirements.txt portfolio-react/hermes/config.py portfolio-react/.env
git commit -m "feat(auth): add JWT and bcrypt dependencies + config"
```

---

### Task 1.2: 扩展数据库 schema（users / guest_quotas / refresh_tokens / interviewer_invites）

**Files:**
- Modify: `portfolio-react/hermes/models.py`

**Step 1: 在 init_db() 中追加认证表**

在 `init_db()` 的 `executescript` 中，现有表之后追加：

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    is_active INTEGER DEFAULT 1,
    expires_at TEXT,
    created_by TEXT REFERENCES users(id),
    last_login_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 访客配额表
CREATE TABLE IF NOT EXISTS guest_quotas (
    id TEXT PRIMARY KEY,
    ip_hash TEXT NOT NULL,
    query_date TEXT NOT NULL,
    query_count INTEGER DEFAULT 0,
    last_query_at TEXT,
    UNIQUE(ip_hash, query_date)
);

-- 刷新令牌表
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 面试官邀请码
CREATE TABLE IF NOT EXISTS interviewer_invites (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id),
    company TEXT,
    position TEXT,
    interview_date TEXT,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    expires_at TEXT NOT NULL,
    linked_user_id TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_guest_quotas_lookup ON guest_quotas(ip_hash, query_date);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON interviewer_invites(code);
```

**Step 2: 运行验证**

Run:
```powershell
cd portfolio-react/hermes; python -c "from models import init_db; init_db(); print('OK')"
```
Expected: `OK`

**Step 3: Commit**

```bash
git add portfolio-react/hermes/models.py
git commit -m "feat(auth): add users/guest_quotas/refresh_tokens/interviewer_invites tables"
```

---

### Task 1.3: 密码哈希工具

**Files:**
- Create: `portfolio-react/hermes/core/__init__.py`
- Create: `portfolio-react/hermes/core/auth/__init__.py`
- Create: `portfolio-react/hermes/core/auth/password.py`
- Create: `portfolio-react/hermes/tests/__init__.py`
- Create: `portfolio-react/hermes/tests/test_password.py`

**Step 1: 写失败测试**

```python
# tests/test_password.py
from core.auth.password import hash_password, verify_password

def test_hash_and_verify():
    pw = "MyPass123"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True

def test_verify_wrong_password():
    hashed = hash_password("correct")
    assert verify_password("wrong", hashed) is False

def test_hash_is_unique():
    h1 = hash_password("same")
    h2 = hash_password("same")
    assert h1 != h2  # bcrypt salt
```

**Step 2: 运行验证失败**

Run: `cd portfolio-react/hermes; python -m pytest tests/test_password.py -v`
Expected: FAIL（模块不存在）

**Step 3: 实现**

```python
# core/auth/password.py
import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
```

**Step 4: 运行验证通过**

Run: `cd portfolio-react/hermes; python -m pytest tests/test_password.py -v`
Expected: 3 passed

**Step 5: Commit**

```bash
git add portfolio-react/hermes/core/ portfolio-react/hermes/tests/
git commit -m "feat(auth): add bcrypt password hashing"
```

---

### Task 1.4: JWT 签发与验证

**Files:**
- Create: `portfolio-react/hermes/core/auth/jwt_handler.py`
- Create: `portfolio-react/hermes/tests/test_jwt.py`

**Step 1: 写失败测试**

```python
# tests/test_jwt.py
from core.auth.jwt_handler import create_access_token, create_refresh_token, decode_token, SECRET_KEY, ALGORITHM

def test_access_token_contains_user_id():
    token = create_access_token("user-123", "owner")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "owner"
    assert payload["type"] == "access"

def test_refresh_token_has_jti():
    token = create_refresh_token("user-123")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["type"] == "refresh"
    assert "jti" in payload

def test_invalid_token_returns_none():
    result = decode_token("invalid.token.here")
    assert result is None
```

**Step 2: 运行验证失败**

Run: `cd portfolio-react/hermes; python -m pytest tests/test_jwt.py -v`
Expected: FAIL

**Step 3: 实现**

```python
# core/auth/jwt_handler.py
import jwt
import uuid
from datetime import datetime, timedelta, timezone
from config import JWT_SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS

def create_access_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
```

**Step 4: 运行验证通过**

Run: `cd portfolio-react/hermes; python -m pytest tests/test_jwt.py -v`
Expected: 3 passed

**Step 5: Commit**

```bash
git add portfolio-react/hermes/core/auth/jwt_handler.py portfolio-react/hermes/tests/test_jwt.py
git commit -m "feat(auth): add JWT token creation and verification"
```

---

### Task 1.5: 用户数据访问层

**Files:**
- Create: `portfolio-react/hermes/core/auth/user_repo.py`
- Create: `portfolio-react/hermes/tests/test_user_repo.py`

**Step 1: 写失败测试**

```python
# tests/test_user_repo.py
import pytest
from models import init_db
from core.auth.password import hash_password
from core.auth.user_repo import create_user, get_user_by_email, get_user_by_id, update_last_login

@pytest.fixture(autouse=True)
def db():
    init_db()

def test_create_and_get_user():
    uid = create_user("test@example.com", "tester", hash_password("pass123"), role="user")
    user = get_user_by_email("test@example.com")
    assert user is not None
    assert user["id"] == uid
    assert user["email"] == "test@example.com"
    assert user["role"] == "user"

def test_get_nonexistent_user():
    assert get_user_by_email("nobody@example.com") is None
    assert get_user_by_id("nonexistent") is None

def test_update_last_login():
    uid = create_user("login@example.com", "logger", hash_password("pass"), role="user")
    update_last_login(uid)
    user = get_user_by_id(uid)
    assert user["last_login_at"] is not None
```

**Step 2: 运行验证失败**

Run: `cd portfolio-react/hermes; python -m pytest tests/test_user_repo.py -v`
Expected: FAIL

**Step 3: 实现**

```python
# core/auth/user_repo.py
import uuid
from datetime import datetime, timezone
from models import get_db

def create_user(email: str, username: str, password_hash: str, role: str = "user",
                created_by: str = None, expires_at: str = None) -> str:
    uid = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            """INSERT INTO users (id, email, username, password_hash, role, created_by, expires_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (uid, email, username, password_hash, role, created_by, expires_at)
        )
    return uid

def get_user_by_email(email: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None

def get_user_by_id(uid: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
        return dict(row) if row else None

def update_last_login(uid: str):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute("UPDATE users SET last_login_at = ? WHERE id = ?", (now, uid))
```

**Step 4: 运行验证通过**

Run: `cd portfolio-react/hermes; python -m pytest tests/test_user_repo.py -v`
Expected: 3 passed

**Step 5: Commit**

```bash
git add portfolio-react/hermes/core/auth/user_repo.py portfolio-react/hermes/tests/test_user_repo.py
git commit -m "feat(auth): add user repository CRUD"
```

---

### Task 1.6: 访客配额管理

**Files:**
- Create: `portfolio-react/hermes/core/auth/guest_quota.py`
- Create: `portfolio-react/hermes/tests/test_guest_quota.py`

**Step 1: 写失败测试**

```python
# tests/test_guest_quota.py
import pytest
from models import init_db
from core.auth.guest_quota import check_guest_quota, increment_guest_quota, GUEST_DAILY_LIMIT

@pytest.fixture(autouse=True)
def db():
    init_db()

def test_guest_starts_with_full_quota():
    allowed, remaining = check_guest_quota("192.168.1.1")
    assert allowed is True
    assert remaining == GUEST_DAILY_LIMIT

def test_quota_decrements_after_use():
    increment_guest_quota("10.0.0.1")
    allowed, remaining = check_guest_quota("10.0.0.1")
    assert remaining == GUEST_DAILY_LIMIT - 1

def test_quota_exhausted():
    for _ in range(GUEST_DAILY_LIMIT):
        increment_guest_quota("10.0.0.2")
    allowed, remaining = check_guest_quota("10.0.0.2")
    assert allowed is False
    assert remaining == 0

def test_different_ips_have_separate_quotas():
    increment_guest_quota("1.1.1.1")
    increment_guest_quota("2.2.2.2")
    _, r1 = check_guest_quota("1.1.1.1")
    _, r2 = check_guest_quota("3.3.3.3")
    assert r1 == GUEST_DAILY_LIMIT - 1
    assert r2 == GUEST_DAILY_LIMIT
```

**Step 2: 运行验证失败**

Run: `cd portfolio-react/hermes; python -m pytest tests/test_guest_quota.py -v`
Expected: FAIL

**Step 3: 实现**

```python
# core/auth/guest_quota.py
import hashlib
import uuid
from datetime import datetime, timezone
from models import get_db
from config import GUEST_DAILY_LIMIT

def _hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()

def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def check_guest_quota(ip: str) -> tuple[bool, int]:
    """返回 (允许, 剩余次数)。"""
    ip_hash = _hash_ip(ip)
    today = _today()
    with get_db() as conn:
        row = conn.execute(
            "SELECT query_count FROM guest_quotas WHERE ip_hash = ? AND query_date = ?",
            (ip_hash, today)
        ).fetchone()
    used = row["query_count"] if row else 0
    remaining = GUEST_DAILY_LIMIT - used
    return (remaining > 0), remaining

def increment_guest_quota(ip: str):
    """对话成功后调用，计数 +1。"""
    ip_hash = _hash_ip(ip)
    today = _today()
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            """INSERT INTO guest_quotas (id, ip_hash, query_date, query_count, last_query_at)
               VALUES (?, ?, ?, 1, ?)
               ON CONFLICT(ip_hash, query_date)
               DO UPDATE SET query_count = query_count + 1, last_query_at = ?""",
            (str(uuid.uuid4()), ip_hash, today, now, now)
        )
```

**Step 4: 运行验证通过**

Run: `cd portfolio-react/hermes; python -m pytest tests/test_guest_quota.py -v`
Expected: 4 passed

**Step 5: Commit**

```bash
git add portfolio-react/hermes/core/auth/guest_quota.py portfolio-react/hermes/tests/test_guest_quota.py
git commit -m "feat(auth): add guest daily quota (5/IP/day)"
```

---

### Task 1.7: FastAPI 依赖注入（current_user_or_guest）

**Files:**
- Create: `portfolio-react/hermes/core/auth/deps.py`

**Step 1: 实现 UserContext 和依赖**

```python
# core/auth/deps.py
from dataclasses import dataclass
from fastapi import Request, Header
from core.auth.jwt_handler import decode_token
from core.auth.user_repo import get_user_by_id
from core.auth.guest_quota import check_guest_quota
from config import GUEST_DAILY_LIMIT

@dataclass
class UserContext:
    is_guest: bool
    user_id: str | None = None
    role: str = "guest"
    email: str | None = None
    ip: str | None = None
    quota_remaining: int | None = None

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

async def get_current_user_or_guest(
    request: Request,
    authorization: str | None = Header(None),
) -> UserContext:
    """统一入口：有 Token 返回 User，无 Token 返回 Guest。"""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        payload = decode_token(token)
        if payload and payload.get("type") == "access":
            user = get_user_by_id(payload["sub"])
            if user and user["is_active"]:
                return UserContext(
                    is_guest=False,
                    user_id=user["id"],
                    role=user["role"],
                    email=user["email"],
                )
    # Guest
    ip = get_client_ip(request)
    allowed, remaining = check_guest_quota(ip)
    return UserContext(is_guest=True, role="guest", ip=ip, quota_remaining=remaining)
```

**Step 2: 验证导入**

Run: `cd portfolio-react/hermes; python -c "from core.auth.deps import UserContext, get_current_user_or_guest; print('OK')"`
Expected: `OK`

**Step 3: Commit**

```bash
git add portfolio-react/hermes/core/auth/deps.py
git commit -m "feat(auth): add FastAPI dependency injection for user/guest context"
```

---

### Task 1.8: 认证 API 路由（注册/登录/刷新/me/warmup）

**Files:**
- Create: `portfolio-react/hermes/api/__init__.py`
- Create: `portfolio-react/hermes/api/auth.py`
- Create: `portfolio-react/hermes/tests/test_auth_api.py`

**Step 1: 写失败测试**

```python
# tests/test_auth_api.py
import pytest
from fastapi.testclient import TestClient
from main import app
from models import init_db

@pytest.fixture(autouse=True)
def db():
    init_db()

@pytest.fixture
def client():
    return TestClient(app)

def test_register_and_login(client):
    # Register
    resp = client.post("/api/auth/register", json={
        "email": "test@example.com", "username": "tester", "password": "Pass1234"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"

    # Login
    resp = client.post("/api/auth/login", json={
        "email": "test@example.com", "password": "Pass1234"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "x@example.com", "username": "x", "password": "Right123"
    })
    resp = client.post("/api/auth/login", json={
        "email": "x@example.com", "password": "Wrong123"
    })
    assert resp.status_code == 401

def test_me_with_token(client):
    resp = client.post("/api/auth/register", json={
        "email": "me@example.com", "username": "me", "password": "Pass1234"
    })
    token = resp.json()["access_token"]
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"

def test_me_without_token_returns_guest(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_guest"] is True

def test_refresh_token(client):
    resp = client.post("/api/auth/register", json={
        "email": "r@example.com", "username": "r", "password": "Pass1234"
    })
    refresh = resp.json()["refresh_token"]
    resp = client.post("/api/auth/refresh", json={"refresh_token": refresh})
    assert resp.status_code == 200
    assert "access_token" in resp.json()
```

**Step 2: 运行验证失败**

Run: `cd portfolio-react/hermes; python -m pytest tests/test_auth_api.py -v`
Expected: FAIL

**Step 3: 实现认证路由**

```python
# api/auth.py
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr

from core.auth.password import hash_password, verify_password
from core.auth.jwt_handler import create_access_token, create_refresh_token, decode_token
from core.auth.user_repo import create_user, get_user_by_email, get_user_by_id, update_last_login
from core.auth.deps import UserContext, get_current_user_or_guest
from models import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/register")
async def register(req: RegisterRequest):
    existing = get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    uid = create_user(req.email, req.username, hash_password(req.password), role="user")
    user = get_user_by_id(uid)
    return _build_auth_response(user)

@router.post("/login")
async def login(req: LoginRequest):
    user = get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Account disabled")
    update_last_login(user["id"])
    return _build_auth_response(user)

@router.post("/refresh")
async def refresh_token(req: RefreshRequest):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = get_user_by_id(payload["sub"])
    if not user or not user["is_active"]:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    # 检查是否已撤销
    token_hash = _hash_token(req.refresh_token)
    with get_db() as conn:
        row = conn.execute(
            "SELECT revoked FROM refresh_tokens WHERE token_hash = ?", (token_hash,)
        ).fetchone()
        if row and row["revoked"]:
            raise HTTPException(status_code=401, detail="Token revoked")
    access = create_access_token(user["id"], user["role"])
    return {"access_token": access, "token_type": "bearer"}

@router.get("/me")
async def me(ctx: UserContext = Depends(get_current_user_or_guest)):
    if ctx.is_guest:
        return {"is_guest": True, "role": "guest", "quota_remaining": ctx.quota_remaining}
    user = get_user_by_id(ctx.user_id)
    return {
        "is_guest": False,
        "user_id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "role": user["role"],
    }

@router.get("/warmup")
async def auth_warmup(ctx: UserContext = Depends(get_current_user_or_guest)):
    """前端探测登录状态 + 配额。"""
    if ctx.is_guest:
        return {"is_guest": True, "role": "guest", "quota_remaining": ctx.quota_remaining}
    return {"is_guest": False, "role": ctx.role, "email": ctx.email}

def _build_auth_response(user: dict) -> dict:
    access = create_access_token(user["id"], user["role"])
    refresh = create_refresh_token(user["id"])
    # 存储 refresh token hash
    token_hash = _hash_token(refresh)
    with get_db() as conn:
        conn.execute(
            """INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
               VALUES (?, ?, ?, ?)""",
            (str(uuid.uuid4()), user["id"], token_hash,
             datetime.now(timezone.utc).isoformat())
        )
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "role": user["role"],
        },
    }

def _hash_token(token: str) -> str:
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()
```

**Step 4: 在 main.py 注册路由**

在 `main.py` 的 `app` 创建后、路由定义前添加：
```python
from api.auth import router as auth_router
app.include_router(auth_router)
```

**Step 5: 运行验证通过**

Run: `cd portfolio-react/hermes; python -m pytest tests/test_auth_api.py -v`
Expected: 5 passed

**Step 6: Commit**

```bash
git add portfolio-react/hermes/api/ portfolio-react/hermes/tests/test_auth_api.py portfolio-react/hermes/main.py
git commit -m "feat(auth): add register/login/refresh/me/warmup API endpoints"
```

---

### Task 1.9: Owner 账号自动初始化

**Files:**
- Modify: `portfolio-react/hermes/main.py` (lifespan)
- Create: `portfolio-react/hermes/core/auth/init_owner.py`

**Step 1: 实现 owner 初始化**

```python
# core/auth/init_owner.py
from config import OWNER_EMAIL, OWNER_INITIAL_PASSWORD
from core.auth.password import hash_password
from core.auth.user_repo import get_user_by_email, create_user

def ensure_owner_account():
    """首次启动时自动创建 owner 账号。"""
    existing = get_user_by_email(OWNER_EMAIL)
    if existing:
        return False  # 已存在
    create_user(
        email=OWNER_EMAIL,
        username="owner",
        password_hash=hash_password(OWNER_INITIAL_PASSWORD),
        role="owner",
    )
    print(f"[hermes] Owner account created: {OWNER_EMAIL}")
    print(f"[hermes] Initial password: {OWNER_INITIAL_PASSWORD} — change it after first login!")
    return True
```

**Step 2: 在 lifespan 中调用**

在 `main.py` 的 `lifespan` 函数中，`init_db()` 之后添加：
```python
from core.auth.init_owner import ensure_owner_account
ensure_owner_account()
```

**Step 3: 验证**

Run:
```powershell
cd portfolio-react/hermes; python -c "from models import init_db; init_db(); from core.auth.init_owner import ensure_owner_account; print('Created:', ensure_owner_account())"
```
Expected: `Created: True`

**Step 4: Commit**

```bash
git add portfolio-react/hermes/core/auth/init_owner.py portfolio-react/hermes/main.py
git commit -m "feat(auth): auto-create owner account on first startup"
```

---

### Task 1.10: 面试官邀请码 API

**Files:**
- Create: `portfolio-react/hermes/core/auth/invite_repo.py`
- Create: `portfolio-react/hermes/api/admin.py`
- Modify: `portfolio-react/hermes/main.py`
- Create: `portfolio-react/hermes/tests/test_invite.py`

**Step 1: 写失败测试**

```python
# tests/test_invite.py
import pytest
from fastapi.testclient import TestClient
from main import app
from models import init_db
from core.auth.init_owner import ensure_owner_account
from core.auth.password import hash_password
from core.auth.user_repo import create_user, get_user_by_email

@pytest.fixture(autouse=True)
def db():
    init_db()

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def owner_token(client):
    # 直接创建 owner 账号并登录
    create_user("owner@test.com", "owner", hash_password("Pass123"), role="owner")
    resp = client.post("/api/auth/login", json={"email": "owner@test.com", "password": "Pass123"})
    return resp.json()["access_token"]

def test_create_invite(client, owner_token):
    resp = client.post("/api/admin/invites", json={
        "company": "Acme Corp", "position": "Backend Engineer", "interview_date": "2026-07-01"
    }, headers={"Authorization": f"Bearer {owner_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "code" in data
    assert len(data["code"]) >= 6

def test_invite_requires_owner(client):
    # 普通用户不能创建邀请码
    create_user("user@test.com", "user", hash_password("Pass123"), role="user")
    resp = client.post("/api/auth/login", json={"email": "user@test.com", "password": "Pass123"})
    token = resp.json()["access_token"]
    resp = client.post("/api/admin/invites", json={"company": "X"}, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403

def test_redeem_invite(client, owner_token):
    # 创建邀请码
    resp = client.post("/api/admin/invites", json={"company": "TestCo"}, headers={"Authorization": f"Bearer {owner_token}"})
    code = resp.json()["code"]
    # 凭码登录
    resp = client.post("/api/auth/interviewer/redeem", json={"code": code})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "interviewer"

def test_redeem_invalid_code(client):
    resp = client.post("/api/auth/interviewer/redeem", json={"code": "INVALID"})
    assert resp.status_code == 404
```

**Step 2: 运行验证失败**

Run: `cd portfolio-react/hermes; python -m pytest tests/test_invite.py -v`
Expected: FAIL

**Step 3: 实现 invite_repo.py**

```python
# core/auth/invite_repo.py
import uuid
import secrets
from datetime import datetime, timedelta, timezone
from models import get_db

def create_invite(created_by: str, company: str = None, position: str = None,
                  interview_date: str = None, max_uses: int = 1,
                  expire_days: int = 3) -> dict:
    code = secrets.token_urlsafe(6).upper()[:8]
    expires_at = (datetime.now(timezone.utc) + timedelta(days=expire_days)).isoformat()
    invite_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            """INSERT INTO interviewer_invites
               (id, code, created_by, company, position, interview_date, max_uses, used_count, expires_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)""",
            (invite_id, code, created_by, company, position, interview_date, max_uses, expires_at)
        )
    return {"id": invite_id, "code": code, "expires_at": expires_at}

def get_invite_by_code(code: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM interviewer_invites WHERE code = ?", (code,)).fetchone()
        return dict(row) if row else None

def increment_invite_usage(invite_id: str, linked_user_id: str):
    with get_db() as conn:
        conn.execute(
            "UPDATE interviewer_invites SET used_count = used_count + 1, linked_user_id = ? WHERE id = ?",
            (linked_user_id, invite_id)
        )

def list_invites(created_by: str = None) -> list[dict]:
    with get_db() as conn:
        if created_by:
            rows = conn.execute(
                "SELECT * FROM interviewer_invites WHERE created_by = ? ORDER BY created_at DESC",
                (created_by,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM interviewer_invites ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]

def is_invite_valid(invite: dict) -> bool:
    if invite["used_count"] >= invite["max_uses"]:
        return False
    expires = datetime.fromisoformat(invite["expires_at"])
    if datetime.now(timezone.utc) > expires:
        return False
    return True
```

**Step 4: 实现 admin.py 路由**

```python
# api/admin.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth.deps import UserContext, get_current_user_or_guest
from core.auth.invite_repo import create_invite, list_invites, get_invite_by_code, increment_invite_usage, is_invite_valid
from core.auth.user_repo import create_user, get_user_by_id
from core.auth.password import hash_password
from core.auth.jwt_handler import create_access_token, create_refresh_token
import uuid, secrets

router = APIRouter(prefix="/api/admin", tags=["admin"])

class CreateInviteRequest(BaseModel):
    company: str | None = None
    position: str | None = None
    interview_date: str | None = None
    max_uses: int = 1
    expire_days: int = 3

def require_owner(ctx: UserContext = Depends(get_current_user_or_guest)):
    if ctx.is_guest or ctx.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return ctx

@router.post("/invites")
async def create_interviewer_invite(req: CreateInviteRequest, ctx: UserContext = Depends(require_owner)):
    invite = create_invite(
        created_by=ctx.user_id,
        company=req.company, position=req.position,
        interview_date=req.interview_date, max_uses=req.max_uses,
        expire_days=req.expire_days
    )
    return invite

@router.get("/invites")
async def list_all_invites(ctx: UserContext = Depends(require_owner)):
    return list_invites(created_by=ctx.user_id)
```

**Step 5: 实现邀请码兑换路由（在 auth.py 中追加）**

```python
# 在 api/auth.py 追加
from core.auth.invite_repo import get_invite_by_code, increment_invite_usage, is_invite_valid
import secrets

class RedeemInviteRequest(BaseModel):
    code: str

@router.post("/interviewer/redeem")
async def redeem_interviewer_invite(req: RedeemInviteRequest):
    invite = get_invite_by_code(req.code.upper().strip())
    if not invite or not is_invite_valid(invite):
        raise HTTPException(status_code=404, detail="Invalid or expired invite code")
    # 创建 interviewer 账号
    random_email = f"interviewer-{secrets.token_hex(4)}@hermes.local"
    uid = create_user(
        email=random_email, username=f"Interviewer-{invite.get('company', 'Guest')[:8]}",
        password_hash=hash_password(secrets.token_urlsafe(32)),  # 随机密码，不使用密码登录
        role="interviewer", created_by=invite["created_by"],
    )
    increment_invite_usage(invite["id"], uid)
    user = get_user_by_id(uid)
    return _build_auth_response(user)
```

**Step 6: 在 main.py 注册 admin 路由**

```python
from api.admin import router as admin_router
app.include_router(admin_router)
```

**Step 7: 运行验证通过**

Run: `cd portfolio-react/hermes; python -m pytest tests/test_invite.py -v`
Expected: 4 passed

**Step 8: Commit**

```bash
git add portfolio-react/hermes/core/auth/invite_repo.py portfolio-react/hermes/api/admin.py portfolio-react/hermes/api/auth.py portfolio-react/hermes/main.py portfolio-react/hermes/tests/test_invite.py
git commit -m "feat(auth): add interviewer invite code system (create/redeem/list)"
```

---

### Task 1.11: 对话 API 集成配额检查

**Files:**
- Modify: `portfolio-react/hermes/main.py` (chat_stream endpoint)

**Step 1: 修改 chat_stream 加入配额检查**

在 `main.py` 的 `chat_stream` 函数中，获取 `conv_id` 之前插入配额检查：

```python
from core.auth.deps import get_current_user_or_guest, UserContext
from core.auth.guest_quota import increment_guest_quota
from fastapi import Depends

@app.post("/api/chat/stream")
async def chat_stream(
    req: ChatRequest,
    background_tasks: BackgroundTasks,
    ctx: UserContext = Depends(get_current_user_or_guest),
):
    # 访客配额检查
    if ctx.is_guest:
        if ctx.quota_remaining <= 0:
            raise HTTPException(
                status_code=403,
                detail={"need_login": True, "message": "访客每日限 5 次对话，登录后无限制"}
            )
    # ... 原有逻辑 ...
```

在 SSE generator 的 `done` 事件之后，如果是访客，调用 `increment_guest_quota(ctx.ip)`：

```python
        # 在 done 事件后
        if ctx.is_guest and ctx.ip:
            increment_guest_quota(ctx.ip)
            remaining = ctx.quota_remaining - 1
            yield f"data: {json.dumps({'type': 'quota', 'remaining': remaining, 'is_guest': True})}\n\n"
```

**Step 2: 验证手动**

Run: 启动后端，用 curl 测试无 token 访问
```powershell
curl -X POST http://localhost:8000/api/chat/stream -H "Content-Type: application/json" -d '{"message":"hello"}'
```
Expected: 正常返回 SSE 流（消耗 1 次配额）

**Step 3: Commit**

```bash
git add portfolio-react/hermes/main.py
git commit -m "feat(auth): integrate guest quota check into chat stream endpoint"
```

---

### Task 1.12: 前端登录模态框

**Files:**
- Create: `portfolio-react/src/components/AuthModal.tsx`
- Modify: `portfolio-react/src/components/FloatingAssistant.tsx`
- Modify: `portfolio-react/src/i18n.tsx` (追加登录相关文案)

**Step 1: 实现 AuthModal 组件**

```tsx
// src/components/AuthModal.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useI18n } from '../i18n';

const API_BASE = import.meta.env.VITE_API_BASE || '';

type Tab = 'login' | 'interviewer' | 'register';

export const AuthModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: (token: string, user: any) => void }) => {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const endpoint = tab === 'register' ? '/api/auth/register'
        : tab === 'interviewer' ? '/api/auth/interviewer/redeem'
        : '/api/auth/login';
      const body = tab === 'interviewer'
        ? { code: inviteCode }
        : tab === 'register'
        ? { email, username, password }
        : { email, password };

      const resp = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || 'Failed');

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      onSuccess(data.access_token, data.user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-bg-primary rounded-xl shadow-2xl border border-border-subtle p-6 w-full max-w-md"
          initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{t('auth.title')}</h2>
            <button onClick={onClose}><X size={18} /></button>
          </div>
          <div className="flex gap-2 mb-4">
            {(['login', 'interviewer', 'register'] as Tab[]).map(tb => (
              <button key={tb} onClick={() => setTab(tb)}
                className={`px-3 py-1.5 rounded-lg text-sm ${tab === tb ? 'bg-accent text-white' : 'bg-bg-section-alt'}`}>
                {t(`auth.${tb}`)}
              </button>
            ))}
          </div>
          {tab === 'interviewer' ? (
            <input value={inviteCode} onChange={e => setInviteCode(e.target.value)}
              placeholder={t('auth.invitePlaceholder')} className="w-full p-2.5 rounded-lg border border-border-subtle bg-transparent mb-3" />
          ) : (
            <>
              {tab === 'register' && (
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
                  className="w-full p-2.5 rounded-lg border border-border-subtle bg-transparent mb-3" />
              )}
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
                className="w-full p-2.5 rounded-lg border border-border-subtle bg-transparent mb-3" />
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password"
                className="w-full p-2.5 rounded-lg border border-border-subtle bg-transparent mb-3" />
            </>
          )}
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent text-white font-medium disabled:opacity-50">
            {loading ? '...' : t('auth.submit')}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
```

**Step 2: 在 i18n.tsx 追加认证文案**

在 i18n 的翻译对象中追加：
```typescript
auth: {
  title: lang === 'zh' ? '登录 / 体验' : 'Sign In',
  login: lang === 'zh' ? '登录' : 'Login',
  register: lang === 'zh' ? '注册' : 'Register',
  interviewer: lang === 'zh' ? '面试官入口' : 'Interviewer',
  invitePlaceholder: lang === 'zh' ? '输入邀请码' : 'Enter invite code',
  submit: lang === 'zh' ? '确认' : 'Submit',
  quotaWarning: lang === 'zh' ? '剩余 {n} 次，登录解锁无限对话' : '{n} left, sign in for unlimited',
  needLogin: lang === 'zh' ? '需要登录才能继续' : 'Please sign in to continue',
},
```

**Step 3: 修改 FloatingAssistant.tsx 集成登录**

在 `FloatingAssistant.tsx` 中：
1. 导入 `AuthModal`
2. 添加状态：`const [showAuth, setShowAuth] = useState(false)` 和 `const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null)`
3. 组件挂载时调用 `/api/auth/warmup` 获取配额状态
4. 在 SSE 解析中处理 `quota` 和 `error` 事件
5. 收到 `need_login` 时 `setShowAuth(true)`
6. 发送请求时带上 `Authorization: Bearer <token>`（如已登录）
7. 渲染 `<AuthModal>` 当 `showAuth` 为 true
8. 配额 ≤ 1 时在输入框上方显示提示

**Step 4: 手动验证**

Run: 启动前后端，打开浏览器
- 访客对话 5 次后应弹出登录框
- 登录后可无限对话
- 面试官 Tab 输入邀请码可登录

**Step 5: Commit**

```bash
git add portfolio-react/src/components/AuthModal.tsx portfolio-react/src/components/FloatingAssistant.tsx portfolio-react/src/i18n.tsx
git commit -m "feat(auth): add login modal with 3 tabs (login/interviewer/register)"
```

---

### Task 1.13: 全量测试 + Phase 1 收尾

**Step 1: 运行全部测试**

Run: `cd portfolio-react/hermes; python -m pytest tests/ -v`
Expected: 全部 passed

**Step 2: 端到端验证**

启动后端 + 前端，验证：
1. 访客对话 5 次后弹出登录框
2. 注册 → 登录 → 无限对话
3. owner 账号登录 → 创建邀请码 → 面试官凭码登录
4. 面试官登录后可无限对话
5. `/api/auth/me` 返回正确角色

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(auth): Phase 1 complete — auth system with roles, quota, interviewer invites"
```

---

## Phase 2: RAG 管线

**目标**: 文档分块、混合检索（向量+FTS5）、RRF 融合、embedding、摄入现有 Markdown、RAG 增强对话

### Task 2.1: 安装 sqlite-vec + tiktoken 依赖
### Task 2.2: 扩展数据库 schema（knowledge_bases / documents / chunks / chunks_fts）
### Task 2.3: Embedder Provider 抽象 + OpenAI 实现
### Task 2.4: 分块器（三级策略链：Auto → Heading → Heuristic → Legacy）
### Task 2.5: 混合检索器（sqlite-vec + FTS5 + CJK 二元分词）
### Task 2.6: RRF 融合算法
### Task 2.7: Reranker 接口 + BGE/Cohere 实现
### Task 2.8: 知识库 API（CRUD + 文档上传 + 搜索测试）
### Task 2.9: 摄入现有 Markdown 文章脚本
### Task 2.10: RAG 增强对话集成到 chat_stream

> Phase 2 详细任务在 Phase 1 完成后展开，遵循同样的 TDD 结构。

---

## Phase 3: ReAct Agent 引擎

**目标**: 完整 ReAct 循环、Tool 系统、4 内置工具、停止条件、Token 压缩、记忆整合

### Task 3.1: Tool 基类 + ToolRegistry
### Task 3.2: LLM function calling 集成（think.py）
### Task 3.3: 并行工具执行（act.py + asyncio.gather）
### Task 3.4: 停止条件判断（observe.py）
### Task 3.5: 最终答案生成（finalize.py）
### Task 3.6: AgentEngine 主循环（engine.py）
### Task 3.7: 内置工具 — knowledge_search
### Task 3.8: ~~内置工具 — web_search + web_fetch~~（已移除，所有问答仅基于知识库）
### Task 3.9: 内置工具 — todo_write
### Task 3.10: Token 压缩（compress.py, 0.8 阈值）
### Task 3.11: 记忆整合（consolidator.py, 0.5 阈值）
### Task 3.12: SSE 协议扩展（think/tool_call/tool_result 事件）
### Task 3.13: Agent 集成到 chat_stream

> Phase 3 详细任务在 Phase 2 完成后展开。

---

## Phase 4: Prompt 模板 + 配置系统

### Task 4.1: 从 WeKnora 复制 prompt YAML 到 config_files/prompts/
### Task 4.2: 微调占位符（适配 Python 模板渲染）
### Task 4.3: config.yaml 加载器
### Task 4.4: agents.yaml 预设加载

---

## Phase 5: docreader 集成

### Task 5.1: 从 WeKnora 复制 docreader/ 目录
### Task 5.2: 简化为 HTTP 接口（MVP 不用 gRPC）
### Task 5.3: 异步文档处理流水线（pending → parsing → chunking → embedding → ready）
### Task 5.4: 前端文档上传 UI

---

## Phase 6: Skills + MCP

### Task 6.1: Skill YAML 加载器
### Task 6.2: 运行时 Skill 挂载到 Agent
### Task 6.3: 从 WeKnora 复制 mcp_server/
### Task 6.4: MCP 客户端（stdio 传输）

---

## Phase 7: 前端完整 UI

### Task 7.1: Agent 思考过程展示（折叠面板）
### Task 7.2: 知识库管理页 `#/admin`
### Task 7.3: owner 管理后台（邀请码 + 用户管理）
### Task 7.4: 文章页"向 AI 提问"按钮

---

## Phase 8: Docker Compose 部署

### Task 8.1: Dockerfile（app + docreader）
### Task 8.2: docker-compose.yml
### Task 8.3: .env.example
### Task 8.4: README 部署说明

---

*生成时间：2026-06-28*
*基于设计文档：docs/plans/2026-06-28-rag-agent-refactoring.md*
