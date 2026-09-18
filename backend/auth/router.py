import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.database import get_db, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class SignUpRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=1, max_length=128)


def _create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO auth_sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
            (token, user_id, expires_at),
        )
    return token


def _auth_response(user: dict) -> dict:
    return {
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
        "token": _create_session(user["id"]),
    }


def _normalise_email(email: str) -> str:
    email = email.strip().lower()
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    return email


@router.post("/signup", status_code=201)
def signup(data: SignUpRequest):
    name = data.name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Please enter your name.")

    with get_db() as conn:
        try:
            cursor = conn.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                (name, _normalise_email(data.email), hash_password(data.password)),
            )
        except Exception as exc:
            if "unique" in str(exc).lower():
                raise HTTPException(status_code=409, detail="An account already exists for this email. Sign in instead.") from exc
            raise
        user = {"id": cursor.lastrowid, "name": name, "email": _normalise_email(data.email)}
    return {"success": True, **_auth_response(user)}


@router.post("/login")
def login(data: LoginRequest):
    with get_db() as conn:
        user = conn.execute(
            "SELECT id, name, email, password_hash FROM users WHERE email = ?",
            (_normalise_email(data.email),),
        ).fetchone()
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    return {"success": True, **_auth_response(dict(user))}
