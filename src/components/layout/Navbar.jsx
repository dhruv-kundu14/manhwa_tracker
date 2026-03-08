import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Search, Plus, Menu } from 'lucide-react'
import { useUiStore } from '../../store/uiStore.js'
import { useState } from 'react'

const PAGE_TITLES = {
  '/dashboard':     'Dashboard',
  '/library':       'My Library',
  '/discover':      'Discover',
  '/friends':       'Friends',
  '/notifications': 'Notifications',
  '/profile':       'Profile',
  '/settings':      'Settings',
}

export default function Navbar() {
  const navigate      = useNavigate()
  const location      = useLocation()
  const openModal     = useUiStore((s) => s.openModal)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const [search, setSearch] = useState('')

  const title = PAGE_TITLES[location.pathname] ?? 'Manhwa Tracker'

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/discover?q=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  return (
    <header className="topbar">
      <button className="icon-btn sidebar-toggle" onClick={toggleSidebar} title="Toggle sidebar">
        <Menu size={18} />
      </button>

      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-right">
        <div className="search-box">
          <Search size={15} color="var(--muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search library…"
          />
        </div>

        <button className="icon-btn" title="Add manhwa" onClick={() => openModal('addManhwa')}>
          <Plus size={17} />
        </button>

        <button className="icon-btn" title="Notifications" onClick={() => navigate('/notifications')}>
          <Bell size={17} />
          <span className="notif-dot" />
        </button>
      </div>
    </header>
  )
}
