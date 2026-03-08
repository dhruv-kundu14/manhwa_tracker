import React from 'react'
import { Bell } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <div className="empty-state" style={{ marginTop: 60 }}>
      <Bell size={52} className="empty-state-icon" />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>Notifications — Coming Soon</div>
      <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 380, textAlign: 'center', lineHeight: 1.6 }}>
        Notifications for friend requests and shared manhwa will be available once the backend is live.
      </p>
    </div>
  )
}
