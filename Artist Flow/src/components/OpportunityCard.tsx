import { Calendar, Clock3, IndianRupee, MapPin, Mic2 } from 'lucide-react'
import { formatEventDate, isUrgentDate } from '../lib/date'
import type { Opportunity } from '../types'

interface OpportunityCardProps {
  opportunity: Opportunity
  canConnect: boolean
  alreadyConnected: boolean
  onConnect: (opportunity: Opportunity) => Promise<void>
  isOwner: boolean
  onEdit?: (opportunity: Opportunity) => void
  onDelete?: (opportunity: Opportunity) => Promise<void>
  isDeleting?: boolean
}

export const OpportunityCard = ({
  opportunity,
  canConnect,
  alreadyConnected,
  onConnect,
  isOwner,
  onEdit,
  onDelete,
  isDeleting = false,
}: OpportunityCardProps) => {
  const urgent = isUrgentDate(opportunity.eventDate)

  return (
    <article className="opportunity-card">
      <div className="opportunity-card__head">
        <div>
          <p className="kicker">{opportunity.venueName}</p>
          <h3>{opportunity.title}</h3>
        </div>
        <div className="pill-row">
          <span className="pill">{opportunity.genre}</span>
          {urgent && <span className="pill pill-danger">Urgent</span>}
        </div>
      </div>

      <div className="meta-grid">
        <p>
          <Calendar size={16} /> {formatEventDate(opportunity.eventDate)}
        </p>
        <p>
          <Clock3 size={16} /> {opportunity.eventTime}
        </p>
        <p>
          <MapPin size={16} /> {opportunity.city}
        </p>
        <p>
          <IndianRupee size={16} /> {opportunity.budget}
        </p>
      </div>

      <p className="description">{opportunity.description}</p>

      <div className="opportunity-card__footer">
        <p>
          <Mic2 size={16} /> Looking for artists on this date
        </p>

        {canConnect && (
          <button
            type="button"
            className="button button-primary"
            disabled={alreadyConnected}
            onClick={() => void onConnect(opportunity)}
          >
            {alreadyConnected ? 'Connected' : 'Connect & Chat'}
          </button>
        )}

        {isOwner && (
          <div className="owner-actions">
            <span className="pill">Your posting</span>
            {onEdit && (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => onEdit(opportunity)}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="button button-danger"
                onClick={() => void onDelete(opportunity)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
