"""Retest samaj-isolation fix in core.can_view for albums/posts/events.

Scenario: creator's own samaj-only content must NOT leak across active-Samaj context.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://samaj-connect-repair.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
FIREBASE_API_KEY = "AIzaSyAbtSfHuagL-N8p0Uw3-C5kXOCusb_59jA"
SAMAJ_B_ID = "5a99297b87c14bf79b2c6bda6a524f1d"
DEFAULT_SAMAJ_ID = "default"

SUPER_PHONE = "+919925514713"
MEMBER_PHONE = "+919000000002"
MEMBER3_PHONE = "+919000000003"


def _exchange(phone: str) -> str:
    r = requests.post(f"{API}/auth/dev-login", json={"phone": phone, "otp": "123456"}, timeout=15)
    assert r.status_code == 200, f"dev-login failed for {phone}: {r.status_code} {r.text}"
    ct = r.json()["customToken"]
    r2 = requests.post(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={FIREBASE_API_KEY}",
        json={"token": ct, "returnSecureToken": True}, timeout=15)
    assert r2.status_code == 200, r2.text
    return r2.json()["idToken"]


def H(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def admin_tok():
    return _exchange(SUPER_PHONE)


@pytest.fixture(scope="module")
def member_tok():
    return _exchange(MEMBER_PHONE)


@pytest.fixture(scope="module")
def member3_tok():
    return _exchange(MEMBER3_PHONE)


@pytest.fixture(scope="module")
def me_id(member_tok):
    r = requests.get(f"{API}/auth/me", headers=H(member_tok), timeout=15)
    assert r.status_code == 200
    return r.json()["id"]


def _activate(tok, sid):
    r = requests.post(f"{API}/samaj/{sid}/activate", headers=H(tok), timeout=10)
    assert r.status_code == 200, r.text


class TestIsolationFix:
    """Create samaj-only + private + all_samaj content on default; switch to Samaj B; verify isolation."""
    state = {}

    def test_setup_activate_default(self, member_tok):
        _activate(member_tok, "default")

    def test_create_samaj_only_album(self, member_tok):
        r = requests.post(f"{API}/albums", headers=H(member_tok),
                          json={"title": "TEST_iso_samaj_album", "visibility": "samaj"}, timeout=15)
        assert r.status_code == 200, r.text
        self.state["samaj_album"] = r.json()["id"]

    def test_create_private_album(self, member_tok):
        r = requests.post(f"{API}/albums", headers=H(member_tok),
                          json={"title": "TEST_iso_private_album", "visibility": "private"}, timeout=15)
        assert r.status_code == 200, r.text
        self.state["private_album"] = r.json()["id"]

    def test_create_samaj_only_post(self, member_tok):
        r = requests.post(f"{API}/posts", headers=H(member_tok),
                          json={"caption": "TEST_iso_samaj_post", "visibility": "samaj"}, timeout=15)
        assert r.status_code == 200, r.text
        self.state["samaj_post"] = r.json()["id"]

    def test_create_private_post(self, member_tok):
        r = requests.post(f"{API}/posts", headers=H(member_tok),
                          json={"caption": "TEST_iso_private_post", "visibility": "private"}, timeout=15)
        assert r.status_code == 200, r.text
        self.state["private_post"] = r.json()["id"]

    def test_create_samaj_only_event(self, admin_tok):
        # events likely need admin/event_manager; create via super admin on default
        _activate(admin_tok, "default")
        r = requests.post(f"{API}/events", headers=H(admin_tok),
                          json={"title": "TEST_iso_samaj_event", "visibility": "samaj",
                                "startAt": "2027-06-01T10:00:00Z", "location": "TEST"}, timeout=15)
        if r.status_code == 200:
            self.state["samaj_event"] = r.json()["id"]
            self.state["samaj_event_owner"] = "admin"
        else:
            pytest.skip(f"events create not supported here: {r.status_code} {r.text[:120]}")

    # ----- Default-context: creator sees own samaj-only content -----
    def test_default_context_lists_own_samaj_album(self, member_tok):
        _activate(member_tok, "default")
        r = requests.get(f"{API}/albums", headers=H(member_tok), timeout=15)
        assert r.status_code == 200
        ids = [a["id"] for a in r.json().get("items", [])]
        assert self.state["samaj_album"] in ids
        assert self.state["private_album"] in ids

    def test_default_context_get_own_samaj_album_200(self, member_tok):
        r = requests.get(f"{API}/albums/{self.state['samaj_album']}", headers=H(member_tok), timeout=15)
        assert r.status_code == 200

    def test_default_context_posts_authored_lists_own(self, member_tok, me_id):
        r = requests.get(f"{API}/posts?authorId={me_id}", headers=H(member_tok), timeout=15)
        assert r.status_code == 200
        ids = [p["id"] for p in r.json().get("items", [])]
        assert self.state["samaj_post"] in ids
        assert self.state["private_post"] in ids

    def test_default_context_get_own_samaj_post_200(self, member_tok):
        r = requests.get(f"{API}/posts/{self.state['samaj_post']}", headers=H(member_tok), timeout=15)
        assert r.status_code == 200

    # ----- Switch to Samaj B: samaj-only leaks must be gone -----
    def test_activate_samaj_b(self, member_tok):
        _activate(member_tok, SAMAJ_B_ID)

    def test_samajB_albums_list_excludes_default_samaj_album(self, member_tok):
        r = requests.get(f"{API}/albums", headers=H(member_tok), timeout=15)
        assert r.status_code == 200
        ids = [a["id"] for a in r.json().get("items", [])]
        assert self.state["samaj_album"] not in ids, "samaj-only default album leaked into Samaj B context"
        # PRIVATE stays visible for owner across contexts
        assert self.state["private_album"] in ids, "own private album should remain visible across contexts"

    def test_samajB_get_default_samaj_album_404(self, member_tok):
        r = requests.get(f"{API}/albums/{self.state['samaj_album']}", headers=H(member_tok), timeout=15)
        assert r.status_code == 404

    def test_samajB_get_private_album_200(self, member_tok):
        r = requests.get(f"{API}/albums/{self.state['private_album']}", headers=H(member_tok), timeout=15)
        assert r.status_code == 200

    def test_samajB_posts_authored_excludes_default_samaj_post(self, member_tok, me_id):
        r = requests.get(f"{API}/posts?authorId={me_id}", headers=H(member_tok), timeout=15)
        assert r.status_code == 200
        ids = [p["id"] for p in r.json().get("items", [])]
        assert self.state["samaj_post"] not in ids, "samaj-only default post leaked into Samaj B context"
        assert self.state["private_post"] in ids

    def test_samajB_get_default_samaj_post_404(self, member_tok):
        r = requests.get(f"{API}/posts/{self.state['samaj_post']}", headers=H(member_tok), timeout=15)
        assert r.status_code == 404

    def test_samajB_get_private_post_200(self, member_tok):
        r = requests.get(f"{API}/posts/{self.state['private_post']}", headers=H(member_tok), timeout=15)
        assert r.status_code == 200

    def test_samajB_events_excludes_default_samaj_event(self, member_tok):
        if "samaj_event" not in self.state:
            pytest.skip("no samaj event created")
        r = requests.get(f"{API}/events", headers=H(member_tok), timeout=15)
        assert r.status_code == 200
        ids = [e["id"] for e in r.json().get("items", [])]
        assert self.state["samaj_event"] not in ids

    # ----- Super admin still sees everything -----
    def test_super_admin_sees_default_samaj_album_from_any_context(self, admin_tok):
        # Whatever admin's active samaj is, super admin has global visibility.
        r = requests.get(f"{API}/albums/{self.state['samaj_album']}", headers=H(admin_tok), timeout=15)
        assert r.status_code == 200

    def test_super_admin_sees_default_samaj_post(self, admin_tok):
        r = requests.get(f"{API}/posts/{self.state['samaj_post']}", headers=H(admin_tok), timeout=15)
        assert r.status_code == 200

    # ----- Non-owner Samaj-B user (member3) still 404 on default samaj-only items -----
    def test_member3_activate_samaj_b(self, member3_tok):
        # member3 was previously joined to Samaj B in phase-3 tests
        j = requests.post(f"{API}/samaj/{SAMAJ_B_ID}/join", headers=H(member3_tok), timeout=15)
        assert j.status_code in (200, 400, 409)
        _activate(member3_tok, SAMAJ_B_ID)

    def test_member3_get_default_samaj_album_404(self, member3_tok):
        r = requests.get(f"{API}/albums/{self.state['samaj_album']}", headers=H(member3_tok), timeout=15)
        assert r.status_code == 404

    def test_member3_get_default_samaj_post_404(self, member3_tok):
        r = requests.get(f"{API}/posts/{self.state['samaj_post']}", headers=H(member3_tok), timeout=15)
        assert r.status_code == 404

    # ----- Restore + cleanup -----
    def test_cleanup(self, member_tok, member3_tok, admin_tok):
        _activate(member_tok, "default")
        _activate(member3_tok, "default")
        _activate(admin_tok, "default")
        for aid in (self.state.get("samaj_album"), self.state.get("private_album")):
            if aid:
                requests.delete(f"{API}/albums/{aid}", headers=H(member_tok), timeout=15)
        for pid in (self.state.get("samaj_post"), self.state.get("private_post")):
            if pid:
                requests.delete(f"{API}/posts/{pid}", headers=H(member_tok), timeout=15)
        eid = self.state.get("samaj_event")
        if eid:
            requests.delete(f"{API}/events/{eid}", headers=H(admin_tok), timeout=15)
