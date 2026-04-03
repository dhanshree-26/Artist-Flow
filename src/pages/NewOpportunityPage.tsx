import { useState } from 'react'
import type { FormEvent } from 'react'
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { db } from '../lib/firebase'
import { appendCachedOpportunity } from '../lib/opportunityCache'
import { writeCachedProfile } from '../lib/profileCache'

interface OpportunityFormState {
  title: string
  genre: string
  city: string
  budget: string
  eventDate: string
  eventTime: string
  description: string
}

const defaultForm: OpportunityFormState = {
  title: '',
  genre: '',
  city: '',
  budget: '',
  eventDate: '',
  eventTime: '',
  description: '',
}

export const NewOpportunityPage = () => {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<OpportunityFormState>(defaultForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSwitchingRole, setIsSwitchingRole] = useState(false)

  const handleSwitchToVenue = async () => {
    if (!user) {
      setError('Please login first to switch account role.')
      return
    }

    setError('')
    setIsSwitchingRole(true)

    try {
      await setDoc(doc(db, 'users', user.uid), { role: 'venue' }, { merge: true })
      writeCachedProfile(user.uid, {
        fullName: profile?.fullName || user.displayName || 'Artist Flow User',
        role: 'venue',
        phone: profile?.phone || '',
        city: profile?.city || '',
        stageOrVenueName: profile?.stageOrVenueName || user.email?.split('@')[0] || 'Venue Profile',
        about: profile?.about || '',
        email: profile?.email || user.email || '',
      })
      await refreshProfile()
    } catch {
      setError('Unable to switch role. Deploy Firestore rules with `npm run firebase:deploy` and try again.')
    } finally {
      setIsSwitchingRole(false)
    }
  }

  if (!profile) {
    return (
      <section className="surface-card">
        <h2>Loading account role</h2>
        <p>Please wait while we load your account permissions.</p>
      </section>
    )
  }

  if (profile?.role !== 'venue') {
    return (
      <section className="surface-card">
        <h2>Venue access only</h2>
        <p>Only venue accounts can create artist requirement ads.</p>
        <div className="button-stack">
          <button
            type="button"
            className="button button-primary"
            onClick={() => void handleSwitchToVenue()}
            disabled={isSwitchingRole}
          >
            {isSwitchingRole ? 'Switching...' : 'Switch my account to Venue'}
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
      </section>
    )
  }

  const setField = <K extends keyof OpportunityFormState>(key: K, value: OpportunityFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user || !profile) {
      setError('You must be logged in to post an ad.')
      return
    }

    if (new Date(`${form.eventDate}T${form.eventTime}`) < new Date()) {
      setError('Event date and time must be in the future.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const venueName = profile.stageOrVenueName || profile.fullName

      const createdDoc = await addDoc(collection(db, 'opportunities'), {
        ...form,
        venueId: user.uid,
        venueName,
        status: 'open',
        createdAt: serverTimestamp(),
      })

      appendCachedOpportunity({
        id: createdDoc.id,
        ...form,
        venueId: user.uid,
        venueName,
        status: 'open',
        createdAt: null,
      })

      navigate('/app', { replace: true })
    } catch {
      setError('Unable to post the ad right now. Please retry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="surface-card">
      <p className="hero-tag">Create requirement ad</p>
      <h2>Post a new performance requirement</h2>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Event title
          <input
            required
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
            placeholder="Friday Live Acoustic Night"
          />
        </label>

        <label>
          Genre / Style
          <input
            required
            value={form.genre}
            onChange={(event) => setField('genre', event.target.value)}
            placeholder="Acoustic, Jazz, DJ, Stand-up"
          />
        </label>

        <label>
          City
          <input required value={form.city} onChange={(event) => setField('city', event.target.value)} />
        </label>

        <label>
          Budget
          <input
            required
            value={form.budget}
            onChange={(event) => setField('budget', event.target.value)}
            placeholder="INR 10,000 - 20,000"
          />
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
            placeholder="Mention crowd size, setup support, duration, and expected performer profile."
          />
        </label>

        {error && <p className="form-error col-span-2">{error}</p>}

        <button type="submit" className="button button-primary col-span-2" disabled={isSubmitting}>
          {isSubmitting ? 'Publishing ad...' : 'Publish ad'}
        </button>
      </form>
    </section>
  )
}
