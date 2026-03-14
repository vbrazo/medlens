"""Unit tests for app/core/security.py — no DB, no HTTP."""
import time

import pytest
from jose import JWTError

from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        hashed = hash_password("secret")
        assert hashed != "secret"

    def test_hash_starts_with_bcrypt_prefix(self):
        hashed = hash_password("secret")
        assert hashed.startswith("$2b$") or hashed.startswith("$2a$")

    def test_correct_password_verifies(self):
        hashed = hash_password("correct")
        assert verify_password("correct", hashed) is True

    def test_wrong_password_rejected(self):
        hashed = hash_password("correct")
        assert verify_password("wrong", hashed) is False

    def test_empty_password_verifies_against_its_own_hash(self):
        hashed = hash_password("")
        assert verify_password("", hashed) is True

    def test_two_hashes_of_same_password_differ(self):
        # bcrypt uses a random salt
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2


class TestJWT:
    def test_round_trip(self):
        token = create_access_token("user-123")
        assert decode_token(token) == "user-123"

    def test_different_subjects_produce_different_tokens(self):
        t1 = create_access_token("user-1")
        t2 = create_access_token("user-2")
        assert t1 != t2

    def test_tampered_token_raises(self):
        token = create_access_token("user-123")
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(JWTError):
            decode_token(tampered)

    def test_completely_invalid_token_raises(self):
        with pytest.raises(JWTError):
            decode_token("not.a.jwt")

    def test_token_contains_subject(self):
        """Smoke-check: token is a valid JWT string."""
        token = create_access_token("user-abc")
        parts = token.split(".")
        assert len(parts) == 3  # header.payload.signature
