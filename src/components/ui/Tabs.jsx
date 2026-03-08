import React from 'react'
/**
 * tabs: [{ id, label, count? }]
 * active: string (id of active tab)
 * onChange: (id) => void
 */
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`tab ${active === t.id ? 'tab--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="tab-count">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
