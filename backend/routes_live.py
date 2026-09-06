"""YouTube-like Live: sessions metadata, schedule, go live, viewers, reactions, chat, replay, moderation."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from google.cloud.firestore_v1 import ArrayUnion, ArrayRemove, Increment
import os

from core import (db, get_current_user, can_view, resolve_visibility, visible_query_docs, get_doc, stream, now_iso,
                  author_fields, notify, notify_samaj, can_moderate, DEFAULT_SAMAJ_ID)
from live_service import get_provider

router = APIRouter()


class LiveIn(BaseModel):
    title: str
    description: str = ""
    thumbnail: str = ""
    streamUrl: str = ""
    scheduledAt: Optional[str] = None
    visibility: Optional[str] = "samaj"
    allowedUserIds: List[str] = []


class ChatIn(BaseModel):
    text: str


def _ref(lid: str):
    return db.collection("liveSessions").document(lid)


def _load_live(lid: str, user: dict) -> dict:
    s = get_doc("liveSessions", lid)
    if not s or not can_view(s, user):
        raise HTTPException(status_code=404, detail="Live not found")
    if s.get("status") == "removed" and not can_moderate(user, s.get("samajId")):
        raise HTTPException(status_code=404, detail="Live not found")
    return s


@router.get("/live/config")
def live_config(user=Depends(get_current_user)):
    p = get_provider()
    return {"provider": p.name, "requiresStreamUrl": p.name == "embed"}


@router.post("/live")
def create_live(body: LiveIn, user=Depends(get_current_user)):
    sid = user.get("activeSamajId") or DEFAULT_SAMAJ_ID
    vis = resolve_visibility(user, body.visibility)
    doc = {**author_fields(user), "hostId": user["id"], "hostName": user.get("name", ""), "hostPhoto": user.get("profilePhoto", ""),
           "samajId": sid, "title": body.title, "description": body.description, "thumbnail": body.thumbnail,
           "streamUrl": body.streamUrl, "scheduledAt": body.scheduledAt, "visibility": vis,
           "allowedUserIds": body.allowedUserIds if vis == "private" else [],
           "status": "scheduled" if body.scheduledAt else "created", "provider": get_provider().name,
           "playback": None, "viewerCount": 0, "peakViewers": 0, "viewers": [], "reactions": {}, "chatEnabled": True,
           "startedAt": None, "endedAt": None, "replayUrl": "", "createdAt": now_iso(), "updatedAt": now_iso()}
    ref = db.collection("liveSessions").document()
    ref.set(doc)
    if body.scheduledAt:
        notify_samaj(sid, "live_scheduled", f"{user.get('name')} નું લાઈવ શેડ્યૂલ થયું", body.title, {"liveId": ref.id}, actor_id=user["id"], all_samaj=vis in ("all_samaj", "public"))
    return {"id": ref.id, **doc}


@router.post("/live/{lid}/start")
def start_live(lid: str, body: dict = None, user=Depends(get_current_user)):
    s = _load_live(lid, user)
    if s["hostId"] != user["id"]:
        raise HTTPException(status_code=403, detail="Host only")
    if body and body.get("streamUrl"):
        s["streamUrl"] = body["streamUrl"]
    playback = get_provider().start(s, user)
    public_playback = {k: v for k, v in playback.items() if k not in ("streamKey", "hostToken")}
    _ref(lid).update({"status": "live", "startedAt": now_iso(), "streamUrl": s.get("streamUrl", ""), "playback": public_playback, "updatedAt": now_iso()})
    notify_samaj(s["samajId"], "live_started", f"{user.get('name')} લાઈવ છે!", s["title"], {"liveId": lid}, actor_id=user["id"], all_samaj=s["visibility"] in ("all_samaj", "public"))
    for f in stream(db.collection("follows").where("followingId", "==", user["id"]).limit(500)):
        notify(f["followerId"], "live_started", f"{user.get('name')} લાઈવ છે!", s["title"], {"liveId": lid}, s["samajId"], user["id"])
    return {**get_doc("liveSessions", lid), "hostSecrets": {k: playback[k] for k in ("streamKey", "hostToken", "ingestUrl") if k in playback}}


@router.post("/live/{lid}/end")
def end_live(lid: str, body: dict = None, user=Depends(get_current_user)):
    s = _load_live(lid, user)
    if s["hostId"] != user["id"] and not can_moderate(user, s["samajId"]):
        raise HTTPException(status_code=403, detail="Not allowed")
    get_provider().end(s)
    replay = (body or {}).get("replayUrl") or (s.get("playback") or {}).get("playbackUrl", "")
    _ref(lid).update({"status": "ended", "endedAt": now_iso(), "replayUrl": replay, "viewerCount": 0, "updatedAt": now_iso()})
    return get_doc("liveSessions", lid)


@router.get("/live")
def list_live(status: Optional[str] = None, mine: bool = False, user=Depends(get_current_user)):
    def f(d):
        if d.get("status") == "removed" and not can_moderate(user, d.get("samajId")): return False
        if status and d.get("status") != status: return False
        if mine and d.get("hostId") != user["id"]: return False
        return True
    items = visible_query_docs("liveSessions", user, f)
    order = {"live": 0, "scheduled": 1, "created": 2, "ended": 3}
    items.sort(key=lambda x: (order.get(x.get("status"), 9), x.get("createdAt", "")), reverse=False)
    items.sort(key=lambda x: order.get(x.get("status"), 9))
    return {"items": items}


@router.get("/live/{lid}")
def get_live(lid: str, user=Depends(get_current_user)):
    s = _load_live(lid, user)
    s["hostFollowedByMe"] = bool(get_doc("follows", f"{user['id']}_{s['hostId']}"))
    return s


@router.post("/live/{lid}/join")
def join_live(lid: str, user=Depends(get_current_user)):
    s = _load_live(lid, user)
    if s.get("status") != "live":
        return {"viewerCount": s.get("viewerCount", 0)}
    if user["id"] not in s.get("viewers", []):
        cnt = len(s.get("viewers", [])) + 1
        _ref(lid).update({"viewers": ArrayUnion([user["id"]]), "viewerCount": cnt, "peakViewers": max(cnt, s.get("peakViewers", 0))})
        _ref(lid).collection("sessions").add({"userId": user["id"], "joinedAt": now_iso()})
    return {"viewerCount": len(set(s.get("viewers", []) + [user["id"]]))}


@router.post("/live/{lid}/leave")
def leave_live(lid: str, user=Depends(get_current_user)):
    s = get_doc("liveSessions", lid)
    if s and user["id"] in s.get("viewers", []):
        _ref(lid).update({"viewers": ArrayRemove([user["id"]]), "viewerCount": max(0, len(s["viewers"]) - 1)})
    return {"ok": True}


@router.post("/live/{lid}/react")
def react(lid: str, body: dict, user=Depends(get_current_user)):
    _load_live(lid, user)
    emoji = str(body.get("emoji", "❤️"))[:4]
    _ref(lid).update({f"reactions.{emoji}": Increment(1)})
    return {"ok": True}


@router.post("/live/{lid}/chat")
def live_chat(lid: str, body: ChatIn, user=Depends(get_current_user)):
    s = _load_live(lid, user)
    if not s.get("chatEnabled", True):
        raise HTTPException(status_code=403, detail="Chat disabled")
    if user["id"] in s.get("bannedUserIds", []):
        raise HTTPException(status_code=403, detail="You are blocked from this chat")
    doc = {"liveId": lid, "userId": user["id"], "userName": user.get("name", ""), "userPhoto": user.get("profilePhoto", ""),
           "text": body.text[:500], "hidden": False, "createdAt": now_iso()}
    ref = _ref(lid).collection("chat").document()
    ref.set(doc)
    return {"id": ref.id, **doc}


@router.get("/live/{lid}/chat")
def list_live_chat(lid: str, user=Depends(get_current_user)):
    _load_live(lid, user)
    items = stream(_ref(lid).collection("chat").order_by("createdAt", direction="DESCENDING").limit(100))
    items.reverse()
    return {"items": [i for i in items if not i.get("hidden")]}


@router.post("/live/{lid}/moderate")
def moderate_live(lid: str, body: dict, user=Depends(get_current_user)):
    s = get_doc("liveSessions", lid)
    if not s or (s["hostId"] != user["id"] and not can_moderate(user, s["samajId"])):
        raise HTTPException(status_code=403, detail="Not allowed")
    action = body.get("action")
    if action == "toggle_chat":
        _ref(lid).update({"chatEnabled": not s.get("chatEnabled", True)})
    elif action == "hide_message":
        _ref(lid).collection("chat").document(body["messageId"]).update({"hidden": True})
    elif action == "ban_user":
        _ref(lid).update({"bannedUserIds": ArrayUnion([body["userId"]])})
    elif action == "remove":
        if not can_moderate(user, s["samajId"]):
            raise HTTPException(status_code=403, detail="Moderator only")
        _ref(lid).update({"status": "removed", "updatedAt": now_iso()})
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    return get_doc("liveSessions", lid)


@router.delete("/live/{lid}")
def delete_live(lid: str, user=Depends(get_current_user)):
    s = get_doc("liveSessions", lid)
    if not s or (s["hostId"] != user["id"] and not can_moderate(user, s["samajId"])):
        raise HTTPException(status_code=403, detail="Not allowed")
    _ref(lid).update({"status": "removed", "updatedAt": now_iso()})
    return {"ok": True}
