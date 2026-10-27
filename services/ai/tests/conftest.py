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
from app.main import app  # noqa: E402

TEST_USER = CurrentUser(id="u-1", email="a@ogr.sakarya.edu.tr")


@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: TEST_USER
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
