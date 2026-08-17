"""JWT auth: password hashing, tokens, current-user dependency, and auth router."""
import os
import uuid
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr

from database import get_db

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(hours=12)}
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def _set_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="none", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    db = get_db()
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterBody(BaseModel):
    name: str
    email: EmailStr
    password: str
    org_name: str | None = None


class LoginBody(BaseModel):
    email: EmailStr
    password: str


async def _public_user(db, user: dict) -> dict:
    org = await db.organizations.find_one({"id": user["org_id"]}, {"_id": 0})
    u = {k: v for k, v in user.items() if k not in ("_id", "password_hash")}
    u["organization"] = org
    return u


@router.post("/register")
async def register(body: RegisterBody, response: Response):
    db = get_db()
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    org_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.organizations.insert_one({
        "id": org_id, "name": body.org_name or f"{body.name}'s Workspace",
        "plan": "free", "ai_credits_used": 0, "created_at": now,
    })
    user_id = str(uuid.uuid4())
    user = {"id": user_id, "email": email, "password_hash": hash_password(body.password),
            "name": body.name, "org_id": org_id, "role": "owner", "created_at": now}
    await db.users.insert_one(user)
    _set_cookies(response, create_access_token(user_id, email), create_refresh_token(user_id))
    return await _public_user(db, user)


async def _locked(db, identifier: str) -> bool:
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if not rec:
        return False
    if rec.get("count", 0) >= 5 and rec.get("locked_until"):
        return datetime.fromisoformat(rec["locked_until"]) > datetime.now(timezone.utc)
    return False


@router.post("/login")
async def login(body: LoginBody, request: Request, response: Response):
    db = get_db()
    email = body.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    if await _locked(db, identifier):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        until = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": until}}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    _set_cookies(response, create_access_token(user["id"], email), create_refresh_token(user["id"]))
    return await _public_user(db, user)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    db = get_db()
    full = await db.users.find_one({"id": user["id"]})
    return await _public_user(db, full)
