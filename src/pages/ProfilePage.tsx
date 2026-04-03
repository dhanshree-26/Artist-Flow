import { BadgeCheck, Building2, Mail, Phone, Sparkles, UserRound } from 'lucide-react'
import { useAuth } from '../context/useAuth'

export const ProfilePage = () => {
  const { profile, user } = useAuth()

  if (!profile || !user) {
    return (
      <section className="surface-card">
        <h2>Profile loading</h2>
        <p>Your profile details are being fetched.</p>
      </section>
    )
  }

  return (
    <section className="surface-card profile-grid">
      <div className="profile-main">
        <p className="hero-tag">Account profile</p>
        <h2>{profile.stageOrVenueName}</h2>
        <p>{profile.about}</p>

        <div className="meta-grid compact">
          <p>
            <UserRound size={16} /> {profile.fullName}
          </p>
          <p>
            <Mail size={16} /> {profile.email}
          </p>
          <p>
            <Phone size={16} /> {profile.phone}
          </p>
          <p>
            <Building2 size={16} /> {profile.city}
          </p>
        </div>
      </div>

      <aside className="profile-side">
        <div className="stat-card">
          <BadgeCheck size={18} />
          <div>
            <h3>Verification status</h3>
            <p>{user.emailVerified ? 'Email verified and active' : 'Verification pending'}</p>
          </div>
        </div>

        <div className="stat-card">
          <Sparkles size={18} />
          <div>
            <h3>Role</h3>
            <p>{profile.role === 'venue' ? 'Venue / restaurant account' : 'Artist / performer account'}</p>
          </div>
        </div>
      </aside>
    </section>
  )
}
