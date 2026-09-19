const http = require("http");

const USER_TOKEN = "mock-token-9825123456";
const ADMIN_TOKEN = "mock-token-9876543210";

function request(method, path, body = null, token = USER_TOKEN) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          ...(dataString ? { "Content-Length": Buffer.byteLength(dataString) } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on("error", reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function run() {
  console.log("🔔 Starting Phone & Screen Notifications Test Suite...");

  // 1. Check notifications endpoint
  const notifsRes = await request("GET", "/api/notifications");
  if (notifsRes.status !== 200) throw new Error("GET /api/notifications failed: " + notifsRes.status);
  console.log("✅ [PASS] GET /api/notifications returned 200 OK");

  // 2. Test Reel notification generation
  const reelTestRes = await request("POST", "/api/notifications/test", { type: "reel" });
  if (reelTestRes.status !== 200 || !reelTestRes.data.item || reelTestRes.data.item.type !== "reel") {
    throw new Error("POST /api/notifications/test (reel) failed: " + JSON.stringify(reelTestRes));
  }
  console.log("✅ [PASS] Reel notification generation works:", reelTestRes.data.item.title);

  // 3. Test Message notification generation
  const msgTestRes = await request("POST", "/api/notifications/test", { type: "message" });
  if (msgTestRes.status !== 200 || !msgTestRes.data.item || msgTestRes.data.item.type !== "message") {
    throw new Error("POST /api/notifications/test (message) failed: " + JSON.stringify(msgTestRes));
  }
  console.log("✅ [PASS] Message notification generation works:", msgTestRes.data.item.title);

  // 4. Test Publishing a Reel via POST /api/posts with mediaType='video' using ADMIN_TOKEN
  const postReelRes = await request("POST", "/api/posts", {
    content: "શ્રી ખોડલધામ પાટોત્સવ 2026 Live દર્શન 🚩",
    caption: "ખોડલધામ પાટોત્સવ Live",
    mediaUrls: ["/sample-reel.mp4"],
    mediaType: "video",
    isReel: true,
  }, ADMIN_TOKEN);
  if (postReelRes.status !== 200) throw new Error("POST /api/posts failed: " + JSON.stringify(postReelRes));
  console.log("✅ [PASS] New Reel published successfully:", postReelRes.data.id);

  // 5. Verify that the new Reel created a notification for user
  const afterReelNotifs = await request("GET", "/api/notifications", null, USER_TOKEN);
  const foundReelNotif = afterReelNotifs.data.items.find((n) => n.type === "reel");
  if (!foundReelNotif) throw new Error("Expected Reel notification not found in notifications list");
  console.log("✅ [PASS] Reel notification present in feed:", foundReelNotif.title, "-", foundReelNotif.body);

  // 6. Test Sending a Direct Chat Message
  const directChatRes = await request("POST", "/api/conversations/direct", { targetUserId: "mem_4" }, USER_TOKEN);
  const convId = directChatRes.data.id;
  const sendMsgRes = await request("POST", `/api/conversations/${convId}/messages`, {
    text: "જય શ્રી કૃષ્ણ! કેમ છો ડૉક્ટર સાહેબ?",
    type: "text",
  }, USER_TOKEN);
  if (sendMsgRes.status !== 200) throw new Error("POST message failed");
  console.log("✅ [PASS] Chat message sent successfully:", sendMsgRes.data.id);

  // 7. Test Marking Notifications as read
  const markReadRes = await request("POST", "/api/notifications/read", {});
  if (markReadRes.status !== 200) throw new Error("POST /api/notifications/read failed");
  console.log("✅ [PASS] Notifications marked as read successfully");

  console.log("========================================");
  console.log("🏁 ALL 7 NOTIFICATION TESTS PASSED!");
  console.log("========================================");
}

run().catch((e) => {
  console.error("❌ Test Failed:", e);
  process.exit(1);
});
