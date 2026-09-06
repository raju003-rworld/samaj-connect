"""One-time: copy legacy MongoDB members/posts/events into Firestore (default samaj). Idempotent via legacyId."""
import os, asyncio
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")
from core import db, DEFAULT_SAMAJ_ID
from motor.motor_asyncio import AsyncIOMotorClient


async def main():
    m = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    plan = {"members": ("persons", {"isActive": True}), "posts": ("posts", {"status": "active", "approved": True, "visibility": "samaj", "savedBy": [], "sharesCount": 0, "hashtags": [], "mediaType": "image"}), "events": ("events", {"visibility": "samaj"})}
    for src, (dst, defaults) in plan.items():
        n = 0
        async for d in m[src].find({}, {"_id": 0}):
            lid = d.get("id")
            if list(db.collection(dst).where("legacyId", "==", lid).limit(1).stream()):
                continue
            doc = {**defaults, **d, "legacyId": lid, "samajId": DEFAULT_SAMAJ_ID}
            doc.pop("id", None)
            if dst == "posts":
                doc["mediaUrls"] = doc.get("imageUrls", []); doc["caption"] = doc.get("content", ""); doc["createdBy"] = doc.get("authorId")
            db.collection(dst).document(lid).set(doc)
            n += 1
        print(src, "->", dst, "migrated", n)
    # legacy persons without samajId -> default samaj
    for s in db.collection("persons").stream():
        if not s.to_dict().get("samajId"):
            s.reference.update({"samajId": DEFAULT_SAMAJ_ID, "isActive": s.to_dict().get("isActive", True)})
    for s in db.collection("events").stream():
        if not s.to_dict().get("visibility"):
            s.reference.update({"visibility": "samaj", "samajId": s.to_dict().get("samajId", DEFAULT_SAMAJ_ID)})

asyncio.run(main())
