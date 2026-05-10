def _register_and_login(client, email="user@example.com", password="mypassword", role="parent"):
    client.post("/api/auth/register", json={
        "email": email, "password": password, "role": role,
    })
    resp = client.post("/api/auth/login", json={
        "email": email, "password": password,
    })
    return resp.json()["access_token"]


def test_generate_api_token(client):
    token = _register_and_login(client)
    response = client.post("/api/cryplo/tokens", headers={
        "Authorization": f"Bearer {token}",
    })
    assert response.status_code == 201
    data = response.json()
    assert "token" in data
    assert data["token"].startswith("exs_")
    assert "id" in data


def test_list_tokens_shows_masked_tokens(client):
    token = _register_and_login(client)
    client.post("/api/cryplo/tokens", headers={"Authorization": f"Bearer {token}"})
    response = client.get("/api/cryplo/tokens", headers={
        "Authorization": f"Bearer {token}",
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] > 0
    assert "token" not in data[0]
    assert data[0]["is_active"] is True


def test_revoke_token_marks_as_inactive(client):
    token = _register_and_login(client)
    gen = client.post("/api/cryplo/tokens", headers={"Authorization": f"Bearer {token}"})
    token_id = gen.json()["id"]

    response = client.patch(f"/api/cryplo/tokens/{token_id}/revoke", headers={
        "Authorization": f"Bearer {token}",
    })
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    listed = client.get("/api/cryplo/tokens", headers={"Authorization": f"Bearer {token}"})
    assert listed.json()[0]["is_active"] is False


def test_verify_valid_token_returns_user_info(client):
    token = _register_and_login(client, email="alice@example.com")
    gen = client.post("/api/cryplo/tokens", headers={"Authorization": f"Bearer {token}"})
    raw_api_token = gen.json()["token"]

    response = client.post("/api/cryplo/verify-token", json={"token": raw_api_token})
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["email"] == "alice@example.com"
    assert "user_id" in data


def test_verify_invalid_token_returns_401(client):
    response = client.post("/api/cryplo/verify-token", json={"token": "exs_nope"})
    assert response.status_code == 401
    assert response.json()["valid"] is False
    assert response.json()["error"] == "invalid_token"


def test_verify_revoked_token_returns_401(client):
    token = _register_and_login(client)
    gen = client.post("/api/cryplo/tokens", headers={"Authorization": f"Bearer {token}"})
    raw_api_token = gen.json()["token"]
    token_id = gen.json()["id"]

    client.patch(f"/api/cryplo/tokens/{token_id}/revoke", headers={
        "Authorization": f"Bearer {token}",
    })

    response = client.post("/api/cryplo/verify-token", json={"token": raw_api_token})
    assert response.status_code == 401
    assert response.json()["valid"] is False
