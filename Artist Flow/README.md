# Artist Flow

Artist Flow is a React + Firebase platform where clubs, bars, and restaurants post performer requirements and artists connect through real-time chat.

## Core Features

- Firebase email/password authentication with email verification.
- Role-based signup (Artist or Venue) with profile details.
- Venue dashboard to post performance requirement ads.
- Artist board to browse opportunities and connect instantly.
- Auto-created conversation thread when artist connects.
- Real-time chat powered by Firestore snapshots.
- Feedback form that sends email to your configured inbox through a Firebase Cloud Function.
- Responsive, artistic-professional UI for mobile, iPad, and desktop.

## Tech Stack

- React 19 + TypeScript + Vite
- React Router
- Firebase Auth + Cloud Firestore
- Firebase Hosting + Firebase Functions
- Resend for outbound feedback mail delivery

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Fill Firebase and Resend environment variables in `.env.local`.

4. Start development server:

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Important Files

- App routes and guards: `src/App.tsx`
- Firebase config: `src/lib/firebase.ts`
- Auth context: `src/context/AuthContext.tsx`
- Opportunities board: `src/pages/OpportunitiesPage.tsx`
- Real-time chat: `src/pages/ChatsPage.tsx`
- Feedback cloud function: `functions/index.js`
- Firestore rules: `firebase.rules`
- Firebase deploy config: `firebase.json`

## Deployment + Firebase Hosting Configuration

Use the detailed setup guide here:

- `FIREBASE_VERCEL_SETUP.md`
