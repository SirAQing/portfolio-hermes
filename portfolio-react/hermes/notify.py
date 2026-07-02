"""
Notification service: Feishu (Lark) webhook + PushPlus (WeChat).
Sends conversation summaries to the portfolio owner.
"""
import httpx
import time
from config import FEISHU_WEBHOOK_URL, PUSHPLUS_TOKEN, SUMMARY_SCHEDULE_HOURS
from models import get_unnotified_messages, mark_notified, get_conversation_messages


def _format_time(ts: float) -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(ts))


def _build_summary_text(conversations: list[dict]) -> str:
    """Build a plain-text summary of new conversations."""
    lines = [f"📬 Hermes 新消息汇总 ({_format_time(time.time())})\n"]

    for conv in conversations:
        urgent_tag = " 🚨紧急" if conv.get("is_urgent") else ""
        visitor = conv.get("visitor_name") or conv.get("visitor_id", "unknown")
        lines.append(f"── 访客: {visitor}{urgent_tag} ──")
        lines.append(f"会话 ID: {conv['id']} | 消息数: {conv['message_count']}")
        lines.append(f"开始: {_format_time(conv['started_at'])}\n")

        for msg in conv.get("new_messages", []):
            role = "👤 访客" if msg["role"] == "visitor" else "🤖 Hermes"
            lines.append(f"  {role}: {msg['content'][:200]}")

        lines.append("")

    if not conversations:
        lines.append("暂无新消息。")

    return "\n".join(lines)


async def send_feishu(title: str, content: str):
    """Send a message to Feishu via webhook."""
    if not FEISHU_WEBHOOK_URL:
        print("[notify] Feishu webhook URL not configured, skipping.")
        return

    payload = {
        "msg_type": "interactive",
        "card": {
            "header": {
                "title": {"tag": "plain_text", "content": title},
                "template": "blue"
            },
            "elements": [
                {
                    "tag": "markdown",
                    "content": content.replace("\n", "\n")
                }
            ]
        }
    }

    async with httpx.AsyncClient(timeout=10.0, trust_env=False) as client:
        resp = await client.post(FEISHU_WEBHOOK_URL, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == 0 or data.get("StatusCode") == 0:
                print("[notify] Feishu notification sent.")
            else:
                print(f"[notify] Feishu API error: {data}")
        else:
            print(f"[notify] Feishu HTTP error: {resp.status_code}")


async def send_pushplus(title: str, content: str):
    """Send a message to WeChat via PushPlus."""
    if not PUSHPLUS_TOKEN:
        print("[notify] PushPlus token not configured, skipping.")
        return

    payload = {
        "token": PUSHPLUS_TOKEN,
        "title": title,
        "content": content.replace("\n", "<br>"),
        "template": "html",
    }

    async with httpx.AsyncClient(timeout=10.0, trust_env=False) as client:
        resp = await client.post("https://www.pushplus.plus/send", json=payload)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == 200:
                print("[notify] PushPlus notification sent.")
            else:
                print(f"[notify] PushPlus API error: {data}")
        else:
            print(f"[notify] PushPlus HTTP error: {resp.status_code}")


async def send_urgent_notification(conv_id: str, visitor_msg: str):
    """Send immediate notification for urgent messages."""
    title = f"🚨 Hermes 紧急消息 (会话 {conv_id})"
    content = (
        f"访客发送了需要人工介入的消息：\n\n"
        f"> {visitor_msg}\n\n"
        f"请尽快回复！"
    )
    await send_feishu(title, content)
    await send_pushplus(title, content)


async def send_realtime_notification(conv_id: str, visitor_msg: str, ai_reply: str):
    """Send immediate notification after each conversation turn."""
    print(f"[notify] Sending realtime notification for conv {conv_id}...")
    title = f"💬 Hermes 新对话 (会话 {conv_id})"
    content = (
        f"**访客说：**\n> {visitor_msg[:300]}\n\n"
        f"**Hermes 回复：**\n> {ai_reply[:300]}"
    )
    try:
        await send_feishu(title, content)
        await send_pushplus(title, content)
    except Exception as e:
        print(f"[notify] Realtime notification error: {e}")


async def send_periodic_summary(since: float = None):
    """Check for unnotified messages and send summary."""
    if since is None:
        # Look back 24 hours; DB notified_at filter prevents duplicates
        since = time.time() - (24 * 3600)

    conversations = get_unnotified_messages(since)
    if not conversations:
        return

    title = f"📬 Hermes 消息汇总 ({len(conversations)} 个会话)"
    summary = _build_summary_text(conversations)

    await send_feishu(title, summary)
    await send_pushplus(title, summary)

    # Mark as notified
    conv_ids = [c["id"] for c in conversations]
    mark_notified(conv_ids)
    print(f"[notify] Sent summary for {len(conversations)} conversations.")


def check_urgent_keywords(content: str, keywords: list[str]) -> bool:
    """Check if message contains urgent keywords."""
    content_lower = content.lower()
    return any(kw.strip().lower() in content_lower for kw in keywords)
