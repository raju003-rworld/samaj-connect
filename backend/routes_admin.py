"""Admin & moderation: stats, members, users/roles, posts approval, reports, samaj settings, public access."""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from core import (db, get_current_user, require_admin, require_moderator, is_super, is_samaj_admin, can_moderate,
                  get_doc, stream, now_iso, notify, ROLES, DEFAULT_SAMAJ_ID)

router = APIRouter(prefix="/admin")


def _scope(admin: dict, samajId: Optional[str]) -> Optional[str]:
    """Super admin may pass any samajId (or None=all). Others are locked to their active samaj."""
    if is_super(admin):
        return samajId
    return admin.get("activeSamajId") or DEFAULT_SAMAJ_ID


def _in_scope(doc: dict, sid: Optional[str]) -> bool:
    return sid is None or doc.get("samajId", DEFAULT_SAMAJ_ID) == sid


@router.get("/stats")
def stats(samajId: Optional[str] = None, admin=Depends(require_moderator)):
    sid = _scope(admin, samajId)
    def cnt(col, pred=lambda d: True):
        return sum(1 for d in stream(db.collection(col).limit(2000)) if _in_scope(d, sid) and pred(d))
    return {"members": cnt("persons", lambda d: d.get("isActive", True)), "users": cnt("users") if sid is None else sum(1 for u in stream(db.collection("users").where("samajIds", "array_contains", sid).limit(2000))),
            "posts": cnt("posts", lambda d: d.get("status", "active") == "active"), "events": cnt("events"),
            "comments": cnt("comments"), "live": cnt("liveSessions"), "openReports": cnt("reports", lambda d: d.get("status") == "open"),
            "pendingPosts": cnt("posts", lambda d: not d.get("approved", True) and d.get("status") == "active")}


@router.get("/members")
def members(q: Optional[str] = None, samajId: Optional[str] = None, admin=Depends(require_admin)):
    sid = _scope(admin, samajId)
    ql = (q or "").lower()
    items = [m for m in stream(db.collection("persons").limit(2000)) if _in_scope(m, sid) and (not ql or ql in str(m.get("name", "")).lower() or ql in str(m.get("mobile", "")))]
    items.sort(key=lambda x: str(x.get("createdAt", "")), reverse=True)
    return {"items": items[:500]}


@router.patch("/members/{mid}/toggle-active")
def toggle_member(mid: str, admin=Depends(require_admin)):
    m = get_doc("persons", mid)
    if not m or not is_samaj_admin(admin, m.get("samajId", DEFAULT_SAMAJ_ID)):
        raise HTTPException(status_code=404, detail="Not found")
    db.collection("persons").document(mid).update({"isActive": not m.get("isActive", True)})
    return {"ok": True}


@router.get("/users")
def users(q: Optional[str] = None, samajId: Optional[str] = None, admin=Depends(require_admin)):
    sid = _scope(admin, samajId)
    ql = (q or "").lower()
    items = [u for u in stream(db.collection("users").limit(2000)) if (sid is None or sid in u.get("samajIds", [])) and (not ql or ql in u.get("name", "").lower() or ql in u.get("phone", ""))]
    return {"items": [{k: u.get(k) for k in ("id", "name", "phone", "role", "profilePhoto", "isSuspended", "activeSamajId", "samajIds", "createdAt")} for u in items[:500]]}


@router.patch("/users/{uid}/role")
def set_role(uid: str, body: dict, admin=Depends(require_admin)):
    role = body.get("role")
    if role not in ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    if role == "super_admin" and not is_super(admin):
        raise HTTPException(status_code=403, detail="Super admin only")
    target = get_doc("users", uid)
    if not target or not is_samaj_admin(admin, target.get("activeSamajId")):
        raise HTTPException(status_code=403, detail="Not allowed")
    db.collection("users").document(uid).update({"role": role})
    return {"ok": True}


@router.patch("/users/{uid}/suspend")
def suspend(uid: str, admin=Depends(require_admin)):
    target = get_doc("users", uid)
    if not target or not is_samaj_admin(admin, target.get("activeSamajId")) or target.get("role") == "super_admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    db.collection("users").document(uid).update({"isSuspended": not target.get("isSuspended", False)})
    return {"suspended": not target.get("isSuspended", False)}


@router.get("/posts")
def mod_posts(status: str = "pending", samajId: Optional[str] = None, admin=Depends(require_moderator)):
    sid = _scope(admin, samajId)
    def f(p):
        if not _in_scope(p, sid): return False
        if status == "pending": return not p.get("approved", True) and p.get("status") == "active"
        if status == "hidden": return p.get("status") == "hidden"
        if status == "wide": return p.get("visibility") in ("all_samaj", "public")
        return p.get("status", "active") == "active"
    items = [p for p in stream(db.collection("posts").limit(2000)) if f(p)]
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return {"items": items[:200]}


@router.post("/posts/{pid}/moderate")
def moderate_post(pid: str, body: dict, admin=Depends(require_moderator)):
    p = get_doc("posts", pid)
    if not p or not can_moderate(admin, p.get("samajId")):
        raise HTTPException(status_code=404, detail="Not found")
    action = body.get("action")
    upd = {"approve": {"approved": True, "status": "active"}, "reject": {"approved": False, "status": "hidden"},
           "hide": {"status": "hidden"}, "unhide": {"status": "active"}, "delete": {"status": "removed", "isActive": False}}.get(action)
    if not upd:
        raise HTTPException(status_code=400, detail="Invalid action")
    upd.update({"updatedAt": now_iso(), "moderatedBy": admin["id"]})
    db.collection("posts").document(pid).update(upd)
    msg = {"approve": "તમારી પોસ્ટ મંજૂર થઈ", "reject": "તમારી પોસ્ટ નામંજૂર થઈ", "hide": "તમારી પોસ્ટ છુપાવાઈ", "unhide": "તમારી પોસ્ટ ફરી દેખાય છે", "delete": "તમારી પોસ્ટ દૂર કરાઈ"}[action]
    notify(p["createdBy"], f"post_{action}", msg, (p.get("caption") or "")[:80], {"postId": pid}, p.get("samajId"), admin["id"])
    return get_doc("posts", pid)


@router.post("/comments/{cid}/moderate")
def moderate_comment(cid: str, body: dict, admin=Depends(require_moderator)):
    c = get_doc("comments", cid)
    if not c or not can_moderate(admin, c.get("samajId")):
        raise HTTPException(status_code=404, detail="Not found")
    db.collection("comments").document(cid).update({"status": "removed" if body.get("action", "remove") == "remove" else "active"})
    return {"ok": True}


@router.get("/reports")
def reports(status: str = "open", samajId: Optional[str] = None, admin=Depends(require_moderator)):
    sid = _scope(admin, samajId)
    items = [r for r in stream(db.collection("reports").limit(1000)) if _in_scope(r, sid) and (status == "all" or r.get("status") == status)]
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return {"items": items}


@router.patch("/reports/{rid}")
def resolve_report(rid: str, body: dict, admin=Depends(require_moderator)):
    r = get_doc("reports", rid)
    if not r or not can_moderate(admin, r.get("samajId")):
        raise HTTPException(status_code=404, detail="Not found")
    st = body.get("status", "resolved")
    if st not in ("open", "resolved", "dismissed"):
        raise HTTPException(status_code=400, detail="Invalid status")
    db.collection("reports").document(rid).update({"status": st, "resolvedBy": admin["id"], "resolvedAt": now_iso(), "note": body.get("note", "")})
    notify(r["reportedBy"], "report_" + st, "તમારો રિપોર્ટ " + ("ઉકેલાયો" if st == "resolved" else "નકારાયો" if st == "dismissed" else "ફરી ખોલાયો"), r.get("reason", "")[:80], {}, r.get("samajId"), admin["id"])
    return {"ok": True}


@router.get("/samaj")
def admin_samaj(admin=Depends(require_admin)):
    items = stream(db.collection("samaj"))
    if not is_super(admin):
        items = [s for s in items if s["id"] in admin.get("samajIds", [])]
    return {"items": items}


@router.patch("/samaj/{sid}")
def update_samaj(sid: str, body: dict, admin=Depends(require_admin)):
    if not is_samaj_admin(admin, sid):
        raise HTTPException(status_code=403, detail="Not allowed")
    allowed = {"name", "nameEn", "code", "requirePostApproval"}
    if is_super(admin):
        allowed.add("isActive")
    upd = {k: v for k, v in body.items() if k in allowed}
    if upd:
        db.collection("samaj").document(sid).update(upd)
    return get_doc("samaj", sid)


@router.get("/settings")
def get_settings(admin=Depends(require_admin)):
    return get_doc("settings", "global") or {"publicAccessEnabled": False}


@router.patch("/settings")
def update_settings(body: dict, admin=Depends(get_current_user)):
    if not is_super(admin):
        raise HTTPException(status_code=403, detail="Super admin only")
    db.collection("settings").document("global").set({"publicAccessEnabled": bool(body.get("publicAccessEnabled", False))}, merge=True)
    return get_doc("settings", "global")


@router.get("/live")
def admin_live(samajId: Optional[str] = None, admin=Depends(require_moderator)):
    sid = _scope(admin, samajId)
    items = [l for l in stream(db.collection("liveSessions").limit(500)) if _in_scope(l, sid)]
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return {"items": items}
