import React from 'react'
/**
 * size: 'sm' (28px) | 'md' (36px) | 'lg' (44px) | 'xl' (60px)
 */
const SIZE_MAP = { sm: 28, md: 36, lg: 44, xl: 60 }
const FONT_MAP = { sm: 10,  md: 13, lg: 15, xl: 20 }

// Deterministic hue from string
function strToHue(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360
  return h
}

export default function Avatar({ username = '', src, size = 'md', className = '' }) {
  const px   = SIZE_MAP[size] ?? 36
  const fs   = FONT_MAP[size] ?? 13
  const hue  = strToHue(username)
  const initials = username.slice(0, 2).toUpperCase()

  const style = {
    width:          px,
    height:         px,
    borderRadius:   '50%',
    flexShrink:     0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       fs,
    fontWeight:     700,
    fontFamily:     'var(--font-mono)',
    background:     src ? 'transparent' : `hsl(${hue}, 55%, 32%)`,
    color:          '#fff',
    overflow:       'hidden',
  }

  return (
    <div style={style} className={className}>
      {src ? <img src={src} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </div>
  )
}
