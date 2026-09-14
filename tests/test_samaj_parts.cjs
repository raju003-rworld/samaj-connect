// Targeted test for Samaj Change Approval and Chat message enhancements
const BASE_URL = "http://localhost:3000";
const ADMIN_TOKEN = "mock-token-9876543210";
const USER_TOKEN = "mock-token-9825123456"; // Paresh Patel
const NON_ADMIN_TOKEN = "mock-token-9825999999"; // Regular member
const USER2_TOKEN = "mock-token-9825000002"; // Ramesh Patel

let passed = 0;
let failed = 0;

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
    passed++;
    console.log(`✅ [PASS] ${name}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${name}`, details);
  }
}

async function run() {
  console.log("\n🧪 Running Part 18-20 Samaj Change & Chat Tests...\n");

  // 1. Initial User Profile Check
  const meRes = await request("GET", "/api/auth/me", null, USER_TOKEN);
  assert(meRes.status === 200, "User can get auth/me", meRes.data);
  const initialActiveSamaj = meRes.data.activeSamajId;
  console.log(`ℹ️ Initial activeSamajId: ${initialActiveSamaj}`);

  const candidates = ["samaj_soni_surat", "samaj_soni_rajkot", "samaj_brahmin_central"];
  const targetSamajId = candidates.find((id) => id !== initialActiveSamaj) || "samaj_soni_rajkot";
  const secondTargetId = candidates.find((id) => id !== initialActiveSamaj && id !== targetSamajId) || "samaj_brahmin_central";

  // 2. Submit Samaj Change Request
  console.log("\n--- Testing Samaj Change Request Submission (Part 19) ---");
  const changeRes = await request(
    "POST",
    "/api/samaj/change-request",
    { requestedSamajId: targetSamajId, reason: "Moving for business" },
    USER_TOKEN
  );
  assert(changeRes.status === 200 && changeRes.data.ok, "POST /api/samaj/change-request returns 200 OK", changeRes.data);
  const requestId = changeRes.data?.request?.id;

  // 3. CRITICAL: activeSamajId MUST NOT change immediately!
  const meAfterSubmit = await request("GET", "/api/auth/me", null, USER_TOKEN);
  assert(
    meAfterSubmit.data.activeSamajId === initialActiveSamaj,
    "CRITICAL: User activeSamajId remains UNCHANGED while request is PENDING",
    { expected: initialActiveSamaj, actual: meAfterSubmit.data.activeSamajId }
  );

  // 4. Duplicate pending request must be rejected
  const dupRes = await request(
    "POST",
    "/api/samaj/change-request",
    { requestedSamajId: secondTargetId, reason: "Another reason" },
    USER_TOKEN
  );
  assert(dupRes.status === 400, "Duplicate change request while PENDING is rejected with 400", dupRes.data);

  // 5. User can view their pending request
  const myReqRes = await request("GET", "/api/samaj/change-request", null, USER_TOKEN);
  assert(
    myReqRes.status === 200 && myReqRes.data.request?.status === "PENDING",
    "GET /api/samaj/change-request returns current pending request",
    myReqRes.data
  );

  // 6. Admin Listing (Part 20)
  console.log("\n--- Testing Samaj Admin Approval (Part 20) ---");
  // Non-admin forbidden
  const nonAdminList = await request("GET", "/api/admin/samaj/change-requests", null, NON_ADMIN_TOKEN);
  assert(nonAdminList.status === 403, "Non-admin cannot access /api/admin/samaj/change-requests (403)", nonAdminList.status);

  // Admin list
  const adminList = await request("GET", "/api/admin/samaj/change-requests", null, ADMIN_TOKEN);
  assert(
    adminList.status === 200 && Array.isArray(adminList.data.items),
    "Admin can list Samaj change requests",
    adminList.data
  );
  const foundInAdmin = adminList.data.items.find((r) => r.id === requestId);
  assert(!!foundInAdmin, "Pending request is present in admin queue", foundInAdmin);

  // 7. Admin Approves Request
  const approveRes = await request(
    "POST",
    `/api/admin/samaj/change-requests/${requestId}/approve`,
    {},
    ADMIN_TOKEN
  );
  assert(approveRes.status === 200 && approveRes.data.ok, "Admin can approve Samaj change request", approveRes.data);

  // 8. CRITICAL: Now and only now, target user's activeSamajId is updated to requestedSamajId!
  const meAfterApprove = await request("GET", "/api/auth/me", null, USER_TOKEN);
  assert(
    meAfterApprove.data.activeSamajId === targetSamajId,
    "CRITICAL: User activeSamajId updated to requested Samaj ONLY AFTER admin approval",
    { expected: targetSamajId, actual: meAfterApprove.data.activeSamajId }
  );

  // 9. Rejection Flow Test
  console.log("\n--- Testing Samaj Admin Rejection Flow ---");
  const req2Res = await request(
    "POST",
    "/api/samaj/change-request",
    { requestedSamajId: secondTargetId, reason: "Testing rejection" },
    USER_TOKEN
  );
  assert(req2Res.status === 200, "New change request submitted after prior approval", req2Res.data);
  const req2Id = req2Res.data.request.id;

  const rejectRes = await request(
    "POST",
    `/api/admin/samaj/change-requests/${req2Id}/reject`,
    { rejectionReason: "Address proof incomplete" },
    ADMIN_TOKEN
  );
  assert(rejectRes.status === 200 && rejectRes.data.ok, "Admin can reject Samaj change request", rejectRes.data);

  const meAfterReject = await request("GET", "/api/auth/me", null, USER_TOKEN);
  assert(
    meAfterReject.data.activeSamajId === targetSamajId,
    "User activeSamajId remains UNCHANGED after rejection",
    meAfterReject.data.activeSamajId
  );

  // 10. Chat Message Edit & Delete for Everyone Tests
  console.log("\n--- Testing Chat Message Edit & Delete (Parts 8-11) ---");
  // Initialize USER2 to ensure user exists
  await request("GET", "/api/auth/me", null, USER2_TOKEN);

  // Start direct conversation between USER and USER2
  const convRes = await request(
    "POST",
    "/api/conversations/direct",
    { userId: "user_9825000002" },
    USER_TOKEN
  );
  assert(convRes.status === 200 && convRes.data.id, "Open direct conversation returns 200 with id", convRes.data);
  const convId = convRes.data.id;

  // Send a message
  const sendRes = await request(
    "POST",
    `/api/conversations/${convId}/messages`,
    { text: "Initial message to be edited", type: "text" },
    USER_TOKEN
  );
  assert(sendRes.status === 200 && sendRes.data.id, "Send message returns 200", sendRes.data);
  const msgId = sendRes.data.id;

  // Edit the message
  const editRes = await request(
    "PATCH",
    `/api/conversations/${convId}/messages/${msgId}`,
    { text: "Edited message content" },
    USER_TOKEN
  );
  assert(
    editRes.status === 200 && editRes.data.message?.text === "Edited message content" && editRes.data.message?.edited === true,
    "Message author can edit message content and marked edited: true",
    editRes.data
  );

  // Non-author cannot edit message
  const unauthEdit = await request(
    "PATCH",
    `/api/conversations/${convId}/messages/${msgId}`,
    { text: "Hacked content" },
    USER2_TOKEN
  );
  assert(unauthEdit.status === 403, "Non-author is forbidden from editing message (403)", unauthEdit.status);

  // Delete message for everyone
  const delRes = await request(
    "DELETE",
    `/api/conversations/${convId}/messages/${msgId}?forEveryone=true`,
    null,
    USER_TOKEN
  );
  assert(delRes.status === 200 && delRes.data.ok, "Delete for everyone returns 200", delRes.data);

  // Verify message is excluded from visible messages for both sender and recipient
  const msgList1 = await request("GET", `/api/conversations/${convId}/messages`, null, USER_TOKEN);
  const msgList2 = await request("GET", `/api/conversations/${convId}/messages`, null, USER2_TOKEN);
  const foundIn1 = (msgList1.data?.items || []).find((m) => m.id === msgId);
  const foundIn2 = (msgList2.data?.items || []).find((m) => m.id === msgId);
  assert(!foundIn1 && !foundIn2, "Deleted for everyone message is hidden from both conversation participants");

  console.log(`\n========================================`);
  console.log(`🏁 Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

