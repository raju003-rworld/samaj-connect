#!/usr/bin/env python3
"""
Profile Verification Workflow Test Suite for Samaj Connect (TASK 4)
Tests verification submission, admin approval/rejection, and verified-only publishing guard
"""

import requests
import json
from typing import Dict, Tuple, Optional

# Base URL
BASE_URL = "https://b5c99426-11b3-4b0f-8151-b911a4003d2b.preview.emergentagent.com/api"

# Test Tokens
SUPER_ADMIN = "mock-token-9925514713"
USER_U = "mock-token-9551000001"  # Normal user for approval flow
USER_V = "mock-token-9551000002"  # User for rejection flow
USER_W = "mock-token-9551000003"  # Non-verified user for publish guard

def get_auth_header(token: str) -> Dict[str, str]:
    """Get authorization header"""
    return {"Authorization": f"Bearer {token}"}

def provision_user(token: str) -> Tuple[int, dict]:
    """Provision user by calling GET /api/auth/me"""
    headers = get_auth_header(token)
    url = f"{BASE_URL}/auth/me"
    try:
        response = requests.get(url, headers=headers, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def get_verification_status(token: str) -> Tuple[int, dict]:
    """GET /api/verification/status"""
    headers = get_auth_header(token)
    url = f"{BASE_URL}/verification/status"
    try:
        response = requests.get(url, headers=headers, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def submit_verification(token: str) -> Tuple[int, dict]:
    """POST /api/verification/submit"""
    headers = get_auth_header(token)
    url = f"{BASE_URL}/verification/submit"
    try:
        response = requests.post(url, headers=headers, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def update_profile(token: str, payload: dict) -> Tuple[int, dict]:
    """PATCH /api/auth/me"""
    headers = get_auth_header(token)
    headers["Content-Type"] = "application/json"
    url = f"{BASE_URL}/auth/me"
    try:
        response = requests.patch(url, headers=headers, json=payload, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def admin_approve(admin_token: str, uid: str) -> Tuple[int, dict]:
    """POST /api/admin/verification/:uid/approve"""
    headers = get_auth_header(admin_token)
    url = f"{BASE_URL}/admin/verification/{uid}/approve"
    try:
        response = requests.post(url, headers=headers, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def admin_reject(admin_token: str, uid: str, reason: Optional[str] = None) -> Tuple[int, dict]:
    """POST /api/admin/verification/:uid/reject"""
    headers = get_auth_header(admin_token)
    headers["Content-Type"] = "application/json"
    url = f"{BASE_URL}/admin/verification/{uid}/reject"
    payload = {}
    if reason is not None:
        payload["reason"] = reason
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def get_pending_verifications(admin_token: str) -> Tuple[int, dict]:
    """GET /api/admin/verification"""
    headers = get_auth_header(admin_token)
    url = f"{BASE_URL}/admin/verification"
    try:
        response = requests.get(url, headers=headers, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def get_admin_settings(admin_token: str) -> Tuple[int, dict]:
    """GET /api/admin/settings"""
    headers = get_auth_header(admin_token)
    url = f"{BASE_URL}/admin/settings"
    try:
        response = requests.get(url, headers=headers, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def update_admin_settings(admin_token: str, payload: dict) -> Tuple[int, dict]:
    """PATCH /api/admin/settings"""
    headers = get_auth_header(admin_token)
    headers["Content-Type"] = "application/json"
    url = f"{BASE_URL}/admin/settings"
    try:
        response = requests.patch(url, headers=headers, json=payload, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def create_post(token: str, payload: dict) -> Tuple[int, dict]:
    """POST /api/posts"""
    headers = get_auth_header(token)
    headers["Content-Type"] = "application/json"
    url = f"{BASE_URL}/posts"
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def run_tests():
    """Run all 14 verification workflow tests"""
    results = []
    
    print("=" * 100)
    print("PROFILE VERIFICATION WORKFLOW TEST SUITE (TASK 4)")
    print("=" * 100)
    print()
    
    # Provision users
    print("SETUP: Provisioning test users...")
    provision_user(SUPER_ADMIN)
    provision_user(USER_U)
    provision_user(USER_V)
    provision_user(USER_W)
    print("  ✓ Users provisioned")
    print()
    
    # Test 1: INCOMPLETE cannot submit
    print("Test 1: INCOMPLETE profile cannot submit verification")
    print("  Step 1: Make U's profile incomplete (empty village)")
    status_patch, _ = update_profile(USER_U, {"village": ""})
    print(f"    PATCH /api/auth/me: {status_patch}")
    
    print("  Step 2: Try to submit verification")
    status_submit, data_submit = submit_verification(USER_U)
    print(f"    POST /api/verification/submit: {status_submit}")
    
    print("  Step 3: Check status")
    status_check, data_check = get_verification_status(USER_U)
    print(f"    GET /api/verification/status: {status_check}")
    
    has_missing_fields = False
    if status_submit == 400 and isinstance(data_submit, dict):
        has_missing_fields = "missingFields" in data_submit or "missing" in str(data_submit).lower()
    
    state_is_incomplete = False
    if status_check == 200 and isinstance(data_check, dict):
        state_is_incomplete = data_check.get("verificationState") == "PROFILE_INCOMPLETE"
    
    pass_1 = (status_submit == 400 and has_missing_fields and state_is_incomplete)
    results.append(("Test 1", "INCOMPLETE cannot submit", pass_1, 
                   f"submit={status_submit}, has_missing={has_missing_fields}, state={data_check.get('verificationState') if isinstance(data_check, dict) else 'N/A'}"))
    print(f"  Result: {'✅ PASS' if pass_1 else '❌ FAIL'}")
    print()
    
    # Test 2: COMPLETE then submit
    print("Test 2: COMPLETE profile can submit verification")
    print("  Step 1: Complete U's profile")
    status_patch, _ = update_profile(USER_U, {"village": "Unjha", "name": "User U", "district": "Mehsana"})
    print(f"    PATCH /api/auth/me: {status_patch}")
    
    print("  Step 2: Submit verification")
    status_submit, data_submit = submit_verification(USER_U)
    print(f"    POST /api/verification/submit: {status_submit}")
    
    pass_2 = (status_submit == 200)
    results.append(("Test 2", "COMPLETE can submit", pass_2, f"submit={status_submit}"))
    print(f"  Result: {'✅ PASS' if pass_2 else '❌ FAIL'}")
    print()
    
    # Test 3: Status becomes VERIFICATION_PENDING
    print("Test 3: Status becomes VERIFICATION_PENDING after submit")
    status_check, data_check = get_verification_status(USER_U)
    print(f"  GET /api/verification/status: {status_check}")
    
    state_is_pending = False
    if status_check == 200 and isinstance(data_check, dict):
        state_is_pending = data_check.get("verificationState") == "VERIFICATION_PENDING"
        print(f"    verificationState: {data_check.get('verificationState')}")
    
    pass_3 = state_is_pending
    results.append(("Test 3", "Status = VERIFICATION_PENDING", pass_3, 
                   f"state={data_check.get('verificationState') if isinstance(data_check, dict) else 'N/A'}"))
    print(f"  Result: {'✅ PASS' if pass_3 else '❌ FAIL'}")
    print()
    
    # Test 4: Normal user CANNOT self-verify
    print("Test 4: Normal user CANNOT self-verify")
    print("  (a) Try to set verificationStatus via PATCH /api/auth/me")
    status_patch, _ = update_profile(USER_U, {"verificationStatus": "verified"})
    print(f"    PATCH /api/auth/me: {status_patch}")
    
    status_check, data_check = get_verification_status(USER_U)
    print(f"    GET /api/verification/status: {status_check}")
    state_still_pending = False
    if status_check == 200 and isinstance(data_check, dict):
        state_still_pending = data_check.get("verificationState") == "VERIFICATION_PENDING"
        print(f"    verificationState: {data_check.get('verificationState')}")
    
    print("  (b) Try to approve self via admin endpoint")
    status_self_approve, _ = admin_approve(USER_U, "user_9551000001")
    print(f"    POST /api/admin/verification/user_9551000001/approve: {status_self_approve}")
    
    pass_4 = (state_still_pending and status_self_approve in [401, 403])
    results.append(("Test 4", "Normal user CANNOT self-verify", pass_4, 
                   f"state={data_check.get('verificationState') if isinstance(data_check, dict) else 'N/A'}, self_approve={status_self_approve}"))
    print(f"  Result: {'✅ PASS' if pass_4 else '❌ FAIL'}")
    print()
    
    # Test 5: Admin sees pending user
    print("Test 5: Admin sees pending user in list")
    status_list, data_list = get_pending_verifications(SUPER_ADMIN)
    print(f"  GET /api/admin/verification: {status_list}")
    
    user_in_list = False
    if status_list == 200:
        if isinstance(data_list, list):
            user_ids = [u.get("id") or u.get("uid") for u in data_list if isinstance(u, dict)]
            user_in_list = "user_9551000001" in user_ids
            print(f"    Pending users: {user_ids}")
        elif isinstance(data_list, dict) and "items" in data_list:
            user_ids = [u.get("id") or u.get("uid") for u in data_list["items"] if isinstance(u, dict)]
            user_in_list = "user_9551000001" in user_ids
            print(f"    Pending users: {user_ids}")
    
    pass_5 = (status_list == 200 and user_in_list)
    results.append(("Test 5", "Admin sees pending user", pass_5, 
                   f"status={status_list}, user_in_list={user_in_list}"))
    print(f"  Result: {'✅ PASS' if pass_5 else '❌ FAIL'}")
    print()
    
    # Test 6: Admin APPROVE
    print("Test 6: Admin APPROVE user")
    status_approve, _ = admin_approve(SUPER_ADMIN, "user_9551000001")
    print(f"  POST /api/admin/verification/user_9551000001/approve: {status_approve}")
    
    status_check, data_check = get_verification_status(USER_U)
    print(f"  GET /api/verification/status (as U): {status_check}")
    
    state_is_verified = False
    if status_check == 200 and isinstance(data_check, dict):
        state_is_verified = data_check.get("verificationState") == "VERIFIED"
        print(f"    verificationState: {data_check.get('verificationState')}")
    
    pass_6 = (status_approve == 200 and state_is_verified)
    results.append(("Test 6", "Admin APPROVE", pass_6, 
                   f"approve={status_approve}, state={data_check.get('verificationState') if isinstance(data_check, dict) else 'N/A'}"))
    print(f"  Result: {'✅ PASS' if pass_6 else '❌ FAIL'}")
    print()
    
    # Test 7: Admin REJECT requires reason
    print("Test 7: Admin REJECT requires reason")
    print("  Setup: Provision and submit for user V")
    update_profile(USER_V, {"village": "Vadodara", "name": "User V", "district": "Vadodara"})
    submit_verification(USER_V)
    print("    ✓ User V submitted")
    
    print("  Step 1: Try reject with EMPTY body")
    status_reject_empty, data_reject_empty = admin_reject(SUPER_ADMIN, "user_9551000002", reason="")
    print(f"    POST /api/admin/verification/user_9551000002/reject (empty): {status_reject_empty}")
    
    print("  Step 2: Reject with reason")
    status_reject_reason, data_reject_reason = admin_reject(SUPER_ADMIN, "user_9551000002", reason="Photo unclear")
    print(f"    POST /api/admin/verification/user_9551000002/reject (reason): {status_reject_reason}")
    
    status_check, data_check = get_verification_status(USER_V)
    print(f"  GET /api/verification/status (as V): {status_check}")
    
    state_is_rejected = False
    if status_check == 200 and isinstance(data_check, dict):
        state_is_rejected = data_check.get("verificationState") == "REJECTED"
        print(f"    verificationState: {data_check.get('verificationState')}")
    
    pass_7 = (status_reject_empty == 400 and status_reject_reason == 200 and state_is_rejected)
    results.append(("Test 7", "Admin REJECT requires reason", pass_7, 
                   f"reject_empty={status_reject_empty}, reject_reason={status_reject_reason}, state={data_check.get('verificationState') if isinstance(data_check, dict) else 'N/A'}"))
    print(f"  Result: {'✅ PASS' if pass_7 else '❌ FAIL'}")
    print()
    
    # Test 8: User sees rejection reason
    print("Test 8: User sees rejection reason")
    status_check, data_check = get_verification_status(USER_V)
    print(f"  GET /api/verification/status (as V): {status_check}")
    
    rejection_reason = None
    if status_check == 200 and isinstance(data_check, dict):
        rejection_reason = data_check.get("rejectionReason")
        print(f"    rejectionReason: {rejection_reason}")
    
    pass_8 = (rejection_reason == "Photo unclear")
    results.append(("Test 8", "User sees rejection reason", pass_8, 
                   f"reason={rejection_reason}"))
    print(f"  Result: {'✅ PASS' if pass_8 else '❌ FAIL'}")
    print()
    
    # Test 9: Rejected can resubmit
    print("Test 9: Rejected user can resubmit")
    status_resubmit, _ = submit_verification(USER_V)
    print(f"  POST /api/verification/submit (as V): {status_resubmit}")
    
    status_check, data_check = get_verification_status(USER_V)
    print(f"  GET /api/verification/status (as V): {status_check}")
    
    state_is_pending = False
    rejection_cleared = False
    if status_check == 200 and isinstance(data_check, dict):
        state_is_pending = data_check.get("verificationState") == "VERIFICATION_PENDING"
        rejection_reason = data_check.get("rejectionReason")
        rejection_cleared = (rejection_reason is None or rejection_reason == "")
        print(f"    verificationState: {data_check.get('verificationState')}")
        print(f"    rejectionReason: {rejection_reason}")
    
    pass_9 = (status_resubmit == 200 and state_is_pending and rejection_cleared)
    results.append(("Test 9", "Rejected can resubmit", pass_9, 
                   f"resubmit={status_resubmit}, state={data_check.get('verificationState') if isinstance(data_check, dict) else 'N/A'}, reason_cleared={rejection_cleared}"))
    print(f"  Result: {'✅ PASS' if pass_9 else '❌ FAIL'}")
    print()
    
    # Test 10: VERIFIED can publish when setting ON
    print("Test 10: VERIFIED user can publish when requireVerificationForPosting=true")
    print("  Step 1: Enable requireVerificationForPosting")
    status_settings, _ = update_admin_settings(SUPER_ADMIN, {"requireVerificationForPosting": True})
    print(f"    PATCH /api/admin/settings: {status_settings}")
    
    print("  Step 2: U (VERIFIED) creates a post")
    status_post, data_post = create_post(USER_U, {"visibility": "public", "content": "Hello from verified user"})
    print(f"    POST /api/posts (as U): {status_post}")
    
    pass_10 = (status_post == 200)
    results.append(("Test 10", "VERIFIED can publish when ON", pass_10, 
                   f"post={status_post}"))
    print(f"  Result: {'✅ PASS' if pass_10 else '❌ FAIL'}")
    print()
    
    # Test 11: NON-verified cannot publish when ON
    print("Test 11: NON-verified user cannot publish when requireVerificationForPosting=true")
    print("  Step 1: W (non-verified) tries to create a post")
    status_post, data_post = create_post(USER_W, {"visibility": "public", "content": "Hello from unverified user"})
    print(f"    POST /api/posts (as W): {status_post}")
    
    print("  Step 2: W tries to create a reel")
    status_reel, data_reel = create_post(USER_W, {"visibility": "public", "mediaType": "reel", "mediaUrls": ["x.mp4"]})
    print(f"    POST /api/posts reel (as W): {status_reel}")
    
    pass_11 = (status_post == 403 and status_reel == 403)
    results.append(("Test 11", "NON-verified cannot publish when ON", pass_11, 
                   f"post={status_post}, reel={status_reel}"))
    print(f"  Result: {'✅ PASS' if pass_11 else '❌ FAIL'}")
    print()
    
    # Test 12: Direct API bypass blocked
    print("Test 12: Direct API bypass blocked (non-verified cannot self-approve)")
    print("  Step 1: W tries to approve self")
    status_self_approve, _ = admin_approve(USER_W, "user_9551000003")
    print(f"    POST /api/admin/verification/user_9551000003/approve (as W): {status_self_approve}")
    
    print("  Step 2: W still cannot publish")
    status_post, _ = create_post(USER_W, {"visibility": "public", "content": "Bypass attempt"})
    print(f"    POST /api/posts (as W): {status_post}")
    
    pass_12 = (status_self_approve in [401, 403] and status_post == 403)
    results.append(("Test 12", "Direct API bypass blocked", pass_12, 
                   f"self_approve={status_self_approve}, post={status_post}"))
    print(f"  Result: {'✅ PASS' if pass_12 else '❌ FAIL'}")
    print()
    
    # Test 13: REGRESSION - setting OFF restores posting
    print("Test 13: REGRESSION - requireVerificationForPosting=false restores posting")
    print("  Step 1: Disable requireVerificationForPosting")
    status_settings, _ = update_admin_settings(SUPER_ADMIN, {"requireVerificationForPosting": False})
    print(f"    PATCH /api/admin/settings: {status_settings}")
    
    print("  Step 2: W (non-verified) can now publish")
    status_post, data_post = create_post(USER_W, {"content": "Post with setting OFF"})
    print(f"    POST /api/posts (as W): {status_post}")
    
    pass_13 = (status_post == 200)
    results.append(("Test 13", "REGRESSION - setting OFF restores posting", pass_13, 
                   f"post={status_post}"))
    print(f"  Result: {'✅ PASS' if pass_13 else '❌ FAIL'}")
    print()
    
    # Test 14: REGRESSION - admin security intact
    print("Test 14: REGRESSION - admin security intact")
    print("  Step 1: W (non-admin) tries to access admin endpoint")
    status_admin_w, _ = get_pending_verifications(USER_W)
    print(f"    GET /api/admin/verification (as W): {status_admin_w}")
    
    print("  Step 2: SUPER_ADMIN can access admin endpoint")
    status_admin_super, _ = get_pending_verifications(SUPER_ADMIN)
    print(f"    GET /api/admin/verification (as SUPER_ADMIN): {status_admin_super}")
    
    pass_14 = (status_admin_w == 403 and status_admin_super == 200)
    results.append(("Test 14", "REGRESSION - admin security intact", pass_14, 
                   f"W={status_admin_w}, SUPER_ADMIN={status_admin_super}"))
    print(f"  Result: {'✅ PASS' if pass_14 else '❌ FAIL'}")
    print()
    
    # Summary
    print("=" * 100)
    print("TEST RESULTS SUMMARY")
    print("=" * 100)
    print()
    print(f"{'Test':<12} {'Description':<50} {'Result':<10} {'Details'}")
    print("-" * 120)
    for test_num, desc, passed, details in results:
        result_str = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_num:<12} {desc:<50} {result_str:<10} {details}")
    print()
    
    total_tests = len(results)
    passed_tests = sum(1 for _, _, passed, _ in results if passed)
    failed_tests = total_tests - passed_tests
    
    print(f"Total: {total_tests} | Passed: {passed_tests} | Failed: {failed_tests}")
    print()
    
    # Critical security checks
    print("=" * 100)
    print("CRITICAL SECURITY CHECKS")
    print("=" * 100)
    
    # Check if normal user could self-verify
    self_verify_blocked = results[3][2]  # Test 4
    print(f"1. Normal user CANNOT self-verify: {'✅ PASS' if self_verify_blocked else '❌ FAIL (CRITICAL)'}")
    
    # Check if non-verified could publish when setting ON
    publish_blocked = results[10][2]  # Test 11
    bypass_blocked = results[11][2]  # Test 12
    print(f"2. Non-verified CANNOT publish when setting ON: {'✅ PASS' if publish_blocked else '❌ FAIL (CRITICAL)'}")
    print(f"3. Direct API bypass BLOCKED: {'✅ PASS' if bypass_blocked else '❌ FAIL (CRITICAL)'}")
    
    # Overall security verdict
    security_pass = self_verify_blocked and publish_blocked and bypass_blocked
    print()
    if security_pass:
        print("✅ SECURITY VERDICT: All critical security checks PASSED")
        print("   - Normal/unverified users CANNOT self-verify")
        print("   - Non-verified users CANNOT publish when requireVerificationForPosting=true")
        print("   - Direct API bypass attempts are BLOCKED")
    else:
        print("🚨 SECURITY VERDICT: CRITICAL SECURITY FAILURES DETECTED")
        if not self_verify_blocked:
            print("   - ❌ Normal users CAN self-verify (CRITICAL)")
        if not publish_blocked:
            print("   - ❌ Non-verified users CAN publish when setting ON (CRITICAL)")
        if not bypass_blocked:
            print("   - ❌ Direct API bypass NOT blocked (CRITICAL)")
    
    print()
    print("=" * 100)
    
    return results, security_pass

if __name__ == "__main__":
    results, security_pass = run_tests()
