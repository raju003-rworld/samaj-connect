// Comprehensive test suite for Samaj Connect application
const BASE_URL = "http://localhost:3000";
const ADMIN_TOKEN = "mock-token-9876543210";
const USER_TOKEN = "mock-token-9825123456";

let passedCount = 0;
let failedCount = 0;
const results = [];

async function request(method, path, body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

function assert(condition, name, details = "") {
  if (condition) {
    passedCount++;
    results.push({ name, status: "PASS" });
    console.log(`✅ [PASS] ${name}`);
  } else {
    failedCount++;
    results.push({ name, status: "FAIL", details });
    console.error(`❌ [FAIL] ${name} (Details: ${typeof details === "object" ? JSON.stringify(details) : details})`);
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   🚀 STARTING FULL SAMAJ CONNECT FUNCTIONALITY TESTS   ");
  console.log("=======================================================\n");

  // 1. SYSTEM & CONFIG & LOCATIONS
  console.log("--- 1. System & Location Master Data ---");
  const configRes = await request("GET", "/api/auth/config");
  assert(configRes.status === 200 && typeof configRes.data.publicAccessEnabled === "boolean", "GET /api/auth/config returns system config");

  const distRes = await request("GET", "/api/location/districts");
  assert(distRes.status === 200 && Array.isArray(distRes.data?.items) && distRes.data.items.length > 0, "GET /api/location/districts returns district list");

  const talRes = await request("GET", "/api/location/talukas");
  assert(talRes.status === 200 && Array.isArray(talRes.data?.items) && talRes.data.items.length > 0, "GET /api/location/talukas returns talukas list");

  const vilRes = await request("GET", "/api/location/villages");
  assert(vilRes.status === 200 && Array.isArray(vilRes.data?.items) && vilRes.data.items.length > 0, "GET /api/location/villages returns villages list");

  const samajRes = await request("GET", "/api/samaj", null, ADMIN_TOKEN);
  assert(samajRes.status === 200 && Array.isArray(samajRes.data?.allItems) && samajRes.data.allItems.length > 0, "GET /api/samaj returns all samaj units");

  // 2. AUTH & MULTI-STEP ONBOARDING
  console.log("\n--- 2. Auth & Multi-step Onboarding ---");
  const adminMe = await request("GET", "/api/auth/me", null, ADMIN_TOKEN);
  assert(adminMe.status === 200 && adminMe.data.adminRole === "SUPER_ADMIN", "GET /api/auth/me (Admin Token) has SUPER_ADMIN role");

  const unauthReq = await request("GET", "/api/admin/stats", null, null);
  assert(unauthReq.status === 401, "Protected Admin API rejects unauthenticated request with 401");

  // Run Onboarding for test user
  console.log("-> Completing 5-step onboarding for user...");
  await request("POST", "/api/onboarding/step", { mainSamajId: "main_patidar" }, USER_TOKEN);
  await request("POST", "/api/onboarding/step", { districtId: "dist_mehsana" }, USER_TOKEN);
  await request("POST", "/api/onboarding/step", { talukaId: "tal_mehsana_unjha" }, USER_TOKEN);
  await request("POST", "/api/onboarding/step", { villageId: "vil_unjha" }, USER_TOKEN);
  const onbFinal = await request("POST", "/api/onboarding/step", { samajId: "default" }, USER_TOKEN);
  assert(onbFinal.status === 200 && onbFinal.data.user?.onboardingCompleted === true, "POST /api/onboarding/step completes onboarding");

  const userMe = await request("GET", "/api/auth/me", null, USER_TOKEN);
  assert(userMe.status === 200 && userMe.data.onboardingCompleted === true, "GET /api/auth/me reflects active onboarded status");

  // 3. MEMBERS DIRECTORY
  console.log("\n--- 3. Members Directory ---");
  const membersRes = await request("GET", "/api/members", null, USER_TOKEN);
  assert(membersRes.status === 200 && Array.isArray(membersRes.data.items) && membersRes.data.total > 0, "GET /api/members returns member directory");

  const newMobile = `99${Date.now().toString().slice(-8)}`;
  const newMemberRes = await request("POST", "/api/members", {
    name: "ટેસ્ટ સભ્ય પટેલ",
    mobile: newMobile,
    village: "ઊંઝા",
    district: "મહેસાણા",
    address: "ટેસ્ટ સરનામું, ઊંઝા",
    gender: "male",
    maritalStatus: "married",
    bloodGroup: "B+",
    education: "B.Tech"
  }, USER_TOKEN);
  assert(newMemberRes.status === 200 && newMemberRes.data.id, "POST /api/members registers new community member");

  const memberId = newMemberRes.data.id || "mem_1";
  const getMemberRes = await request("GET", `/api/members/${memberId}`, null, USER_TOKEN);
  assert(getMemberRes.status === 200 && getMemberRes.data.name, "GET /api/members/:id fetches member details");

  // 4. HALL BOOKING SYSTEM
  console.log("\n--- 4. Hall Booking System ---");
  const hallsRes = await request("GET", "/api/halls", null, USER_TOKEN);
  assert(hallsRes.status === 200 && Array.isArray(hallsRes.data?.items) && hallsRes.data.items.length > 0, "GET /api/halls returns available community halls");

  const hallId = hallsRes.data.items[0]?.id || "h1";
  const bookRes = await request("POST", "/api/bookings", {
    hallId,
    date: "2026-11-20",
    eventTitle: "લગ્ન પ્રસંગ સમારંભ",
    attendees: 350,
    organizerName: "પટેલ પરિવાર",
    organizerPhone: "9825123456",
    startTime: "09:00",
    endTime: "18:00"
  }, USER_TOKEN);
  assert(bookRes.status === 200 && bookRes.data.id, "POST /api/bookings successfully creates hall booking");

  const bookingId = bookRes.data.id;
  if (bookingId) {
    const cancelRes = await request("POST", `/api/bookings/${bookingId}/cancel`, null, USER_TOKEN);
    assert(cancelRes.status === 200 && cancelRes.data.booking?.status === "cancelled", "POST /api/bookings/:id/cancel cancels the booking");
  }

  // 5. EVENTS MODULE
  console.log("\n--- 5. Events Module ---");
  const eventsRes = await request("GET", "/api/events", null, USER_TOKEN);
  assert(eventsRes.status === 200 && Array.isArray(eventsRes.data?.items), "GET /api/events returns event list");

  const createEventRes = await request("POST", "/api/events", {
    title: "વાર્ષિક સ્નેહમિલન સમારોહ",
    description: "સમસ્ત પાટીદાર સમાજ સ્નેહમિલન કાર્યક્રમ",
    date: "2026-12-25",
    location: "ઊંઝા પાટીદાર વાડી",
    category: "cultural",
    visibility: "samaj"
  }, ADMIN_TOKEN);
  assert(createEventRes.status === 200 && createEventRes.data.id, "POST /api/events creates a new event");

  const eventId = createEventRes.data.id || eventsRes.data?.items[0]?.id;
  if (eventId) {
    const regRes = await request("POST", `/api/events/${eventId}/register`, null, USER_TOKEN);
    assert(regRes.status === 200 && typeof regRes.data.registeredByMe === "boolean", "POST /api/events/:id/register registers user for event");

    const unregRes = await request("POST", `/api/events/${eventId}/unregister`, null, USER_TOKEN);
    assert(unregRes.status === 200 && typeof unregRes.data.registeredByMe === "boolean", "POST /api/events/:id/unregister unregisters user");
  }

  // 6. PHOTO GALLERY & ALBUMS
  console.log("\n--- 6. Photo Gallery & Albums ---");
  const albumsRes = await request("GET", "/api/albums", null, USER_TOKEN);
  assert(albumsRes.status === 200 && Array.isArray(albumsRes.data?.items), "GET /api/albums returns album collection");

  const createAlbumRes = await request("POST", "/api/albums", {
    title: "યુવા મહોત્સવ ૨૦૨૬",
    description: "યુવા મહોત્સવ અને સ્પોર્ટ્સ ડે ફોટોગ્રાફ્સ",
    coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800"
  }, USER_TOKEN);
  assert(createAlbumRes.status === 200 && createAlbumRes.data.id, "POST /api/albums creates community album");

  const albumId = createAlbumRes.data.id || albumsRes.data.items[0]?.id;
  if (albumId) {
    const addPhotoRes = await request("POST", `/api/albums/${albumId}/photos`, {
      items: [
        {
          url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800",
          caption: "ઉદ્ઘાટન સમારોહ"
        }
      ]
    }, USER_TOKEN);
    assert(addPhotoRes.status === 200 && Array.isArray(addPhotoRes.data.items), "POST /api/albums/:id/photos adds photo to album");
  }

  // 7. SOCIAL FEED & POSTS
  console.log("\n--- 7. Social Feed, Posts, Likes & Comments ---");
  const createPostRes = await request("POST", "/api/posts", {
    content: "આજરોજ સમાજ ભવન ખાતે યોજાયેલ સત્સંગ અને ભોજન સમારંભની ઝલક. સૌ જ્ઞાતિજનોને જય શ્રી કૃષ્ણ!",
    mediaUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800",
    mediaType: "image",
    visibility: "samaj"
  }, USER_TOKEN);
  assert(createPostRes.status === 200 && createPostRes.data.id, "POST /api/posts publishes feed post");

  const postId = createPostRes.data.id;
  if (postId) {
    const likeRes = await request("POST", `/api/posts/${postId}/like`, null, USER_TOKEN);
    assert(likeRes.status === 200 && typeof likeRes.data.liked === "boolean", "POST /api/posts/:id/like toggles post like");

    const commentRes = await request("POST", `/api/posts/${postId}/comments`, {
      content: "ખૂબ સરસ આયોજન! અભિનંદન!"
    }, USER_TOKEN);
    assert(commentRes.status === 200 && commentRes.data.id && commentRes.data.content, "POST /api/posts/:id/comments adds comment to post");

    const saveRes = await request("POST", `/api/posts/${postId}/save`, null, USER_TOKEN);
    assert(saveRes.status === 200 && typeof saveRes.data.saved === "boolean", "POST /api/posts/:id/save bookmarks post");
  }

  // 8. STORIES MODULE
  console.log("\n--- 8. Stories Module ---");
  const storyRes = await request("POST", "/api/stories", {
    mediaUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
    mediaType: "image",
    caption: "સુપ્રભાત ઊંઝા! શુભ દિવસ!"
  }, USER_TOKEN);
  assert(storyRes.status === 200 && storyRes.data.id, "POST /api/stories uploads user story");

  if (storyRes.data.id) {
    const viewStoryRes = await request("POST", `/api/stories/${storyRes.data.id}/view`, null, USER_TOKEN);
    assert(viewStoryRes.status === 200 && viewStoryRes.data.viewsCount >= 1, "POST /api/stories/:id/view records story view");
  }

  // 9. MARAN NODH (OBITUARY) MODULE
  console.log("\n--- 9. Maran Nodh (Obituary) Module ---");
  const maranListRes = await request("GET", "/api/maran-nodh", null, USER_TOKEN);
  assert(maranListRes.status === 200 && Array.isArray(maranListRes.data.items), "GET /api/maran-nodh returns obituary notices");

  const newMaranRes = await request("POST", "/api/maran-nodh", {
    deceasedName: "સ્વ. શાંતિલાલ કેશવલાલ પટેલ",
    age: 82,
    gender: "male",
    village: "ઊંઝા",
    currentCity: "અમદાવાદ",
    passedDate: "2026-09-10",
    besnuDate: "2026-09-14",
    besnuTime: "સાંજે ૪:૦૦ થી ૬:૦૦",
    besnuVenue: "ઊંઝા પાટીદાર વાડી, હોલ નં ૧",
    grievingFamily: "પટેલ પરિવાર",
    contactPhone: "9825123456"
  }, USER_TOKEN);
  assert(newMaranRes.status === 200 && newMaranRes.data.ok && newMaranRes.data.item?.id, "POST /api/maran-nodh creates obituary notice");

  const maranId = newMaranRes.data.item?.id || maranListRes.data.items[0]?.id;
  if (maranId) {
    const tributeRes = await request("POST", `/api/maran-nodh/${maranId}/tribute`, { type: "diya" }, USER_TOKEN);
    assert(tributeRes.status === 200 && tributeRes.data.ok && tributeRes.data.diyaCount >= 1, "POST /api/maran-nodh/:id/tribute adds tribute diya");

    const condolenceRes = await request("POST", `/api/maran-nodh/${maranId}/condolence`, {
      text: "પ્રભુ દિવંગત આત્માને પરમ શાંતિ અર્પે અને પરિવારને દુઃખ સહન કરવાની શક્તિ આપે. ઓમ શાંતિ."
    }, USER_TOKEN);
    assert(condolenceRes.status === 200 && condolenceRes.data.ok && condolenceRes.data.condolence?.id, "POST /api/maran-nodh/:id/condolence records condolence message");
  }

  // 10. FAMILY TREE
  console.log("\n--- 10. Family Tree Module ---");
  const familyTreeRes = await request("GET", "/api/family-tree", null, USER_TOKEN);
  assert(familyTreeRes.status === 200 && Array.isArray(familyTreeRes.data.members), "GET /api/family-tree returns family tree members");

  const addFamilyMemberRes = await request("POST", "/api/family-tree", {
    name: "આરવ પટેલ",
    relation: "son",
    gender: "male",
    dob: "2018-05-12",
    bloodGroup: "O+"
  }, USER_TOKEN);
  assert(addFamilyMemberRes.status === 200 && addFamilyMemberRes.data.member, "POST /api/family-tree adds family relation");

  // 11. MESSAGING & CHAT
  console.log("\n--- 11. Chat & Conversations ---");
  const startDirectRes = await request("POST", "/api/conversations/direct", {
    userId: "user_demo_admin"
  }, USER_TOKEN);
  assert(startDirectRes.status === 200 && startDirectRes.data.id, "POST /api/conversations/direct initiates direct chat");

  const convsRes = await request("GET", "/api/conversations", null, USER_TOKEN);
  assert(convsRes.status === 200 && Array.isArray(convsRes.data?.items), "GET /api/conversations returns user conversations");

  const convId = startDirectRes.data.id;
  if (convId) {
    const sendMsgRes = await request("POST", `/api/conversations/${convId}/messages`, {
      text: "નમસ્તે ભાઈ, જય શ્રી કૃષ્ણ!"
    }, USER_TOKEN);
    assert(sendMsgRes.status === 200 && sendMsgRes.data.id, "POST /api/conversations/:id/messages sends message");

    const typingRes = await request("POST", `/api/conversations/${convId}/typing`, { isTyping: true }, USER_TOKEN);
    assert(typingRes.status === 200, "POST /api/conversations/:id/typing updates typing indicator");
  }

  // 12. LIVE BROADCAST
  console.log("\n--- 12. Live Broadcast Module ---");
  const liveListRes = await request("GET", "/api/live", null, USER_TOKEN);
  assert(liveListRes.status === 200 && Array.isArray(liveListRes.data?.items), "GET /api/live returns active live sessions");

  const liveId = liveListRes.data.items[0]?.id;
  if (liveId) {
    const joinLiveRes = await request("POST", `/api/live/${liveId}/join`, null, USER_TOKEN);
    assert(joinLiveRes.status === 200 && joinLiveRes.data.ok === true, "POST /api/live/:id/join successfully joins live session");

    const chatLiveRes = await request("POST", `/api/live/${liveId}/chat`, {
      text: "જય માતાજી! ખૂબ સરસ દર્શન!"
    }, USER_TOKEN);
    assert(chatLiveRes.status === 200 && chatLiveRes.data.id && chatLiveRes.data.text, "POST /api/live/:id/chat sends live stream comment");

    const reactLiveRes = await request("POST", `/api/live/${liveId}/react`, {
      emoji: "🙏"
    }, USER_TOKEN);
    assert(reactLiveRes.status === 200 && reactLiveRes.data.ok === true, "POST /api/live/:id/react sends live reaction");

    const leaveLiveRes = await request("POST", `/api/live/${liveId}/leave`, null, USER_TOKEN);
    assert(leaveLiveRes.status === 200 && leaveLiveRes.data.ok === true, "POST /api/live/:id/leave leaves live session");
  }

  // 13. ADMIN SUITE
  console.log("\n--- 13. Admin Management Suite ---");
  const adminStatsRes = await request("GET", "/api/admin/stats", null, ADMIN_TOKEN);
  assert(adminStatsRes.status === 200 && adminStatsRes.data.users !== undefined, "GET /api/admin/stats returns platform statistics");

  const adminUsersRes = await request("GET", "/api/admin/users", null, ADMIN_TOKEN);
  assert(adminUsersRes.status === 200 && Array.isArray(adminUsersRes.data.items), "GET /api/admin/users lists all system users");

  const adminVerificationRes = await request("GET", "/api/admin/verification", null, ADMIN_TOKEN);
  assert(adminVerificationRes.status === 200 && Array.isArray(adminVerificationRes.data.items), "GET /api/admin/verification lists pending verifications");

  const auditLogsRes = await request("GET", "/api/admin/audit-logs", null, ADMIN_TOKEN);
  assert(auditLogsRes.status === 200 && Array.isArray(auditLogsRes.data.items), "GET /api/admin/audit-logs returns system audit trail");

  const adminSettingsRes = await request("GET", "/api/admin/settings", null, ADMIN_TOKEN);
  assert(adminSettingsRes.status === 200 && typeof adminSettingsRes.data.publicAccessEnabled === "boolean", "GET /api/admin/settings returns system configuration");

  // Test dynamic admin role assignment
  const grantRoleRes = await request("POST", "/api/admin/roles", {
    phone: "9825123456",
    role: "SAMAJ_ADMIN",
    samajId: "default"
  }, ADMIN_TOKEN);
  assert(grantRoleRes.status === 200 && grantRoleRes.data.success === true, "POST /api/admin/roles grants administrative role dynamically");

  // 14. DATA PERSISTENCE CHECK
  console.log("\n--- 14. Data Persistence & Integrity Verification ---");
  await new Promise((resolve) => setTimeout(resolve, 600)); // wait for store debounced save
  const fs = require("fs");
  const path = require("path");
  const storePath = path.join(process.cwd(), "data", "store.json");
  const fileExists = fs.existsSync(storePath);
  assert(fileExists, "data/store.json exists on disk");
  if (fileExists) {
    const storeContent = JSON.parse(fs.readFileSync(storePath, "utf-8"));
    assert(storeContent.usersMap && storeContent.postsList && storeContent.savedAt, "data/store.json contains complete synced data state");
  }

  // SUMMARY REPORT
  console.log("\n=======================================================");
  console.log(`   🏁 ALL TESTS COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
