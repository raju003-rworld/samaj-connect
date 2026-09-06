# SAMAJ CONNECT — PRD

## Original problem statement
Gujarati-first community social platform ("સમાજને જોડતું એક ડિજિટલ પ્લેટફોર્મ"). 40-module scope: splash, phone-OTP login, home dashboard, members directory (add/search/profile/edit), social feed, events, hall booking, family tree, maran nodh, business directory + ads, live streaming, messenger, cloud photos, photo gallery, admin panel, notifications, security rules. Web + PWA + admin.

## Stack
- Backend: FastAPI + MongoDB (JWT auth, dev OTP=123456; SMS provider swap-ready)
- Frontend: React 19 + Tailwind + shadcn/ui, Noto Sans Gujarati, PWA manifest
- Env keys used: MONGO_URL, DB_NAME, REACT_APP_BACKEND_URL, JWT_SECRET (optional), SEED_ADMIN_PHONE (optional)

## User personas
- Community member (search directory, post, join events)
- Community admin / super_admin (manage members, moderation, stats)

## Implemented (2026-02)
- Splash screen with auto-routing (logged-in → /home, else → /login)
- Phone OTP login (dev OTP 123456), JWT session persistence, language toggle Gujarati↔English
- Home dashboard: greeting card, purple community banner, 12-tile quick-access grid, bottom nav w/ floating FAB
- Society Members: create (`POST /api/members`), search (name/mobile/village/district/education), filter, member profile with Call/WhatsApp/Share
- Social Feed: create text+image post, like toggle, comments, delete own post
- Events: create dialog, upcoming/past/mine tabs, register toggle, registration count
- User Profile: view + inline edit (name/village/district/photo), quick links to my posts / events / admin
- Admin panel: 4 stat cards (members/users/posts/events) + member management table with active toggle
- Coming-soon placeholder for Messenger / Live / Hall / Family Tree / Maran Nodh / Business / Gallery / Cloud
- data-testid on every interactive element for testing agent

## Backlog (P0/P1/P2)
- P0: Real SMS OTP (Twilio/MSG91) — swap in `/api/auth/send-otp`
- P0: File upload for member/profile/post photos (currently URL input); object storage integration
- P1: Messenger (1-1 & group chat), Notifications (push + in-app badge), Hall/Room Booking with availability
- P1: Business Directory + Business Ads (admin approval workflow)
- P2: Family Tree graphical view, Maran Nodh memorial page, Live Streaming embed, Photo Gallery + Cloud Photos, PWA install prompt, Firebase migration bridge if user provides project

---
## Phase 2 Upgrade — Firebase migration + Social/Messenger/Live/Multi-Samaj (June 2026)

### Architecture (changed)
- Backend: FastAPI + **firebase-admin** (Firestore DB, Firebase Auth ID-token verification, Storage bucket). Mongo no longer used (legacy data migrated via `backend/migrate_mongo_to_firestore.py`).
- Auth: Firebase Phone OTP (client SDK). Dev mode `DEV_AUTH_ENABLED=true` → `/api/auth/dev-login` (OTP 123456) issues Firebase custom token. Prod: set false + add domain in Firebase authorized domains.
- Files: `core.py` (auth deps, samaj/visibility authz, notify), `routes_social.py`, `routes_chat.py`, `routes_live.py`, `live_service.py` (providers: embed | livekit | mux via env LIVE_PROVIDER), `routes_admin.py`.
- Frontend: `lib/firebase.js` (auth, Storage upload, realtime listeners), `components/MediaUploader.jsx`, `Visibility.jsx`, `SamajSwitcher.jsx`, `social/*`, `chat/ChatWindow.jsx`, `admin/Moderation.jsx`; pages Messages, Live, LiveRoom, Notifications, UserProfile, Search.
- Rules: `/app/firebase/firestore.rules`, `storage.rules` deployed with `backend/deploy_rules.py` (clients read-only realtime; all writes via backend).

### Firestore collections
samaj, settings/global, users, persons (members), posts, comments, stories, follows, reports, notifications, conversations (+ /messages subcollection), groups, presence, liveSessions (+ /chat, /sessions), events.

### Implemented
- Multi-Samaj (samajIds/activeSamajId, join/activate, super-admin create), visibility samaj/all_samaj/public/private enforced server-side; members limited to samaj/private.
- Social: multi-media posts/reels, like, comments+replies, save, share, follow, stories(24h), hashtags, search, report, block, approval workflow.
- Messenger: direct/group, media/doc/voice msgs, reply, delete (me/everyone), typing, sent/delivered/read, mute, group admin add/remove, presence.
- Live: create/schedule/start/end, embed provider (YouTube/FB/HLS), viewers, reactions, chat, moderation, replay. No fake video.
- Notifications (realtime), Admin moderation (posts, reports, users roles/suspend, samaj approval, public access).
- Tested: /app/test_reports/iteration_2.json — all pass.

### Requires external configuration
- Real SMS OTP: DEV_AUTH_ENABLED=false + Firebase authorized domain + billing for SMS.
- WebRTC/RTMP live: set LIVE_PROVIDER=livekit (LIVEKIT_URL/API_KEY/API_SECRET, `pip install livekit-api`) or mux (MUX_TOKEN_ID/SECRET).
- Push notifications (FCM) not yet wired (in-app realtime only).

### Backlog
P1: Hall booking, Photo gallery albums, Family tree, FCM push. P2: Death records, Business directory, export data.
