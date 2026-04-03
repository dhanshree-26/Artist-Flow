import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OpportunityCard } from '../components/OpportunityCard'
import { useAuth } from '../context/useAuth'
import {
  readCachedOpportunities,
  removeCachedOpportunity,
  writeCachedOpportunities,
} from '../lib/opportunityCache'
import { formatEventDate } from '../lib/date'
import { db } from '../lib/firebase'
import type { ConnectionThread, Opportunity } from '../types'

const timestampToMs = (value: { toDate: () => Date } | null | undefined) =>
  value?.toDate ? value.toDate().getTime() : 0

export const OpportunitiesPage = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const isVenue = profile?.role === 'venue'

  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => readCachedOpportunities())
  const [myConnections, setMyConnections] = useState<ConnectionThread[]>([])
  const [manualViewMode, setManualViewMode] = useState<'all' | 'mine' | null>(null)
  const [isLoading, setIsLoading] = useState(() => readCachedOpportunities().length === 0)
  const [boardError, setBoardError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const viewMode = manualViewMode ?? 'all'

  useEffect(() => {
    const opportunitiesQuery = query(
      collection(db, 'opportunities'),
    )

    const unsubscribe = onSnapshot(
      opportunitiesQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((opportunityDoc) => ({
            id: opportunityDoc.id,
            ...(opportunityDoc.data() as Omit<Opportunity, 'id'>),
          }))
          .filter((opportunity) => opportunity.status !== 'closed')
          .sort((a, b) => a.eventDate.localeCompare(b.eventDate))

        setOpportunities(next)
        writeCachedOpportunities(next)
        setBoardError('')
        setIsLoading(false)
      },
      () => {
        const cached = readCachedOpportunities()

        if (cached.length > 0) {
          setOpportunities(cached)
          setBoardError('Live sync unavailable. Showing your last saved opportunities.')
        } else {
          setBoardError('Unable to load opportunities right now. Please refresh and try again.')
        }

        setIsLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    const connectionsQuery = query(collection(db, 'connections'), where('artistId', '==', user.uid))

    const unsubscribe = onSnapshot(
      connectionsQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((threadDoc) => ({
            id: threadDoc.id,
            ...(threadDoc.data() as Omit<ConnectionThread, 'id'>),
          }))
          .sort((a, b) => timestampToMs(b.lastMessageAt) - timestampToMs(a.lastMessageAt))

        setMyConnections(next)
      },
      () => {
        setBoardError('Unable to load connection state. Chat may be temporarily unavailable.')
      },
    )

    return () => unsubscribe()
  }, [user])

  const connectedOpportunityIds = useMemo(
    () => new Set(myConnections.map((thread) => thread.opportunityId)),
    [myConnections],
  )

  const visibleOpportunities = useMemo(() => {
    if (!isVenue || !user || viewMode !== 'mine') {
      return opportunities
    }

    return opportunities.filter((opportunity) => opportunity.venueId === user.uid)
  }, [opportunities, isVenue, user, viewMode])

  const handleConnect = async (opportunity: Opportunity) => {
    if (!user || !profile || profile.role !== 'artist') {
      return
    }

    const connectionId = `${opportunity.id}_${user.uid}`

    try {
      if (!connectedOpportunityIds.has(opportunity.id)) {
        const connectionRef = doc(db, 'connections', connectionId)

        await setDoc(
          connectionRef,
          {
            opportunityId: opportunity.id,
            opportunityTitle: opportunity.title,
            venueId: opportunity.venueId,
            venueName: opportunity.venueName,
            artistId: user.uid,
            artistName: profile.stageOrVenueName || profile.fullName,
            lastMessage: 'Connection started',
            lastMessageAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true },
        )

        await addDoc(collection(db, 'connections', connectionId, 'messages'), {
          senderId: user.uid,
          senderName: profile.stageOrVenueName || profile.fullName,
          text: `Hi ${opportunity.venueName}, I am interested in performing on ${formatEventDate(opportunity.eventDate)}.`,
          createdAt: serverTimestamp(),
        })
      }

      navigate(`/app/chats?thread=${connectionId}`)
    } catch {
      setBoardError('Unable to connect right now. Please try again in a moment.')
    }
  }

  const handleEdit = (opportunity: Opportunity) => {
    navigate(`/app/edit/${opportunity.id}`)
  }

  const handleDelete = async (opportunity: Opportunity) => {
    if (!user || opportunity.venueId !== user.uid) {
      return
    }

    const shouldDelete = window.confirm('Delete this post permanently?')
    if (!shouldDelete) {
      return
    }

    setDeletingId(opportunity.id)
    setBoardError('')

    try {
      await deleteDoc(doc(db, 'opportunities', opportunity.id))
      removeCachedOpportunity(opportunity.id)
    } catch {
      setBoardError('Unable to delete post right now. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="surface-card stack-gap">
      <div className="surface-head">
        <div>
          <p className="hero-tag">Live requirements board</p>
          <h2>Upcoming artist requirements</h2>
        </div>

        {isVenue && (
          <div className="button-group">
            <button
              type="button"
              className={viewMode === 'all' ? 'button button-primary' : 'button button-secondary'}
              onClick={() => setManualViewMode('all')}
            >
              All posts
            </button>
            <button
              type="button"
              className={viewMode === 'mine' ? 'button button-primary' : 'button button-secondary'}
              onClick={() => setManualViewMode('mine')}
            >
              My posts
            </button>
          </div>
        )}
      </div>

      {isLoading && <p>Loading opportunities...</p>}

      {boardError && <p className="form-error">{boardError}</p>}

      {!isLoading && visibleOpportunities.length === 0 && (
        <p className="empty-copy">
          No active requirements found. Venues can post new requirements from the Post Ad section.
        </p>
      )}

      <div className="card-grid">
        {visibleOpportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
            canConnect={profile?.role === 'artist'}
            alreadyConnected={connectedOpportunityIds.has(opportunity.id)}
            onConnect={handleConnect}
            isOwner={opportunity.venueId === user?.uid}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={deletingId === opportunity.id}
          />
        ))}
      </div>
    </section>
  )
}
