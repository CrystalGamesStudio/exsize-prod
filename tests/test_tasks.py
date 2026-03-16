def _register_and_login(client, email="parent@example.com", password="mypassword", role="parent"):
    client.post("/api/auth/register", json={
        "email": email, "password": password, "role": role,
    })
    resp = client.post("/api/auth/login", json={
        "email": email, "password": password,
    })
    return resp.json()["access_token"]


def _setup_family_with_child(client):
    """Create a family with one parent and one child. Returns (parent_token, child_token, child_id)."""
    parent_token = _register_and_login(client, email="parent@example.com")
    family = client.post("/api/family", headers={"Authorization": f"Bearer {parent_token}"}).json()

    child_token = _register_and_login(client, email="child@example.com", role="child")
    client.post("/api/family/join", json={"pin": family["pin"]}, headers={
        "Authorization": f"Bearer {child_token}",
    })

    members = client.get("/api/family", headers={"Authorization": f"Bearer {parent_token}"}).json()["members"]
    child_id = next(m["id"] for m in members if m["role"] == "child")
    return parent_token, child_token, child_id


def test_parent_creates_task(client):
    parent_token, child_token, child_id = _setup_family_with_child(client)

    response = client.post("/api/tasks", json={
        "name": "Do 10 pushups",
        "description": "Complete 10 pushups with proper form",
        "exbucks": 5,
        "assigned_to": child_id,
    }, headers={"Authorization": f"Bearer {parent_token}"})

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Do 10 pushups"
    assert data["description"] == "Complete 10 pushups with proper form"
    assert data["exbucks"] == 5
    assert data["assigned_to"] == child_id
    assert data["status"] == "assigned"


def test_child_sees_assigned_tasks(client):
    parent_token, child_token, child_id = _setup_family_with_child(client)

    client.post("/api/tasks", json={
        "name": "Do 10 pushups",
        "description": "Complete 10 pushups",
        "exbucks": 5,
        "assigned_to": child_id,
    }, headers={"Authorization": f"Bearer {parent_token}"})

    response = client.get("/api/tasks", headers={"Authorization": f"Bearer {child_token}"})
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) == 1
    assert tasks[0]["name"] == "Do 10 pushups"
    assert tasks[0]["status"] == "assigned"


def test_child_completes_task(client):
    parent_token, child_token, child_id = _setup_family_with_child(client)

    task = client.post("/api/tasks", json={
        "name": "Do 10 pushups",
        "description": "Complete 10 pushups",
        "exbucks": 5,
        "assigned_to": child_id,
    }, headers={"Authorization": f"Bearer {parent_token}"}).json()

    response = client.patch(f"/api/tasks/{task['id']}/complete", headers={
        "Authorization": f"Bearer {child_token}",
    })
    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_parent_sees_pending_approvals(client):
    parent_token, child_token, child_id = _setup_family_with_child(client)

    task = client.post("/api/tasks", json={
        "name": "Do 10 pushups",
        "description": "Complete 10 pushups",
        "exbucks": 5,
        "assigned_to": child_id,
    }, headers={"Authorization": f"Bearer {parent_token}"}).json()

    # Child completes the task
    client.patch(f"/api/tasks/{task['id']}/complete", headers={
        "Authorization": f"Bearer {child_token}",
    })

    # Parent sees all family tasks, including completed ones
    response = client.get("/api/tasks", headers={"Authorization": f"Bearer {parent_token}"})
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) == 1
    assert tasks[0]["status"] == "completed"


def test_parent_approves_task(client):
    parent_token, child_token, child_id = _setup_family_with_child(client)

    task = client.post("/api/tasks", json={
        "name": "Do 10 pushups",
        "description": "Complete 10 pushups",
        "exbucks": 5,
        "assigned_to": child_id,
    }, headers={"Authorization": f"Bearer {parent_token}"}).json()

    client.patch(f"/api/tasks/{task['id']}/complete", headers={
        "Authorization": f"Bearer {child_token}",
    })

    response = client.patch(f"/api/tasks/{task['id']}/approve", headers={
        "Authorization": f"Bearer {parent_token}",
    })
    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_parent_rejects_task(client):
    parent_token, child_token, child_id = _setup_family_with_child(client)

    task = client.post("/api/tasks", json={
        "name": "Do 10 pushups",
        "description": "Complete 10 pushups",
        "exbucks": 5,
        "assigned_to": child_id,
    }, headers={"Authorization": f"Bearer {parent_token}"}).json()

    client.patch(f"/api/tasks/{task['id']}/complete", headers={
        "Authorization": f"Bearer {child_token}",
    })

    response = client.patch(f"/api/tasks/{task['id']}/reject", headers={
        "Authorization": f"Bearer {parent_token}",
    })
    assert response.status_code == 200
    assert response.json()["status"] == "assigned"


def test_child_cannot_create_task(client):
    parent_token, child_token, child_id = _setup_family_with_child(client)

    response = client.post("/api/tasks", json={
        "name": "Do 10 pushups",
        "description": "Complete 10 pushups",
        "exbucks": 5,
        "assigned_to": child_id,
    }, headers={"Authorization": f"Bearer {child_token}"})
    assert response.status_code == 403


def test_child_cannot_approve_task(client):
    parent_token, child_token, child_id = _setup_family_with_child(client)

    task = client.post("/api/tasks", json={
        "name": "Do 10 pushups",
        "description": "Complete 10 pushups",
        "exbucks": 5,
        "assigned_to": child_id,
    }, headers={"Authorization": f"Bearer {parent_token}"}).json()

    client.patch(f"/api/tasks/{task['id']}/complete", headers={
        "Authorization": f"Bearer {child_token}",
    })

    response = client.patch(f"/api/tasks/{task['id']}/approve", headers={
        "Authorization": f"Bearer {child_token}",
    })
    assert response.status_code == 403


def test_child_cannot_reject_task(client):
    parent_token, child_token, child_id = _setup_family_with_child(client)

    task = client.post("/api/tasks", json={
        "name": "Do 10 pushups",
        "description": "Complete 10 pushups",
        "exbucks": 5,
        "assigned_to": child_id,
    }, headers={"Authorization": f"Bearer {parent_token}"}).json()

    client.patch(f"/api/tasks/{task['id']}/complete", headers={
        "Authorization": f"Bearer {child_token}",
    })

    response = client.patch(f"/api/tasks/{task['id']}/reject", headers={
        "Authorization": f"Bearer {child_token}",
    })
    assert response.status_code == 403


def test_parent_cannot_complete_task(client):
    parent_token, child_token, child_id = _setup_family_with_child(client)

    task = client.post("/api/tasks", json={
        "name": "Do 10 pushups",
        "description": "Complete 10 pushups",
        "exbucks": 5,
        "assigned_to": child_id,
    }, headers={"Authorization": f"Bearer {parent_token}"}).json()

    response = client.patch(f"/api/tasks/{task['id']}/complete", headers={
        "Authorization": f"Bearer {parent_token}",
    })
    assert response.status_code == 403


def test_cannot_act_on_task_outside_family(client):
    # Family 1
    parent1_token, child1_token, child1_id = _setup_family_with_child(client)

    task = client.post("/api/tasks", json={
        "name": "Do 10 pushups",
        "description": "Complete 10 pushups",
        "exbucks": 5,
        "assigned_to": child1_id,
    }, headers={"Authorization": f"Bearer {parent1_token}"}).json()

    # Family 2
    parent2_token = _register_and_login(client, email="parent2@example.com")
    client.post("/api/family", headers={"Authorization": f"Bearer {parent2_token}"})

    # Parent from family 2 cannot approve family 1's task
    response = client.patch(f"/api/tasks/{task['id']}/approve", headers={
        "Authorization": f"Bearer {parent2_token}",
    })
    assert response.status_code == 404
