"""Integration tests for /logs endpoints."""
import pytest
from httpx import AsyncClient

from app.models.medication_log import MedicationLog
from app.models.user import User


class TestCreateLog:
    async def test_create_log_success(
        self,
        async_client: AsyncClient,
        patient_user: tuple[User, str],
    ):
        _, token = patient_user
        res = await async_client.post(
            "/logs",
            json={
                "medication_name": "Metformin",
                "confidence": 0.91,
                "verified": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 201
        body = res.json()
        assert body["medication_name"] == "Metformin"
        assert body["confidence"] == 0.91
        assert body["verified"] is True
        assert "id" in body
        assert "timestamp" in body

    async def test_create_log_no_auth_returns_403(self, async_client: AsyncClient):
        res = await async_client.post(
            "/logs",
            json={"medication_name": "X", "confidence": 0.5, "verified": False},
        )
        assert res.status_code == 403

    async def test_create_log_invalid_confidence_returns_422(
        self,
        async_client: AsyncClient,
        patient_user: tuple[User, str],
    ):
        _, token = patient_user
        res = await async_client.post(
            "/logs",
            json={"medication_name": "X", "confidence": 2.5, "verified": False},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 422


class TestListAllLogs:
    async def test_admin_can_list_all_logs(
        self,
        async_client: AsyncClient,
        admin_user: tuple[User, str],
        sample_log: MedicationLog,
    ):
        _, admin_token = admin_user
        res = await async_client.get(
            "/logs",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        ids = [l["id"] for l in res.json()]
        assert sample_log.id in ids

    async def test_patient_cannot_list_all_logs(
        self,
        async_client: AsyncClient,
        patient_user: tuple[User, str],
    ):
        _, token = patient_user
        res = await async_client.get(
            "/logs",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403


class TestPatientLogs:
    async def test_patient_sees_own_logs(
        self,
        async_client: AsyncClient,
        patient_user: tuple[User, str],
        sample_log: MedicationLog,
    ):
        user, token = patient_user
        res = await async_client.get(
            f"/logs/{user.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        ids = [l["id"] for l in res.json()]
        assert sample_log.id in ids

    async def test_admin_sees_any_patient_logs(
        self,
        async_client: AsyncClient,
        admin_user: tuple[User, str],
        patient_user: tuple[User, str],
        sample_log: MedicationLog,
    ):
        patient, _ = patient_user
        _, admin_token = admin_user
        res = await async_client.get(
            f"/logs/{patient.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200

    async def test_patient_cannot_see_other_patient_logs(
        self,
        async_client: AsyncClient,
        patient_user: tuple[User, str],
        admin_user: tuple[User, str],
    ):
        _, patient_token = patient_user
        admin, _ = admin_user
        res = await async_client.get(
            f"/logs/{admin.id}",
            headers={"Authorization": f"Bearer {patient_token}"},
        )
        assert res.status_code == 403
