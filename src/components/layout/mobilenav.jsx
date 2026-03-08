import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Compass, User } from 'lucide-react'

const NAV = [
    { to: '/dashboard', label: 'Home', Icon: LayoutDashboard },
    { to: '/library', label: 'Library', Icon: BookOpen },
    { to: '/discover', label: 'Discover', Icon: Compass },
    { to: '/profile', label: 'Profile', Icon: User },
]

export default function MobileNav() {
    return (
        <nav className="mobile-bottom-nav">
            {NAV.map(({ to, label, Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                        `mobile-nav-item ${isActive ? 'mobile-nav-item--active' : ''}`
                    }
                >
                    <Icon size={20} />
                    {label}
                </NavLink>
            ))}
        </nav>
    )
}