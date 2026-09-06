"""Shared Firebase init, auth dependencies, Samaj/visibility authorization helpers."""
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import logging
import os
import uuid
import firebase_admin
from firebase_admin import credentials, firestore, auth as fb_auth

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

SA_PATH = os.environ["FIREBASE_SERVICE_ACCOUNT"]
STORAGE_BUCKET = os.environ["FIREBASE_STORAGE_BUCKET"]
DEV_AUTH_ENABLED = os.environ.get("DEV_AUTH_ENABLED", "false").lower() == "true"
DEV_OTP = "123456"
SEED_ADMIN_PHONE = os.environ.get("SEED_ADMIN_PHONE", "").strip()
DEFAULT_SAMAJ_ID = "default"

if not firebase_admin._apps:
    firebase_admin.initialize_app(credentials.Certificate(str(ROOT_DIR / SA_PATH)), {"storageBucket": STORAGE_BUCKET})
db = firestore.client()
bearer = HTTPBearer(auto_error=False)

VISIBILITIES = ("samaj", "all_samaj", "public", "private")
ROLES = ("super_admin", "samaj_admin", "moderator", "member", "business_user", "event_manager")
ADMIN_ROLES = ("super_admin", "samaj_admin", "admin")
MOD_ROLES = ADMIN_ROLES + ("moderator",)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return uuid.uuid4().hex


def snap_dict(snap) -> Optional[dict]:
    if not snap.exists:
        return None
    d = snap.to_dict() or {}
    d["id"] = snap.id
    for k, v in list(d.items()):
        if isinstance(v, datetime):
            d[k] = v.isoformat()
    return d


def get_doc(col: str, did: str) -> Optional[dict]:
    return snap_dict(db.collection(col).document(did).get())


def stream(query) -> list:
    return [snap_dict(s) for s in query.stream()]


def ensure_default_samaj():
    ref = db.collection("samaj").document(DEFAULT_SAMAJ_ID)
    if not ref.get().exists:
        ref.set({"name": "મુખ્ય સમાજ", "nameEn": "Main Samaj", "code": "MAIN", "isActive": True,
                 "requirePostApproval": False, "createdAt": now_iso()})
    sref = db.collection("settings").document("global")
    if not sref.get().exists:
        sref.set({"publicAccessEnabled": False})


def public_access_enabled() -> bool:
    s = get_doc("settings", "global") or {}
    return bool(s.get("publicAccessEnabled"))


def upsert_user_from_token(decoded: dict) -> dict:
    uid = decoded["uid"]
    ref = db.collection("users").document(uid)
    snap = ref.get()
    if snap.exists:
        u = snap_dict(snap)
        if u.get("isSuspended"):
            raise HTTPException(status_code=403, detail="Account suspended")
        return u
    phone = decoded.get("phone_number") or decoded.get("phone") or ""
    total = len(list(db.collection("users").limit(1).stream()))
    role = "super_admin" if (total == 0 or (SEED_ADMIN_PHONE and phone == SEED_ADMIN_PHONE)) else "member"
    u = {"phone": phone, "name": decoded.get("name") or f"Member {phone[-4:]}", "role": role,
         "profilePhoto": "", "village": "", "district": "", "bio": "",
         "samajIds": [DEFAULT_SAMAJ_ID], "activeSamajId": DEFAULT_SAMAJ_ID, "samajRoles": {DEFAULT_SAMAJ_ID: role}, "fcmTokens": [],
         "followersCount": 0, "followingCount": 0, "blocked": [], "isSuspended": False,
         "createdAt": now_iso()}
    ref.set(u)
    u["id"] = uid
    return u


def _decode(cred: Optional[HTTPAuthorizationCredentials], path: str = "") -> dict:
    if not cred or not cred.credentials:
        logging.warning("401 no-bearer-header path=%s", path)
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return fb_auth.verify_id_token(cred.credentials, clock_skew_seconds=60)
    except Exception as e:
        logging.warning("401 invalid-token path=%s err=%s", path, str(e)[:160])
        raise HTTPException(status_code=401, detail=f"Invalid token: {type(e).__name__}")


def get_current_user(request: Request, cred: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> dict:
    return upsert_user_from_token(_decode(cred, request.url.path))


def optional_user(cred: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Optional[dict]:
    if not cred:
        return None
    try:
        return upsert_user_from_token(fb_auth.verify_id_token(cred.credentials, clock_skew_seconds=60))
    except Exception:
        return None


def is_super(u: dict) -> bool:
    return u.get("role") == "super_admin"


def role_in(u: dict, samaj_id: Optional[str] = None) -> str:
    """Samaj-specific role: users.samajRoles[samajId]; falls back to legacy global `role`."""
    if is_super(u):
        return "super_admin"
    sid = samaj_id or u.get("activeSamajId") or DEFAULT_SAMAJ_ID
    if sid not in u.get("samajIds", []):
        return "none"
    r = (u.get("samajRoles") or {}).get(sid) or u.get("role") or "member"
    return "samaj_admin" if r == "admin" else r


def is_samaj_admin(u: dict, samaj_id: Optional[str] = None) -> bool:
    return role_in(u, samaj_id) in ("super_admin", "samaj_admin")


def can_moderate(u: dict, samaj_id: Optional[str] = None) -> bool:
    return role_in(u, samaj_id) in ("super_admin", "samaj_admin", "moderator")


def is_event_manager(u: dict, samaj_id: Optional[str] = None) -> bool:
    return role_in(u, samaj_id) in ("super_admin", "samaj_admin", "event_manager")


def require_admin(user=Depends(get_current_user)):
    if not is_samaj_admin(user):
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def require_moderator(user=Depends(get_current_user)):
    if not can_moderate(user):
        raise HTTPException(status_code=403, detail="Moderator only")
    return user


def resolve_visibility(u: dict, requested: Optional[str]) -> str:
    """Members may only choose samaj/private. all_samaj/public need admin role."""
    v = requested or "samaj"
    if v not in VISIBILITIES:
        raise HTTPException(status_code=400, detail="Invalid visibility")
    if v in ("all_samaj", "public") and not is_samaj_admin(u):
        raise HTTPException(status_code=403, detail="Only admins can publish All-Samaj/Public content")
    return v


def can_view(doc: dict, u: Optional[dict]) -> bool:
    v = doc.get("visibility", "samaj")
    if u is None:
        return v == "public" and public_access_enabled()
    if is_super(u):
        return True
    if doc.get("createdBy") == u["id"]:
        # own content: samaj-only content is scoped to the active Samaj context
        return v != "samaj" or doc.get("samajId", DEFAULT_SAMAJ_ID) == u.get("activeSamajId")
    if v == "private":
        return u["id"] in doc.get("allowedUserIds", []) or can_moderate(u, doc.get("samajId"))
    if v == "samaj":
        return doc.get("samajId", DEFAULT_SAMAJ_ID) == u.get("activeSamajId") or can_moderate(u, doc.get("samajId"))
    return True  # all_samaj / public for any authenticated user


def visible_query_docs(col: str, u: dict, extra_filter=None) -> list:
    """Gather docs visible to user: own-samaj + all_samaj/public + private-allowed. Filtered/sorted in memory."""
    c = db.collection(col)
    seen, out = set(), []
    queries = [
        c.where("samajId", "==", u.get("activeSamajId")),
        c.where("visibility", "in", ["all_samaj", "public"]),
        c.where("allowedUserIds", "array_contains", u["id"]),
        c.where("createdBy", "==", u["id"]),
    ]
    for q in queries:
        for d in stream(q.limit(300)):
            if d["id"] in seen:
                continue
            seen.add(d["id"])
            if can_view(d, u) and (extra_filter is None or extra_filter(d)):
                out.append(d)
    return out


PUSH_TYPES = {"like", "comment", "reply", "share", "follow", "message", "group_added", "live_started", "live_scheduled", "new_event",
              "announcement", "post_approve", "post_reject", "post_hide", "post_delete", "booking_approved", "booking_rejected",
              "booking_request", "album_approve", "album_reject", "report_resolved", "report_dismissed"}


def send_push(user_id: str, title: str, body: str, data: Optional[dict] = None):
    """FCM push to all registered device tokens of a user (silently skipped if none). Uses existing Firebase project."""
    u = get_doc("users", user_id) or {}
    tokens = [t for t in (u.get("fcmTokens") or []) if t]
    if not tokens:
        return
    try:
        from firebase_admin import messaging
        msg = messaging.MulticastMessage(tokens=tokens, notification=messaging.Notification(title=title[:100], body=(body or "")[:200]),
                                         data={k: str(v) for k, v in (data or {}).items()},
                                         webpush=messaging.WebpushConfig(fcm_options=messaging.WebpushFCMOptions(link=_deep_link(data))))
        res = messaging.send_each_for_multicast(msg)
        dead = [tokens[i] for i, r in enumerate(res.responses) if not r.success and getattr(r.exception, "code", "") in ("NOT_FOUND", "UNREGISTERED", "INVALID_ARGUMENT")]
        if dead:
            from google.cloud.firestore_v1 import ArrayRemove
            db.collection("users").document(user_id).update({"fcmTokens": ArrayRemove(dead)})
    except Exception as e:  # push is best-effort; in-app notification already stored
        logging.warning("push failed uid=%s err=%s", user_id, str(e)[:120])


def _deep_link(data: Optional[dict]) -> str:
    d = data or {}
    if d.get("conversationId"): return f"/messages/{d['conversationId']}"
    if d.get("liveId"): return f"/live/{d['liveId']}"
    if d.get("postId"): return f"/social?post={d['postId']}"
    if d.get("bookingId"): return "/hall"
    if d.get("albumId"): return f"/photos/{d['albumId']}"
    if d.get("eventId"): return f"/events?event={d['eventId']}"
    return "/notifications"


def notify(user_id: str, ntype: str, title: str, body: str = "", data: Optional[dict] = None, samaj_id: Optional[str] = None, actor_id: Optional[str] = None):
    if not user_id or user_id == actor_id:
        return
    db.collection("notifications").add({"userId": user_id, "type": ntype, "title": title, "body": body,
                                        "data": data or {}, "samajId": samaj_id, "read": False,
                                        "actorId": actor_id, "createdAt": now_iso()})
    if ntype in PUSH_TYPES:
        send_push(user_id, title, body, data)


def notify_samaj(samaj_id: Optional[str], ntype: str, title: str, body: str = "", data: Optional[dict] = None, actor_id: Optional[str] = None, all_samaj: bool = False):
    q = db.collection("users")
    if not all_samaj:
        q = q.where("samajIds", "array_contains", samaj_id)
    batch, n = db.batch(), 0
    for u in stream(q.limit(500)):
        if u["id"] == actor_id or u.get("isSuspended"):
            continue
        ref = db.collection("notifications").document()
        batch.set(ref, {"userId": u["id"], "type": ntype, "title": title, "body": body, "data": data or {},
                        "samajId": samaj_id, "read": False, "actorId": actor_id, "createdAt": now_iso()})
        n += 1
        if n % 400 == 0:
            batch.commit(); batch = db.batch()
    batch.commit()


def author_fields(u: dict) -> dict:
    return {"createdBy": u["id"], "authorId": u["id"], "authorName": u.get("name", ""), "authorPhoto": u.get("profilePhoto", ""), "authorRole": u.get("role", "member")}
