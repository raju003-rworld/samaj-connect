"""SAMAJ CONNECT Phase-2 tests: event/location on posts, cursor pagination, view, repost 403,
comment report, search events, public/posts endpoint, admin moderation notifications."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://samaj-connect-24.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
FIREBASE_API_KEY = "AIzaSyAbtSfHuagL-N8p0Uw3-C5kXOCusb_59jA"
SAMAJ_B_ID = "5a99297b87c14bf79b2c6bda6a524f1d"

SUPER_PHONE = "+919925514713"
MEMBER_PHONE = "+919000000002"
MEMBER2_PHONE = "+919000000003"


def _exchange(phone: str) -> str:
    r = requests.post(f"{API}/auth/dev-login", json={"phone": phone, "otp": "123456"}, timeout=15)
    assert r.status_code == 200, f"dev-login: {r.status_code} {r.text}"
    ct = r.json()["customToken"]
    r2 = requests.post(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={FIREBASE_API_KEY}",
        json={"token": ct, "returnSecureToken": True}, timeout=15)
    assert r2.status_code == 200, r2.text
    return r2.json()["idToken"]


def H(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def admin_token():
    return _exchange(SUPER_PHONE)


@pytest.fixture(scope="session")
def member_token():
    return _exchange(MEMBER_PHONE)


@pytest.fixture(scope="session")
def member2_token():
    return _exchange(MEMBER2_PHONE)


# ---------- Post with event + location ----------
class TestPostEventLocation:
    def test_create_post_with_event_and_location(self, admin_token, member_token):
        # admin creates event
        r = requests.post(f"{API}/events", headers=H(admin_token),
                          json={"title": "TEST_evt_phase2", "date": "2026-06-01", "location": "Ahmedabad",
                                "visibility": "samaj"}, timeout=15)
        assert r.status_code == 200, r.text
        eid = r.json()["id"]
        try:
            # member creates post attaching event + #hashtag + location
            r2 = requests.post(f"{API}/posts", headers=H(member_token),
                               json={"caption": "TEST_evt_post #phase2test",
                                     "eventId": eid, "location": "Rajkot", "visibility": "samaj"}, timeout=15)
            assert r2.status_code == 200, r2.text
            p = r2.json()
            assert p.get("eventId") == eid
            assert p.get("event", {}).get("title") == "TEST_evt_phase2"
            assert p.get("location") == "Rajkot"
            assert "phase2test" in p.get("hashtags", [])
            requests.delete(f"{API}/posts/{p['id']}", headers=H(member_token), timeout=10)
        finally:
            requests.delete(f"{API}/events/{eid}", headers=H(admin_token), timeout=10)

    def test_create_post_with_invalid_event_404(self, member_token):
        r = requests.post(f"{API}/posts", headers=H(member_token),
                          json={"caption": "TEST_bad_evt", "eventId": "nonexistent_id_xyz"}, timeout=15)
        assert r.status_code == 404


# ---------- Cursor pagination ----------
class TestCursorPagination:
    def test_before_cursor_returns_older_and_no_duplicates(self, member_token):
        created = []
        for i in range(12):
            r = requests.post(f"{API}/posts", headers=H(member_token),
                              json={"caption": f"TEST_cursor_{i}_{os.urandom(2).hex()}", "visibility": "samaj"}, timeout=10)
            assert r.status_code == 200, r.text
            created.append(r.json()["id"])
            time.sleep(0.05)
        try:
            r1 = requests.get(f"{API}/posts?limit=10", headers=H(member_token), timeout=15)
            assert r1.status_code == 200
            j1 = r1.json()
            page1_ids = [p["id"] for p in j1["items"]]
            assert len(page1_ids) == 10
            cursor = j1.get("nextCursor")
            assert cursor, "nextCursor missing on first page"
            r2 = requests.get(f"{API}/posts?limit=10&before={cursor}", headers=H(member_token), timeout=15)
            assert r2.status_code == 200
            page2_ids = [p["id"] for p in r2.json()["items"]]
            assert not (set(page1_ids) & set(page2_ids)), "duplicate ids across pages"
        finally:
            for pid in created:
                requests.delete(f"{API}/posts/{pid}", headers=H(member_token), timeout=10)


# ---------- View count ----------
class TestViewCount:
    def test_view_increments_for_non_author(self, member_token, member2_token):
        r = requests.post(f"{API}/posts", headers=H(member_token),
                          json={"caption": "TEST_views", "visibility": "samaj"}, timeout=10)
        assert r.status_code == 200
        pid = r.json()["id"]
        try:
            # author's own view should NOT increment
            requests.post(f"{API}/posts/{pid}/view", headers=H(member_token), timeout=10)
            g0 = requests.get(f"{API}/posts/{pid}", headers=H(member_token), timeout=10).json()
            assert g0.get("viewsCount", 0) == 0

            # other user's view increments
            requests.post(f"{API}/posts/{pid}/view", headers=H(member2_token), timeout=10)
            g1 = requests.get(f"{API}/posts/{pid}", headers=H(member_token), timeout=10).json()
            assert g1.get("viewsCount", 0) >= 1
        finally:
            requests.delete(f"{API}/posts/{pid}", headers=H(member_token), timeout=10)


# ---------- Repost authorization ----------
class TestRepostAuthz:
    def test_member_cannot_repost_samaj_only_to_samaj_b(self, member_token, admin_token):
        r = requests.post(f"{API}/posts", headers=H(admin_token),
                          json={"caption": "TEST_repost_src", "visibility": "samaj"}, timeout=10)
        assert r.status_code == 200
        pid = r.json()["id"]
        try:
            r2 = requests.post(f"{API}/posts/{pid}/repost", headers=H(member_token),
                               json={"caption": "TEST_repost_target_B", "samajId": SAMAJ_B_ID,
                                     "visibility": "samaj"}, timeout=10)
            assert r2.status_code == 403, f"expected 403 got {r2.status_code}: {r2.text}"
        finally:
            requests.delete(f"{API}/posts/{pid}", headers=H(admin_token), timeout=10)

    def test_private_post_repost_403(self, member_token):
        r = requests.post(f"{API}/posts", headers=H(member_token),
                          json={"caption": "TEST_priv", "visibility": "private"}, timeout=10)
        assert r.status_code == 200
        pid = r.json()["id"]
        try:
            r2 = requests.post(f"{API}/posts/{pid}/repost", headers=H(member_token),
                               json={"caption": "TEST_priv_share"}, timeout=10)
            assert r2.status_code == 403
        finally:
            requests.delete(f"{API}/posts/{pid}", headers=H(member_token), timeout=10)

    def test_repost_own_samaj_ok(self, member_token, admin_token):
        r = requests.post(f"{API}/posts", headers=H(admin_token),
                          json={"caption": "TEST_repost_ok_src", "visibility": "samaj"}, timeout=10)
        pid = r.json()["id"]
        try:
            r2 = requests.post(f"{API}/posts/{pid}/repost", headers=H(member_token),
                               json={"caption": "TEST_repost_ok_caption"}, timeout=10)
            assert r2.status_code == 200, r2.text
            shared = r2.json()
            assert shared.get("mediaType") == "share"
            assert shared.get("sharedFrom", {}).get("id") == pid
            requests.delete(f"{API}/posts/{shared['id']}", headers=H(member_token), timeout=10)
        finally:
            requests.delete(f"{API}/posts/{pid}", headers=H(admin_token), timeout=10)


# ---------- Comment report ----------
class TestCommentReport:
    def test_report_comment(self, member_token, member2_token):
        r = requests.post(f"{API}/posts", headers=H(member_token),
                          json={"caption": "TEST_comm_report_post"}, timeout=10)
        pid = r.json()["id"]
        try:
            c = requests.post(f"{API}/posts/{pid}/comments", headers=H(member_token),
                              json={"content": "TEST_comment_to_report"}, timeout=10)
            assert c.status_code == 200
            cid = c.json()["id"]
            rep = requests.post(f"{API}/reports", headers=H(member2_token),
                                json={"targetType": "comment", "targetId": cid, "reason": "TEST_spam"}, timeout=10)
            assert rep.status_code == 200
            assert rep.json().get("status") == "open"
        finally:
            requests.delete(f"{API}/posts/{pid}", headers=H(member_token), timeout=10)


# ---------- Search: events ----------
class TestSearchEvents:
    def test_search_returns_events(self, admin_token, member_token):
        r = requests.post(f"{API}/events", headers=H(admin_token),
                          json={"title": "TEST_search_evtxyz", "date": "2026-06-01",
                                "location": "Somewhere", "visibility": "samaj"}, timeout=10)
        eid = r.json()["id"]
        try:
            s = requests.get(f"{API}/search?q=search_evtxyz", headers=H(member_token), timeout=10)
            assert s.status_code == 200
            events = s.json().get("events", [])
            assert any(e["id"] == eid for e in events), f"event not in search: {events}"
        finally:
            requests.delete(f"{API}/events/{eid}", headers=H(admin_token), timeout=10)


# ---------- Public post endpoint ----------
class TestPublicPost:
    def test_public_post_when_disabled_403(self):
        cfg = requests.get(f"{API}/auth/config", timeout=10).json()
        if cfg.get("publicAccessEnabled"):
            pytest.skip("publicAccess is enabled; skipping disabled-check")
        r = requests.get(f"{API}/public/posts/anything", timeout=10)
        assert r.status_code == 403

    def test_public_post_flow_when_enabled(self, admin_token):
        # enable
        requests.patch(f"{API}/admin/settings", headers=H(admin_token),
                       json={"publicAccessEnabled": True}, timeout=10)
        try:
            # create public post
            pr = requests.post(f"{API}/posts", headers=H(admin_token),
                               json={"caption": "TEST_public_" + os.urandom(2).hex(),
                                     "visibility": "public"}, timeout=10)
            assert pr.status_code == 200
            pid = pr.json()["id"]
            # create samaj-only post
            sr = requests.post(f"{API}/posts", headers=H(admin_token),
                               json={"caption": "TEST_samaj_only", "visibility": "samaj"}, timeout=10)
            spid = sr.json()["id"]
            try:
                # unauth GET public post -> 200
                r1 = requests.get(f"{API}/public/posts/{pid}", timeout=10)
                assert r1.status_code == 200, r1.text
                assert r1.json().get("id") == pid
                # unauth GET samaj-only -> 404
                r2 = requests.get(f"{API}/public/posts/{spid}", timeout=10)
                assert r2.status_code == 404
            finally:
                requests.delete(f"{API}/posts/{pid}", headers=H(admin_token), timeout=10)
                requests.delete(f"{API}/posts/{spid}", headers=H(admin_token), timeout=10)
        finally:
            # restore disabled
            requests.patch(f"{API}/admin/settings", headers=H(admin_token),
                           json={"publicAccessEnabled": False}, timeout=10)


# ---------- Admin moderation notifications ----------
class TestModerationNotifications:
    def test_hide_notifies_author(self, admin_token, member_token):
        r = requests.post(f"{API}/posts", headers=H(member_token),
                          json={"caption": "TEST_mod_hide_" + os.urandom(2).hex()}, timeout=10)
        pid = r.json()["id"]
        try:
            m = requests.post(f"{API}/admin/posts/{pid}/moderate", headers=H(admin_token),
                              json={"action": "hide"}, timeout=10)
            assert m.status_code == 200
            time.sleep(0.5)
            n = requests.get(f"{API}/notifications", headers=H(member_token), timeout=10).json()
            types = [i.get("type") for i in n.get("items", [])]
            assert "post_hide" in types, f"post_hide notification missing; got {types[:10]}"
        finally:
            requests.delete(f"{API}/posts/{pid}", headers=H(admin_token), timeout=10)

    def test_resolve_report_notifies_reporter(self, admin_token, member_token, member2_token):
        # member post, member2 reports, admin resolves
        r = requests.post(f"{API}/posts", headers=H(member_token),
                          json={"caption": "TEST_report_resolved"}, timeout=10)
        pid = r.json()["id"]
        try:
            rep = requests.post(f"{API}/reports", headers=H(member2_token),
                                json={"targetType": "post", "targetId": pid, "reason": "TEST"}, timeout=10)
            rid = rep.json()["id"]
            rr = requests.patch(f"{API}/admin/reports/{rid}", headers=H(admin_token),
                                json={"status": "resolved"}, timeout=10)
            assert rr.status_code == 200
            time.sleep(0.5)
            n = requests.get(f"{API}/notifications", headers=H(member2_token), timeout=10).json()
            types = [i.get("type") for i in n.get("items", [])]
            assert "report_resolved" in types, f"report_resolved missing; got {types[:10]}"
        finally:
            requests.delete(f"{API}/posts/{pid}", headers=H(member_token), timeout=10)
