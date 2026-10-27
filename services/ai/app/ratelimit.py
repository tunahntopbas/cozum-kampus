import time
from collections import defaultdict, deque
from collections.abc import Callable

from fastapi import HTTPException


class RateLimiter:
    """In-memory sliding window limiter. Good enough for a single Render instance."""

    def __init__(self, limit: int, window_s: float = 60, clock: Callable[[], float] = time.monotonic):
        self.limit = limit
        self.window_s = window_s
        self.clock = clock
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = self.clock()
        hits = self._hits[key]
        while hits and now - hits[0] >= self.window_s:
            hits.popleft()
        if len(hits) >= self.limit:
            raise HTTPException(status_code=429, detail="Çok fazla istek. Biraz sonra yeniden dene.")
        hits.append(now)
