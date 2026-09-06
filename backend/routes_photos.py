"""Cloud Photos: albums (samaj/event-wise) + photos. Media in Firebase Storage (client upload), metadata in Firestore. Samaj isolation server-side."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from google.cloud.firestore_v1 import Increment

from core import (db, get_current_user, can_view, resolve_visibility, visible_query_docs, get_doc, stream, now_iso,
                  author_fields, notify, can_moderate, is_samaj_admin, DEFAULT_SAMAJ_ID)

router = APIRouter()


class AlbumIn(BaseModel):
    title: str
    description: str = ""
    coverUrl: str = ""
    eventId: Optional[str] = None
    visibility: Optional[str] = "samaj"
    allowedUserIds: List[str] = []


class PhotosIn(BaseModel):
    items: List[dict]  # [{url, type: image|video, caption?}]


def _album_visible(a: dict, u: dict) -> bool:
    if a.get("status", "active") != "active":
        return can_moderate(u, a.get("samajId")) or a.get("createdBy") == u["id"]
    return True


def _load_album(aid: str, u: dict) -> dict:
    a = get_doc("albums", aid)
    if not a or not can_view(a, u) or not _album_visible(a, u):
        raise HTTPException(status_code=404, detail="Album not found")
    return a


@router.post("/albums")
def create_album(b: AlbumIn, user=Depends(get_current_user)):
    sid = user.get("activeSamajId") or DEFAULT_SAMAJ_ID
    vis = resolve_visibility(user, b.visibility)
    event = None
    if b.eventId:
        ev = get_doc("events", b.eventId)
        if not ev or not can_view(ev, user):
            raise HTTPException(status_code=404, detail="Event not found")
        event = {"id": ev["id"], "title": ev.get("title", ""), "date": ev.get("date", "")}
    samaj = get_doc("samaj", sid) or {}
    doc = {**author_fields(user), "samajId": sid, "title": b.title.strip(), "description": b.description, "coverUrl": b.coverUrl,
           "eventId": b.eventId, "event": event, "visibility": vis, "allowedUserIds": b.allowedUserIds if vis == "private" else [],
           "photoCount": 0, "status": "active", "approved": not samaj.get("requirePostApproval", False) or is_samaj_admin(user, sid),
           "createdAt": now_iso(), "updatedAt": now_iso()}
    ref = db.collection("albums").document()
    ref.set(doc)
    return {"id": ref.id, **doc}


@router.get("/albums")
def list_albums(eventId: Optional[str] = None, user=Depends(get_current_user)):
    items = visible_query_docs("albums", user, lambda a: _album_visible(a, user) and (not eventId or a.get("eventId") == eventId)
                               and (a.get("approved", True) or a.get("createdBy") == user["id"] or can_moderate(user, a.get("samajId"))))
    items.sort(key=lambda x: x.get("updatedAt", ""), reverse=True)
    return {"items": items}


@router.get("/albums/{aid}")
def get_album(aid: str, user=Depends(get_current_user)):
    a = _load_album(aid, user)
    a["canEdit"] = a.get("createdBy") == user["id"] or is_samaj_admin(user, a.get("samajId"))
    return a


@router.patch("/albums/{aid}")
def update_album(aid: str, patch: dict, user=Depends(get_current_user)):
    a = _load_album(aid, user)
    if a.get("createdBy") != user["id"] and not is_samaj_admin(user, a.get("samajId")):
        raise HTTPException(status_code=403, detail="Not allowed")
    upd = {k: v for k, v in patch.items() if k in ("title", "description", "coverUrl", "allowedUserIds")}
    if "visibility" in patch:
        upd["visibility"] = resolve_visibility(user, patch["visibility"])
    upd["updatedAt"] = now_iso()
    db.collection("albums").document(aid).update(upd)
    return get_doc("albums", aid)


@router.delete("/albums/{aid}")
def delete_album(aid: str, user=Depends(get_current_user)):
    a = _load_album(aid, user)
    if a.get("createdBy") != user["id"] and not can_moderate(user, a.get("samajId")):
        raise HTTPException(status_code=403, detail="Not allowed")
    db.collection("albums").document(aid).update({"status": "removed", "updatedAt": now_iso()})
    return {"ok": True}


@router.post("/albums/{aid}/photos")
def add_photos(aid: str, body: PhotosIn, user=Depends(get_current_user)):
    a = _load_album(aid, user)
    if a.get("samajId") != user.get("activeSamajId") and not is_samaj_admin(user, a.get("samajId")):
        raise HTTPException(status_code=403, detail="Only members of this Samaj can upload here")
    out, batch = [], db.batch()
    for it in body.items[:50]:
        url = str(it.get("url", "")).strip()
        if not url.startswith("https://"):
            continue
        ref = db.collection("photos").document()
        doc = {**author_fields(user), "albumId": aid, "samajId": a["samajId"], "url": url, "type": it.get("type", "image"),
               "caption": str(it.get("caption", ""))[:200], "visibility": a.get("visibility", "samaj"), "allowedUserIds": a.get("allowedUserIds", []),
               "status": "active", "likesCount": 0, "createdAt": now_iso()}
        batch.set(ref, doc)
        out.append({"id": ref.id, **doc})
    if out:
        upd = {"photoCount": Increment(len(out)), "updatedAt": now_iso()}
        if not a.get("coverUrl"):
            upd["coverUrl"] = next((o["url"] for o in out if o["type"] == "image"), "")
        batch.update(db.collection("albums").document(aid), upd)
        batch.commit()
        if a.get("createdBy") != user["id"]:
            notify(a["createdBy"], "album_photos", f"{user.get('name')} એ '{a['title']}' માં {len(out)} ફોટો ઉમેર્યા", "", {"albumId": aid}, a["samajId"], user["id"])
    return {"items": out}


@router.get("/albums/{aid}/photos")
def list_photos(aid: str, limit: int = Query(60, le=200), before: Optional[str] = None, user=Depends(get_current_user)):
    _load_album(aid, user)
    items = [p for p in stream(db.collection("photos").where("albumId", "==", aid).limit(1000)) if p.get("status") == "active" and (not before or p["createdAt"] < before)]
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    page = items[:limit]
    return {"items": page, "nextCursor": page[-1]["createdAt"] if len(items) > limit else None}


@router.delete("/photos/{pid}")
def delete_photo(pid: str, user=Depends(get_current_user)):
    p = get_doc("photos", pid)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    if p.get("createdBy") != user["id"] and not can_moderate(user, p.get("samajId")):
        raise HTTPException(status_code=403, detail="Not allowed")
    db.collection("photos").document(pid).update({"status": "removed"})
    db.collection("albums").document(p["albumId"]).update({"photoCount": Increment(-1), "updatedAt": now_iso()})
    return {"ok": True}


@router.get("/photos/recent")
def recent_photos(limit: int = Query(30, le=100), user=Depends(get_current_user)):
    """Cloud Photos home: latest photos across albums visible to the user."""
    items = visible_query_docs("photos", user, lambda p: p.get("status") == "active")
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return {"items": items[:limit]}
