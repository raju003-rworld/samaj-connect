"""Phase-3 backend tests: Photos/Albums, Hall Booking, Trending hashtags, FCM devices, Samaj role switching.

Uses Firebase dev-login token exchange (member 9000000002, super admin 9925514713, member 9000000003).
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://samaj-connect-24.preview.emergentagent.com").rstrip("/")
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
    assert r2.status_code == 200, f"token exchange failed: {r2.text}"
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


def _activate(tok, sid):
    r = requests.post(f"{API}/samaj/{sid}/activate", headers=H(tok), timeout=10)
    return r


# ---------------- Photos / Albums ----------------
class TestAlbumsAndPhotos:
    _created_album_ids = []

    def test_member_create_public_album_forbidden(self, member_tok):
        r = requests.post(f"{API}/albums", headers=H(member_tok),
                          json={"title": "TEST_public", "visibility": "public"}, timeout=15)
        # resolve_visibility should force non-admin to samaj (200) OR reject (403). Accept either.
        assert r.status_code in (200, 403), r.text
        if r.status_code == 200:
            body = r.json()
            assert body.get("visibility") != "public", "Member should not create public album"
            self.__class__._created_album_ids.append(body["id"])

    def test_member_create_samaj_album(self, member_tok):
        r = requests.post(f"{API}/albums", headers=H(member_tok),
                          json={"title": "TEST_samaj_album_p3", "visibility": "samaj",
                                "description": "phase3 album"}, timeout=15)
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["title"] == "TEST_samaj_album_p3"
        assert b["visibility"] == "samaj"
        assert b["samajId"] in (DEFAULT_SAMAJ_ID, "default")
        assert b.get("photoCount") == 0
        self.__class__._created_album_ids.append(b["id"])

    def test_list_albums_contains_created(self, member_tok):
        r = requests.get(f"{API}/albums", headers=H(member_tok), timeout=15)
        assert r.status_code == 200
        ids = [a["id"] for a in r.json().get("items", [])]
        assert self._created_album_ids[-1] in ids

    def test_add_photo_and_list(self, member_tok):
        aid = self._created_album_ids[-1]
        r = requests.post(f"{API}/albums/{aid}/photos", headers=H(member_tok),
                          json={"items": [{"url": "https://example.com/test.jpg", "type": "image", "caption": "hi"}]},
                          timeout=15)
        assert r.status_code == 200, r.text
        assert len(r.json()["items"]) == 1
        # GET verify persistence
        g = requests.get(f"{API}/albums/{aid}/photos", headers=H(member_tok), timeout=15)
        assert g.status_code == 200
        assert len(g.json()["items"]) >= 1
        # Album count updated
        ga = requests.get(f"{API}/albums/{aid}", headers=H(member_tok), timeout=15)
        assert ga.status_code == 200
        assert ga.json().get("photoCount") >= 1

    def test_samaj_b_isolation_get_404_and_upload_403(self, member_tok):
        aid = self._created_album_ids[-1]
        try:
            r_act = _activate(member_tok, SAMAJ_B_ID)
            assert r_act.status_code == 200, r_act.text
            r = requests.get(f"{API}/albums", headers=H(member_tok), timeout=15)
            assert r.status_code == 200
            ids = [a["id"] for a in r.json().get("items", [])]
            # BUG-ISOLATION: creator's own default-samaj album still listed under Samaj B
            assert aid not in ids, "Samaj B should not see default samaj album (isolation leak via createdBy query)"
            g = requests.get(f"{API}/albums/{aid}", headers=H(member_tok), timeout=15)
            assert g.status_code == 404
            p = requests.post(f"{API}/albums/{aid}/photos", headers=H(member_tok),
                              json={"items": [{"url": "https://example.com/x.jpg"}]}, timeout=15)
            assert p.status_code in (403, 404), p.text
        finally:
            requests.post(f"{API}/samaj/default/activate", headers=H(member_tok), timeout=10)

    def test_delete_album_cleanup(self, member_tok):
        for aid in list(self._created_album_ids):
            requests.delete(f"{API}/albums/{aid}", headers=H(member_tok), timeout=15)


# ---------------- Hall booking ----------------
class TestHallBooking:
    def test_list_halls_member(self, member_tok):
        r = requests.get(f"{API}/halls", headers=H(member_tok), timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "items" in j and "canManage" in j
        assert j["canManage"] is False, "member should not manage halls"

    def test_member_cannot_create_hall(self, member_tok):
        r = requests.post(f"{API}/halls", headers=H(member_tok),
                          json={"name": "TEST_hall_p3", "capacity": 50}, timeout=15)
        assert r.status_code == 403

    def test_member_cannot_view_admin_bookings(self, member_tok):
        r = requests.get(f"{API}/admin/bookings", headers=H(member_tok), timeout=15)
        assert r.status_code == 403

    def test_admin_can_list_halls_and_bookings(self, admin_tok):
        r = requests.get(f"{API}/halls", headers=H(admin_tok), timeout=15)
        assert r.status_code == 200
        assert r.json()["canManage"] is True
        r2 = requests.get(f"{API}/admin/bookings?status=all", headers=H(admin_tok), timeout=15)
        assert r2.status_code == 200

    def test_booking_conflict_and_capacity(self, member_tok):
        # There is an existing approved booking 2026-12-01 10:00-14:00 on hall t1se1JQlx7mNfydoIfyO cap 200
        hid = "t1se1JQlx7mNfydoIfyO"
        # Overlap -> 409
        r = requests.post(f"{API}/bookings", headers=H(member_tok),
                          json={"hallId": hid, "date": "2026-12-01", "startTime": "12:00", "endTime": "13:00",
                                "guests": 10, "purpose": "TEST_overlap"}, timeout=15)
        assert r.status_code == 409, r.text
        # Capacity > 200 -> 400
        r2 = requests.post(f"{API}/bookings", headers=H(member_tok),
                          json={"hallId": hid, "date": "2027-01-15", "startTime": "10:00", "endTime": "11:00",
                                "guests": 5000, "purpose": "TEST_cap"}, timeout=15)
        assert r2.status_code == 400, r2.text

    def test_booking_create_and_cancel(self, member_tok):
        hid = "t1se1JQlx7mNfydoIfyO"
        r = requests.post(f"{API}/bookings", headers=H(member_tok),
                          json={"hallId": hid, "date": f"2027-{(int(time.time())%12)+1:02d}-{(int(time.time())%27)+1:02d}", "startTime": "09:00", "endTime": "10:00",
                                "guests": 20, "purpose": "TEST_p3_booking"}, timeout=15)
        assert r.status_code == 200, r.text
        bid = r.json()["id"]
        assert r.json()["status"] == "pending"
        # my-bookings
        my = requests.get(f"{API}/bookings", headers=H(member_tok), timeout=15)
        assert my.status_code == 200
        assert any(b["id"] == bid for b in my.json()["items"])
        # cancel
        c = requests.post(f"{API}/bookings/{bid}/cancel", headers=H(member_tok), timeout=15)
        assert c.status_code == 200
        assert c.json()["status"] == "cancelled"


# ---------------- Trending hashtags ----------------
class TestTrending:
    def test_trending_endpoint(self, member_tok):
        r = requests.get(f"{API}/hashtags/trending", headers=H(member_tok), timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "items" in j
        assert isinstance(j["items"], list)


# ---------------- FCM devices ----------------
class TestDevices:
    def test_register_short_token_400(self, member_tok):
        r = requests.post(f"{API}/devices", headers=H(member_tok), json={"token": "short"}, timeout=10)
        assert r.status_code == 400, r.text

    def test_register_and_delete_ok(self, member_tok):
        long_tok = "A" * 60
        r = requests.post(f"{API}/devices", headers=H(member_tok), json={"token": long_tok}, timeout=10)
        assert r.status_code == 200, r.text
        d = requests.delete(f"{API}/devices", headers=H(member_tok), json={"token": long_tok}, timeout=10)
        assert d.status_code == 200, d.text


# ---------------- Samaj-specific role switching ----------------
class TestSamajRoles:
    def test_admin_set_role_and_hall_manage_flip(self, admin_tok, member3_tok):
        # find uid of 9000000003
        me = requests.get(f"{API}/auth/me", headers=H(member3_tok), timeout=10).json()
        uid = me["id"]
        # Set event_manager in default samaj
        r = requests.patch(f"{API}/admin/users/{uid}/role", headers=H(admin_tok),
                           json={"role": "event_manager", "samajId": "default"}, timeout=15)
        assert r.status_code == 200, r.text
        # Now 9000000003 GET /halls -> canManage true
        h = requests.get(f"{API}/halls", headers=H(member3_tok), timeout=15)
        assert h.status_code == 200
        assert h.json()["canManage"] is True
        # Can create hall
        c = requests.post(f"{API}/halls", headers=H(member3_tok),
                          json={"name": "TEST_p3_hall_role", "capacity": 30}, timeout=15)
        assert c.status_code in (200, 201), c.text
        new_hid = c.json()["id"]
        # Join + activate Samaj B
        j = requests.post(f"{API}/samaj/{SAMAJ_B_ID}/join", headers=H(member3_tok), timeout=15)
        assert j.status_code in (200, 400, 409), j.text  # may already be joined
        a = requests.post(f"{API}/samaj/{SAMAJ_B_ID}/activate", headers=H(member3_tok), timeout=15)
        assert a.status_code == 200
        h2 = requests.get(f"{API}/halls", headers=H(member3_tok), timeout=15)
        assert h2.status_code == 200
        assert h2.json()["canManage"] is False, "role in default should not apply to Samaj B"
        c2 = requests.post(f"{API}/halls", headers=H(member3_tok),
                           json={"name": "TEST_p3_should_fail", "capacity": 20}, timeout=15)
        assert c2.status_code == 403
        # Restore: activate default + role member
        requests.post(f"{API}/samaj/default/activate", headers=H(member3_tok), timeout=15)
        rb = requests.patch(f"{API}/admin/users/{uid}/role", headers=H(admin_tok),
                            json={"role": "member", "samajId": "default"}, timeout=15)
        assert rb.status_code == 200
        # cleanup created hall
        requests.delete(f"{API}/halls/{new_hid}", headers=H(admin_tok), timeout=15)


# ---------------- 401 regression: pages backing endpoints ----------------
class TestNoUnauthorized:
    ENDPOINTS = [
        "/auth/me", "/members?limit=5", "/search?q=a", "/posts?limit=5",
        "/events", "/conversations", "/live/rooms", "/notifications",
        "/albums", "/halls", "/hashtags/trending",
    ]

    @pytest.mark.parametrize("path", ENDPOINTS)
    def test_member_no_401(self, member_tok, path):
        r = requests.get(f"{API}{path}", headers=H(member_tok), timeout=15)
        assert r.status_code != 401, f"401 on {path}: {r.text}"

    @pytest.mark.parametrize("path", ENDPOINTS + ["/admin/bookings?status=pending", "/admin/stats"])
    def test_admin_no_401(self, admin_tok, path):
        r = requests.get(f"{API}{path}", headers=H(admin_tok), timeout=15)
        assert r.status_code != 401, f"401 on {path}: {r.text}"
