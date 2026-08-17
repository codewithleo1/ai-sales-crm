"""Team management with RBAC: list, invite, change role, remove members."""
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from auth import get_current_user, hash_password
from database import get_db

router = APIRouter(prefix="/api/team", tags=["team"])

ROLES = ["owner", "admin", "member", "viewer"]


class InviteBody(BaseModel):
    name: str
    email: EmailStr
    role: str = "member"


class RoleBody(BaseModel):
    role: str


def _require_admin(user: dict):
    if user.get("role") not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/members")
async def members(user: dict = Depends(get_current_user)):
    db = get_db()
    people = await db.users.find({"org_id": user["org_id"]},
                                 {"_id": 0, "password_hash": 0}).to_list(200)
    return {"data": people}


@router.post("/invite", status_code=201)
async def invite(body: InviteBody, user: dict = Depends(get_current_user)):
    _require_admin(user)
    if body.role not in ROLES or body.role == "owner":
        raise HTTPException(status_code=400, detail="Invalid role")
    db = get_db()
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already in use")
    temp_password = secrets.token_urlsafe(9)
    member = {"id": str(uuid.uuid4()), "email": email, "name": body.name,
              "password_hash": hash_password(temp_password), "org_id": user["org_id"],
              "role": body.role, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.insert_one(member)
    return {"data": {"id": member["id"], "email": email, "name": body.name,
                     "role": body.role, "temp_password": temp_password}}


@router.patch("/members/{member_id}")
async def change_role(member_id: str, body: RoleBody, user: dict = Depends(get_current_user)):
    _require_admin(user)
    if body.role not in ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    db = get_db()
    target = await db.users.find_one({"id": member_id, "org_id": user["org_id"]})
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    if target.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Cannot change the owner's role")
    await db.users.update_one({"id": member_id}, {"$set": {"role": body.role}})
    return {"data": {"id": member_id, "role": body.role}}


@router.delete("/members/{member_id}")
async def remove_member(member_id: str, user: dict = Depends(get_current_user)):
    _require_admin(user)
    if member_id == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot remove yourself")
    db = get_db()
    target = await db.users.find_one({"id": member_id, "org_id": user["org_id"]})
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    if target.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove the owner")
    await db.users.delete_one({"id": member_id})
    return {"data": {"deleted": member_id}}
