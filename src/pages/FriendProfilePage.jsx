import React from 'react'
import { Users } from 'lucide-react'

export default function FriendProfilePage() {
  return (
    <div className="empty-state" style={{ marginTop: 60 }}>
      <Users size={52} className="empty-state-icon" />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>Friend Profiles — Coming Soon</div>
      <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 380, textAlign: 'center', lineHeight: 1.6 }}>
        Friend profiles will be available once the backend is live.
      </p>
    </div>
  )
}
