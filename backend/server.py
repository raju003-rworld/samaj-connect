"""SAMAJ CONNECT — FastAPI backend on Firebase (Auth + Firestore + Storage).

Auth: Firebase Phone OTP ID tokens (dev custom-token login when DEV_AUTH_ENABLED=true).
Data: Firestore. All authorization (Samaj isolation + visibility) enforced server-side.
"""
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime, timezone
import os
import logging
from firebase_admin import auth as fb_auth

from core import (db, get_current_user, optional_user, require_admin, is_samaj_admin, is_super, is_event_manager, can_view,
                  resolve_visibility, visible_query_docs, snap_dict, get_doc, stream, now_iso, new_id,
                  ensure_default_samaj, public_access_enabled, DEV_AUTH_ENABLED, DEV_OTP, DEFAULT_SAMAJ_ID,
                  notify_samaj, ROLES)
from routes_social import router as social_router
from routes_chat import router as chat_router
from routes_live import router as live_router
from routes_admin import router as admin_router
from routes_photos import router as photos_router
from routes_booking import router as booking_router

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="Samaj Connect API")
api = APIRouter(prefix="/api")
ensure_default_samaj()


class UserOut(BaseModel):
    id: str
    phone: str = ""
    name: str = ""
    role: str = "member"
    profilePhoto: Optional[str] = ""
    village: Optional[str] = ""
    district: Optional[str] = ""
    bio: Optional[str] = ""
    samajIds: List[str] = []
    samajRoles: dict = {}
    activeSamajId: Optional[str] = None
    followersCount: int = 0
    followingCount: int = 0
    isSuspended: bool = False


def user_out(u: dict) -> dict:
    return UserOut(**{k: v for k, v in u.items() if k in UserOut.model_fields}).model_dump()


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


class EventIn(BaseModel):
    title: str
    description: str = ""
    eventImage: str = ""
    location: str = ""
    date: str
    startTime: str = ""
    endTime: str = ""
    visibility: Optional[str] = "samaj"
    allowedUserIds: List[str] = []


class DevLogin(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None


# ---------- Auth ----------
@api.get("/auth/config")
def auth_config():
    return {"devAuth": DEV_AUTH_ENABLED, "publicAccessEnabled": public_access_enabled()}


@api.post("/auth/dev-login")
def dev_login(body: DevLogin):
    """Dev/test only: returns a Firebase custom token for a phone (OTP 123456). Disabled unless DEV_AUTH_ENABLED."""
    if not DEV_AUTH_ENABLED or body.otp != DEV_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    try:
        fu = fb_auth.get_user_by_phone_number(body.phone)
    except fb_auth.UserNotFoundError:
        fu = fb_auth.create_user(phone_number=body.phone, display_name=body.name or None)
    token = fb_auth.create_custom_token(fu.uid, {"phone": body.phone})
    return {"customToken": token.decode() if isinstance(token, bytes) else token}


@api.get("/auth/me")
def me(user=Depends(get_current_user)):
    return user_out(user)


@api.patch("/auth/me")
def update_me(patch: dict, user=Depends(get_current_user)):
    allowed = {"name", "profilePhoto", "village", "district", "bio"}
    upd = {k: v for k, v in patch.items() if k in allowed}
    if upd:
        db.collection("users").document(user["id"]).update(upd)
    return user_out(get_doc("users", user["id"]))


# ---------- Samaj ----------
@api.get("/samaj")
def list_samaj(user=Depends(get_current_user)):
    items = stream(db.collection("samaj").where("isActive", "==", True))
    return {"items": items, "mine": user.get("samajIds", []), "active": user.get("activeSamajId")}


@api.post("/samaj")
def create_samaj(body: dict, user=Depends(get_current_user)):
    if not is_super(user):
        raise HTTPException(status_code=403, detail="Super admin only")
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name required")
    sid = new_id()
    doc = {"name": name, "nameEn": body.get("nameEn", name), "code": body.get("code", sid[:6].upper()),
           "isActive": True, "requirePostApproval": False, "createdAt": now_iso(), "createdBy": user["id"]}
    db.collection("samaj").document(sid).set(doc)
    return {"id": sid, **doc}


@api.post("/samaj/{sid}/join")
def join_samaj(sid: str, user=Depends(get_current_user)):
    s = get_doc("samaj", sid)
    if not s or not s.get("isActive"):
        raise HTTPException(status_code=404, detail="Samaj not found")
    ids = list(dict.fromkeys(user.get("samajIds", []) + [sid]))
    db.collection("users").document(user["id"]).update({"samajIds": ids, "activeSamajId": sid})
    return user_out(get_doc("users", user["id"]))


@api.post("/samaj/{sid}/activate")
def activate_samaj(sid: str, user=Depends(get_current_user)):
    if sid not in user.get("samajIds", []):
        raise HTTPException(status_code=403, detail="Not a member of this Samaj")
    db.collection("users").document(user["id"]).update({"activeSamajId": sid})
    return user_out(get_doc("users", user["id"]))


# ---------- Members (Firestore collection: persons) ----------
def _member_visible(m: dict, user: dict) -> bool:
    return m.get("samajId", DEFAULT_SAMAJ_ID) == user.get("activeSamajId") or is_super(user)


@api.post("/members")
def create_member(m: MemberIn, user=Depends(get_current_user)):
    sid = user.get("activeSamajId") or DEFAULT_SAMAJ_ID
    dup = stream(db.collection("persons").where("mobile", "==", m.mobile).where("samajId", "==", sid).limit(1))
    if dup:
        raise HTTPException(status_code=400, detail="આ મોબાઇલ નંબર પહેલેથી નોંધાયેલ છે")
    doc = m.model_dump()
    doc.update({"samajId": sid, "createdAt": now_iso(), "createdBy": user["id"], "createdByPhone": user.get("phone", ""), "isActive": True})
    ref = db.collection("persons").document()
    ref.set(doc)
    return {"id": ref.id, **doc}


@api.get("/members")
def list_members(q: Optional[str] = None, village: Optional[str] = None, district: Optional[str] = None,
                 bloodGroup: Optional[str] = None, gender: Optional[str] = None,
                 limit: int = Query(50, le=200), skip: int = 0, user=Depends(get_current_user)):
    sid = user.get("activeSamajId") or DEFAULT_SAMAJ_ID
    items = stream(db.collection("persons").where("samajId", "==", sid).limit(2000))
    if sid == DEFAULT_SAMAJ_ID:  # legacy docs without samajId belong to default samaj
        seen = {i["id"] for i in items}
        items += [d for d in stream(db.collection("persons").limit(2000)) if d["id"] not in seen and not d.get("samajId")]
    items = [m for m in items if m.get("isActive", True)]
    ql = (q or "").lower()
    def match(m):
        if ql and not any(ql in str(m.get(k, "")).lower() for k in ("name", "mobile", "village", "district", "education")):
            return False
        if village and str(m.get("village", "")).lower() != village.lower(): return False
        if district and str(m.get("district", "")).lower() != district.lower(): return False
        if bloodGroup and m.get("bloodGroup") != bloodGroup: return False
        if gender and m.get("gender") != gender: return False
        return True
    items = [m for m in items if match(m)]
    items.sort(key=lambda x: str(x.get("createdAt", "")), reverse=True)
    return {"items": items[skip:skip + limit], "total": len(items)}


@api.get("/members/{mid}")
def get_member(mid: str, user=Depends(get_current_user)):
    m = get_doc("persons", mid)
    if not m or not _member_visible(m, user):
        raise HTTPException(status_code=404, detail="સભ્ય મળ્યા નહીં")
    return m


@api.put("/members/{mid}")
def update_member(mid: str, patch: dict, user=Depends(get_current_user)):
    m = get_doc("persons", mid)
    if not m or not _member_visible(m, user):
        raise HTTPException(status_code=404, detail="સભ્ય મળ્યા નહીં")
    if m.get("createdBy") != user["id"] and not is_samaj_admin(user, m.get("samajId", DEFAULT_SAMAJ_ID)):
        raise HTTPException(status_code=403, detail="Not allowed")
    allowed = {"name", "mobile", "village", "address", "dob", "bloodGroup", "education", "email", "father",
               "mother", "gender", "maritalStatus", "district", "profilePhoto"}
    upd = {k: v for k, v in patch.items() if k in allowed}
    if upd:
        db.collection("persons").document(mid).update(upd)
    return get_doc("persons", mid)


@api.delete("/members/{mid}")
def delete_member(mid: str, admin=Depends(require_admin)):
    m = get_doc("persons", mid)
    if not m or not is_samaj_admin(admin, m.get("samajId", DEFAULT_SAMAJ_ID)):
        raise HTTPException(status_code=403, detail="Not allowed")
    db.collection("persons").document(mid).update({"isActive": False})
    return {"ok": True}


# ---------- Events ----------
def _event_out(e: dict, user: dict) -> dict:
    uid = user["id"]
    e.setdefault("visibility", "samaj")
    e["registeredByMe"] = uid in e.get("registrations", [])
    e["registrationCount"] = len(e.get("registrations", []))
    e["canManage"] = _can_manage_event(e, user)
    return e


def _can_manage_event(e: dict, user: dict) -> bool:
    """Owner, super admin, or samaj_admin / event_manager of the event's Samaj (must be the active Samaj for non-super)."""
    if is_super(user):
        return True
    sid = e.get("samajId", DEFAULT_SAMAJ_ID)
    if sid != user.get("activeSamajId"):
        return False
    return e.get("createdBy") == user["id"] or is_event_manager(user, sid)


@api.post("/events")
def create_event(e: EventIn, user=Depends(get_current_user)):
    doc = e.model_dump()
    doc["visibility"] = resolve_visibility(user, e.visibility)
    sid = user.get("activeSamajId") or DEFAULT_SAMAJ_ID
    doc.update({"samajId": sid, "createdBy": user["id"], "createdByName": user.get("name", ""), "createdAt": now_iso(), "registrations": []})
    ref = db.collection("events").document()
    ref.set(doc)
    notify_samaj(sid, "new_event", "નવો ઈવેન્ટ", e.title, {"eventId": ref.id}, actor_id=user["id"], all_samaj=doc["visibility"] in ("all_samaj", "public"))
    return {"id": ref.id, **doc}


@api.get("/events")
def list_events(filter: Literal["upcoming", "past", "mine"] = "upcoming", user=Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    docs = visible_query_docs("events", user)
    if filter == "mine":
        items = [d for d in docs if d.get("createdBy") == user["id"]]
    elif filter == "past":
        items = [d for d in docs if d.get("date", "") < today]
    else:
        items = [d for d in docs if d.get("date", "") >= today]
    items.sort(key=lambda x: x.get("date", ""), reverse=(filter == "past"))
    return {"items": [_event_out(i, user) for i in items]}


@api.get("/events/{eid}")
def get_event(eid: str, user=Depends(get_current_user)):
    e = get_doc("events", eid)
    if not e or not can_view(e, user):
        raise HTTPException(status_code=404, detail="Event not found")
    return _event_out(e, user)


@api.post("/events/{eid}/register")
def register_event(eid: str, user=Depends(get_current_user)):
    e = get_doc("events", eid)
    if not e or not can_view(e, user):
        raise HTTPException(status_code=404, detail="Event not found")
    ref = db.collection("events").document(eid)
    from google.cloud.firestore_v1 import ArrayUnion, ArrayRemove
    if user["id"] in e.get("registrations", []):
        ref.update({"registrations": ArrayRemove([user["id"]])})
        return {"registered": False}
    ref.update({"registrations": ArrayUnion([user["id"]])})
    return {"registered": True}


@api.patch("/events/{eid}")
def update_event(eid: str, patch: dict, user=Depends(get_current_user)):
    e = get_doc("events", eid)
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    if not _can_manage_event(e, user):
        raise HTTPException(status_code=403, detail="Not allowed")
    allowed = {"title", "description", "eventImage", "location", "date", "startTime", "endTime", "allowedUserIds"}
    upd = {k: v for k, v in patch.items() if k in allowed}
    if "visibility" in patch:
        upd["visibility"] = resolve_visibility(user, patch["visibility"])
    if upd:
        db.collection("events").document(eid).update(upd)
    return _event_out(get_doc("events", eid), user)


@api.delete("/events/{eid}")
def delete_event(eid: str, user=Depends(get_current_user)):
    e = get_doc("events", eid)
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    if not _can_manage_event(e, user):
        raise HTTPException(status_code=403, detail="Not allowed")
    db.collection("events").document(eid).delete()
    return {"ok": True}


# ---------- Public (unauthenticated) ----------
@api.get("/public/feed")
def public_feed(user=Depends(optional_user)):
    if not public_access_enabled():
        raise HTTPException(status_code=403, detail="Public access disabled")
    posts = [p for p in stream(db.collection("posts").where("visibility", "==", "public").limit(50)) if p.get("status") == "active" and p.get("approved", True)]
    events = stream(db.collection("events").where("visibility", "==", "public").limit(50))
    return {"posts": posts, "events": events}


@api.get("/public/posts/{pid}")
def public_post(pid: str):
    """Public share target: only PUBLIC posts and only when public access is enabled."""
    if not public_access_enabled():
        raise HTTPException(status_code=403, detail="Public access disabled")
    p = get_doc("posts", pid)
    if not p or p.get("visibility") != "public" or p.get("status") != "active" or not p.get("approved", True):
        raise HTTPException(status_code=404, detail="Post not found")
    keys = ("id", "caption", "mediaUrls", "media", "mediaType", "authorName", "authorPhoto", "createdAt", "likesCount", "commentsCount", "sharesCount", "hashtags", "event", "location")
    return {k: p.get(k) for k in keys}


@api.get("/")
def root():
    return {"app": "Samaj Connect", "status": "ok", "backend": "firebase"}


api.include_router(social_router)
api.include_router(chat_router)
api.include_router(live_router)
api.include_router(admin_router)
api.include_router(photos_router)
api.include_router(booking_router)
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
