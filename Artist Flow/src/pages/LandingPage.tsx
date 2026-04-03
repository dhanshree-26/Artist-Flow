import { ArrowRight, Building2, CalendarClock, MessageSquareHeart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const highlights = [
  {
    title: 'Smart Opportunity Board',
    description:
      'Restaurants, clubs, and bars publish artist requirements with date, budget, and style in one polished board.',
    icon: CalendarClock,
  },
  {
    title: 'Instant Artist Connections',
    description:
      'Artists connect in one click and get a real-time chat thread instantly created for fast confirmations.',
    icon: MessageSquareHeart,
  },
  {
    title: 'Venue-Grade Profiles',
    description:
      'Structured signup captures city, role, contact details, and stage or venue identity for trust and clarity.',
    icon: Building2,
  },
]

export const LandingPage = () => {
  const { user, isEmailVerified } = useAuth()
  const appPath = user && isEmailVerified ? '/app' : '/signup'

  return (
    <main className="landing-page">
      <header className="hero-panel">
        <p className="hero-tag">Artist Flow</p>
        <h1>Where Venues Meet Performers, Professionally</h1>
        <p>
          A creative hiring platform for clubs, bars, and restaurants to post performance requirements and
          manage artist conversations in real time.
        </p>

        <div className="hero-actions">
          <Link to={appPath} className="button button-primary">
            Launch Platform <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="button button-secondary">
            Login
          </Link>
        </div>
      </header>

      <section className="feature-grid" aria-label="Platform highlights">
        {highlights.map(({ title, description, icon: Icon }) => (
          <article key={title} className="feature-card">
            <Icon size={20} />
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
