"""Events management RBAC tests: canManage flag, PATCH/DELETE 403 for unauthorized.

Covers:
- Super admin creates event, PATCH updates same id (no duplicate), canManage true globally.
- Member 9000000002 gets 403 on PATCH/DELETE of admin's event; sees canManage=false.
- Setting 9000000003 role event_manager (default samaj) via admin route grants canManage=true.
- When 9000000003 activates Samaj B, canManage falls to false and PATCH -> 403.
- Restore 9000000003 role member.
- Samaj B member cannot GET default samaj-only event (404).
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
        json={"token": ct, "returnSecureToken": True}, timeout=15,
    )
    assert r2.status_code == 200, r2.text
    return r2.json()["idToken"]


def H(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


def _activate(tok, sid):
    r = requests.post(f"{API}/samaj/{sid}/activate", headers=H(tok), timeout=10)
    assert r.status_code == 200, r.text


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
def member3_id(member3_tok):
    r = requests.get(f"{API}/auth/me", headers=H(member3_tok), timeout=15)
    assert r.status_code == 200
    return r.json()["id"]


# Module-shared event id created by super admin on default samaj
STATE = {}


def _future_date():
    # Use a date well in the future so it appears in "upcoming" tab
    return "2030-06-15"


class TestEventsManageRBAC:
    def test_00_admin_activate_default(self, admin_tok):
        _activate(admin_tok, DEFAULT_SAMAJ_ID)

    def test_01_admin_create_event(self, admin_tok):
        payload = {
            "title": "TEST_rbac_event",
            "description": "rbac original",
            "location": "TEST",
            "date": _future_date(),
            "startTime": "10:00",
            "endTime": "12:00",
            "visibility": "samaj",
        }
        r = requests.post(f"{API}/events", headers=H(admin_tok), json=payload, timeout=15)
        assert r.status_code == 200, r.text
        STATE["eid"] = r.json()["id"]

    def test_02_admin_get_canManage_true(self, admin_tok):
        r = requests.get(f"{API}/events/{STATE['eid']}", headers=H(admin_tok), timeout=15)
        assert r.status_code == 200
        assert r.json().get("canManage") is True

    def test_03_admin_patch_same_id_no_duplicate(self, admin_tok):
        # count upcoming before
        r1 = requests.get(f"{API}/events", headers=H(admin_tok), params={"filter": "upcoming"}, timeout=15)
        assert r1.status_code == 200
        count_before = len(r1.json()["items"])

        r = requests.patch(f"{API}/events/{STATE['eid']}", headers=H(admin_tok),
                           json={"title": "TEST_rbac_event_edited"}, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["id"] == STATE["eid"]
        assert r.json()["title"] == "TEST_rbac_event_edited"

        r2 = requests.get(f"{API}/events", headers=H(admin_tok), params={"filter": "upcoming"}, timeout=15)
        assert r2.status_code == 200
        count_after = len(r2.json()["items"])
        assert count_after == count_before, f"Event list count changed after PATCH: {count_before} -> {count_after}"

    def test_04_member_canManage_false(self, member_tok):
        _activate(member_tok, DEFAULT_SAMAJ_ID)
        r = requests.get(f"{API}/events/{STATE['eid']}", headers=H(member_tok), timeout=15)
        assert r.status_code == 200
        assert r.json().get("canManage") is False

    def test_05_member_patch_forbidden(self, member_tok):
        r = requests.patch(f"{API}/events/{STATE['eid']}", headers=H(member_tok),
                           json={"title": "HACK"}, timeout=15)
        assert r.status_code == 403, f"expected 403, got {r.status_code} {r.text}"

    def test_06_member_delete_forbidden(self, member_tok):
        r = requests.delete(f"{API}/events/{STATE['eid']}", headers=H(member_tok), timeout=15)
        assert r.status_code == 403, f"expected 403, got {r.status_code} {r.text}"

    def test_07_promote_member3_event_manager_default(self, admin_tok, member3_id):
        _activate(admin_tok, DEFAULT_SAMAJ_ID)
        r = requests.patch(f"{API}/admin/users/{member3_id}/role", headers=H(admin_tok),
                           json={"role": "event_manager", "samajId": DEFAULT_SAMAJ_ID}, timeout=15)
        assert r.status_code == 200, r.text

    def test_08_member3_canManage_true_on_default(self, member3_tok):
        _activate(member3_tok, DEFAULT_SAMAJ_ID)
        r = requests.get(f"{API}/events/{STATE['eid']}", headers=H(member3_tok), timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("canManage") is True

    def test_09_member3_switch_to_samajB_and_patch_forbidden(self, member3_tok):
        # ensure member3 has joined Samaj B (idempotent join)
        requests.post(f"{API}/samaj/{SAMAJ_B_ID}/join", headers=H(member3_tok), timeout=15)
        _activate(member3_tok, SAMAJ_B_ID)
        # Event is samaj-only on default; from Samaj B context, should 404 (not visible)
        r = requests.get(f"{API}/events/{STATE['eid']}", headers=H(member3_tok), timeout=15)
        assert r.status_code == 404, f"expected 404 for cross-samaj GET, got {r.status_code}"
        # PATCH must be 403 (not in active samaj)
        r2 = requests.patch(f"{API}/events/{STATE['eid']}", headers=H(member3_tok),
                            json={"title": "HACK2"}, timeout=15)
        assert r2.status_code == 403, f"expected 403, got {r2.status_code} {r2.text}"

    def test_10_restore_member3_role_and_default(self, admin_tok, member3_tok, member3_id):
        _activate(admin_tok, DEFAULT_SAMAJ_ID)
        r = requests.patch(f"{API}/admin/users/{member3_id}/role", headers=H(admin_tok),
                           json={"role": "member", "samajId": DEFAULT_SAMAJ_ID}, timeout=15)
        assert r.status_code == 200, r.text
        _activate(member3_tok, DEFAULT_SAMAJ_ID)

    def test_11_samajB_user_cannot_get_default_event(self, member_tok):
        # Isolation regression: Samaj B active member cannot GET default samaj-only event
        _activate(member_tok, SAMAJ_B_ID)
        r = requests.get(f"{API}/events/{STATE['eid']}", headers=H(member_tok), timeout=15)
        assert r.status_code == 404, f"expected 404 cross-samaj GET, got {r.status_code}"
        _activate(member_tok, DEFAULT_SAMAJ_ID)

    def test_99_cleanup_delete_event(self, admin_tok):
        eid = STATE.get("eid")
        if not eid:
            return
        r = requests.delete(f"{API}/events/{eid}", headers=H(admin_tok), timeout=15)
        assert r.status_code == 200, r.text
