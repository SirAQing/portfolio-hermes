import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import get_db

with get_db() as c:
    r1 = c.execute("SELECT COUNT(*) FROM conversations WHERE id LIKE 'seed-%'").fetchone()[0]
    r2 = c.execute("SELECT COUNT(*) FROM users WHERE email LIKE '%@seed.local'").fetchone()[0]
    r3 = c.execute("SELECT COUNT(*) FROM messages WHERE conversation_id LIKE 'seed-%'").fetchone()[0]
    r4 = c.execute("SELECT COUNT(*) FROM guest_quotas WHERE id LIKE 'seed-%'").fetchone()[0]
print(f"Conversations: {r1}")
print(f"Users: {r2}")
print(f"Messages: {r3}")
print(f"Guest quotas: {r4}")
