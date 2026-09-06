"""SAMAJ CONNECT Phase-2 backend tests (Firestore + Firebase Auth).

Covers auth token exchange, samaj isolation, post visibility authorization,
conversation membership, live cross-samaj, and public feed toggle.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://samaj-connect-24.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
FIREBASE_API_KEY = "AIzaSyAbtSfHuagL-N8p0Uw3-C5kXOCusb_59jA"
SAMAJ_B_ID = "5a99297b87c14bf79b2c6bda6a524f1d"

SUPER_PHONE = "+919925514713"
MEMBER_PHONE = "+919000000002"


def _exchange(phone: str) -> str:
    r = requests.post(f"{API}/auth/dev-login", json={"phone": phone, "otp": "123456"}, timeout=15)
    assert r.status_code == 200, f"dev-login failed: {r.status_code} {r.text}"
    ct = r.json()["customToken"]
    r2 = requests.post(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={FIREBASE_API_KEY}",
        json={"token": ct, "returnSecureToken": True}, timeout=15)
    assert r2.status_code == 200, f"token exchange failed: {r2.text}"
    return r2.json()["idToken"]


@pytest.fixture(scope="session")
def admin_token():
    return _exchange(SUPER_PHONE)


@pytest.fixture(scope="session")
def member_token():
    return _exchange(MEMBER_PHONE)


def H(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# ---------- Auth ----------
class TestAuthBasics:
    def test_auth_config(self):
        r = requests.get(f"{API}/auth/config", timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j.get("devAuth") is True
        assert "publicAccessEnabled" in j

    def test_auth_me_member(self, member_token):
        r = requests.get(f"{API}/auth/me", headers=H(member_token), timeout=10)
        assert r.status_code == 200
        u = r.json()
        assert u["phone"] == MEMBER_PHONE
        assert "role" in u
        assert "activeSamajId" in u

    def test_auth_me_admin_is_super(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=H(admin_token), timeout=10)
        assert r.status_code == 200
        assert r.json().get("role") == "super_admin"

    def test_auth_me_no_token(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code in (401, 403)


# ---------- Post visibility authorization ----------
class TestPostVisibilityAuthz:
    def test_member_cannot_post_public(self, member_token):
        r = requests.post(f"{API}/posts",
                          headers=H(member_token),
                          json={"caption": "TEST_public_denied", "visibility": "public"},
                          timeout=15)
        assert r.status_code == 403, f"expected 403 got {r.status_code}: {r.text}"

    def test_member_cannot_post_all_samaj(self, member_token):
        r = requests.post(f"{API}/posts",
                          headers=H(member_token),
                          json={"caption": "TEST_all_samaj_denied", "visibility": "all_samaj"},
                          timeout=15)
        assert r.status_code == 403

    def test_member_injected_samajId_createdBy_overridden(self, member_token):
        # member should not be able to inject samajId/createdBy
        r = requests.post(f"{API}/posts",
                          headers=H(member_token),
                          json={"caption": "TEST_injection", "visibility": "samaj",
                                "samajId": "hacked_samaj", "createdBy": "hacked_user"},
                          timeout=15)
        assert r.status_code == 200, r.text
        post = r.json()
        assert post.get("samajId") != "hacked_samaj"
        assert post.get("createdBy") != "hacked_user"
        # cleanup
        requests.delete(f"{API}/posts/{post['id']}", headers=H(member_token), timeout=10)

    def test_admin_can_post_public(self, admin_token):
        r = requests.post(f"{API}/posts",
                          headers=H(admin_token),
                          json={"caption": "TEST_admin_public", "visibility": "public"},
                          timeout=15)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        requests.delete(f"{API}/posts/{pid}", headers=H(admin_token), timeout=10)


# ---------- Samaj isolation ----------
class TestSamajIsolation:
    def test_samaj_isolation_after_switch(self, member_token, admin_token):
        # 1) admin (default samaj) creates a samaj-only post
        r = requests.post(f"{API}/posts", headers=H(admin_token),
                          json={"caption": "TEST_default_only_" + os.urandom(3).hex(),
                                "visibility": "samaj"}, timeout=15)
        assert r.status_code == 200, r.text
        default_pid = r.json()["id"]
        default_caption = r.json()["caption"]

        # 2) admin creates all_samaj announcement
        r2 = requests.post(f"{API}/posts", headers=H(admin_token),
                           json={"caption": "TEST_all_samaj_ann_" + os.urandom(3).hex(),
                                 "visibility": "all_samaj"}, timeout=15)
        assert r2.status_code == 200
        all_pid = r2.json()["id"]
        all_caption = r2.json()["caption"]

        try:
            # switch member to Samaj B
            act = requests.post(f"{API}/samaj/{SAMAJ_B_ID}/activate", headers=H(member_token), timeout=10)
            if act.status_code != 200:
                pytest.skip(f"Member is not in Samaj B: {act.status_code} {act.text}")

            feed = requests.get(f"{API}/posts?limit=100", headers=H(member_token), timeout=15)
            assert feed.status_code == 200
            captions = [p.get("caption") for p in feed.json().get("items", [])]
            assert default_caption not in captions, "Samaj-only post leaked cross-samaj"
            assert all_caption in captions, "all_samaj post did not appear cross-samaj"
        finally:
            # restore member to default
            requests.post(f"{API}/samaj/default/activate", headers=H(member_token), timeout=10)
            requests.delete(f"{API}/posts/{default_pid}", headers=H(admin_token), timeout=10)
            requests.delete(f"{API}/posts/{all_pid}", headers=H(admin_token), timeout=10)


# ---------- Conversation membership ----------
class TestConversationAuthz:
    def test_non_member_cannot_read_messages(self, admin_token, member_token):
        # admin creates a direct conv with self (or fetch existing). Simpler: create direct with member,
        # then try to read from a THIRD user token created on the fly.
        # Create direct conv admin<->member
        me_admin = requests.get(f"{API}/auth/me", headers=H(admin_token), timeout=10).json()
        me_member = requests.get(f"{API}/auth/me", headers=H(member_token), timeout=10).json()
        r = requests.post(f"{API}/conversations/direct", headers=H(admin_token),
                          json={"userId": me_member["id"]}, timeout=15)
        assert r.status_code == 200, r.text
        cid = r.json()["id"]

        # Third user
        third_tok = _exchange("+919000009999")
        r2 = requests.get(f"{API}/conversations/{cid}/messages", headers=H(third_tok), timeout=10)
        assert r2.status_code == 403, f"expected 403 got {r2.status_code}"

        # But the members themselves can read
        r3 = requests.get(f"{API}/conversations/{cid}/messages", headers=H(member_token), timeout=10)
        assert r3.status_code == 200


# ---------- Live cross-samaj ----------
class TestLiveCrossSamaj:
    def test_live_samaj_only_hidden_cross_samaj(self, admin_token, member_token):
        # Admin creates samaj-only live in default samaj
        r = requests.post(f"{API}/live", headers=H(admin_token),
                          json={"title": "TEST_live_default",
                                "streamUrl": "https://www.youtube.com/watch?v=jfKfPfyJRdk",
                                "visibility": "samaj"}, timeout=15)
        assert r.status_code == 200, r.text
        lid = r.json()["id"]

        try:
            act = requests.post(f"{API}/samaj/{SAMAJ_B_ID}/activate", headers=H(member_token), timeout=10)
            if act.status_code != 200:
                pytest.skip("member not in Samaj B")
            r2 = requests.get(f"{API}/live/{lid}", headers=H(member_token), timeout=10)
            assert r2.status_code == 404, f"expected 404 got {r2.status_code}"
        finally:
            requests.post(f"{API}/samaj/default/activate", headers=H(member_token), timeout=10)
            requests.delete(f"{API}/live/{lid}", headers=H(admin_token), timeout=10)


# ---------- Public feed toggle ----------
class TestPublicFeedToggle:
    def test_public_feed_default_disabled(self):
        # By default publicAccessEnabled=false in seed; unauthenticated should be 403
        r = requests.get(f"{API}/public/feed", timeout=10)
        # If enabled elsewhere this may be 200, so check config first
        cfg = requests.get(f"{API}/auth/config", timeout=10).json()
        if cfg.get("publicAccessEnabled"):
            assert r.status_code == 200
        else:
            assert r.status_code == 403, f"expected 403 when public disabled, got {r.status_code}"


# ---------- Live requires streamUrl ----------
class TestLiveValidation:
    def test_live_start_without_streamurl_fails(self, admin_token):
        # Create live without streamUrl (allowed as scheduled/draft), but /start must reject
        r = requests.post(f"{API}/live", headers=H(admin_token),
                          json={"title": "TEST_no_url", "visibility": "samaj"}, timeout=15)
        assert r.status_code == 200, r.text
        lid = r.json()["id"]
        try:
            s = requests.post(f"{API}/live/{lid}/start", headers=H(admin_token), json={}, timeout=15)
            assert s.status_code in (400, 422), f"expected 400/422 got {s.status_code}: {s.text}"
        finally:
            requests.delete(f"{API}/live/{lid}", headers=H(admin_token), timeout=10)
