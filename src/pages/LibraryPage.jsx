import React from 'react'
import { useState } from 'react'
import { useLibraryStore } from '../store/libraryStore.js'
import { useUiStore } from '../store/uiStore.js'
import ManhwaGrid from '../components/manhwa/ManhwaGrid.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Button from '../components/ui/Button.jsx'
import { Plus, Search } from 'lucide-react'

const TABS = [
  { id: 'READING',      label: 'Reading'   },
  { id: 'WANT_TO_READ', label: 'Wishlist'  },
  { id: 'COMPLETED',    label: 'Completed' },
  { id: 'DROPPED',      label: 'Dropped'   },
]

export default function LibraryPage() {
  const [tab,    setTab]    = useState('READING')
  const [search, setSearch] = useState('')
  const openModal = useUiStore((s) => s.openModal)
  const entries   = useLibraryStore((s) => s.entries)

  const counts = Object.fromEntries(
    TABS.map((t) => [t.id, entries.filter((e) => e.readingStatus === t.id).length])
  )

  const filtered = entries
    .filter((e) => e.readingStatus === tab)
    .filter((e) => !search || e.manhwa?.title?.toLowerCase().includes(search.toLowerCase()))

  const tabsWithCounts = TABS.map((t) => ({ ...t, count: counts[t.id] }))

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Tabs tabs={tabsWithCounts} active={tab} onChange={(t) => { setTab(t); setSearch('') }} />

        {/* Search within tab */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 12px', flex: 1, minWidth: 160, maxWidth: 280 }}>
          <Search size={14} color="var(--muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title…"
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, width: '100%' }}
          />
        </div>

        <Button size="sm" onClick={() => openModal('addManhwa')} style={{ marginLeft: 'auto' }}>
          <Plus size={14} /> Add
        </Button>
      </div>

      <ManhwaGrid
        entries={filtered}
        onCardClick={(entry) => openModal('detail', entry)}
        emptyMessage={
          search
            ? `No "${search}" found in ${TABS.find((t) => t.id === tab)?.label}.`
            : `Nothing in ${TABS.find((t) => t.id === tab)?.label} yet.`
        }
      />
    </>
  )
}
