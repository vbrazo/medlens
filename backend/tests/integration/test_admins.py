"""
Integration tests for admin user management.

GET  /users?role=admin  — paginated admin listing
POST /users             — create admin (role=admin)
PUT  /users/{id}        — update admin
DELETE /users/{id}      — delete admin (self-delete blocked)

Admin listing must be isolated from patient listing and vice-versa.
"""
import pytest
from httpx import AsyncClient

from app.models.user import User


# ─── helpers ─────────────────────────────────────────────────────────────────

def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _create_admin(client: AsyncClient, admin_token: str, suffix: str) -> dict:
    """Admin creates another admin; returns the full response body."""
    res = await client.post(
        "/users",
        json={"email": f"admin2.{suffix}@test.com", "password": "password123", "role": "admin"},
        headers=auth(admin_token),
    )
    assert res.status_code == 201, res.text
    return res.json()


async def _create_patient(client: AsyncClient, admin_token: str, suffix: str) -> dict:
    """Admin creates a patient; returns the full response body."""
    res = await client.post(
        "/users",
        json={"email": f"pat.{suffix}@test.com", "password": "password123", "role": "patient"},
        headers=auth(admin_token),
    )
    assert res.status_code == 201, res.text
    return res.json()


# ─── GET /users?role=admin ────────────────────────────────────────────────────

class TestListAdmins:
    async def test_returns_paginated_shape(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.get("/users?role=admin", headers=auth(token))
        assert res.status_code == 200
        body = res.json()
        for key in ("items", "total", "page", "page_size", "pages"):
            assert key in body, f"Missing key: {key}"

    async def test_created_admin_appears_in_admin_list(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        new_admin = await _create_admin(async_client, token, "appears")
        body = (
            await async_client.get("/users?role=admin&page_size=100", headers=auth(token))
        ).json()
        ids = [u["id"] for u in body["items"]]
        assert new_admin["id"] in ids

    async def test_admin_does_not_appear_in_patient_list(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        new_admin = await _create_admin(async_client, token, "notinpatients")
        body = (
            await async_client.get("/users?role=patient&page_size=100", headers=auth(token))
        ).json()
        ids = [u["id"] for u in body["items"]]
        assert new_admin["id"] not in ids

    async def test_patient_does_not_appear_in_admin_list(
        self, async_client: AsyncClient, admin_user: tuple[User, str], patient_user: tuple[User, str]
    ):
        _, token = admin_user
        patient, _ = patient_user
        body = (
            await async_client.get("/users?role=admin&page_size=100", headers=auth(token))
        ).json()
        ids = [u["id"] for u in body["items"]]
        assert patient.id not in ids

    async def test_role_field_is_admin_in_items(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        await _create_admin(async_client, token, "rolefield")
        body = (
            await async_client.get("/users?role=admin&page_size=100", headers=auth(token))
        ).json()
        for item in body["items"]:
            assert item["role"] == "admin"

    async def test_default_role_is_patient(
        self, async_client: AsyncClient, admin_user: tuple[User, str], patient_user: tuple[User, str]
    ):
        """GET /users without role param must return patients (backward compat)."""
        _, token = admin_user
        patient, _ = patient_user
        body = (await async_client.get("/users?page_size=100", headers=auth(token))).json()
        ids = [u["id"] for u in body["items"]]
        assert patient.id in ids

    async def test_patient_cannot_list_admins(
        self, async_client: AsyncClient, patient_user: tuple[User, str]
    ):
        _, token = patient_user
        res = await async_client.get("/users?role=admin", headers=auth(token))
        assert res.status_code == 403

    async def test_unauthenticated_returns_403(self, async_client: AsyncClient):
        res = await async_client.get("/users?role=admin")
        assert res.status_code == 403

    async def test_page_size_limits_results(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        for i in range(3):
            await _create_admin(async_client, token, f"limit{i}")
        body = (
            await async_client.get("/users?role=admin&page_size=2", headers=auth(token))
        ).json()
        assert len(body["items"]) <= 2

    async def test_pagination_page_zero_returns_422(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.get("/users?role=admin&page=0", headers=auth(token))
        assert res.status_code == 422

    async def test_pagination_page_size_over_max_returns_422(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.get("/users?role=admin&page_size=101", headers=auth(token))
        assert res.status_code == 422

    async def test_pages_calculation(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        for i in range(4):
            await _create_admin(async_client, token, f"pages{i}")
        body = (
            await async_client.get("/users?role=admin&page_size=1", headers=auth(token))
        ).json()
        assert body["pages"] >= 4
        assert body["pages"] == body["total"]


# ─── POST /users with role=admin (create admin) ───────────────────────────────

class TestCreateAdmin:
    async def test_success_returns_201_with_admin_role(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.post(
            "/users",
            json={"email": "newadmin@test.com", "password": "password123", "role": "admin"},
            headers=auth(token),
        )
        assert res.status_code == 201
        assert res.json()["role"] == "admin"
        assert "password_hash" not in res.json()

    async def test_created_admin_can_login(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        email, pw = "adminlogin@test.com", "password123"
        await async_client.post(
            "/users",
            json={"email": email, "password": pw, "role": "admin"},
            headers=auth(token),
        )
        res = await async_client.post("/auth/login", json={"email": email, "password": pw})
        assert res.status_code == 200
        assert "access_token" in res.json()

    async def test_created_admin_can_access_admin_endpoints(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        """A newly created admin should be able to call admin-only routes."""
        _, token = admin_user
        email, pw = "newaccessadmin@test.com", "password123"
        await async_client.post(
            "/users",
            json={"email": email, "password": pw, "role": "admin"},
            headers=auth(token),
        )
        login = await async_client.post("/auth/login", json={"email": email, "password": pw})
        new_token = login.json()["access_token"]
        res = await async_client.get("/users?role=admin", headers=auth(new_token))
        assert res.status_code == 200

    async def test_duplicate_email_returns_409(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        payload = {"email": "dupadmin@test.com", "password": "password123", "role": "admin"}
        await async_client.post("/users", json=payload, headers=auth(token))
        res = await async_client.post("/users", json=payload, headers=auth(token))
        assert res.status_code == 409

    async def test_invalid_email_returns_422(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.post(
            "/users",
            json={"email": "not-an-email", "password": "password123", "role": "admin"},
            headers=auth(token),
        )
        assert res.status_code == 422

    async def test_short_password_returns_422(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.post(
            "/users",
            json={"email": "adminshortpw@test.com", "password": "short", "role": "admin"},
            headers=auth(token),
        )
        assert res.status_code == 422

    async def test_patient_cannot_create_admin(
        self, async_client: AsyncClient, patient_user: tuple[User, str]
    ):
        _, token = patient_user
        res = await async_client.post(
            "/users",
            json={"email": "forbidden@test.com", "password": "password123", "role": "admin"},
            headers=auth(token),
        )
        assert res.status_code == 403


# ─── PUT /users/{id} for admin users ─────────────────────────────────────────

class TestUpdateAdmin:
    async def test_update_admin_email(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        target = await _create_admin(async_client, token, "updemail")
        res = await async_client.put(
            f"/users/{target['id']}",
            json={"email": "adminupdated@test.com"},
            headers=auth(token),
        )
        assert res.status_code == 200
        assert res.json()["email"] == "adminupdated@test.com"

    async def test_update_admin_role_to_patient(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        """Demoting an admin to patient should move them out of the admin list."""
        _, token = admin_user
        target = await _create_admin(async_client, token, "demote")
        await async_client.put(
            f"/users/{target['id']}", json={"role": "patient"}, headers=auth(token)
        )
        # Should no longer appear in admin list
        body = (
            await async_client.get("/users?role=admin&page_size=100", headers=auth(token))
        ).json()
        ids = [u["id"] for u in body["items"]]
        assert target["id"] not in ids
        # Should now appear in patient list
        body2 = (
            await async_client.get("/users?role=patient&page_size=100", headers=auth(token))
        ).json()
        ids2 = [u["id"] for u in body2["items"]]
        assert target["id"] in ids2

    async def test_reset_admin_password(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        email = "adminpwreset@test.com"
        target = await _create_admin(async_client, token, "pwreset")
        await async_client.put(
            f"/users/{target['id']}", json={"email": email}, headers=auth(token)
        )
        new_pw = "newadminpass99"
        await async_client.put(
            f"/users/{target['id']}", json={"password": new_pw}, headers=auth(token)
        )
        res = await async_client.post("/auth/login", json={"email": email, "password": new_pw})
        assert res.status_code == 200

    async def test_email_conflict_returns_409(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        a1 = await _create_admin(async_client, token, "conflict1a")
        await _create_admin(async_client, token, "conflict2a")
        res = await async_client.put(
            f"/users/{a1['id']}",
            json={"email": f"admin2.conflict2a@test.com"},
            headers=auth(token),
        )
        assert res.status_code == 409

    async def test_not_found_returns_404(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.put(
            "/users/ghost-admin-id", json={"email": "x@test.com"}, headers=auth(token)
        )
        assert res.status_code == 404

    async def test_patient_cannot_update_admin(
        self, async_client: AsyncClient, patient_user: tuple[User, str], admin_user: tuple[User, str]
    ):
        admin, _ = admin_user
        _, patient_token = patient_user
        res = await async_client.put(
            f"/users/{admin.id}", json={"email": "hacked@test.com"}, headers=auth(patient_token)
        )
        assert res.status_code == 403


# ─── DELETE /users/{id} for admin users ──────────────────────────────────────

class TestDeleteAdmin:
    async def test_admin_deletes_another_admin(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        target = await _create_admin(async_client, token, "del1")
        res = await async_client.delete(f"/users/{target['id']}", headers=auth(token))
        assert res.status_code == 204

    async def test_deleted_admin_not_in_list(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        target = await _create_admin(async_client, token, "delgone")
        await async_client.delete(f"/users/{target['id']}", headers=auth(token))
        body = (
            await async_client.get("/users?role=admin&page_size=100", headers=auth(token))
        ).json()
        ids = [u["id"] for u in body["items"]]
        assert target["id"] not in ids

    async def test_deleted_admin_cannot_login(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        email, pw = "deletedadmin@test.com", "password123"
        target = await _create_admin(async_client, token, "logincheck")
        await async_client.put(
            f"/users/{target['id']}", json={"email": email}, headers=auth(token)
        )
        await async_client.delete(f"/users/{target['id']}", headers=auth(token))
        res = await async_client.post("/auth/login", json={"email": email, "password": pw})
        assert res.status_code == 401

    async def test_admin_cannot_delete_self(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        admin, token = admin_user
        res = await async_client.delete(f"/users/{admin.id}", headers=auth(token))
        assert res.status_code == 400

    async def test_not_found_returns_404(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        res = await async_client.delete("/users/ghost-admin-xyz", headers=auth(token))
        assert res.status_code == 404

    async def test_double_delete_second_is_404(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        _, token = admin_user
        target = await _create_admin(async_client, token, "doubledel")
        await async_client.delete(f"/users/{target['id']}", headers=auth(token))
        res = await async_client.delete(f"/users/{target['id']}", headers=auth(token))
        assert res.status_code == 404

    async def test_patient_cannot_delete_admin(
        self, async_client: AsyncClient, patient_user: tuple[User, str], admin_user: tuple[User, str]
    ):
        admin, _ = admin_user
        _, patient_token = patient_user
        res = await async_client.delete(f"/users/{admin.id}", headers=auth(patient_token))
        assert res.status_code == 403

    async def test_unauthenticated_returns_403(
        self, async_client: AsyncClient, admin_user: tuple[User, str]
    ):
        admin, _ = admin_user
        res = await async_client.delete(f"/users/{admin.id}")
        assert res.status_code == 403
