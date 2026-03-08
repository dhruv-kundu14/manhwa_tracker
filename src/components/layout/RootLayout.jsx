import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'
import AddManhwaForm from '../manhwa/AddManhwaForm.jsx'
import EditLibraryEntry from '../manhwa/EditLibraryEntry.jsx'
import ManhwaDetailModal from '../manhwa/ManhwaDetailModal.jsx'
import ReadOnlineModal from '../manhwa/ReadOnlineModal.jsx'
import ShareManhwaModal from '../friends/ShareManhwaModal.jsx'
import { useUiStore } from '../../store/uiStore.js'
import './layout.css'

export default function RootLayout() {
  const activeModal = useUiStore((s) => s.activeModal)
  const modalData = useUiStore((s) => s.modalData)
  const openModal = useUiStore((s) => s.openModal)
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const location = useLocation()

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth <= 768 && sidebarOpen) {
      toggleSidebar()
    }
  }, [location.pathname])

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>

      {/* Mobile overlay behind sidebar */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay visible"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar className={sidebarOpen ? 'mobile-open' : ''} />

      <div className="app-main">
        <Navbar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* Global modals */}
      {activeModal === 'addManhwa' && <AddManhwaForm />}
      {activeModal === 'editEntry' && <EditLibraryEntry />}
      {activeModal === 'detail' && <ManhwaDetailModal entry={modalData} onEdit={(e) => openModal('editEntry', e)} />}
      {activeModal === 'readOnline' && <ReadOnlineModal />}
      {activeModal === 'share' && <ShareManhwaModal />}
    </div>
  )
}