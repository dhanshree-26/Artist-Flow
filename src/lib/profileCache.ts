import type { UserProfile, UserRole } from '../types'

type CachedProfile = Pick<
  UserProfile,
  'fullName' | 'role' | 'phone' | 'city' | 'stageOrVenueName' | 'about' | 'email'
>

const CACHE_PREFIX = 'artist-flow-profile:'

const isBrowser = () => typeof window !== 'undefined' && Boolean(window.localStorage)

const cacheKey = (uid: string) => `${CACHE_PREFIX}${uid}`

const normalizeRole = (value: unknown): UserRole => (value === 'venue' ? 'venue' : 'artist')

const asString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)

export const readCachedProfile = (uid: string): CachedProfile | null => {
  if (!isBrowser()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(cacheKey(uid))

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<CachedProfile>

    return {
      fullName: asString(parsed.fullName),
      role: normalizeRole(parsed.role),
      phone: asString(parsed.phone),
      city: asString(parsed.city),
      stageOrVenueName: asString(parsed.stageOrVenueName),
      about: asString(parsed.about),
      email: asString(parsed.email),
    }
  } catch {
    return null
  }
}

export const writeCachedProfile = (uid: string, profile: CachedProfile) => {
  if (!isBrowser()) {
    return
  }

  try {
    window.localStorage.setItem(cacheKey(uid), JSON.stringify(profile))
  } catch {
    // Ignore storage write failures. App can still run without local cache.
  }
}
