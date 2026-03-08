import React from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../ui/Avatar.jsx'
import Button from '../ui/Button.jsx'
import { Eye, Share2, UserMinus } from 'lucide-react'
import { useRemoveFriend } from '../../hooks/useFriends.js'
import { useUiStore } from '../../store/uiStore.js'

export default function FriendCard({ friend }) {
  const navigate    = useNavigate()
  const openModal   = useUiStore((s) => s.openModal)
  const { mutate: remove, isPending } = useRemoveFriend()

  return (
    <div className="friend-card">
      <div className="friend-card-header">
        <Avatar username={friend.username} src={friend.avatar} size="lg" />
        <div className="friend-card-info">
          <div className="friend-name">{friend.username}</div>
          <div className="friend-sub">{friend.totalRead ?? 0} manhwas read</div>
        </div>
      </div>

      {friend.currentlyReading && (
        <div className="friend-activity">
          <span className="activity-dot" />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            Reading <strong style={{ color: 'var(--text)' }}>{friend.currentlyReading}</strong>
          </span>
        </div>
      )}

      <div className="friend-card-actions">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/friends/${friend._id}`)}>
          <Eye size={14} /> View List
        </Button>
        <Button variant="ghost" size="sm" onClick={() => openModal('share', { friendId: friend._id, friendName: friend.username })}>
          <Share2 size={14} /> Share
        </Button>
        <Button variant="ghost" size="sm" loading={isPending} onClick={() => remove(friend._id)}>
          <UserMinus size={14} />
        </Button>
      </div>
    </div>
  )
}
