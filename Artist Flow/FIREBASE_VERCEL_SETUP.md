# Firebase Hosting Deployment Guide (Step-by-Step)

This guide is now fully Firebase-native: frontend on Firebase Hosting, feedback backend on Firebase Functions, and auth/chat/data on Firebase Auth + Firestore.

## 1. Firebase Project

1. Open Firebase Console.
2. Create project (example: `artist-flow-prod`).
3. Add a **Web App** inside the project.
4. Copy web SDK config into `.env.local`.

## 2. Firebase Authentication

1. Open **Authentication** > **Sign-in method**.
2. Enable **Email/Password** provider.
3. Email verification is enabled in-app.

## 3. Firestore Database

1. Open **Firestore Database**.
2. Create database in production mode.
3. Choose region closest to users.

## 4. Local Environment (Frontend)

Create local env file:

```bash
cp .env.example .env.local
```

Fill client-side keys:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 5. Install Firebase CLI (No Global Install Required)

Use `npx` so you do not need global install permissions:

```bash
npx firebase-tools login
npx firebase-tools use artist-flow-prod
```

## 6. Configure Feedback Email Function (Resend)

Create Resend API key and set Firebase Function params:

```bash
npx firebase-tools functions:params:set RESEND_API_KEY="YOUR_RESEND_KEY"
npx firebase-tools functions:params:set FEEDBACK_TO_EMAIL="ojassomani@gmail.com"
npx firebase-tools functions:params:set FEEDBACK_FROM_EMAIL="onboarding@resend.dev"
```

Function source is here:

- `functions/index.js`

## 7. Install Dependencies and Build

```bash
npm install
npm --prefix functions install
npm run build
```

## 8. Deploy (Hosting + Functions + Firestore Rules)

```bash
npx firebase-tools deploy --only hosting,functions,firestore:rules,firestore:indexes
```

Or use prepared script:

```bash
npm run firebase:deploy
```

## 9. Firebase Hosting + API Rewrite

Deployment config is already prepared in:

- `firebase.json`

Important rewrites included:

1. `/api/feedback` -> Firebase Function `sendFeedback`
2. SPA fallback -> `/index.html`

## 10. Post-Deploy Checklist

1. Open Firebase Hosting URL.
2. Sign up as venue and artist, then verify both email addresses.
3. Login and confirm only verified accounts enter dashboard.
4. Create ad from `Post Ad` page.
5. Connect as artist and confirm chat thread appears.
6. Submit feedback form and verify email received at `ojassomani@gmail.com`.

## 11. If Post Ad or Chat Looks Missing

1. Open `Post Ad` page directly from nav.
2. If account is not venue, click **Switch my account to Venue** on that page.
3. Reload dashboard and confirm posting + chats.
4. If you see a profile sync warning, run `npm run firebase:deploy` to push Firestore rules.

## 12. Optional Hardening

1. Add App Check.
2. Add rate limit in `functions/index.js`.
3. Add moderation for opportunities.
4. Add notifications for new chat connections.
