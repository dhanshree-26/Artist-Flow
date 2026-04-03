import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { AuthContext } from './auth-context'
import { auth, db } from '../lib/firebase'
import { readCachedProfile, writeCachedProfile } from '../lib/profileCache'
import type { UserProfile } from '../types'

const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
  const profileSnap = await getDoc(doc(db, 'users', uid))

  if (!profileSnap.exists()) {
    return null
  }

  const data = profileSnap.data() as Omit<UserProfile, 'uid'>
  return { uid, ...data }
}

const toCachePayload = (profile: UserProfile) => ({
  fullName: profile.fullName,
  role: profile.role,
  phone: profile.phone,
  city: profile.city,
  stageOrVenueName: profile.stageOrVenueName,
  about: profile.about,
  email: profile.email,
})

const buildLocalFallbackProfile = (nextUser: User): UserProfile => {
  const cached = readCachedProfile(nextUser.uid)

  return {
    uid: nextUser.uid,
    fullName: cached?.fullName || nextUser.displayName || 'Artist Flow User',
    role: cached?.role || 'artist',
    phone: cached?.phone || '',
    city: cached?.city || '',
    stageOrVenueName:
      cached?.stageOrVenueName || nextUser.displayName || nextUser.email?.split('@')[0] || 'Profile Pending',
    about:
      cached?.about ||
      'Complete your profile details to unlock better matching and conversation context.',
    email: cached?.email || nextUser.email || '',
    createdAt: null,
  }
}

const getProfileIssueMessage = (error: unknown) => {
  const code = (error as { code?: string })?.code ?? ''

  if (code.includes('permission-denied')) {
    return 'Profile sync is limited until Firestore rules are deployed. Run npm run firebase:deploy.'
  }

  if (code.includes('unavailable')) {
    return 'Firebase is temporarily unavailable. Running in local profile mode.'
  }

  return 'Profile sync is limited right now. Running in local profile mode.'
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authIssue, setAuthIssue] = useState('')
  const [isEmailVerified, setIsEmailVerified] = useState(false)

  useEffect(() => {
    let cancelled = false

    const syncProfileInBackground = async (nextUser: User) => {
      try {
        const loadedProfile = await fetchProfile(nextUser.uid)

        if (cancelled) {
          return
        }

        if (loadedProfile) {
          writeCachedProfile(nextUser.uid, toCachePayload(loadedProfile))
          setProfile(loadedProfile)
          setAuthIssue('')
          return
        }

        setAuthIssue('Profile sync pending. Using local profile until Firestore data is available.')
      } catch (profileError) {
        if (!cancelled) {
          setAuthIssue(getProfileIssueMessage(profileError))
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (cancelled) {
        return
      }

      setAuthIssue('')
      setUser(nextUser)
      setIsEmailVerified(Boolean(nextUser?.emailVerified))
      setLoading(false)

      if (!nextUser) {
        setProfile(null)
        return
      }

      const fallbackProfile = buildLocalFallbackProfile(nextUser)
      setProfile(fallbackProfile)
      writeCachedProfile(nextUser.uid, toCachePayload(fallbackProfile))

      void syncProfileInBackground(nextUser)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const refreshUser = async () => {
    if (!auth.currentUser) {
      setUser(null)
      setIsEmailVerified(false)
      setAuthIssue('')
      return
    }

    await auth.currentUser.reload()
    setUser(auth.currentUser)
    setIsEmailVerified(Boolean(auth.currentUser.emailVerified))
  }

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setProfile(null)
      return
    }

    const fallbackProfile = buildLocalFallbackProfile(auth.currentUser)

    try {
      const loadedProfile = await fetchProfile(auth.currentUser.uid)

      if (loadedProfile) {
        writeCachedProfile(auth.currentUser.uid, toCachePayload(loadedProfile))
        setProfile(loadedProfile)
        setAuthIssue('')
        return
      }

      setProfile(fallbackProfile)
      writeCachedProfile(auth.currentUser.uid, toCachePayload(fallbackProfile))
    } catch (profileError) {
      setProfile(fallbackProfile)
      writeCachedProfile(auth.currentUser.uid, toCachePayload(fallbackProfile))
      setAuthIssue(getProfileIssueMessage(profileError))
    }
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      authIssue,
      isEmailVerified,
      refreshUser,
      refreshProfile,
    }),
    [user, profile, loading, authIssue, isEmailVerified],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
