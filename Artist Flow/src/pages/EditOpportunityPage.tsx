import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { db } from '../lib/firebase'
import { getCachedOpportunityById, upsertCachedOpportunity } from '../lib/opportunityCache'
import type { Opportunity } from '../types'

interface OpportunityFormState {
  title: string
  genre: string
  city: string
  budget: string
  eventDate: string
  eventTime: string
  description: string
}

const toFormState = (opportunity: Opportunity): OpportunityFormState => ({
  title: opportunity.title,
  genre: opportunity.genre,
  city: opportunity.city,
  budget: opportunity.budget,
  eventDate: opportunity.eventDate,
  eventTime: opportunity.eventTime,
  description: opportunity.description,
})

export const EditOpportunityPage = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<OpportunityFormState | null>(null)
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setError('Invalid post id.')
      setIsLoading(false)
      return
    }

    const cached = getCachedOpportunityById(id)

    if (cached) {
      setOpportunity(cached)
      setForm(toFormState(cached))
      setIsLoading(false)
    }

    const load = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'opportunities', id))

        if (!snapshot.exists()) {
          setError('Post not found.')
          setIsLoading(false)
          return
        }

        const loaded = {
          id: snapshot.id,
          ...(snapshot.data() as Omit<Opportunity, 'id'>),
        }

        setOpportunity(loaded)
        setForm(toFormState(loaded))
      } catch {
        if (!cached) {
          setError('Unable to load post details right now.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [id])

  const setField = <K extends keyof OpportunityFormState>(key: K, value: OpportunityFormState[K]) => {
    setForm((previous) => (previous ? { ...previous, [key]: value } : previous))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!id || !form || !opportunity || !user) {
      setError('Unable to save this post right now.')
      return
    }

    if (opportunity.venueId !== user.uid) {
      setError('Only the post owner can edit this post.')
      return
    }

    if (new Date(`${form.eventDate}T${form.eventTime}`) < new Date()) {
      setError('Event date and time must be in the future.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await updateDoc(doc(db, 'opportunities', id), {
        ...form,
        status: opportunity.status || 'open',
        updatedAt: serverTimestamp(),
      })

      upsertCachedOpportunity({
        ...opportunity,
        ...form,
        status: opportunity.status || 'open',
      })

      navigate('/app', { replace: true })
    } catch {
      setError('Unable to update post right now. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <section className="surface-card">
        <h2>Loading post</h2>
        <p>Please wait while we load this posting.</p>
      </section>
    )
  }

  if (!form || !opportunity) {
    return (
      <section className="surface-card">
        <h2>Post unavailable</h2>
        <p>{error || 'This post is unavailable.'}</p>
      </section>
    )
  }

  if (!user || opportunity.venueId !== user.uid) {
    return (
      <section className="surface-card">
        <h2>Owner access only</h2>
        <p>Only the owner of this post can edit it.</p>
      </section>
    )
  }

  return (
    <section className="surface-card">
      <p className="hero-tag">Edit posting</p>
      <h2>Update your performance requirement</h2>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Event title
          <input required value={form.title} onChange={(event) => setField('title', event.target.value)} />
        </label>

        <label>
          Genre / Style
          <input required value={form.genre} onChange={(event) => setField('genre', event.target.value)} />
        </label>

        <label>
          City
          <input required value={form.city} onChange={(event) => setField('city', event.target.value)} />
        </label>

        <label>
          Budget
          <input required value={form.budget} onChange={(event) => setField('budget', event.target.value)} />
        </label>

        <label>
          Event date
          <input
            type="date"
            required
            value={form.eventDate}
            onChange={(event) => setField('eventDate', event.target.value)}
          />
        </label>

        <label>
          Event time
          <input
            type="time"
            required
            value={form.eventTime}
            onChange={(event) => setField('eventTime', event.target.value)}
          />
        </label>

        <label className="col-span-2">
          Description
          <textarea
            rows={6}
            required
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
          />
        </label>

        {error && <p className="form-error col-span-2">{error}</p>}

        <button type="submit" className="button button-primary col-span-2" disabled={isSaving}>
          {isSaving ? 'Saving changes...' : 'Save changes'}
        </button>
      </form>
    </section>
  )
}
