import os

os.environ.update(
    {
        "SUPABASE_URL": "https://test.supabase.co",
        "SUPABASE_ANON_KEY": "anon-test",
        "SUPABASE_SERVICE_ROLE_KEY": "service-test",
        "DEEPSEEK_API_KEY": "deepseek-test",
        "ALLOWED_ORIGIN": "http://localhost:3000",
    }
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.auth import CurrentUser, get_current_user  # noqa: E402
from app.llm import get_llm  # noqa: E402
from app.llm.fake import FakeProvider  # noqa: E402
from app.main import app  # noqa: E402
from app.ratelimit import RateLimiter, get_rate_limiter  # noqa: E402
from app.storage import get_image_fetcher, get_run_recorder  # noqa: E402

TEST_USER = CurrentUser(id="u-1", email="a@ogr.sakarya.edu.tr")


@pytest.fixture
def recorded_runs():
    return []


@pytest.fixture
def client(recorded_runs):
    async def fake_fetch(paths):
        return ["QUJD" for _ in paths]

    async def fake_record(**run):
        recorded_runs.append(run)

    limiter = RateLimiter(limit=1000)
    app.dependency_overrides[get_current_user] = lambda: TEST_USER
    app.dependency_overrides[get_image_fetcher] = lambda: fake_fetch
    app.dependency_overrides[get_run_recorder] = lambda: fake_record
    app.dependency_overrides[get_rate_limiter] = lambda: limiter
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def fake_llm():
    provider = FakeProvider([])
    app.dependency_overrides[get_llm] = lambda: provider
    return provider
