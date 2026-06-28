"""访客配额管理测试"""
from core.auth.guest_quota import (
    check_guest_quota,
    increment_guest_quota,
    GUEST_DAILY_LIMIT,
)


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
