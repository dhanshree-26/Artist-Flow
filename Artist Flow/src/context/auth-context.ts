import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { UserProfile } from '../types'

export interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  authIssue: string
  isEmailVerified: boolean
  refreshUser: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
