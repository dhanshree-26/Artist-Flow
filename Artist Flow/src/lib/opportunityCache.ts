import type { Opportunity } from '../types'

type CachedOpportunity = Omit<Opportunity, 'createdAt'>

const CACHE_KEY = 'artist-flow-opportunities:v1'

const isBrowser = () => typeof window !== 'undefined' && Boolean(window.localStorage)

const normalizeOpportunity = (item: Partial<CachedOpportunity>): Opportunity | null => {
  if (!item.id || !item.title || !item.venueId || !item.venueName) {
    return null
  }

  return {
    id: item.id,
    title: String(item.title || ''),
    genre: String(item.genre || ''),
    city: String(item.city || ''),
    budget: String(item.budget || ''),
    eventDate: String(item.eventDate || ''),
    eventTime: String(item.eventTime || ''),
    description: String(item.description || ''),
    venueId: String(item.venueId || ''),
    venueName: String(item.venueName || ''),
    status: item.status === 'closed' ? 'closed' : 'open',
    createdAt: null,
  }
}

const serialize = (opportunity: Opportunity): CachedOpportunity => ({
  id: opportunity.id,
  title: opportunity.title,
  genre: opportunity.genre,
  city: opportunity.city,
  budget: opportunity.budget,
  eventDate: opportunity.eventDate,
  eventTime: opportunity.eventTime,
  description: opportunity.description,
  venueId: opportunity.venueId,
  venueName: opportunity.venueName,
  status: opportunity.status,
})

export const readCachedOpportunities = (): Opportunity[] => {
  if (!isBrowser()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Array<Partial<CachedOpportunity>>

    return parsed
      .map((item) => normalizeOpportunity(item))
      .filter((item): item is Opportunity => Boolean(item))
  } catch {
    return []
  }
}

export const writeCachedOpportunities = (opportunities: Opportunity[]) => {
  if (!isBrowser()) {
    return
  }

  try {
    const deduped = Array.from(
      new Map(opportunities.map((opportunity) => [opportunity.id, serialize(opportunity)])).values(),
    )

    window.localStorage.setItem(CACHE_KEY, JSON.stringify(deduped))
  } catch {
    // Ignore local cache failures and keep Firestore as source of truth.
  }
}

export const appendCachedOpportunity = (opportunity: Opportunity) => {
  const existing = readCachedOpportunities()
  writeCachedOpportunities([opportunity, ...existing])
}

export const upsertCachedOpportunity = (opportunity: Opportunity) => {
  const existing = readCachedOpportunities().filter((item) => item.id !== opportunity.id)
  writeCachedOpportunities([opportunity, ...existing])
}

export const removeCachedOpportunity = (opportunityId: string) => {
  const existing = readCachedOpportunities().filter((item) => item.id !== opportunityId)
  writeCachedOpportunities(existing)
}

export const getCachedOpportunityById = (opportunityId: string) =>
  readCachedOpportunities().find((item) => item.id === opportunityId) ?? null
