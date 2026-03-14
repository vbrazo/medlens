"""Integration tests for POST /auth/register and POST /auth/login."""
import pytest
from httpx import AsyncClient


class TestRegister:
    async def test_register_success(self, async_client: AsyncClient):
        res = await async_client.post(
            "/auth/register",
            json={"email": "new@test.com", "password": "pass1234"},
        )
        assert res.status_code == 201
        body = res.json()
        assert body["email"] == "new@test.com"
        assert body["role"] == "patient"
        assert "id" in body
        assert "created_at" in body
        assert "password_hash" not in body

    async def test_register_duplicate_email_returns_409(self, async_client: AsyncClient):
        payload = {"email": "dup@test.com", "password": "pass1234"}
        await async_client.post("/auth/register", json=payload)
        res = await async_client.post("/auth/register", json=payload)
        assert res.status_code == 409

    async def test_register_admin_role(self, async_client: AsyncClient):
        res = await async_client.post(
            "/auth/register",
            json={"email": "admin2@test.com", "password": "pass1234", "role": "admin"},
        )
        assert res.status_code == 201
        assert res.json()["role"] == "admin"

    async def test_register_invalid_email_returns_422(self, async_client: AsyncClient):
        res = await async_client.post(
            "/auth/register",
            json={"email": "not-an-email", "password": "pass1234"},
        )
        assert res.status_code == 422


class TestLogin:
    async def test_login_success(self, async_client: AsyncClient):
        await async_client.post(
            "/auth/register",
            json={"email": "login@test.com", "password": "secret99"},
        )
        res = await async_client.post(
            "/auth/login",
            json={"email": "login@test.com", "password": "secret99"},
        )
        assert res.status_code == 200
        body = res.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert len(body["access_token"]) > 20

    async def test_login_wrong_password_returns_401(self, async_client: AsyncClient):
        await async_client.post(
            "/auth/register",
            json={"email": "wrongpw@test.com", "password": "correct"},
        )
        res = await async_client.post(
            "/auth/login",
            json={"email": "wrongpw@test.com", "password": "wrong"},
        )
        assert res.status_code == 401

    async def test_login_unknown_email_returns_401(self, async_client: AsyncClient):
        res = await async_client.post(
            "/auth/login",
            json={"email": "nobody@test.com", "password": "pass"},
        )
        assert res.status_code == 401

    async def test_login_missing_fields_returns_422(self, async_client: AsyncClient):
        res = await async_client.post("/auth/login", json={"email": "x@test.com"})
        assert res.status_code == 422
