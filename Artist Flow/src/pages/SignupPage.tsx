import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'
import { auth, db } from '../lib/firebase'
import { isStrongPassword, mapAuthError, passwordChecks } from '../lib/authErrors'
import { writeCachedProfile } from '../lib/profileCache'
import type { UserRole } from '../types'

interface SignupFormState {
  fullName: string
  stageOrVenueName: string
  city: string
  phone: string
  about: string
  role: UserRole
  email: string
  password: string
  confirmPassword: string
}

const defaultForm: SignupFormState = {
  fullName: '',
  stageOrVenueName: '',
  city: '',
  phone: '',
  about: '',
  role: 'artist',
  email: '',
  password: '',
  confirmPassword: '',
}

const phoneRegex = /^[+]?[-()\d\s]{8,18}$/

export const SignupPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState<SignupFormState>(defaultForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordState = useMemo(() => passwordChecks(form.password), [form.password])

  const setField = <K extends keyof SignupFormState>(key: K, value: SignupFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!isStrongPassword(form.password)) {
      setError('Password must include uppercase, lowercase, number, symbol, and at least 8 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!phoneRegex.test(form.phone)) {
      setError('Please enter a valid phone number.')
      return
    }

    setIsSubmitting(true)

    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password)

      const profilePayload = {
        fullName: form.fullName,
        stageOrVenueName: form.stageOrVenueName,
        city: form.city,
        phone: form.phone,
        about: form.about,
        role: form.role,
        email: form.email,

      }

      writeCachedProfile(credential.user.uid, profilePayload)

      try {
        await setDoc(doc(db, 'users', credential.user.uid), {
          ...profilePayload,
          createdAt: serverTimestamp(),
        })
      } catch {
        // Allow login to continue with cached profile mode if Firestore write is blocked.
      }

      await sendEmailVerification(credential.user)
      navigate('/verify-email', { replace: true, state: { email: form.email } })
    } catch (firebaseError) {
      const code = (firebaseError as { code?: string }).code ?? ''
      setError(mapAuthError(code))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-wide">
        <p className="hero-tag">Create account</p>
        <h1>Join Artist Flow</h1>
        <p>Set up your artist or venue profile with detailed professional information.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(event) => setField('fullName', event.target.value)}
            />
          </label>

          <label>
            Role
            <select value={form.role} onChange={(event) => setField('role', event.target.value as UserRole)}>
              <option value="artist">Artist / Performer</option>
              <option value="venue">Venue / Restaurant</option>
            </select>
          </label>

          <label>
            Stage or Venue Name
            <input
              type="text"
              required
              value={form.stageOrVenueName}
              onChange={(event) => setField('stageOrVenueName', event.target.value)}
            />
          </label>

          <label>
            City
            <input
              type="text"
              required
              value={form.city}
              onChange={(event) => setField('city', event.target.value)}
            />
          </label>

          <label>
            Phone
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(event) => setField('phone', event.target.value)}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
            />
          </label>

          <label className="col-span-2">
            About
            <textarea
              rows={4}
              required
              value={form.about}
              onChange={(event) => setField('about', event.target.value)}
              placeholder="Tell the community about your style, crowd, or performance preference."
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => setField('password', event.target.value)}
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(event) => setField('confirmPassword', event.target.value)}
            />
          </label>

          <div className="password-checks col-span-2">
            <p className={passwordState.minLength ? 'ok' : ''}>At least 8 characters</p>
            <p className={passwordState.upperCase ? 'ok' : ''}>One uppercase letter</p>
            <p className={passwordState.lowerCase ? 'ok' : ''}>One lowercase letter</p>
            <p className={passwordState.number ? 'ok' : ''}>One number</p>
            <p className={passwordState.symbol ? 'ok' : ''}>One special symbol</p>
          </div>

          {error && <p className="form-error col-span-2">{error}</p>}

          <button type="submit" className="button button-primary col-span-2" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-footnote">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  )
}
