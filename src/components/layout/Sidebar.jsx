import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Compass, Users, Bell, User, Settings, LogOut } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import { useAuthStore } from '../../store/authStore.js'
import { useLogout } from '../../hooks/useAuth.js'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/library', label: 'Library', Icon: BookOpen },
  { to: '/discover', label: 'Discover', Icon: Compass },
  { to: '/friends', label: 'Friends', Icon: Users },
  { to: '/notifications', label: 'Notifications', Icon: Bell, badge: true },
]

const BOTTOM_NAV = [
  { to: '/profile', label: 'Profile', Icon: User },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

export default function Sidebar({ className = '' }) {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout } = useLogout()

  return (
    <aside className={`sidebar ${className}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">M</div>
        <div className="logo-text">MAN<span>HWA</span></div>
      </div>

      {/* Main nav */}
      <nav className="sidebar-nav">
        {NAV.map(({ to, label, Icon, badge }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
            <Icon size={17} />
            <span>{label}</span>
            {badge && <span className="nav-badge">2</span>}
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom nav */}
      <nav className="sidebar-nav sidebar-nav--bottom">
        {BOTTOM_NAV.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button className="nav-item nav-item--logout" onClick={() => logout()}>
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </nav>

      {/* User chip */}
      <div className="sidebar-user">
        <Avatar username={user?.username} src={user?.avatar} size="sm" />
        <div>
          <div className="sidebar-user-name">{user?.username}</div>
          <div className="sidebar-user-sub">online</div>
        </div>
      </div>
    </aside>
  )
}