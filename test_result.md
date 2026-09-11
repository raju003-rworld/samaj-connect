#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: "Phase 4 - Post/Reel privacy must be enforced SERVER-SIDE in the active Vite + server.ts app. Modes: PUBLIC(public), MY_SAMAJ(samaj), FOLLOWERS(followers), ONLY_ME(only_me). Unfollow must immediately revoke FOLLOWERS access. Creator always sees own content. Same rules for Posts and Reels (reels are posts). No architecture migration."

backend:
  - task: "Post/Reel privacy enforcement (PUBLIC / MY_SAMAJ / FOLLOWERS / ONLY_ME)"
    implemented: true
    working: true
    file: "server.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Privacy enforced in canUserViewPost() and applied in GET /api/posts (list filter) and GET /api/posts/:pid (403 if not viewable). Reels use the same /api/posts endpoints (filter=reel). Fixed a real bug: Samaj create/join/activate + GET /api/samaj were mutating a hardcoded demo object 'currentUser' instead of the authenticated user (getAuthUser), which made MY_SAMAJ cross-samaj isolation impossible. Now they operate on the authenticated user. Needs independent verification."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL 13 PRIVACY TESTS PASSED (13/13). Verified: (1) PUBLIC posts/reels accessible to all users ✅ (2) MY_SAMAJ posts visible only to same-samaj members, blocked for different-samaj ✅ (3) FOLLOWERS posts/reels visible only to followers, blocked for non-followers ✅ (4) ONLY_ME posts visible only to creator, blocked for all others ✅ (5) EDIT operation preserves privacy (visibility=only_me maintained) ✅ (6) LIST endpoint correctly filters private content (no leaks) ✅ (7) NO AUTH requests do not leak private content ✅ (8) UNFOLLOW immediately revokes FOLLOWERS access for both posts and reels ✅. NO PRIVATE CONTENT LEAKS DETECTED. Server-side privacy enforcement is working correctly."

metadata:
  created_by: "main_agent"
  version: "1.2"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus:
    - "Post/Reel privacy enforcement (PUBLIC / MY_SAMAJ / FOLLOWERS / ONLY_ME)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "ACTIVE APP UNDER TEST IS NODE (server.ts), NOT the FastAPI in /app/backend. I stopped supervisor 'backend' and am running server.ts on port 8001 in DEV auth mode. Base URL: https://b5c99426-11b3-4b0f-8151-b911a4003d2b.preview.emergentagent.com  (append /api). Auth = header 'Authorization: Bearer mock-token-<10digits>' (dev mode). DO NOT restart supervisor/backend or the server will change. Test Post/Reel privacy only. Seeded data + tokens + expected results are provided in the testing task message."
    -agent: "testing"
    -message: "✅ PRIVACY ENFORCEMENT VERIFICATION COMPLETE. All 13 test cases passed successfully. Tested: PUBLIC (accessible to all), MY_SAMAJ (same-samaj only), FOLLOWERS (followers only), ONLY_ME (creator only), EDIT preserves privacy, LIST filtering, NO AUTH protection, and UNFOLLOW revocation. No private content leaks detected. The canUserViewPost() function and privacy filters are working correctly for both posts and reels. Server-side enforcement is solid. Ready for main agent to summarize and finish."
    -agent: "testing"
    -message: "Phase 4 privacy: 13/13 tests PASSED. No private content leaked to unauthorized users. PUBLIC/MY_SAMAJ/FOLLOWERS/ONLY_ME all enforced server-side for posts AND reels; unfollow immediately revokes FOLLOWERS access; edit preserves visibility; list endpoint filters private items."
    -agent: "main"
    -message: "Post-verification hardening: unauthenticated GET /api/posts and GET /api/posts/:pid now return 401 (previously threw 500). Verified via curl (401 no-auth, 200 authenticated). Frontend production build PASS. Restored supervisor backend to original state."
