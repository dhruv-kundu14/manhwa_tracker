import React from 'react'
import { Users } from 'lucide-react'

export default function FriendsPage() {
  return (
    <div className="empty-state" style={{ marginTop: 60 }}>
      <Users size={52} className="empty-state-icon" />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>Friends — Coming Soon</div>
      <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 380, textAlign: 'center', lineHeight: 1.6 }}>
        Friends, sharing, and social features are being built.
        For now you can <strong style={{ color: 'var(--text)' }}>Export your library</strong> as JSON
        and share it with friends manually from the Dashboard.
      </p>
    </div>
  )
}
