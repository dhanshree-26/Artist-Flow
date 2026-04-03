import { sendEmailVerification } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { auth } from '../lib/firebase'

export const VerifyEmailPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isEmailVerified, refreshUser } = useAuth()
  const [status, setStatus] = useState('')
  const [isChecking, setIsChecking] = useState(false)

  const emailHint = (location.state as { email?: string } | null)?.email ?? user?.email ?? ''

  useEffect(() => {
    if (user && isEmailVerified) {
      navigate('/app', { replace: true })
    }
  }, [user, isEmailVerified, navigate])

  const handleResend = async () => {
    if (!auth.currentUser) {
      setStatus('Please log in first, then request verification email again.')
      return
    }

    await sendEmailVerification(auth.currentUser)
    setStatus('Verification email sent again. Check spam/promotions folders too.')
  }

  const handleCheck = async () => {
    setIsChecking(true)
    await refreshUser()
    setIsChecking(false)

    if (auth.currentUser?.emailVerified) {
      navigate('/app', { replace: true })
      return
    }

    setStatus('Still not verified yet. Click the link in your email and try again.')
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="hero-tag">Verification required</p>
        <h1>Confirm your email address</h1>
        <p>
          We sent a verification link to <strong>{emailHint || 'your email'}</strong>. Click the link before
          accessing your dashboard.
        </p>

        <div className="button-stack">
          <button type="button" className="button button-primary" onClick={() => void handleCheck()}>
            {isChecking ? 'Checking...' : 'I have verified'}
          </button>
          <button type="button" className="button button-secondary" onClick={() => void handleResend()}>
            Resend verification email
          </button>
        </div>

        {status && <p className="form-note">{status}</p>}

        <p className="auth-footnote">
          Need another account? <Link to="/signup">Create new account</Link>
        </p>
      </section>
    </main>
  )
}
