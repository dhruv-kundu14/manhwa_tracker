import React from 'react'
import Avatar from '../ui/Avatar.jsx'
import Button from '../ui/Button.jsx'
import { Check, X } from 'lucide-react'
import { useRespondRequest } from '../../hooks/useFriends.js'

export default function FriendRequests({ requests = [] }) {
  const { mutate: respond, isPending } = useRespondRequest()

  if (requests.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-text">No pending requests.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {requests.map((req) => (
        <div key={req._id} className="share-card">
          <Avatar username={req.requester?.username} src={req.requester?.avatar} size="md" />
          <div style={{ flex: 1 }}>
            <div className="share-title">
              <strong>{req.requester?.username}</strong> wants to be your friend
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="ghost" size="sm"
              style={{ color: 'var(--green)', borderColor: 'rgba(45,198,83,.3)' }}
              loading={isPending}
              onClick={() => respond({ userId: req.requester._id, action: 'accept' })}
            >
              <Check size={14} />
            </Button>
            <Button
              variant="ghost" size="sm"
              loading={isPending}
              onClick={() => respond({ userId: req.requester._id, action: 'reject' })}
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
