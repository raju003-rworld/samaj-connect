"""Hall booking: halls (per samaj, admin/event_manager managed) + booking requests with conflict prevention and approval workflow."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from core import db, get_current_user, get_doc, stream, now_iso, notify, is_samaj_admin, is_event_manager, DEFAULT_SAMAJ_ID

router = APIRouter()


class HallIn(BaseModel):
    name: str
    description: str = ""
    location: str = ""
    capacity: int = 100
    imageUrl: str = ""
    pricePerDay: Optional[float] = None
    amenities: list = []
    isActive: bool = True


class BookingIn(BaseModel):
    hallId: str
    date: str          # YYYY-MM-DD
    startTime: str     # HH:MM
    endTime: str       # HH:MM
    purpose: str = ""
    guests: int = 0
    contactPhone: str = ""


def _hall(hid: str, user: dict) -> dict:
    h = get_doc("halls", hid)
    if not h or (h.get("samajId") != user.get("activeSamajId") and not is_samaj_admin(user, h.get("samajId"))):
        raise HTTPException(status_code=404, detail="Hall not found")
    return h


def _overlaps(a_start, a_end, b_start, b_end) -> bool:
    return a_start < b_end and b_start < a_end


@router.get("/halls")
def list_halls(user=Depends(get_current_user)):
    sid = user.get("activeSamajId") or DEFAULT_SAMAJ_ID
    items = [h for h in stream(db.collection("halls").where("samajId", "==", sid)) if h.get("isActive", True) or is_event_manager(user, sid)]
    items.sort(key=lambda x: x.get("name", ""))
    return {"items": items, "canManage": is_event_manager(user, sid)}


@router.post("/halls")
def create_hall(b: HallIn, user=Depends(get_current_user)):
    sid = user.get("activeSamajId") or DEFAULT_SAMAJ_ID
    if not is_event_manager(user, sid):
        raise HTTPException(status_code=403, detail="Admin / Hall manager only")
    doc = {**b.model_dump(), "samajId": sid, "createdBy": user["id"], "createdAt": now_iso()}
    ref = db.collection("halls").document()
    ref.set(doc)
    return {"id": ref.id, **doc}


@router.patch("/halls/{hid}")
def update_hall(hid: str, patch: dict, user=Depends(get_current_user)):
    h = _hall(hid, user)
    if not is_event_manager(user, h["samajId"]):
        raise HTTPException(status_code=403, detail="Admin / Hall manager only")
    upd = {k: v for k, v in patch.items() if k in HallIn.model_fields}
    if upd:
        db.collection("halls").document(hid).update(upd)
    return get_doc("halls", hid)


@router.get("/halls/{hid}")
def get_hall(hid: str, date: Optional[str] = None, user=Depends(get_current_user)):
    h = _hall(hid, user)
    q = db.collection("bookings").where("hallId", "==", hid)
    if date:
        q = q.where("date", "==", date)
    busy = [{"date": b["date"], "startTime": b["startTime"], "endTime": b["endTime"], "status": b["status"]}
            for b in stream(q.limit(500)) if b.get("status") in ("pending", "approved")]
    h["busySlots"] = busy
    return h


@router.post("/bookings")
def create_booking(b: BookingIn, user=Depends(get_current_user)):
    h = _hall(b.hallId, user)
    if not h.get("isActive", True):
        raise HTTPException(status_code=400, detail="Hall inactive")
    if not (b.date and b.startTime and b.endTime) or b.startTime >= b.endTime:
        raise HTTPException(status_code=400, detail="Invalid date/time")
    if b.guests > int(h.get("capacity", 0) or 0):
        raise HTTPException(status_code=400, detail=f"ક્ષમતા {h.get('capacity')} થી વધુ મહેમાનો શક્ય નથી")
    existing = [x for x in stream(db.collection("bookings").where("hallId", "==", b.hallId).where("date", "==", b.date)) if x.get("status") in ("pending", "approved")]
    if any(_overlaps(b.startTime, b.endTime, x["startTime"], x["endTime"]) for x in existing):
        raise HTTPException(status_code=409, detail="આ સમય પહેલેથી બુક છે")
    doc = {**b.model_dump(), "hallName": h.get("name", ""), "samajId": h["samajId"], "userId": user["id"], "createdBy": user["id"],
           "userName": user.get("name", ""), "userPhone": user.get("phone", ""), "status": "pending", "adminNote": "",
           "createdAt": now_iso(), "updatedAt": now_iso()}
    ref = db.collection("bookings").document()
    ref.set(doc)
    for a in stream(db.collection("users").where("samajIds", "array_contains", h["samajId"]).limit(500)):
        if is_event_manager(a, h["samajId"]):
            notify(a["id"], "booking_request", f"નવી હોલ બુકિંગ વિનંતી: {h.get('name')}", f"{user.get('name')} · {b.date} {b.startTime}-{b.endTime}", {"bookingId": ref.id}, h["samajId"], user["id"])
    return {"id": ref.id, **doc}


@router.get("/bookings")
def my_bookings(user=Depends(get_current_user)):
    items = [b for b in stream(db.collection("bookings").where("userId", "==", user["id"]).limit(300)) if b.get("samajId") == user.get("activeSamajId")]
    items.sort(key=lambda x: (x.get("date", ""), x.get("startTime", "")), reverse=True)
    return {"items": items}


@router.post("/bookings/{bid}/cancel")
def cancel_booking(bid: str, user=Depends(get_current_user)):
    b = get_doc("bookings", bid)
    if not b or (b.get("userId") != user["id"] and not is_event_manager(user, b.get("samajId"))):
        raise HTTPException(status_code=404, detail="Booking not found")
    if b.get("status") in ("cancelled", "rejected"):
        return b
    db.collection("bookings").document(bid).update({"status": "cancelled", "updatedAt": now_iso()})
    return get_doc("bookings", bid)


# ---- manager/admin ----
@router.get("/admin/bookings")
def admin_bookings(status: str = "pending", user=Depends(get_current_user)):
    sid = user.get("activeSamajId") or DEFAULT_SAMAJ_ID
    if not is_event_manager(user, sid):
        raise HTTPException(status_code=403, detail="Admin / Hall manager only")
    items = [b for b in stream(db.collection("bookings").where("samajId", "==", sid).limit(1000)) if status == "all" or b.get("status") == status]
    items.sort(key=lambda x: (x.get("date", ""), x.get("startTime", "")))
    return {"items": items}


@router.post("/admin/bookings/{bid}/decision")
def decide_booking(bid: str, body: dict, user=Depends(get_current_user)):
    b = get_doc("bookings", bid)
    if not b or not is_event_manager(user, b.get("samajId")):
        raise HTTPException(status_code=403, detail="Not allowed")
    action = body.get("action")
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Invalid action")
    if action == "approve":
        clash = [x for x in stream(db.collection("bookings").where("hallId", "==", b["hallId"]).where("date", "==", b["date"]))
                 if x["id"] != bid and x.get("status") == "approved" and _overlaps(b["startTime"], b["endTime"], x["startTime"], x["endTime"])]
        if clash:
            raise HTTPException(status_code=409, detail="બીજી મંજૂર બુકિંગ સાથે સમય ટકરાય છે")
    st = "approved" if action == "approve" else "rejected"
    db.collection("bookings").document(bid).update({"status": st, "adminNote": str(body.get("note", ""))[:300], "decidedBy": user["id"], "updatedAt": now_iso()})
    notify(b["userId"], f"booking_{st}", f"હોલ બુકિંગ {'મંજૂર' if st == 'approved' else 'નામંજૂર'}: {b.get('hallName')}", f"{b['date']} {b['startTime']}-{b['endTime']} {body.get('note', '')}", {"bookingId": bid}, b["samajId"], user["id"])
    return get_doc("bookings", bid)
