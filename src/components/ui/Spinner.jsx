import React from 'react'
export default function Spinner({ size = 24, color = 'var(--accent)' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M12 2 a10 10 0 0 1 10 10" />
    </svg>
  )
}

// Full-page centered loading state
export function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner size={36} />
    </div>
  )
}
