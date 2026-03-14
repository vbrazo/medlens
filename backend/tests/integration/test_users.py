"""
Integration tests for /users endpoints.
Covers: GET /users/me, GET /users (paginated), GET /users/{id},
        POST /users, PUT /users/{id}, DELETE /users/{id}
Happy path + edge cases for each.
"""
import pytest
from httpx import AsyncClient

from app.models.user import User


# ─── helpers ─────────────────────────────────────────────────────────────────

def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _create_patient(client: AsyncClient, admin_token: str, suffix: str) -> str:
    """Helper: admin creates a patient and returns their ID."""
    res = await client.post(
        "/users",
        json={"email": f"helper.{suffix}@test.com", "password": "password123"},
        headers=auth(admin_token),
    )
    assert res.status_code == 201, res.text
    return res.json()["id"]


# ─── GET /users/me ────────────────────────────────────────────────────────────

class TestMe:
    async def test_returns_own_profile(
        self, async_client: AsyncClient, patient_user: tuple[User, str]
    ):
        user, token = patient_user
        res = await async_client.get("/users/me", headers=auth(token))
        assert res.status_code == 200
        body = res.json()
        assert body["id"] == user.id
        assert body["email"] == user.email
        assert body["role"] == "patient"

    async def test_no_token_returns_403(self, async_client: AsyncClient):
        res = await async_client.get("/users/me")
        assert res.status_code == 403

    async def test_invalid_token_returns_401(self, async_client: AsyncClient):
        res = await async_client.get("/users/me", headers=auth("bad.token.here"))
        assert res.status_code == 401


# ─── GET /users (paginated list) ─────────────────────────────────────────────

class TestListPatients:
    async def test_returns_paginated_shape(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.get("/users", headers=auth(token))
        assert res.status_code == 200
        body = res.json()
        for key in ("items", "total", "page", "page_size", "pages"):
            assert key in body, f"Missing key: {key}"

    async def test_default_page_is_1(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        body = (await async_client.get("/users", headers=auth(token))).json()
        assert body["page"] == 1

    async def test_patient_appears_in_list(
        self, async_client: AsyncClient, admin_user: tuple[User, str], patient_user: tuple[User, str]
    ):
        _, token = admin_user
        patient, _ = patient_user
        body = (await async_client.get("/users?page_size=100", headers=auth(token))).json()
        ids = [p["id"] for p in body["items"]]
        assert patient.id in ids

    async def test_page_size_limits_results(
        self, async_client: AsyncClient, admin_user: tuple[User, str], patient_user: tuple[User, str]
    ):
        _, token = admin_user
        body = (await async_client.get("/users?page_size=1", headers=auth(token))).json()
        assert len(body["items"]) <= 1

    async def test_items_include_summary_fields(
        self, async_client: AsyncClient, admin_user: tuple[User, str], patient_user: tuple[User, str]
    ):
        _, token = admin_user
        body = (await async_client.get("/users?page_size=100", headers=auth(token))).json()
        if body["items"]:
            item = body["items"][0]
            for field in ("id", "email", "total_scans", "adherence_rate", "missed_doses"):
                assert field in item

    async def test_patient_cannot_list(
        self, async_client: AsyncClient, patient_user: tuple[User, str]
    ):
        _, token = patient_user
        res = await async_client.get("/users", headers=auth(token))
        assert res.status_code == 403

    async def test_unauthenticated_returns_403(self, async_client: AsyncClient):
        res = await async_client.get("/users")
        assert res.status_code == 403

    async def test_page_zero_returns_422(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.get("/users?page=0", headers=auth(token))
        assert res.status_code == 422

    async def test_page_size_zero_returns_422(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.get("/users?page_size=0", headers=auth(token))
        assert res.status_code == 422

    async def test_page_size_over_max_returns_422(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.get("/users?page_size=101", headers=auth(token))
        assert res.status_code == 422

    async def test_pages_ceil_calculation(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        # Seed enough patients to guarantee multiple pages at page_size=1
        for i in range(3):
            await _create_patient(async_client, token, f"pager{i}")
        body = (await async_client.get("/users?page_size=1", headers=auth(token))).json()
        assert body["pages"] >= 3
        assert body["pages"] == body["total"]  # ceil(N/1) == N


# ─── GET /users/{user_id} ─────────────────────────────────────────────────────

class TestGetPatient:
    async def test_admin_gets_patient(
        self, async_client: AsyncClient, admin_user: tuple[User, str], patient_user: tuple[User, str]
    ):
        patient, _ = patient_user
        _, token = admin_user
        res = await async_client.get(f"/users/{patient.id}", headers=auth(token))
        assert res.status_code == 200
        assert res.json()["id"] == patient.id

    async def test_not_found_returns_404(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.get("/users/nonexistent-id-xyz", headers=auth(token))
        assert res.status_code == 404

    async def test_patient_cannot_access_endpoint(
        self, async_client: AsyncClient, patient_user: tuple[User, str], admin_user: tuple[User, str]
    ):
        _, patient_token = patient_user
        admin, _ = admin_user
        res = await async_client.get(f"/users/{admin.id}", headers=auth(patient_token))
        assert res.status_code == 403


# ─── POST /users (create) ────────────────────────────────────────────────────

class TestCreatePatient:
    async def test_success_returns_201(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.post(
            "/users",
            json={"email": "brand.new@test.com", "password": "password123"},
            headers=auth(token),
        )
        assert res.status_code == 201
        body = res.json()
        assert body["email"] == "brand.new@test.com"
        assert body["role"] == "patient"
        assert "id" in body
        assert "password_hash" not in body

    async def test_default_role_is_patient(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.post(
            "/users",
            json={"email": "default.role@test.com", "password": "password123"},
            headers=auth(token),
        )
        assert res.json()["role"] == "patient"

    async def test_explicit_admin_role(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.post(
            "/users",
            json={"email": "new.admin@test.com", "password": "password123", "role": "admin"},
            headers=auth(token),
        )
        assert res.status_code == 201
        assert res.json()["role"] == "admin"

    async def test_duplicate_email_returns_409(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        payload = {"email": "duplicate@test.com", "password": "password123"}
        await async_client.post("/users", json=payload, headers=auth(token))
        res = await async_client.post("/users", json=payload, headers=auth(token))
        assert res.status_code == 409

    async def test_invalid_email_returns_422(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.post(
            "/users",
            json={"email": "not-an-email", "password": "password123"},
            headers=auth(token),
        )
        assert res.status_code == 422

    async def test_short_password_returns_422(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.post(
            "/users",
            json={"email": "short.pw@test.com", "password": "short"},
            headers=auth(token),
        )
        assert res.status_code == 422

    async def test_invalid_role_returns_422(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.post(
            "/users",
            json={"email": "bad.role@test.com", "password": "password123", "role": "superuser"},
            headers=auth(token),
        )
        assert res.status_code == 422

    async def test_patient_cannot_create(
        self, async_client: AsyncClient, patient_user: tuple[User, str]
    ):
        _, token = patient_user
        res = await async_client.post(
            "/users",
            json={"email": "forbidden@test.com", "password": "password123"},
            headers=auth(token),
        )
        assert res.status_code == 403

    async def test_unauthenticated_returns_403(self, async_client: AsyncClient):
        res = await async_client.post(
            "/users", json={"email": "x@test.com", "password": "password123"}
        )
        assert res.status_code == 403

    async def test_created_user_can_login(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        email, password = "can.login@test.com", "password123"
        await async_client.post(
            "/users", json={"email": email, "password": password}, headers=auth(token)
        )
        res = await async_client.post("/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200
        assert "access_token" in res.json()


# ─── PUT /users/{user_id} (update) ───────────────────────────────────────────

class TestUpdatePatient:
    async def test_update_email(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        uid = await _create_patient(async_client, token, "updemail")
        res = await async_client.put(
            f"/users/{uid}", json={"email": "updated@test.com"}, headers=auth(token)
        )
        assert res.status_code == 200
        assert res.json()["email"] == "updated@test.com"

    async def test_update_role(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        uid = await _create_patient(async_client, token, "updrole")
        res = await async_client.put(
            f"/users/{uid}", json={"role": "admin"}, headers=auth(token)
        )
        assert res.status_code == 200
        assert res.json()["role"] == "admin"

    async def test_reset_password_allows_new_login(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        email = "pwreset@test.com"
        uid = await _create_patient(async_client, token, "pwreset")
        await async_client.put(f"/users/{uid}", json={"email": email}, headers=auth(token))
        new_pw = "newpassword99"
        await async_client.put(f"/users/{uid}", json={"password": new_pw}, headers=auth(token))
        res = await async_client.post("/auth/login", json={"email": email, "password": new_pw})
        assert res.status_code == 200

    async def test_updating_to_own_email_is_ok(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        """Sending the user's current email should not return 409."""
        _, token = admin_user
        res = await async_client.post(
            "/users",
            json={"email": "same.email@test.com", "password": "password123"},
            headers=auth(token),
        )
        uid = res.json()["id"]
        res2 = await async_client.put(
            f"/users/{uid}", json={"email": "same.email@test.com"}, headers=auth(token)
        )
        assert res2.status_code == 200

    async def test_email_conflict_with_other_user_returns_409(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        uid = await _create_patient(async_client, token, "conflict1")
        await async_client.post(
            "/users",
            json={"email": "conflict2@test.com", "password": "password123"},
            headers=auth(token),
        )
        res = await async_client.put(
            f"/users/{uid}", json={"email": "conflict2@test.com"}, headers=auth(token)
        )
        assert res.status_code == 409

    async def test_nonexistent_user_returns_404(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.put(
            "/users/does-not-exist", json={"email": "x@test.com"}, headers=auth(token)
        )
        assert res.status_code == 404

    async def test_invalid_role_returns_422(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        uid = await _create_patient(async_client, token, "badrole")
        res = await async_client.put(
            f"/users/{uid}", json={"role": "superuser"}, headers=auth(token)
        )
        assert res.status_code == 422

    async def test_patient_cannot_update(
        self, async_client: AsyncClient, patient_user: tuple[User, str]
    ):
        user, token = patient_user
        res = await async_client.put(
            f"/users/{user.id}", json={"email": "hacked@test.com"}, headers=auth(token)
        )
        assert res.status_code == 403

    async def test_empty_body_is_noop_200(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        """PUT {} should succeed and return unchanged user."""
        _, token = admin_user
        uid = await _create_patient(async_client, token, "noop")
        res = await async_client.put(f"/users/{uid}", json={}, headers=auth(token))
        assert res.status_code == 200


# ─── DELETE /users/{user_id} ─────────────────────────────────────────────────

class TestDeletePatient:
    async def test_admin_deletes_patient_returns_204(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        uid = await _create_patient(async_client, token, "del1")
        res = await async_client.delete(f"/users/{uid}", headers=auth(token))
        assert res.status_code == 204

    async def test_deleted_user_not_found_afterward(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        uid = await _create_patient(async_client, token, "del2")
        await async_client.delete(f"/users/{uid}", headers=auth(token))
        res = await async_client.get(f"/users/{uid}", headers=auth(token))
        assert res.status_code == 404

    async def test_not_found_returns_404(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.delete("/users/nonexistent-xyz", headers=auth(token))
        assert res.status_code == 404

    async def test_admin_cannot_delete_self(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        admin, token = admin_user
        res = await async_client.delete(f"/users/{admin.id}", headers=auth(token))
        assert res.status_code == 400

    async def test_patient_cannot_delete(
        self, async_client: AsyncClient, patient_user: tuple[User, str], admin_user: tuple[User, str]
    ):
        _, patient_token = patient_user
        admin, _ = admin_user
        res = await async_client.delete(f"/users/{admin.id}", headers=auth(patient_token))
        assert res.status_code == 403

    async def test_unauthenticated_returns_403(
        self, async_client: AsyncClient, patient_user: tuple[User, str]
    ):
        patient, _ = patient_user
        res = await async_client.delete(f"/users/{patient.id}")
        assert res.status_code == 403

    async def test_double_delete_second_is_404(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        uid = await _create_patient(async_client, token, "doubledel")
        await async_client.delete(f"/users/{uid}", headers=auth(token))
        res = await async_client.delete(f"/users/{uid}", headers=auth(token))
        assert res.status_code == 404

    async def test_deleted_user_cannot_login(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        email, password = "deleted.login@test.com", "password123"
        res = await async_client.post(
            "/users", json={"email": email, "password": password}, headers=auth(token)
        )
        uid = res.json()["id"]
        await async_client.delete(f"/users/{uid}", headers=auth(token))
        login_res = await async_client.post(
            "/auth/login", json={"email": email, "password": password}
        )
        assert login_res.status_code == 401
