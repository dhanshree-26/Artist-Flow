import { LogOut, MessageCircle, PenSquare, Shapes, UserRound } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { auth } from '../lib/firebase'

export const AppLayout = () => {
  const { profile, authIssue } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { to: '/app', label: 'Opportunities', icon: Shapes },
    { to: '/app/new', label: 'Post Ad', icon: PenSquare },
    { to: '/app/chats', label: 'Chats', icon: MessageCircle },
    { to: '/app/feedback', label: 'Feedback', icon: PenSquare },
    { to: '/app/profile', label: 'Profile', icon: UserRound },
  ]

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <div>
          <p className="hero-tag">Artist Flow</p>
          <h1>Live Booking Desk</h1>
        </div>

        <div className="topbar-actions">
          {profile && <span className="pill">{profile.role === 'venue' ? 'Venue' : 'Artist'} account</span>}
          <button type="button" className="button button-secondary" onClick={() => void handleLogout()}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/app'} className="nav-chip">
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>

      <section className="dashboard-content">
        {authIssue && <p className="form-note">{authIssue}</p>}
        <Outlet />
      </section>
    </div>
  )
}
