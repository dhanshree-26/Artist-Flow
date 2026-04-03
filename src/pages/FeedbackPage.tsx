import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/useAuth'

interface FeedbackFormState {
  fullName: string
  email: string
  category: 'general' | 'feature' | 'bug' | 'support'
  message: string
}

export const FeedbackPage = () => {
  const { profile, user } = useAuth()
  const feedbackEndpoint = '/api/feedback'

  const [form, setForm] = useState<FeedbackFormState>({
    fullName: '',
    email: '',
    category: 'general',
    message: '',
  })
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      fullName: profile?.fullName ?? '',
      email: user?.email ?? '',
    }))
  }, [profile?.fullName, user?.email])

  const setField = <K extends keyof FeedbackFormState>(key: K, value: FeedbackFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('')
    setStatusType('')

    try {
      const response = await fetch(feedbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const rawBody = await response.text()
      let payload: { ok?: boolean; message?: string } = {}

      if (rawBody) {
        try {
          payload = JSON.parse(rawBody) as { ok?: boolean; message?: string }
        } catch {
          payload = {
            ok: false,
            message: 'Feedback endpoint returned an invalid response. Check VITE_FEEDBACK_ENDPOINT and deployment logs.',
          }
        }
      }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? 'Unable to send feedback right now.')
      }

      setStatus('Thanks. Your feedback has been mailed successfully.')
      setStatusType('success')
      setForm((previous) => ({ ...previous, message: '' }))
    } catch (requestError) {
      setStatus((requestError as Error).message)
      setStatusType('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="surface-card">
      <p className="hero-tag">Feedback automation</p>
      <h2>Send feedback directly to your team inbox</h2>
      <p>Your message is emailed to the owner, and you receive a thank-you email confirmation.</p>

      <form className="form-stack" onSubmit={handleSubmit}>
        <label>
          Full name
          <input
            required
            type="text"
            value={form.fullName}
            onChange={(event) => setField('fullName', event.target.value)}
          />
        </label>

        <label>
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setField('email', event.target.value)}
          />
        </label>

        <label>
          Feedback type
          <select
            value={form.category}
            onChange={(event) => setField('category', event.target.value as FeedbackFormState['category'])}
          >
            <option value="general">General</option>
            <option value="feature">Feature request</option>
            <option value="bug">Bug report</option>
            <option value="support">Support request</option>
          </select>
        </label>

        <label>
          Message
          <textarea
            required
            rows={6}
            value={form.message}
            onChange={(event) => setField('message', event.target.value)}
          />
        </label>

        <button type="submit" className="button button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send feedback email'}
        </button>
      </form>

      {status && <p className={statusType === 'error' ? 'form-error' : 'form-note'}>{status}</p>}
    </section>
  )
}
