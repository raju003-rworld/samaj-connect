"""Instagram-like social: posts (multi-media, reels), likes, comments+replies, save, share, follow, stories, hashtags, search, reports, block."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from google.cloud.firestore_v1 import ArrayUnion, ArrayRemove, Increment
import re

from core import (db, get_current_user, can_view, resolve_visibility, visible_query_docs, get_doc, stream,
                  now_iso, author_fields, notify, notify_samaj, can_moderate, is_samaj_admin, DEFAULT_SAMAJ_ID)

router = APIRouter()
HASHTAG_RE = re.compile(r"#([\w\u0A80-\u0AFF]+)")


class PostIn(BaseModel):
    content: str = ""
    caption: Optional[str] = None
    mediaUrls: List[str] = []
    imageUrls: List[str] = []
    mediaType: str = "image"  # image | video | reel | text
    visibility: Optional[str] = "samaj"
    allowedUserIds: List[str] = []


class CommentIn(BaseModel):
    content: str
    parentId: Optional[str] = None


class StoryIn(BaseModel):
    mediaUrl: str
    mediaType: str = "image"
    caption: str = ""
    visibility: Optional[str] = "samaj"


class ReportIn(BaseModel):
    targetType: str  # post | comment | user | live | message
    targetId: str
    reason: str


def _blocked_ids(u: dict) -> set:
    return set(u.get("blocked", []))


def _post_out(p: dict, u: dict) -> dict:
    p["likedByMe"] = u["id"] in p.get("likedBy", [])
    p["savedByMe"] = u["id"] in p.get("savedBy", [])
    p.setdefault("visibility", "samaj")
    p.setdefault("imageUrls", p.get("mediaUrls", []))
    p.setdefault("mediaUrls", p.get("imageUrls", []))
    p.setdefault("content", p.get("caption", ""))
    return p


def _visible_post(p: dict, u: dict) -> bool:
    if p.get("status", "active") != "active":
        return can_moderate(u, p.get("samajId")) or p.get("createdBy") == u["id"]
    if not p.get("approved", True) and p.get("createdBy") != u["id"] and not can_moderate(u, p.get("samajId")):
        return False
    if p.get("createdBy") in _blocked_ids(u):
        return False
    return True


# ---------- Posts ----------
@router.post("/posts")
def create_post(p: PostIn, user=Depends(get_current_user)):
    media = p.mediaUrls or p.imageUrls
    caption = p.caption if p.caption is not None else p.content
    if not caption.strip() and not media:
        raise HTTPException(status_code=400, detail="Caption or media required")
    sid = user.get("activeSamajId") or DEFAULT_SAMAJ_ID
    samaj = get_doc("samaj", sid) or {}
    vis = resolve_visibility(user, p.visibility)
    doc = {
        **author_fields(user),
        "samajId": sid, "caption": caption, "content": caption, "mediaUrls": media, "imageUrls": media,
        "mediaType": p.mediaType if media else "text", "hashtags": [h.lower() for h in HASHTAG_RE.findall(caption)],
        "visibility": vis, "allowedUserIds": p.allowedUserIds if vis == "private" else [],
        "createdAt": now_iso(), "updatedAt": now_iso(), "status": "active",
        "approved": not samaj.get("requirePostApproval", False) or is_samaj_admin(user, sid),
        "likesCount": 0, "commentsCount": 0, "sharesCount": 0, "likedBy": [], "savedBy": [], "isActive": True,
    }
    ref = db.collection("posts").document()
    ref.set(doc)
    if vis == "all_samaj" and is_samaj_admin(user):
        notify_samaj(sid, "announcement", "All-Samaj જાહેરાત", caption[:80], {"postId": ref.id}, actor_id=user["id"], all_samaj=True)
    return _post_out({"id": ref.id, **doc}, user)


@router.get("/posts")
def list_posts(limit: int = Query(20, le=100), skip: int = 0, hashtag: Optional[str] = None,
               authorId: Optional[str] = None, saved: bool = False, mediaType: Optional[str] = None,
               user=Depends(get_current_user)):
    def f(p):
        if not _visible_post(p, user): return False
        if hashtag and hashtag.lower().lstrip("#") not in p.get("hashtags", []): return False
        if authorId and p.get("createdBy") != authorId: return False
        if saved and user["id"] not in p.get("savedBy", []): return False
        if mediaType and p.get("mediaType") != mediaType: return False
        return True
    items = visible_query_docs("posts", user, f)
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return {"items": [_post_out(p, user) for p in items[skip:skip + limit]], "total": len(items)}


@router.get("/posts/{pid}")
def get_post(pid: str, user=Depends(get_current_user)):
    p = get_doc("posts", pid)
    if not p or not can_view(p, user) or not _visible_post(p, user):
        raise HTTPException(status_code=404, detail="Post not found")
    return _post_out(p, user)


def _load_visible_post(pid: str, user: dict) -> dict:
    p = get_doc("posts", pid)
    if not p or not can_view(p, user):
        raise HTTPException(status_code=404, detail="Post not found")
    return p


@router.post("/posts/{pid}/like")
def like_post(pid: str, user=Depends(get_current_user)):
    p = _load_visible_post(pid, user)
    ref = db.collection("posts").document(pid)
    liked = user["id"] in p.get("likedBy", [])
    if liked:
        ref.update({"likedBy": ArrayRemove([user["id"]]), "likesCount": Increment(-1)})
    else:
        ref.update({"likedBy": ArrayUnion([user["id"]]), "likesCount": Increment(1)})
        notify(p["createdBy"], "like", f"{user.get('name')} એ તમારી પોસ્ટ લાઇક કરી", "", {"postId": pid}, p.get("samajId"), user["id"])
    return _post_out(get_doc("posts", pid), user)


@router.post("/posts/{pid}/save")
def save_post(pid: str, user=Depends(get_current_user)):
    p = _load_visible_post(pid, user)
    ref = db.collection("posts").document(pid)
    saved = user["id"] in p.get("savedBy", [])
    ref.update({"savedBy": ArrayRemove([user["id"]]) if saved else ArrayUnion([user["id"]])})
    return {"saved": not saved}


@router.post("/posts/{pid}/share")
def share_post(pid: str, user=Depends(get_current_user)):
    _load_visible_post(pid, user)
    db.collection("posts").document(pid).update({"sharesCount": Increment(1)})
    return {"ok": True}


@router.post("/posts/{pid}/comments")
def add_comment(pid: str, c: CommentIn, user=Depends(get_current_user)):
    p = _load_visible_post(pid, user)
    doc = {**author_fields(user), "postId": pid, "samajId": p.get("samajId"), "content": c.content,
           "parentId": c.parentId, "likesCount": 0, "likedBy": [], "status": "active", "createdAt": now_iso()}
    ref = db.collection("comments").document()
    ref.set(doc)
    db.collection("posts").document(pid).update({"commentsCount": Increment(1)})
    notify(p["createdBy"], "comment", f"{user.get('name')} એ કોમેન્ટ કરી", c.content[:80], {"postId": pid}, p.get("samajId"), user["id"])
    if c.parentId:
        parent = get_doc("comments", c.parentId)
        if parent:
            notify(parent["createdBy"], "reply", f"{user.get('name')} એ જવાબ આપ્યો", c.content[:80], {"postId": pid}, p.get("samajId"), user["id"])
    return {"id": ref.id, **doc}


@router.get("/posts/{pid}/comments")
def list_comments(pid: str, user=Depends(get_current_user)):
    _load_visible_post(pid, user)
    items = [c for c in stream(db.collection("comments").where("postId", "==", pid).limit(500)) if c.get("status", "active") == "active"]
    items.sort(key=lambda x: x.get("createdAt", ""))
    return {"items": items}


@router.delete("/comments/{cid}")
def delete_comment(cid: str, user=Depends(get_current_user)):
    c = get_doc("comments", cid)
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    if c.get("createdBy") != user["id"] and not can_moderate(user, c.get("samajId")):
        raise HTTPException(status_code=403, detail="Not allowed")
    db.collection("comments").document(cid).update({"status": "removed"})
    db.collection("posts").document(c["postId"]).update({"commentsCount": Increment(-1)})
    return {"ok": True}


@router.patch("/posts/{pid}")
def update_post(pid: str, patch: dict, user=Depends(get_current_user)):
    p = get_doc("posts", pid)
    if not p:
        raise HTTPException(status_code=404, detail="Post not found")
    if p.get("createdBy") != user["id"] and not is_samaj_admin(user, p.get("samajId")):
        raise HTTPException(status_code=403, detail="Not allowed")
    upd = {}
    if "caption" in patch or "content" in patch:
        cap = patch.get("caption", patch.get("content", ""))
        upd.update({"caption": cap, "content": cap, "hashtags": [h.lower() for h in HASHTAG_RE.findall(cap)]})
    if "visibility" in patch:
        upd["visibility"] = resolve_visibility(user, patch["visibility"])
    if "allowedUserIds" in patch:
        upd["allowedUserIds"] = list(patch["allowedUserIds"])
    if upd:
        upd["updatedAt"] = now_iso()
        db.collection("posts").document(pid).update(upd)
    return _post_out(get_doc("posts", pid), user)


@router.delete("/posts/{pid}")
def delete_post(pid: str, user=Depends(get_current_user)):
    p = get_doc("posts", pid)
    if not p:
        raise HTTPException(status_code=404, detail="Post not found")
    if p.get("createdBy") != user["id"] and not can_moderate(user, p.get("samajId")):
        raise HTTPException(status_code=403, detail="Not allowed")
    db.collection("posts").document(pid).update({"status": "removed", "isActive": False, "updatedAt": now_iso()})
    return {"ok": True}


# ---------- Stories (24h) ----------
@router.post("/stories")
def create_story(s: StoryIn, user=Depends(get_current_user)):
    sid = user.get("activeSamajId") or DEFAULT_SAMAJ_ID
    doc = {**author_fields(user), "samajId": sid, "mediaUrl": s.mediaUrl, "mediaType": s.mediaType, "caption": s.caption,
           "visibility": resolve_visibility(user, s.visibility), "viewedBy": [], "createdAt": now_iso(), "status": "active"}
    ref = db.collection("stories").document()
    ref.set(doc)
    return {"id": ref.id, **doc}


@router.get("/stories")
def list_stories(user=Depends(get_current_user)):
    from datetime import datetime, timezone, timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    items = visible_query_docs("stories", user, lambda d: d.get("createdAt", "") >= cutoff and d.get("status") == "active" and d.get("createdBy") not in _blocked_ids(user))
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    groups: dict = {}
    for s in items:
        s["viewedByMe"] = user["id"] in s.get("viewedBy", [])
        groups.setdefault(s["createdBy"], {"userId": s["createdBy"], "name": s["authorName"], "photo": s.get("authorPhoto", ""), "items": []})["items"].append(s)
    return {"items": list(groups.values())}


@router.post("/stories/{sid}/view")
def view_story(sid: str, user=Depends(get_current_user)):
    db.collection("stories").document(sid).update({"viewedBy": ArrayUnion([user["id"]])})
    return {"ok": True}


@router.delete("/stories/{sid}")
def delete_story(sid: str, user=Depends(get_current_user)):
    s = get_doc("stories", sid)
    if not s or (s.get("createdBy") != user["id"] and not can_moderate(user, s.get("samajId"))):
        raise HTTPException(status_code=403, detail="Not allowed")
    db.collection("stories").document(sid).update({"status": "removed"})
    return {"ok": True}


# ---------- Users / Follow / Block ----------
def _public_user(u: dict, me: dict) -> dict:
    return {"id": u["id"], "name": u.get("name", ""), "profilePhoto": u.get("profilePhoto", ""), "bio": u.get("bio", ""),
            "village": u.get("village", ""), "role": u.get("role"), "followersCount": u.get("followersCount", 0),
            "followingCount": u.get("followingCount", 0), "activeSamajId": u.get("activeSamajId"),
            "followedByMe": bool(get_doc("follows", f"{me['id']}_{u['id']}")), "blockedByMe": u["id"] in _blocked_ids(me)}


@router.get("/users/search")
def search_users(q: str = "", limit: int = 20, user=Depends(get_current_user)):
    ql = q.lower().strip()
    items = [u for u in stream(db.collection("users").where("samajIds", "array_contains", user.get("activeSamajId")).limit(500))
             if not u.get("isSuspended") and u["id"] != user["id"] and (not ql or ql in u.get("name", "").lower() or ql in u.get("phone", ""))]
    return {"items": [_public_user(u, user) for u in items[:limit]]}


@router.get("/users/{uid}")
def get_user(uid: str, user=Depends(get_current_user)):
    u = get_doc("users", uid)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return _public_user(u, user)


@router.post("/users/{uid}/follow")
def follow(uid: str, user=Depends(get_current_user)):
    if uid == user["id"] or not get_doc("users", uid):
        raise HTTPException(status_code=400, detail="Invalid")
    fid = f"{user['id']}_{uid}"
    ref = db.collection("follows").document(fid)
    if ref.get().exists:
        ref.delete()
        db.collection("users").document(uid).update({"followersCount": Increment(-1)})
        db.collection("users").document(user["id"]).update({"followingCount": Increment(-1)})
        return {"following": False}
    ref.set({"followerId": user["id"], "followingId": uid, "createdAt": now_iso()})
    db.collection("users").document(uid).update({"followersCount": Increment(1)})
    db.collection("users").document(user["id"]).update({"followingCount": Increment(1)})
    notify(uid, "follow", f"{user.get('name')} તમને ફોલો કરે છે", "", {"userId": user["id"]}, None, user["id"])
    return {"following": True}


@router.get("/users/{uid}/followers")
def followers(uid: str, user=Depends(get_current_user)):
    ids = [f["followerId"] for f in stream(db.collection("follows").where("followingId", "==", uid).limit(500))]
    return {"items": [_public_user(get_doc("users", i), user) for i in ids if get_doc("users", i)]}


@router.get("/users/{uid}/following")
def following(uid: str, user=Depends(get_current_user)):
    ids = [f["followingId"] for f in stream(db.collection("follows").where("followerId", "==", uid).limit(500))]
    return {"items": [_public_user(get_doc("users", i), user) for i in ids if get_doc("users", i)]}


@router.post("/users/{uid}/block")
def block(uid: str, user=Depends(get_current_user)):
    blocked = uid in _blocked_ids(user)
    db.collection("users").document(user["id"]).update({"blocked": ArrayRemove([uid]) if blocked else ArrayUnion([uid])})
    return {"blocked": not blocked}


# ---------- Hashtags / Search ----------
@router.get("/search")
def search(q: str = "", user=Depends(get_current_user)):
    ql = q.lower().strip().lstrip("#")
    posts = visible_query_docs("posts", user, lambda p: _visible_post(p, user) and (ql in p.get("caption", "").lower() or ql in p.get("hashtags", [])))
    posts.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    tags: dict = {}
    for p in posts:
        for h in p.get("hashtags", []):
            if ql in h:
                tags[h] = tags.get(h, 0) + 1
    users = search_users(q, 10, user)["items"] if ql else []
    return {"posts": [_post_out(p, user) for p in posts[:30]], "hashtags": [{"tag": k, "count": v} for k, v in sorted(tags.items(), key=lambda x: -x[1])], "users": users}


# ---------- Reports ----------
@router.post("/reports")
def report(r: ReportIn, user=Depends(get_current_user)):
    if r.targetType not in ("post", "comment", "user", "live", "message", "story"):
        raise HTTPException(status_code=400, detail="Invalid target")
    target = get_doc({"post": "posts", "comment": "comments", "user": "users", "live": "liveSessions", "story": "stories", "message": "conversations"}[r.targetType], r.targetId) or {}
    doc = {"targetType": r.targetType, "targetId": r.targetId, "reason": r.reason, "reportedBy": user["id"], "reporterName": user.get("name"),
           "samajId": target.get("samajId") or user.get("activeSamajId"), "status": "open", "createdAt": now_iso()}
    ref = db.collection("reports").document()
    ref.set(doc)
    return {"id": ref.id, **doc}


# ---------- Notifications ----------
@router.get("/notifications")
def list_notifications(user=Depends(get_current_user)):
    items = stream(db.collection("notifications").where("userId", "==", user["id"]).limit(200))
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return {"items": items[:50], "unread": sum(1 for i in items if not i.get("read"))}


@router.post("/notifications/read")
def read_notifications(body: dict, user=Depends(get_current_user)):
    ids = body.get("ids")
    q = db.collection("notifications").where("userId", "==", user["id"])
    batch = db.batch()
    for n in stream(q.limit(500)):
        if (ids is None or n["id"] in ids) and not n.get("read"):
            batch.update(db.collection("notifications").document(n["id"]), {"read": True})
    batch.commit()
    return {"ok": True}
