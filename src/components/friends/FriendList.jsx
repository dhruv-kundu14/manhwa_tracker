import React from 'react'
import FriendCard from './FriendCard.jsx'
import { Users } from 'lucide-react'

export default function FriendList({ friends = [] }) {
  if (friends.length === 0) {
    return (
      <div className="empty-state">
        <Users size={40} className="empty-state-icon" />
        <p className="empty-state-text">No friends yet. Find people to add!</p>
      </div>
    )
  }

  return (
    <div className="friends-grid">
      {friends.map((f) => <FriendCard key={f._id} friend={f} />)}
    </div>
  )
}
