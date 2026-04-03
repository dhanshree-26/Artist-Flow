import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const envFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const hasFirebaseEnv = Object.values(envFirebaseConfig).every((value) => Boolean(value))

const firebaseConfig = hasFirebaseEnv
  ? envFirebaseConfig
  : {
      // Use safe placeholders so the app shell can still render on misconfigured deployments.
      apiKey: 'placeholder-api-key',
      authDomain: 'placeholder.firebaseapp.com',
      projectId: 'placeholder-project',
      storageBucket: 'placeholder.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:0000000000000000000000',
    }

if (!hasFirebaseEnv) {
  console.warn(
    'Firebase environment variables are missing for this deployment. Configure VITE_FIREBASE_* values in your build environment.',
  )
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
