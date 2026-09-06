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
