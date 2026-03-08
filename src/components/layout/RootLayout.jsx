import React from 'react'
import { Outlet } from 'react-router-dom'
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
  const modalData   = useUiStore((s) => s.modalData)
  const openModal   = useUiStore((s) => s.openModal)
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <Sidebar />

      <div className="app-main">
        <Navbar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* Global modals */}
      {activeModal === 'addManhwa'  && <AddManhwaForm />}
      {activeModal === 'editEntry'  && <EditLibraryEntry />}
      {activeModal === 'detail'     && <ManhwaDetailModal entry={modalData} onEdit={(e) => openModal('editEntry', e)} />}
      {activeModal === 'readOnline' && <ReadOnlineModal />}
      {activeModal === 'share'      && <ShareManhwaModal />}
    </div>
  )
}
