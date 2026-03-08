import React from 'react'
import ManhwaCard from './ManhwaCard.jsx'
import { BookOpen } from 'lucide-react'

export default function ManhwaGrid({ entries = [], onCardClick, emptyMessage = 'Nothing here yet.' }) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <BookOpen size={40} className="empty-state-icon" />
        <p className="empty-state-text">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="manhwa-grid">
      {entries.map((entry) => (
        <ManhwaCard key={entry._id} entry={entry} onClick={onCardClick} />
      ))}
    </div>
  )
}
