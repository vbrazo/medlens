"""Integration tests for GET /users/me and GET /users."""
import pytest
from httpx import AsyncClient

from app.models.user import User


class TestMe:
    async def test_me_returns_own_profile(
        self,
        async_client: AsyncClient,
        patient_user: tuple[User, str],
    ):
        user, token = patient_user
        res = await async_client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["id"] == user.id
        assert body["email"] == user.email
        assert body["role"] == "patient"

    async def test_me_no_token_returns_403(self, async_client: AsyncClient):
        res = await async_client.get("/users/me")
        assert res.status_code == 403

    async def test_me_invalid_token_returns_401(self, async_client: AsyncClient):
        res = await async_client.get(
            "/users/me",
            headers={"Authorization": "Bearer bad.token.here"},
        )
        assert res.status_code == 401


class TestListPatients:
    async def test_admin_can_list_patients(
        self,
        async_client: AsyncClient,
        admin_user: tuple[User, str],
        patient_user: tuple[User, str],
    ):
        _, admin_token = admin_user
        patient, _ = patient_user
        res = await async_client.get(
            "/users",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        ids = [p["id"] for p in res.json()]
        assert patient.id in ids

    async def test_patient_cannot_list_users(
        self,
        async_client: AsyncClient,
        patient_user: tuple[User, str],
    ):
        _, token = patient_user
        res = await async_client.get(
            "/users",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403

    async def test_list_includes_summary_fields(
        self,
        async_client: AsyncClient,
        admin_user: tuple[User, str],
        patient_user: tuple[User, str],
    ):
        _, admin_token = admin_user
        res = await async_client.get(
            "/users",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        if res.json():
            p = res.json()[0]
            assert "total_scans" in p
            assert "adherence_rate" in p
            assert "missed_doses" in p
