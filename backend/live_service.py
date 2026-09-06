"""Live streaming provider abstraction. No fake video: providers return real playback/ingest info or raise 501."""
from fastapi import HTTPException
import os


class LiveProvider:
    name = "base"

    def start(self, session: dict, host: dict) -> dict:
        raise NotImplementedError

    def end(self, session: dict) -> dict:
        return {}


class EmbedProvider(LiveProvider):
    """Host streams via YouTube/Facebook/any HLS and pastes the playback URL. Firebase keeps metadata/chat/viewers."""
    name = "embed"

    def start(self, session: dict, host: dict) -> dict:
        url = (session.get("streamUrl") or "").strip()
        if not url:
            raise HTTPException(status_code=400, detail="streamUrl (YouTube/Facebook/HLS) જરૂરી છે")
        return {"playbackUrl": url, "playbackType": _playback_type(url), "ingestUrl": None}


class LiveKitProvider(LiveProvider):
    """WebRTC via LiveKit. Requires LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET."""
    name = "livekit"

    def start(self, session: dict, host: dict) -> dict:
        url, key, secret = os.environ.get("LIVEKIT_URL"), os.environ.get("LIVEKIT_API_KEY"), os.environ.get("LIVEKIT_API_SECRET")
        if not (url and key and secret):
            raise HTTPException(status_code=501, detail="LiveKit provider not configured (LIVEKIT_URL/API_KEY/API_SECRET)")
        try:
            from livekit import api as lk
        except ImportError:
            raise HTTPException(status_code=501, detail="livekit-api package not installed")
        token = lk.AccessToken(key, secret).with_identity(host["id"]).with_name(host.get("name", "")) \
            .with_grants(lk.VideoGrants(room_join=True, room=session["id"], room_admin=True)).to_jwt()
        return {"playbackUrl": url, "playbackType": "webrtc", "room": session["id"], "hostToken": token}


class MuxProvider(LiveProvider):
    """RTMP ingest + HLS playback via Mux. Requires MUX_TOKEN_ID, MUX_TOKEN_SECRET."""
    name = "mux"

    def start(self, session: dict, host: dict) -> dict:
        tid, sec = os.environ.get("MUX_TOKEN_ID"), os.environ.get("MUX_TOKEN_SECRET")
        if not (tid and sec):
            raise HTTPException(status_code=501, detail="Mux provider not configured (MUX_TOKEN_ID/MUX_TOKEN_SECRET)")
        import requests
        r = requests.post("https://api.mux.com/video/v1/live-streams", auth=(tid, sec), json={"playback_policy": ["public"], "new_asset_settings": {"playback_policy": ["public"]}}, timeout=20)
        if r.status_code >= 300:
            raise HTTPException(status_code=502, detail=f"Mux error: {r.text[:200]}")
        d = r.json()["data"]
        pid = d["playback_ids"][0]["id"]
        return {"playbackUrl": f"https://stream.mux.com/{pid}.m3u8", "playbackType": "hls",
                "ingestUrl": "rtmps://global-live.mux.com:443/app", "streamKey": d["stream_key"], "providerId": d["id"]}


def _playback_type(url: str) -> str:
    u = url.lower()
    if "youtube.com" in u or "youtu.be" in u: return "youtube"
    if "facebook.com" in u or "fb.watch" in u: return "facebook"
    if u.endswith(".m3u8"): return "hls"
    return "iframe"


PROVIDERS = {"embed": EmbedProvider(), "livekit": LiveKitProvider(), "mux": MuxProvider()}


def get_provider() -> LiveProvider:
    return PROVIDERS.get(os.environ.get("LIVE_PROVIDER", "embed"), PROVIDERS["embed"])
