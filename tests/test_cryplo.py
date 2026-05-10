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


# --- Deposit & Balance (Issue #57) ---


def test_balance_returns_401_without_token(client):
    response = client.get("/api/cryplo/balance")
    assert response.status_code == 401


def test_balance_returns_excoin_balance_and_user_id(client):
    jwt = _register_and_login(client, email="bob@example.com")
    gen = client.post("/api/cryplo/tokens", headers={"Authorization": f"Bearer {jwt}"})
    api_token = gen.json()["token"]

    response = client.get("/api/cryplo/balance", headers={
        "Authorization": f"Bearer {api_token}",
    })
    assert response.status_code == 200
    data = response.json()
    assert "excoin_balance" in data
    assert "user_id" in data


def test_deposit_deducts_exbucks_and_records_transfer(client):
    jwt = _register_and_login(client, email="depositor@example.com")
    # Give user 200 exbucks
    from exsize.database import get_db
    from exsize.models import User
    # Use the test DB via a direct approach
    gen = client.post("/api/cryplo/tokens", headers={"Authorization": f"Bearer {jwt}"})
    api_token = gen.json()["token"]

    # Set balance via the balance check (default is 0, we need funds)
    # We'll set balance directly in the test DB
    from exsize.app import app
    from exsize.database import get_db as _get_db
    db_gen = app.dependency_overrides[_get_db]()
    db = next(db_gen)
    user = db.query(User).filter(User.email == "depositor@example.com").first()
    user.exbucks_balance = 200
    db.commit()

    # Deposit 100 USD = 50 ExCoin
    response = client.post("/api/cryplo/deposit", headers={
        "Authorization": f"Bearer {api_token}",
    }, json={"amount_usd": 100.0, "cryplo_user_id": "cryplo-uuid-1"})

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["excoin_amount"] == 50
    assert data["new_excoin_balance"] == 150
    assert "transfer_id" in data

    # Verify balance via balance endpoint
    bal = client.get("/api/cryplo/balance", headers={
        "Authorization": f"Bearer {api_token}",
    })
    assert bal.json()["excoin_balance"] == 150


def test_deposit_returns_400_insufficient_funds(client):
    jwt = _register_and_login(client, email="poor@example.com")
    gen = client.post("/api/cryplo/tokens", headers={"Authorization": f"Bearer {jwt}"})
    api_token = gen.json()["token"]

    # User has 0 exbucks by default, try to deposit 100 USD (needs 50 ExCoin)
    response = client.post("/api/cryplo/deposit", headers={
        "Authorization": f"Bearer {api_token}",
    }, json={"amount_usd": 100.0, "cryplo_user_id": "cryplo-uuid-2"})

    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"] == "insufficient_funds"
    assert data["current_balance"] == 0


def test_deposit_returns_401_without_token(client):
    response = client.post("/api/cryplo/deposit", json={
        "amount_usd": 100.0, "cryplo_user_id": "cryplo-uuid-3",
    })
    assert response.status_code == 401


# --- Withdraw (Issue #58) ---


def test_withdraw_returns_401_without_token(client):
    response = client.post("/api/cryplo/withdraw", json={
        "amount_usd": 60.0, "cryplo_user_id": "cryplo-uuid-99",
    })
    assert response.status_code == 401


def test_withdraw_adds_exbucks_and_records_transfer(client):
    jwt = _register_and_login(client, email="withdrawer@example.com")
    gen = client.post("/api/cryplo/tokens", headers={"Authorization": f"Bearer {jwt}"})
    api_token = gen.json()["token"]

    # Withdraw 40 USD = 20 ExCoin (under weekly limit of 60 USD)
    response = client.post("/api/cryplo/withdraw", headers={
        "Authorization": f"Bearer {api_token}",
    }, json={"amount_usd": 40.0, "cryplo_user_id": "cryplo-uuid-w1"})

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["excoin_amount"] == 20.0
    assert data["new_excoin_balance"] == 20
    assert data["weekly_remaining_usd"] == 20.0  # 60 - 40
    assert "transfer_id" in data

    # Verify balance via balance endpoint
    bal = client.get("/api/cryplo/balance", headers={
        "Authorization": f"Bearer {api_token}",
    })
    assert bal.json()["excoin_balance"] == 20


def test_withdraw_returns_429_when_weekly_limit_exceeded(client):
    jwt = _register_and_login(client, email="limited@example.com")
    gen = client.post("/api/cryplo/tokens", headers={"Authorization": f"Bearer {jwt}"})
    api_token = gen.json()["token"]

    # Use full 60 USD weekly limit
    client.post("/api/cryplo/withdraw", headers={
        "Authorization": f"Bearer {api_token}",
    }, json={"amount_usd": 60.0, "cryplo_user_id": "cryplo-uuid-l1"})

    # Try to withdraw 1 more USD — should exceed limit
    response = client.post("/api/cryplo/withdraw", headers={
        "Authorization": f"Bearer {api_token}",
    }, json={"amount_usd": 1.0, "cryplo_user_id": "cryplo-uuid-l1"})

    assert response.status_code == 429
    data = response.json()
    assert data["success"] is False
    assert data["error"] == "weekly_limit_exceeded"
    assert data["weekly_used_usd"] == 60.0
    assert data["weekly_limit_usd"] == 60
    assert data["remaining_usd"] == 0


def test_withdraw_accumulates_toward_weekly_limit(client):
    jwt = _register_and_login(client, email="cumulative@example.com")
    gen = client.post("/api/cryplo/tokens", headers={"Authorization": f"Bearer {jwt}"})
    api_token = gen.json()["token"]

    # First withdrawal: 40 USD
    r1 = client.post("/api/cryplo/withdraw", headers={
        "Authorization": f"Bearer {api_token}",
    }, json={"amount_usd": 40.0, "cryplo_user_id": "cryplo-uuid-c1"})
    assert r1.status_code == 200
    assert r1.json()["weekly_remaining_usd"] == 20.0

    # Second withdrawal: 15 USD (total 55, under limit)
    r2 = client.post("/api/cryplo/withdraw", headers={
        "Authorization": f"Bearer {api_token}",
    }, json={"amount_usd": 15.0, "cryplo_user_id": "cryplo-uuid-c1"})
    assert r2.status_code == 200
    assert r2.json()["weekly_remaining_usd"] == 5.0

    # Third withdrawal: 10 USD (total would be 65, exceeds 60)
    r3 = client.post("/api/cryplo/withdraw", headers={
        "Authorization": f"Bearer {api_token}",
    }, json={"amount_usd": 10.0, "cryplo_user_id": "cryplo-uuid-c1"})
    assert r3.status_code == 429
    assert r3.json()["weekly_used_usd"] == 55.0
    assert r3.json()["remaining_usd"] == 5.0
