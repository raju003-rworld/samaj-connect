#!/usr/bin/env python3
"""
Privacy Enforcement Test Suite for Samaj Connect
Tests POST/REEL visibility rules: PUBLIC, MY_SAMAJ, FOLLOWERS, ONLY_ME
"""

import requests
import json
from typing import Dict, Tuple

# Base URL
BASE_URL = "https://b5c99426-11b3-4b0f-8151-b911a4003d2b.preview.emergentagent.com/api"

# Test Users
USERS = {
    "A": "mock-token-9310000001",  # author
    "B": "mock-token-9310000002",  # same-Samaj
    "C": "mock-token-9310000003",  # different-Samaj
    "D": "mock-token-9310000004",  # follower of A
    "E": "mock-token-9310000005",  # non-follower
}

# Seeded Content
POSTS = {
    "P_PUB": "post_1789094840815",   # public post
    "P_SAM": "post_1789094841116",   # samaj post
    "P_FOL": "post_1789094841373",   # followers post
    "P_ONLY": "post_1789094841659",  # only_me post
    "R_PUB": "post_1789094841976",   # public reel
    "R_FOL": "post_1789094842266",   # followers reel
}

def get_auth_header(user: str) -> Dict[str, str]:
    """Get authorization header for a user"""
    return {"Authorization": f"Bearer {USERS[user]}"}

def get_post(post_id: str, user: str) -> Tuple[int, dict]:
    """
    GET /api/posts/{id} with user's auth
    Returns (status_code, response_json)
    """
    headers = get_auth_header(user)
    url = f"{BASE_URL}/posts/{post_id}"
    try:
        response = requests.get(url, headers=headers, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def get_post_no_auth(post_id: str) -> Tuple[int, dict]:
    """
    GET /api/posts/{id} with NO auth header
    Returns (status_code, response_json)
    """
    url = f"{BASE_URL}/posts/{post_id}"
    try:
        response = requests.get(url, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def get_posts_list(user: str) -> Tuple[int, dict]:
    """
    GET /api/posts with user's auth
    Returns (status_code, response_json)
    """
    headers = get_auth_header(user)
    url = f"{BASE_URL}/posts"
    try:
        response = requests.get(url, headers=headers, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def update_post(post_id: str, user: str, caption: str) -> Tuple[int, dict]:
    """
    PUT /api/posts/{id} with user's auth
    Returns (status_code, response_json)
    """
    headers = get_auth_header(user)
    headers["Content-Type"] = "application/json"
    url = f"{BASE_URL}/posts/{post_id}"
    payload = {"caption": caption}
    try:
        response = requests.put(url, headers=headers, json=payload, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def unfollow_user(follower: str, target_user_id: str) -> Tuple[int, dict]:
    """
    POST /api/users/{target_user_id}/unfollow
    Returns (status_code, response_json)
    """
    headers = get_auth_header(follower)
    url = f"{BASE_URL}/users/{target_user_id}/unfollow"
    try:
        response = requests.post(url, headers=headers, timeout=10)
        try:
            data = response.json()
        except:
            data = {"text": response.text}
        return (response.status_code, data)
    except Exception as e:
        return (0, {"error": str(e)})

def run_tests():
    """Run all 13 privacy enforcement tests"""
    results = []
    
    print("=" * 80)
    print("PRIVACY ENFORCEMENT TEST SUITE")
    print("=" * 80)
    print()
    
    # Test 1: PUBLIC post - B and C should see it
    print("Test 1: PUBLIC post (P_PUB) - same-samaj B and different-samaj C")
    status_b, _ = get_post(POSTS["P_PUB"], "B")
    status_c, _ = get_post(POSTS["P_PUB"], "C")
    pass_1 = (status_b == 200 and status_c == 200)
    results.append(("Test 1", "PUBLIC post: B=200 AND C=200", pass_1, f"B={status_b}, C={status_c}"))
    print(f"  B GET P_PUB: {status_b} | C GET P_PUB: {status_c} | {'PASS' if pass_1 else 'FAIL'}")
    print()
    
    # Test 2: PUBLIC reel - C should see it
    print("Test 2: PUBLIC reel (R_PUB) - different-samaj C")
    status_c, _ = get_post(POSTS["R_PUB"], "C")
    pass_2 = (status_c == 200)
    results.append(("Test 2", "PUBLIC reel: C=200", pass_2, f"C={status_c}"))
    print(f"  C GET R_PUB: {status_c} | {'PASS' if pass_2 else 'FAIL'}")
    print()
    
    # Test 3: MY_SAMAJ same-samaj - B should see it
    print("Test 3: MY_SAMAJ post (P_SAM) - same-samaj B")
    status_b, _ = get_post(POSTS["P_SAM"], "B")
    pass_3 = (status_b == 200)
    results.append(("Test 3", "MY_SAMAJ same-samaj: B=200", pass_3, f"B={status_b}"))
    print(f"  B GET P_SAM: {status_b} | {'PASS' if pass_3 else 'FAIL'}")
    print()
    
    # Test 4: MY_SAMAJ different-samaj - C should NOT see it
    print("Test 4: MY_SAMAJ post (P_SAM) - different-samaj C")
    status_c, _ = get_post(POSTS["P_SAM"], "C")
    pass_4 = (status_c == 403)
    results.append(("Test 4", "MY_SAMAJ different-samaj: C=403", pass_4, f"C={status_c}"))
    print(f"  C GET P_SAM: {status_c} | {'PASS' if pass_4 else 'FAIL'}")
    print()
    
    # Test 5: FOLLOWERS follower - D should see it
    print("Test 5: FOLLOWERS post (P_FOL) - follower D")
    status_d, _ = get_post(POSTS["P_FOL"], "D")
    pass_5 = (status_d == 200)
    results.append(("Test 5", "FOLLOWERS follower: D=200", pass_5, f"D={status_d}"))
    print(f"  D GET P_FOL: {status_d} | {'PASS' if pass_5 else 'FAIL'}")
    print()
    
    # Test 6: FOLLOWERS non-follower - E should NOT see it
    print("Test 6: FOLLOWERS post (P_FOL) - non-follower E")
    status_e, _ = get_post(POSTS["P_FOL"], "E")
    pass_6 = (status_e == 403)
    results.append(("Test 6", "FOLLOWERS non-follower: E=403", pass_6, f"E={status_e}"))
    print(f"  E GET P_FOL: {status_e} | {'PASS' if pass_6 else 'FAIL'}")
    print()
    
    # Test 7: FOLLOWERS reel - D should see, E should NOT
    print("Test 7: FOLLOWERS reel (R_FOL) - follower D and non-follower E")
    status_d, _ = get_post(POSTS["R_FOL"], "D")
    status_e, _ = get_post(POSTS["R_FOL"], "E")
    pass_7 = (status_d == 200 and status_e == 403)
    results.append(("Test 7", "FOLLOWERS reel: D=200 AND E=403", pass_7, f"D={status_d}, E={status_e}"))
    print(f"  D GET R_FOL: {status_d} | E GET R_FOL: {status_e} | {'PASS' if pass_7 else 'FAIL'}")
    print()
    
    # Test 8: ONLY_ME creator - A should see own post
    print("Test 8: ONLY_ME post (P_ONLY) - creator A")
    status_a, _ = get_post(POSTS["P_ONLY"], "A")
    pass_8 = (status_a == 200)
    results.append(("Test 8", "ONLY_ME creator: A=200", pass_8, f"A={status_a}"))
    print(f"  A GET P_ONLY: {status_a} | {'PASS' if pass_8 else 'FAIL'}")
    print()
    
    # Test 9: ONLY_ME others - B, C, E should NOT see it
    print("Test 9: ONLY_ME post (P_ONLY) - others B, C, E")
    status_b, _ = get_post(POSTS["P_ONLY"], "B")
    status_c, _ = get_post(POSTS["P_ONLY"], "C")
    status_e, _ = get_post(POSTS["P_ONLY"], "E")
    pass_9 = (status_b == 403 and status_c == 403 and status_e == 403)
    results.append(("Test 9", "ONLY_ME others: B=403 AND C=403 AND E=403", pass_9, f"B={status_b}, C={status_c}, E={status_e}"))
    print(f"  B GET P_ONLY: {status_b} | C GET P_ONLY: {status_c} | E GET P_ONLY: {status_e} | {'PASS' if pass_9 else 'FAIL'}")
    print()
    
    # Test 10: EDIT preserves privacy
    print("Test 10: EDIT preserves privacy (P_ONLY)")
    print("  Step 1: A edits P_ONLY caption (no visibility field)")
    status_edit, _ = update_post(POSTS["P_ONLY"], "A", "edited caption")
    print(f"    PUT status: {status_edit}")
    
    print("  Step 2: A GET P_ONLY - should still be only_me")
    status_a, data_a = get_post(POSTS["P_ONLY"], "A")
    visibility_preserved = data_a.get("visibility") == "only_me" if status_a == 200 else False
    print(f"    A GET P_ONLY: {status_a}, visibility={data_a.get('visibility')}")
    
    print("  Step 3: B GET P_ONLY - should still be 403")
    status_b, _ = get_post(POSTS["P_ONLY"], "B")
    print(f"    B GET P_ONLY: {status_b}")
    
    pass_10 = (status_edit in [200, 204] and visibility_preserved and status_b == 403)
    results.append(("Test 10", "EDIT preserves privacy: visibility=only_me AND B=403", pass_10, 
                   f"edit={status_edit}, vis={data_a.get('visibility')}, B={status_b}"))
    print(f"  {'PASS' if pass_10 else 'FAIL'}")
    print()
    
    # Test 11: LIST enforcement (no leak)
    print("Test 11: LIST enforcement - C GET /api/posts (should NOT contain P_ONLY, P_FOL, P_SAM)")
    status_list, data_list = get_posts_list("C")
    leaked_ids = []
    if status_list == 200 and isinstance(data_list, list):
        post_ids = [p.get("id") for p in data_list if isinstance(p, dict)]
        for forbidden_id in [POSTS["P_ONLY"], POSTS["P_FOL"], POSTS["P_SAM"]]:
            if forbidden_id in post_ids:
                leaked_ids.append(forbidden_id)
    pass_11 = (status_list == 200 and len(leaked_ids) == 0)
    results.append(("Test 11", "LIST no leak: P_ONLY, P_FOL, P_SAM not in C's list", pass_11, 
                   f"status={status_list}, leaked={leaked_ids}"))
    print(f"  C GET /api/posts: {status_list} | Leaked IDs: {leaked_ids} | {'PASS' if pass_11 else 'FAIL'}")
    print()
    
    # Test 12: DIRECT bypass with NO auth
    print("Test 12: DIRECT bypass - GET P_ONLY with NO auth header")
    status_no_auth, data_no_auth = get_post_no_auth(POSTS["P_ONLY"])
    # Must NOT return 200 with post content
    leaked_content = False
    if status_no_auth == 200:
        # Check if actual post content is returned
        if isinstance(data_no_auth, dict) and ("caption" in data_no_auth or "content" in data_no_auth):
            leaked_content = True
    pass_12 = not leaked_content
    results.append(("Test 12", "NO auth: must NOT return 200 with post content", pass_12, 
                   f"status={status_no_auth}, leaked={leaked_content}"))
    print(f"  GET P_ONLY (no auth): {status_no_auth} | Content leaked: {leaked_content} | {'PASS' if pass_12 else 'FAIL'}")
    print()
    
    # Test 13: UNFOLLOW revokes FOLLOWERS access (RUN LAST - mutates state)
    print("Test 13: UNFOLLOW revokes FOLLOWERS access")
    print("  Step 1: D GET P_FOL - should be 200 (follower)")
    status_d_before, _ = get_post(POSTS["P_FOL"], "D")
    print(f"    D GET P_FOL (before): {status_d_before}")
    
    print("  Step 2: D unfollows A (user_9310000001)")
    status_unfollow, _ = unfollow_user("D", "user_9310000001")
    print(f"    Unfollow status: {status_unfollow}")
    
    print("  Step 3: D GET P_FOL - should be 403 (no longer follower)")
    status_d_after_post, _ = get_post(POSTS["P_FOL"], "D")
    print(f"    D GET P_FOL (after): {status_d_after_post}")
    
    print("  Step 4: D GET R_FOL - should be 403 (no longer follower)")
    status_d_after_reel, _ = get_post(POSTS["R_FOL"], "D")
    print(f"    D GET R_FOL (after): {status_d_after_reel}")
    
    pass_13 = (status_d_before == 200 and status_d_after_post == 403 and status_d_after_reel == 403)
    results.append(("Test 13", "UNFOLLOW revokes: D before=200, after P_FOL=403, after R_FOL=403", pass_13, 
                   f"before={status_d_before}, unfollow={status_unfollow}, after_post={status_d_after_post}, after_reel={status_d_after_reel}"))
    print(f"  {'PASS' if pass_13 else 'FAIL'}")
    print()
    
    # Summary
    print("=" * 80)
    print("TEST RESULTS SUMMARY")
    print("=" * 80)
    print()
    print(f"{'Test':<10} {'Description':<50} {'Result':<8} {'Details'}")
    print("-" * 120)
    for test_num, desc, passed, details in results:
        result_str = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_num:<10} {desc:<50} {result_str:<8} {details}")
    print()
    
    total_tests = len(results)
    passed_tests = sum(1 for _, _, passed, _ in results if passed)
    failed_tests = total_tests - passed_tests
    
    print(f"Total: {total_tests} | Passed: {passed_tests} | Failed: {failed_tests}")
    print()
    
    # Critical check: any private content leaked?
    critical_failures = []
    if not pass_4:
        critical_failures.append("MY_SAMAJ cross-samaj leak (Test 4)")
    if not pass_6:
        critical_failures.append("FOLLOWERS non-follower leak (Test 6)")
    if not pass_7:
        critical_failures.append("FOLLOWERS reel leak (Test 7)")
    if not pass_9:
        critical_failures.append("ONLY_ME leak to others (Test 9)")
    if not pass_10:
        critical_failures.append("EDIT did not preserve privacy (Test 10)")
    if not pass_11:
        critical_failures.append("LIST endpoint leaked private content (Test 11)")
    if not pass_12:
        critical_failures.append("NO AUTH bypass - private content leaked (Test 12)")
    if not pass_13:
        critical_failures.append("UNFOLLOW did not revoke access (Test 13)")
    
    if critical_failures:
        print("🚨 CRITICAL FAILURES - PRIVATE CONTENT LEAKED:")
        for failure in critical_failures:
            print(f"  - {failure}")
    else:
        print("✅ NO PRIVATE CONTENT LEAKS DETECTED")
    
    print()
    print("=" * 80)
    
    return results, critical_failures

if __name__ == "__main__":
    results, critical_failures = run_tests()
