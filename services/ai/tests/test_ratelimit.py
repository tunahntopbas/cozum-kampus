import pytest
from fastapi import HTTPException

from app.ratelimit import RateLimiter


def test_rate_limiter_blocks_after_limit():
    t = [0.0]
    rl = RateLimiter(limit=2, window_s=60, clock=lambda: t[0])
    rl.check("u1")
    rl.check("u1")
    with pytest.raises(HTTPException) as e:
        rl.check("u1")
    assert e.value.status_code == 429
    rl.check("u2")
    t[0] = 61
    rl.check("u1")
