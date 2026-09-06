"""WhatsApp-like messenger. Writes via API (server sets identity/samajId); clients read realtime via Firestore listeners guarded by rules."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from google.cloud.firestore_v1 import ArrayUnion, ArrayRemove, Increment

from core import db, get_current_user, get_doc, stream, now_iso, notify, DEFAULT_SAMAJ_ID

router = APIRouter()


class DirectIn(BaseModel):
    userId: str


class GroupIn(BaseModel):
    name: str
    memberIds: List[str] = []
    photo: str = ""


class MessageIn(BaseModel):
    type: str = "text"  # text | image | video | document | voice
    text: str = ""
    mediaUrl: str = ""
    fileName: str = ""
    replyTo: Optional[str] = None


def _conv_ref(cid: str):
    return db.collection("conversations").document(cid)


def _load_member_conv(cid: str, user: dict) -> dict:
    c = get_doc("conversations", cid)
    if not c or user["id"] not in c.get("memberIds", []):
        raise HTTPException(status_code=403, detail="Not a conversation member")
    return c


def _user_brief(uid: str) -> dict:
    u = get_doc("users", uid) or {}
    return {"id": uid, "name": u.get("name", ""), "photo": u.get("profilePhoto", "")}


@router.post("/conversations/direct")
def open_direct(body: DirectIn, user=Depends(get_current_user)):
    other = get_doc("users", body.userId)
    if not other or body.userId == user["id"]:
        raise HTTPException(status_code=404, detail="User not found")
    if user["id"] in other.get("blocked", []) or body.userId in user.get("blocked", []):
        raise HTTPException(status_code=403, detail="Blocked")
    key = "_".join(sorted([user["id"], body.userId]))
    ref = _conv_ref(f"d_{key}")
    snap = ref.get()
    if snap.exists:
        d = snap.to_dict(); d["id"] = snap.id
        return d
    doc = {"type": "direct", "memberIds": [user["id"], body.userId],
           "members": {user["id"]: _user_brief(user["id"]), body.userId: _user_brief(body.userId)},
           "samajId": user.get("activeSamajId") or DEFAULT_SAMAJ_ID, "createdBy": user["id"], "createdAt": now_iso(),
           "updatedAt": now_iso(), "lastMessage": None, "unread": {user["id"]: 0, body.userId: 0}, "muted": [], "typing": {}}
    ref.set(doc)
    return {"id": ref.id, **doc}


@router.post("/conversations/group")
def create_group(body: GroupIn, user=Depends(get_current_user)):
    ids = list(dict.fromkeys([user["id"]] + [i for i in body.memberIds if get_doc("users", i)]))
    if len(ids) < 2:
        raise HTTPException(status_code=400, detail="Add at least one member")
    doc = {"type": "group", "name": body.name.strip() or "Group", "photo": body.photo, "memberIds": ids,
           "members": {i: _user_brief(i) for i in ids}, "admins": [user["id"]],
           "samajId": user.get("activeSamajId") or DEFAULT_SAMAJ_ID, "createdBy": user["id"], "createdAt": now_iso(),
           "updatedAt": now_iso(), "lastMessage": None, "unread": {i: 0 for i in ids}, "muted": [], "typing": {}}
    ref = db.collection("conversations").document()
    ref.set(doc)
    db.collection("groups").document(ref.id).set({"conversationId": ref.id, "name": doc["name"], "samajId": doc["samajId"], "createdBy": user["id"], "createdAt": doc["createdAt"]})
    for i in ids:
        notify(i, "group_added", f"{user.get('name')} એ તમને '{doc['name']}' ગ્રુપમાં ઉમેર્યા", "", {"conversationId": ref.id}, doc["samajId"], user["id"])
    return {"id": ref.id, **doc}


@router.get("/conversations")
def list_conversations(q: str = "", user=Depends(get_current_user)):
    items = stream(db.collection("conversations").where("memberIds", "array_contains", user["id"]).limit(300))
    ql = q.lower().strip()
    if ql:
        def title(c):
            if c["type"] == "group": return c.get("name", "")
            return " ".join(m.get("name", "") for k, m in c.get("members", {}).items() if k != user["id"])
        items = [c for c in items if ql in title(c).lower()]
    items.sort(key=lambda x: x.get("updatedAt", ""), reverse=True)
    return {"items": items}


@router.get("/conversations/{cid}")
def get_conversation(cid: str, user=Depends(get_current_user)):
    return _load_member_conv(cid, user)


@router.get("/conversations/{cid}/messages")
def list_messages(cid: str, limit: int = 100, user=Depends(get_current_user)):
    _load_member_conv(cid, user)
    items = stream(_conv_ref(cid).collection("messages").order_by("createdAt", direction="DESCENDING").limit(limit))
    items.reverse()
    return {"items": [m for m in items if user["id"] not in m.get("deletedFor", [])]}


@router.post("/conversations/{cid}/messages")
def send_message(cid: str, m: MessageIn, user=Depends(get_current_user)):
    c = _load_member_conv(cid, user)
    if m.type not in ("text", "image", "video", "document", "voice"):
        raise HTTPException(status_code=400, detail="Invalid type")
    if not m.text.strip() and not m.mediaUrl:
        raise HTTPException(status_code=400, detail="Empty message")
    if c["type"] == "direct":
        other = [i for i in c["memberIds"] if i != user["id"]][0]
        ou = get_doc("users", other) or {}
        if user["id"] in ou.get("blocked", []):
            raise HTTPException(status_code=403, detail="Blocked")
    reply = None
    if m.replyTo:
        r = get_doc(f"conversations/{cid}/messages", m.replyTo)
        if r:
            reply = {"id": r["id"], "text": r.get("text", ""), "type": r.get("type"), "senderName": r.get("senderName")}
    doc = {"conversationId": cid, "senderId": user["id"], "senderName": user.get("name", ""), "type": m.type,
           "text": m.text, "mediaUrl": m.mediaUrl, "fileName": m.fileName, "replyTo": reply,
           "status": "sent", "deliveredTo": [], "readBy": [user["id"]], "deletedFor": [], "deleted": False, "createdAt": now_iso()}
    ref = _conv_ref(cid).collection("messages").document()
    ref.set(doc)
    preview = m.text[:60] if m.type == "text" else {"image": "📷 Photo", "video": "🎥 Video", "document": f"📄 {m.fileName or 'Document'}", "voice": "🎤 Voice"}[m.type]
    upd = {"lastMessage": {"id": ref.id, "text": preview, "senderId": user["id"], "senderName": user.get("name", ""), "type": m.type, "createdAt": doc["createdAt"]},
           "updatedAt": doc["createdAt"], f"typing.{user['id']}": False}
    for i in c["memberIds"]:
        if i != user["id"]:
            upd[f"unread.{i}"] = Increment(1)
    _conv_ref(cid).update(upd)
    for i in c["memberIds"]:
        if i != user["id"] and i not in c.get("muted", []):
            notify(i, "message", user.get("name", ""), preview, {"conversationId": cid}, c.get("samajId"), user["id"])
    return {"id": ref.id, **doc}


@router.post("/conversations/{cid}/read")
def mark_read(cid: str, user=Depends(get_current_user)):
    _load_member_conv(cid, user)
    _conv_ref(cid).update({f"unread.{user['id']}": 0})
    batch = db.batch()
    n = 0
    for s in _conv_ref(cid).collection("messages").order_by("createdAt", direction="DESCENDING").limit(50).stream():
        d = s.to_dict()
        if user["id"] not in d.get("readBy", []):
            batch.update(s.reference, {"readBy": ArrayUnion([user["id"]]), "deliveredTo": ArrayUnion([user["id"]]), "status": "read"})
            n += 1
    if n:
        batch.commit()
    return {"ok": True, "updated": n}


@router.post("/conversations/{cid}/delivered")
def mark_delivered(cid: str, user=Depends(get_current_user)):
    _load_member_conv(cid, user)
    batch, n = db.batch(), 0
    for s in _conv_ref(cid).collection("messages").order_by("createdAt", direction="DESCENDING").limit(30).stream():
        d = s.to_dict()
        if d.get("senderId") != user["id"] and user["id"] not in d.get("deliveredTo", []):
            batch.update(s.reference, {"deliveredTo": ArrayUnion([user["id"]]), "status": "delivered" if d.get("status") == "sent" else d.get("status")})
            n += 1
    if n:
        batch.commit()
    return {"ok": True}


@router.post("/conversations/{cid}/typing")
def typing(cid: str, body: dict, user=Depends(get_current_user)):
    _load_member_conv(cid, user)
    _conv_ref(cid).update({f"typing.{user['id']}": bool(body.get("typing"))})
    return {"ok": True}


@router.delete("/conversations/{cid}/messages/{mid}")
def delete_message(cid: str, mid: str, forEveryone: bool = False, user=Depends(get_current_user)):
    c = _load_member_conv(cid, user)
    ref = _conv_ref(cid).collection("messages").document(mid)
    m = ref.get().to_dict()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    if forEveryone:
        if m["senderId"] != user["id"] and user["id"] not in c.get("admins", []):
            raise HTTPException(status_code=403, detail="Not allowed")
        ref.update({"deleted": True, "text": "", "mediaUrl": "", "type": "text"})
    else:
        ref.update({"deletedFor": ArrayUnion([user["id"]])})
    return {"ok": True}


@router.post("/conversations/{cid}/mute")
def mute(cid: str, user=Depends(get_current_user)):
    c = _load_member_conv(cid, user)
    muted = user["id"] in c.get("muted", [])
    _conv_ref(cid).update({"muted": ArrayRemove([user["id"]]) if muted else ArrayUnion([user["id"]])})
    return {"muted": not muted}


def _require_group_admin(cid: str, user: dict) -> dict:
    c = _load_member_conv(cid, user)
    if c["type"] != "group" or user["id"] not in c.get("admins", []):
        raise HTTPException(status_code=403, detail="Group admin only")
    return c


@router.post("/conversations/{cid}/members")
def add_members(cid: str, body: dict, user=Depends(get_current_user)):
    c = _require_group_admin(cid, user)
    ids = [i for i in body.get("memberIds", []) if get_doc("users", i) and i not in c["memberIds"]]
    if not ids:
        return c
    upd = {"memberIds": ArrayUnion(ids), "updatedAt": now_iso()}
    for i in ids:
        upd[f"members.{i}"] = _user_brief(i); upd[f"unread.{i}"] = 0
        notify(i, "group_added", f"{user.get('name')} એ તમને '{c.get('name')}' ગ્રુપમાં ઉમેર્યા", "", {"conversationId": cid}, c.get("samajId"), user["id"])
    _conv_ref(cid).update(upd)
    return get_doc("conversations", cid)


@router.delete("/conversations/{cid}/members/{uid}")
def remove_member(cid: str, uid: str, user=Depends(get_current_user)):
    c = _load_member_conv(cid, user)
    if uid != user["id"] and user["id"] not in c.get("admins", []):
        raise HTTPException(status_code=403, detail="Group admin only")
    from google.cloud.firestore_v1 import DELETE_FIELD
    _conv_ref(cid).update({"memberIds": ArrayRemove([uid]), "admins": ArrayRemove([uid]), f"members.{uid}": DELETE_FIELD, "updatedAt": now_iso()})
    return {"ok": True}


@router.post("/conversations/{cid}/admins/{uid}")
def toggle_admin(cid: str, uid: str, user=Depends(get_current_user)):
    c = _require_group_admin(cid, user)
    if uid not in c["memberIds"]:
        raise HTTPException(status_code=400, detail="Not a member")
    is_admin = uid in c.get("admins", [])
    _conv_ref(cid).update({"admins": ArrayRemove([uid]) if is_admin else ArrayUnion([uid])})
    return {"admin": not is_admin}


@router.patch("/conversations/{cid}")
def update_group(cid: str, body: dict, user=Depends(get_current_user)):
    _require_group_admin(cid, user)
    upd = {k: v for k, v in body.items() if k in ("name", "photo")}
    if upd:
        _conv_ref(cid).update(upd)
        if "name" in upd:
            db.collection("groups").document(cid).set({"name": upd["name"]}, merge=True)
    return get_doc("conversations", cid)


@router.post("/presence")
def presence(body: dict, user=Depends(get_current_user)):
    db.collection("presence").document(user["id"]).set({"online": bool(body.get("online", True)), "lastSeen": now_iso()}, merge=True)
    return {"ok": True}
