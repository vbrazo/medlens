"""Integration tests for /analytics/* endpoints."""
import pytest
from httpx import AsyncClient

from app.models.user import User


class TestOverview:
    async def test_admin_gets_overview(
        self,
        async_client: AsyncClient,
        admin_user: tuple[User, str],
    ):
        _, token = admin_user
        res = await async_client.get(
            "/analytics/overview",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        body = res.json()
        assert "total_patients" in body
        assert "total_scans" in body
        assert "avg_adherence" in body
        assert "total_missed" in body

    async def test_patient_cannot_get_overview(
        self,
        async_client: AsyncClient,
        patient_user: tuple[User, str],
    ):
        _, token = patient_user
        res = await async_client.get(
            "/analytics/overview",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403

    async def test_unauthenticated_returns_403(self, async_client: AsyncClient):
        res = await async_client.get("/analytics/overview")
        assert res.status_code == 403


class TestAdherence:
    async def test_returns_adherence_shape(
        self,
        async_client: AsyncClient,
        admin_user: tuple[User, str],
    ):
        _, token = admin_user
        res = await async_client.get(
            "/analytics/adherence",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        body = res.json()
        assert "weekly_adherence" in body
        assert "missed_doses" in body
        assert "total_scans" in body
        assert "verified_scans" in body
        assert 0.0 <= body["weekly_adherence"] <= 1.0


class TestWeeklyTrend:
    async def test_returns_seven_daily_points(
        self,
        async_client: AsyncClient,
        admin_user: tuple[User, str],
    ):
        _, token = admin_user
        res = await async_client.get(
            "/analytics/weekly",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        points = res.json()
        assert len(points) == 7

    async def test_daily_points_have_correct_fields(
        self,
        async_client: AsyncClient,
        admin_user: tuple[User, str],
    ):
        _, token = admin_user
        res = await async_client.get(
            "/analytics/weekly",
            headers={"Authorization": f"Bearer {token}"},
        )
        point = res.json()[0]
        assert "date" in point
        assert "adherence" in point
        assert "scans" in point
        assert "missed" in point
        assert point["date"] == "Mon"

    async def test_adherence_values_in_range(
        self,
        async_client: AsyncClient,
        admin_user: tuple[User, str],
    ):
        _, token = admin_user
        res = await async_client.get(
            "/analytics/weekly",
            headers={"Authorization": f"Bearer {token}"},
        )
        for point in res.json():
            assert 0.0 <= point["adherence"] <= 1.0


class TestPatientAnalytics:
    async def test_admin_gets_patient_adherence(
        self,
        async_client: AsyncClient,
        admin_user: tuple[User, str],
        patient_user: tuple[User, str],
    ):
        patient, _ = patient_user
        _, admin_token = admin_user
        res = await async_client.get(
            f"/analytics/patient/{patient.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        assert "weekly_adherence" in res.json()

    async def test_patient_gets_own_adherence(
        self,
        async_client: AsyncClient,
        patient_user: tuple[User, str],
    ):
        user, token = patient_user
        res = await async_client.get(
            f"/analytics/patient/{user.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200

    async def test_patient_cannot_get_other_patient_analytics(
        self,
        async_client: AsyncClient,
        patient_user: tuple[User, str],
        admin_user: tuple[User, str],
    ):
        _, patient_token = patient_user
        admin, _ = admin_user
        res = await async_client.get(
            f"/analytics/patient/{admin.id}",
            headers={"Authorization": f"Bearer {patient_token}"},
        )
        assert res.status_code == 403

    async def test_patient_weekly_returns_seven_points(
        self,
        async_client: AsyncClient,
        patient_user: tuple[User, str],
    ):
        user, token = patient_user
        res = await async_client.get(
            f"/analytics/patient/{user.id}/weekly",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        assert len(res.json()) == 7
