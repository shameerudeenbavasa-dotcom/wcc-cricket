# Firebase Setup for WCC Cricket App

## 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project" → name it "wcc-cricket" → Continue
3. Disable Google Analytics (optional) → Create project

## 2. Enable Authentication
1. Left sidebar → Build → Authentication → Get Started
2. Sign-in method tab → Enable **Email/Password** → Save

## 3. Enable Firestore
1. Left sidebar → Build → Firestore Database → Create database
2. Choose **Start in test mode** → Next → Select location → Enable

## 4. Get Your Config
1. Project Settings (gear icon top-left) → Your apps → click Web icon (</>)
2. Register app (name it "wcc-web") → copy the `firebaseConfig` object

## 5. Update src/firebase.js
Replace the placeholder values with your real config values.

## 6. Create Your Admin Account
1. In your app, register with your admin email/password (creates a Firebase Auth user)
2. In Firebase Console → Authentication → Users → copy your User UID
3. Firestore Database → Start collection → Collection ID: `users`
4. Document ID = your UID → Add field:
   - `role` (string) = `admin`
   - `email` (string) = your email
   - `displayName` (string) = your name

## Firestore Collections (auto-created by the app)
| Collection | Purpose |
|---|---|
| `users/{uid}` | User profiles with role: 'admin' or 'user' |
| `teams/{id}` | Cricket teams with player list |
| `matches/current` | Live match scoring data |
| `stream/current` | Live stream on/off status |

## How It Works
- **Admin** logs in → sees Go Live / Scoring / Teams tabs
- **Users** register → see Watch Live / Scoreboard / Teams tabs
- Scores update in real-time across all devices via Firestore
- Admin taps "Go Live" → streams via Agora → users auto-connect to watch
