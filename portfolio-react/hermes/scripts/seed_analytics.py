"""
仪表盘模拟数据填充脚本。

为近 30 天生成合理的对话、消息、用户和访客配额数据，
使 DashboardTab 在空库下也能展示出有参考意义的趋势图。
"""
import os
import sys
import random
import time
import uuid
import hashlib
from datetime import datetime, timedelta

# 把 hermes 根目录加入路径，以便导入 config/models
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from config import DATABASE_PATH
from models import get_db, init_db


def random_ts(start: datetime, end: datetime) -> float:
    """在 [start, end] 之间生成随机 unix 时间戳。"""
    delta = end - start
    rand_delta = timedelta(seconds=random.randint(0, int(delta.total_seconds())))
    return (start + rand_delta).timestamp()


def fmt_ts(ts: float) -> str:
    return datetime.fromtimestamp(ts).isoformat()


def ip_hash(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


def seed():
    init_db()

    end = datetime.now()
    start = end - timedelta(days=30)

    visitor_messages_pool = [
        "你好，介绍一下你自己",
        "你做过哪些项目",
        "讲讲 ETL 平台",
        "天合储能是做什么的",
        "你有什么专利",
        "你熟悉哪些数据库",
        "Python 和 Java 哪个更熟",
        "做过大模型部署吗",
        "RAG 是怎么实现的",
        "你的优势是什么",
        "期望薪资多少",
        "可以接受加班吗",
        "英语口语怎么样",
        "Docker Compose 会吗",
        "介绍一下 NL2SQL 项目",
        "数据治理经验多吗",
        " lithium battery 测试流程了解吗",
        "会用 Airflow 吗",
        "有没有做过实时计算",
        "对能源行业有什么看法",
    ]

    assistant_replies_pool = [
        "我在新能源数据领域有 4 年经验，主导过 ETL 平台和自动化报告系统...",
        "我的核心项目包括 ETL 数据集成平台、实验室报告自动化、私有 LLM 平台和 NL2SQL Agent。",
        "ETL 平台采用 DolphinScheduler + Kettle + Docker Compose 架构，日峰值处理 50GB 数据。",
        "天合储能是天合光能旗下储能业务板块，主营储能电芯与系统集成。",
        "我目前有两项发明专利，一项第一发明人、一项第三发明人。",
        "我熟悉 MySQL、PostgreSQL、SQLite、ClickHouse 等关系型和分析型数据库。",
        "Python 是我的主力语言，Java 也有项目经验，取决于团队技术栈。",
        "做过 Ollama 私有化部署和 Dify 应用平台搭建，支持 RAG 知识库和 Workflow。",
        "RAG 通过 Embedding 模型将文档切片向量化，存入 Chroma，检索时做语义相似度匹配。",
        "我的优势是数据工程 + AI 应用双栈能力，能把算法落到生产环境。",
        "期望薪资可面议，更看重业务价值和成长空间。",
        "项目关键节点可以配合，长期高强度加班不倾向。",
        "能阅读英文文档并进行日常技术交流，口语还在持续提升。",
        "熟悉 Docker Compose 多服务编排，本项目就是基于此部署。",
        "NL2SQL Agent 通过 LangGraph 状态机实现意图解析、SQL 生成、执行校验和结果解读。",
        "有数据治理实践经验，包括指标标准化、血缘梳理和质量校验规则。",
        "熟悉锂电池测试流程，包括循环寿命、热失控、安全测试等环节的数据处理。",
        "用过 DolphinScheduler，Airflow 有了解但生产经验较少。",
        "实时计算做过技术调研，主要生产项目以离线批处理为主。",
        "我认为 AI 与能源数据结合是确定性趋势，大模型能显著降低知识检索门槛。",
    ]

    companies = [
        "远景能源", "宁德时代", "比亚迪储能", "亿纬锂能", "海辰储能",
        "瑞浦兰钧", "中创新航", "蜂巢能源", "鹏辉能源", "国轩高科",
    ]
    positions = [
        "数据工程师", "AI 应用工程师", "后端开发", "算法工程师",
        "大数据开发", "全栈工程师", "平台工程师",
    ]
    user_names = [
        "张明辉", "李思远", "王嘉怡", "陈浩然", "刘子涵",
        "赵雨桐", "周晨曦", "吴宇航", "徐嘉言", "孙艺萌",
    ]

    modes = ["visitor", "demo"]
    mode_weights = [0.45, 0.55]

    with get_db() as conn:
        # 清理旧的模拟数据（可选，幂等）
        conn.execute("DELETE FROM messages WHERE conversation_id LIKE 'seed-%'")
        conn.execute("DELETE FROM conversations WHERE id LIKE 'seed-%'")
        conn.execute("DELETE FROM users WHERE email LIKE '%@seed.local'")
        conn.execute("DELETE FROM guest_quotas WHERE id LIKE 'seed-%'")
        conn.execute("DELETE FROM interviewer_invites WHERE id LIKE 'seed-%'")

        # ── 1. 生成模拟用户（user + interviewer）──
        created_user_ids = []
        for i, name in enumerate(user_names[:8]):
            role = random.choice(["user", "interviewer"])
            email = f"{name}@seed.local"
            user_id = f"seed-user-{i+1:02d}"
            created_days_ago = random.randint(0, 28)
            created_at = end - timedelta(days=created_days_ago, hours=random.randint(0, 23))
            conn.execute(
                """
                INSERT OR IGNORE INTO users
                (id, email, username, password_hash, role, is_active, created_at, last_login_at)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)
                """,
                (
                    user_id,
                    email,
                    name,
                    "$2b$12$seedhashplaceholder",
                    role,
                    fmt_ts(created_at.timestamp()),
                    fmt_ts((created_at + timedelta(days=random.randint(0, 2))).timestamp()),
                ),
            )
            created_user_ids.append(user_id)

        # ── 2. 生成面试官邀请码 ──
        owner_row = conn.execute(
            "SELECT id FROM users WHERE role = 'owner' LIMIT 1"
        ).fetchone()
        owner_id = owner_row["id"] if owner_row else None

        if owner_id:
            for i in range(3):
                code = f"SEED{i+1:02d}{str(uuid.uuid4().int)[:4].upper()}"
                created_at = end - timedelta(days=random.randint(1, 20))
                expires_at = created_at + timedelta(days=random.randint(7, 60))
                max_uses = random.choice([1, 2, 3, 5])
                used_count = random.randint(0, max_uses)
                conn.execute(
                    """
                    INSERT INTO interviewer_invites
                    (id, code, created_by, company, position, max_uses, used_count, expires_at, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        f"seed-invite-{i+1:02d}",
                        code,
                        owner_id,
                        random.choice(companies) if random.random() > 0.3 else None,
                        random.choice(positions) if random.random() > 0.3 else None,
                        max_uses,
                        used_count,
                        fmt_ts(expires_at.timestamp()),
                        fmt_ts(created_at.timestamp()),
                    ),
                )

        # ── 3. 生成访客配额记录 ──
        ip_pool = [f"192.168.1.{i}" for i in range(10, 50)]
        for day_offset in range(31):
            query_date = (end - timedelta(days=day_offset)).strftime("%Y-%m-%d")
            active_ips = random.randint(3, 12)
            for ip_idx in range(active_ips):
                ip = random.choice(ip_pool)
                count = random.randint(1, 8)
                last_query = datetime.combine(
                    datetime.strptime(query_date, "%Y-%m-%d"),
                    datetime.min.time(),
                ) + timedelta(hours=random.randint(9, 22), minutes=random.randint(0, 59))
                conn.execute(
                    """
                    INSERT OR IGNORE INTO guest_quotas
                    (id, ip_hash, query_date, query_count, last_query_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        f"seed-quota-{day_offset}-{ip_idx}",
                        ip_hash(ip),
                        query_date,
                        count,
                        fmt_ts(last_query.timestamp()),
                    ),
                )

        # ── 4. 生成对话与消息 ──
        total_conversations = 120
        for i in range(total_conversations):
            conv_id = f"seed-{str(uuid.uuid4())[:8]}"
            visitor_id = f"v-{random.randint(1000, 9999)}"
            visitor_name = random.choice([None, random.choice(user_names), f"访客{random.randint(100,999)}"])
            mode = random.choices(modes, weights=mode_weights)[0]

            # 随机分布到近 30 天，白天概率更高
            day_offset = random.choices(range(31), weights=[max(1, 30 - d) for d in range(31)])[0]
            day_start = datetime.combine(
                (end - timedelta(days=day_offset)).date(),
                datetime.min.time(),
            ) + timedelta(hours=random.randint(8, 22))
            day_end = day_start + timedelta(hours=2)

            started_at = random_ts(day_start, day_end)
            last_active = started_at + random.randint(30, 600)

            msg_count = random.choices([2, 4, 6, 8, 10], weights=[20, 30, 25, 15, 10])[0]

            conn.execute(
                """
                INSERT INTO conversations
                (id, visitor_id, visitor_name, started_at, last_active, message_count, mode)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (conv_id, visitor_id, visitor_name, started_at, last_active, msg_count, mode),
            )

            for m in range(msg_count):
                role = "visitor" if m % 2 == 0 else "assistant"
                if role == "visitor":
                    content = random.choice(visitor_messages_pool)
                else:
                    content = random.choice(assistant_replies_pool)
                msg_ts = started_at + m * random.randint(15, 120)
                conn.execute(
                    """
                    INSERT INTO messages
                    (id, conversation_id, role, content, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (str(uuid.uuid4())[:8], conv_id, role, content, msg_ts),
                )

    print("[OK] 模拟数据填充完成：30 天趋势数据已生成。")
    print(f"     数据库：{DATABASE_PATH}")


if __name__ == "__main__":
    seed()
