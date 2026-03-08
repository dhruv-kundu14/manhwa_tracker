import React from 'react'
const CONFIG = {
  READING:      { label: 'Reading',       color: '#00b4d8', bg: 'rgba(0,180,216,0.12)'  },
  WANT_TO_READ: { label: 'Want to Read',  color: '#f5a623', bg: 'rgba(245,166,35,0.12)' },
  COMPLETED:    { label: 'Completed',     color: '#2dc653', bg: 'rgba(45,198,83,0.12)'  },
  DROPPED:      { label: 'Dropped',       color: '#e94560', bg: 'rgba(233,69,96,0.12)'  },
}

export default function StatusBadge({ status, small = false }) {
  const cfg = CONFIG[status] ?? CONFIG.WANT_TO_READ
  return (
    <span
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        padding:        small ? '2px 8px' : '3px 10px',
        borderRadius:   20,
        fontSize:       small ? 10 : 11,
        fontFamily:     'var(--font-mono)',
        fontWeight:     500,
        color:          cfg.color,
        background:     cfg.bg,
        border:         `1px solid ${cfg.color}33`,
        whiteSpace:     'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}
