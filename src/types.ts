import type { Timestamp } from 'firebase/firestore'

export type UserRole = 'artist' | 'venue'

export interface UserProfile {
  uid: string
  fullName: string
  role: UserRole
  phone: string
  city: string
  stageOrVenueName: string
  about: string
  email: string
  createdAt?: Timestamp | null
}

export interface Opportunity {
  id: string
  title: string
  genre: string
  city: string
  budget: string
  eventDate: string
  eventTime: string
  description: string
  venueId: string
  venueName: string
  createdAt?: Timestamp | null
  status: 'open' | 'closed'
}

export interface ConnectionThread {
  id: string
  opportunityId: string
  opportunityTitle: string
  venueId: string
  venueName: string
  artistId: string
  artistName: string
  lastMessage: string
  lastMessageAt?: Timestamp | null
  createdAt?: Timestamp | null
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  text: string
  createdAt?: Timestamp | null
}
