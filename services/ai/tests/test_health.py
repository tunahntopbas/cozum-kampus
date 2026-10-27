def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_cors_allows_configured_origin(client):
    r = client.options(
        "/health",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
    )
    assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_rejects_other_origin(client):
    r = client.options(
        "/health",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"},
    )
    assert "access-control-allow-origin" not in r.headers
