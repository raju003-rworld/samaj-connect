"""SAMAJ CONNECT — FastAPI backend.

Provides Phase 1 REST APIs:
- Phone-OTP auth (dev OTP = 123456)
- Society Members CRUD + search
- Social Feed (posts, likes, comments)
- Events (create, register, list)
- Admin stats + member management
"""

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os
import uuid
import logging
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("samaj")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ.get("JWT_SECRET", "samaj-connect-dev-secret-change-me")
JWT_ALGO = "HS256"
JWT_TTL_DAYS = 30
DEV_OTP = "123456"
# First phone that logs in becomes super admin. Set via env to lock a specific admin.
SEED_ADMIN_PHONE = os.environ.get("SEED_ADMIN_PHONE", "").strip()

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Samaj Connect API")
api = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_TTL_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(cred: Optional[HTTPAuthorizationCredentials] = Depends(bearer)):
    if not cred:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        data = jwt.decode(cred.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        user = await db.users.find_one({"id": data["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid session")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_admin(user=Depends(get_current_user)):
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ---------- Models ----------
class OTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)


class OTPVerify(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None


class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    phone: str
    name: str
    role: str
    profilePhoto: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    memberId: Optional[str] = None


class MemberIn(BaseModel):
    name: str
    mobile: str
    village: Optional[str] = ""
    address: Optional[str] = ""
    dob: Optional[str] = ""
    bloodGroup: Optional[str] = ""
    education: Optional[str] = ""
    email: Optional[str] = ""
    father: Optional[str] = ""
    mother: Optional[str] = ""
    gender: Optional[str] = ""
    maritalStatus: Optional[str] = ""
    district: Optional[str] = ""
    profilePhoto: Optional[str] = ""


class PostIn(BaseModel):
    content: str
    imageUrls: List[str] = []


class CommentIn(BaseModel):
    content: str


class EventIn(BaseModel):
    title: str
    description: str = ""
    eventImage: str = ""
    location: str = ""
    date: str  # ISO date string
    startTime: str = ""
    endTime: str = ""


# ---------- Auth ----------
@api.post("/auth/send-otp")
async def send_otp(body: OTPRequest):
    # DEV: always 123456. In prod, call SMS provider here.
    return {"ok": True, "message": "OTP sent (dev mode). Use 123456.", "phone": body.phone}


@api.post("/auth/verify-otp")
async def verify_otp(body: OTPVerify):
    if body.otp != DEV_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    user = await db.users.find_one({"phone": body.phone}, {"_id": 0})
    if not user:
        total = await db.users.count_documents({})
        role = "super_admin" if (total == 0 or (SEED_ADMIN_PHONE and body.phone == SEED_ADMIN_PHONE)) else "member"
        user = {
            "id": new_id(),
            "phone": body.phone,
            "name": body.name or f"Member {body.phone[-4:]}",
            "role": role,
            "profilePhoto": "",
            "village": "",
            "district": "",
            "memberId": None,
            "createdAt": now_iso(),
        }
        await db.users.insert_one(dict(user))
        user.pop("_id", None)
    token = make_token(user["id"])
    return {"token": token, "user": UserOut(**user).model_dump()}


@api.get("/auth/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return UserOut(**user)


@api.patch("/auth/me")
async def update_me(patch: dict, user=Depends(get_current_user)):
    allowed = {"name", "profilePhoto", "village", "district"}
    upd = {k: v for k, v in patch.items() if k in allowed}
    if upd:
        await db.users.update_one({"id": user["id"]}, {"$set": upd})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return UserOut(**fresh)


# ---------- Members ----------
@api.post("/members")
async def create_member(m: MemberIn, user=Depends(get_current_user)):
    existing = await db.members.find_one({"mobile": m.mobile})
    if existing:
        raise HTTPException(status_code=400, detail="આ મોબાઇલ નંબર પહેલેથી નોંધાયેલ છે")
    doc = m.model_dump()
    doc.update({
        "id": new_id(),
        "createdAt": now_iso(),
        "createdBy": user["id"],
        "createdByPhone": user["phone"],
        "isActive": True,
    })
    await db.members.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api.get("/members")
async def list_members(
    q: Optional[str] = None,
    village: Optional[str] = None,
    district: Optional[str] = None,
    bloodGroup: Optional[str] = None,
    gender: Optional[str] = None,
    limit: int = Query(50, le=200),
    skip: int = 0,
    user=Depends(get_current_user),
):
    query: dict = {"isActive": True}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"mobile": {"$regex": q, "$options": "i"}},
            {"village": {"$regex": q, "$options": "i"}},
            {"district": {"$regex": q, "$options": "i"}},
            {"education": {"$regex": q, "$options": "i"}},
        ]
    if village:
        query["village"] = {"$regex": f"^{village}$", "$options": "i"}
    if district:
        query["district"] = {"$regex": f"^{district}$", "$options": "i"}
    if bloodGroup:
        query["bloodGroup"] = bloodGroup
    if gender:
        query["gender"] = gender
    cursor = db.members.find(query, {"_id": 0}).sort("createdAt", -1).skip(skip).limit(limit)
    items = await cursor.to_list(limit)
    total = await db.members.count_documents(query)
    return {"items": items, "total": total}


@api.get("/members/{mid}")
async def get_member(mid: str, user=Depends(get_current_user)):
    m = await db.members.find_one({"id": mid}, {"_id": 0})
    if not m:
        raise HTTPException(status_code=404, detail="સભ્ય મળ્યા નહીં")
    return m


@api.put("/members/{mid}")
async def update_member(mid: str, patch: dict, user=Depends(get_current_user)):
    m = await db.members.find_one({"id": mid})
    if not m:
        raise HTTPException(status_code=404, detail="સભ્ય મળ્યા નહીં")
    if m.get("createdBy") != user["id"] and user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not allowed")
    allowed = {"name", "mobile", "village", "address", "dob", "bloodGroup", "education",
               "email", "father", "mother", "gender", "maritalStatus", "district", "profilePhoto"}
    upd = {k: v for k, v in patch.items() if k in allowed}
    if upd:
        await db.members.update_one({"id": mid}, {"$set": upd})
    fresh = await db.members.find_one({"id": mid}, {"_id": 0})
    return fresh


@api.delete("/members/{mid}")
async def delete_member(mid: str, admin=Depends(require_admin)):
    await db.members.update_one({"id": mid}, {"$set": {"isActive": False}})
    return {"ok": True}


# ---------- Posts / Social ----------
@api.post("/posts")
async def create_post(p: PostIn, user=Depends(get_current_user)):
    doc = {
        "id": new_id(),
        "authorId": user["id"],
        "authorName": user["name"],
        "authorPhoto": user.get("profilePhoto", ""),
        "content": p.content,
        "imageUrls": p.imageUrls,
        "createdAt": now_iso(),
        "likesCount": 0,
        "commentsCount": 0,
        "likedBy": [],
        "isActive": True,
    }
    await db.posts.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api.get("/posts")
async def list_posts(limit: int = Query(20, le=100), skip: int = 0, user=Depends(get_current_user)):
    cursor = db.posts.find({"isActive": True}, {"_id": 0}).sort("createdAt", -1).skip(skip).limit(limit)
    items = await cursor.to_list(limit)
    for it in items:
        it["likedByMe"] = user["id"] in it.get("likedBy", [])
    return {"items": items}


@api.post("/posts/{pid}/like")
async def like_post(pid: str, user=Depends(get_current_user)):
    post = await db.posts.find_one({"id": pid})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    liked = user["id"] in post.get("likedBy", [])
    if liked:
        await db.posts.update_one({"id": pid}, {"$pull": {"likedBy": user["id"]}, "$inc": {"likesCount": -1}})
    else:
        await db.posts.update_one({"id": pid}, {"$addToSet": {"likedBy": user["id"]}, "$inc": {"likesCount": 1}})
    fresh = await db.posts.find_one({"id": pid}, {"_id": 0})
    fresh["likedByMe"] = not liked
    return fresh


@api.post("/posts/{pid}/comments")
async def add_comment(pid: str, c: CommentIn, user=Depends(get_current_user)):
    post = await db.posts.find_one({"id": pid})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    doc = {
        "id": new_id(),
        "postId": pid,
        "authorId": user["id"],
        "authorName": user["name"],
        "authorPhoto": user.get("profilePhoto", ""),
        "content": c.content,
        "createdAt": now_iso(),
    }
    await db.comments.insert_one(dict(doc))
    await db.posts.update_one({"id": pid}, {"$inc": {"commentsCount": 1}})
    doc.pop("_id", None)
    return doc


@api.get("/posts/{pid}/comments")
async def list_comments(pid: str, user=Depends(get_current_user)):
    cursor = db.comments.find({"postId": pid}, {"_id": 0}).sort("createdAt", 1)
    return {"items": await cursor.to_list(500)}


@api.delete("/posts/{pid}")
async def delete_post(pid: str, user=Depends(get_current_user)):
    post = await db.posts.find_one({"id": pid})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["authorId"] != user["id"] and user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.posts.update_one({"id": pid}, {"$set": {"isActive": False}})
    return {"ok": True}


# ---------- Events ----------
@api.post("/events")
async def create_event(e: EventIn, user=Depends(get_current_user)):
    doc = e.model_dump()
    doc.update({
        "id": new_id(),
        "createdBy": user["id"],
        "createdByName": user["name"],
        "createdAt": now_iso(),
        "registrations": [],
    })
    await db.events.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api.get("/events")
async def list_events(filter: Literal["upcoming", "past", "mine"] = "upcoming", user=Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    if filter == "mine":
        query = {"createdBy": user["id"]}
    elif filter == "past":
        query = {"date": {"$lt": today}}
    else:
        query = {"date": {"$gte": today}}
    cursor = db.events.find(query, {"_id": 0}).sort("date", 1 if filter != "past" else -1)
    items = await cursor.to_list(200)
    for it in items:
        it["registeredByMe"] = user["id"] in it.get("registrations", [])
        it["registrationCount"] = len(it.get("registrations", []))
    return {"items": items}


@api.get("/events/{eid}")
async def get_event(eid: str, user=Depends(get_current_user)):
    e = await db.events.find_one({"id": eid}, {"_id": 0})
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    e["registeredByMe"] = user["id"] in e.get("registrations", [])
    e["registrationCount"] = len(e.get("registrations", []))
    return e


@api.post("/events/{eid}/register")
async def register_event(eid: str, user=Depends(get_current_user)):
    e = await db.events.find_one({"id": eid})
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    if user["id"] in e.get("registrations", []):
        await db.events.update_one({"id": eid}, {"$pull": {"registrations": user["id"]}})
        return {"registered": False}
    await db.events.update_one({"id": eid}, {"$addToSet": {"registrations": user["id"]}})
    return {"registered": True}


@api.delete("/events/{eid}")
async def delete_event(eid: str, user=Depends(get_current_user)):
    e = await db.events.find_one({"id": eid})
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    if e["createdBy"] != user["id"] and user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.events.delete_one({"id": eid})
    return {"ok": True}


# ---------- Admin ----------
@api.get("/admin/stats")
async def admin_stats(admin=Depends(require_admin)):
    return {
        "members": await db.members.count_documents({"isActive": True}),
        "users": await db.users.count_documents({}),
        "posts": await db.posts.count_documents({"isActive": True}),
        "events": await db.events.count_documents({}),
        "comments": await db.comments.count_documents({}),
    }


@api.get("/admin/members")
async def admin_members(admin=Depends(require_admin), q: Optional[str] = None):
    query: dict = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"mobile": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.members.find(query, {"_id": 0}).sort("createdAt", -1).limit(500)
    return {"items": await cursor.to_list(500)}


@api.patch("/admin/members/{mid}/toggle-active")
async def toggle_member(mid: str, admin=Depends(require_admin)):
    m = await db.members.find_one({"id": mid})
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    await db.members.update_one({"id": mid}, {"$set": {"isActive": not m.get("isActive", True)}})
    return {"ok": True}


@api.patch("/admin/users/{uid}/role")
async def set_role(uid: str, body: dict, admin=Depends(require_admin)):
    role = body.get("role")
    if role not in ("member", "moderator", "admin", "super_admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    await db.users.update_one({"id": uid}, {"$set": {"role": role}})
    return {"ok": True}


@api.get("/")
async def root():
    return {"app": "Samaj Connect", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
