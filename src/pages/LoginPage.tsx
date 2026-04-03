import { useState } from 'react'
import type { FormEvent } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { auth } from '../lib/firebase'
import { mapAuthError } from '../lib/authErrors'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)

      if (!credential.user.emailVerified) {
        navigate('/verify-email', { replace: true })
        return
      }

      navigate(redirectPath, { replace: true })
    } catch (firebaseError) {
      const code = (firebaseError as { code?: string }).code ?? ''
      setError(mapAuthError(code))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="hero-tag">Welcome back</p>
        <h1>Login to Artist Flow</h1>
        <p>Manage opportunities, connections, and performer chats from one dashboard.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="button button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footnote">
          New here? <Link to="/signup">Create your account</Link>
        </p>
      </section>
    </main>
  )
}
