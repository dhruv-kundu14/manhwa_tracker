import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../store/authStore.js'
import { useLibraryStore } from '../store/libraryStore.js'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  username: z.string().min(3, 'Min 3 characters').max(20, 'Max 20 characters'),
  bio:      z.string().max(200).optional(),
})

export default function SettingsPage() {
  const user       = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const entries    = useLibraryStore((s) => s.entries)
  const importLibrary = useLibraryStore((s) => s.importLibrary)
  const exportLibrary = useLibraryStore((s) => s.exportLibrary)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: user?.username ?? '', bio: user?.bio ?? '' },
  })

  const onSave = (values) => {
    updateUser(values)
    toast.success('Profile updated!')
  }

  const handleClear = () => {
    if (confirm('Clear your entire library? This cannot be undone.')) {
      localStorage.removeItem('manhwa_library')
      window.location.reload()
    }
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = importLibrary(ev.target.result)
      if (result.ok) toast.success(`Imported ${result.count} entries!`)
      else toast.error(result.message ?? 'Import failed')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div style={{ maxWidth: 560 }}>

      {/* Profile */}
      <div className="section-block">
        <div className="section-header"><div className="section-title">Profile</div></div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Username" error={errors.username?.message} {...register('username')} />
          <div className="field">
            <label className="field-label">Bio</label>
            <textarea className="field-input" rows={3} style={{ resize: 'vertical' }} placeholder="Tell us about yourself…" {...register('bio')} />
          </div>
          <Button onClick={handleSubmit(onSave)} style={{ alignSelf: 'flex-end' }}>
            Save Profile
          </Button>
        </div>
      </div>

      {/* Data */}
      <div className="section-block">
        <div className="section-header"><div className="section-title">Library Data</div></div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Your library has <strong style={{ color: 'var(--text)' }}>{entries.length} entries</strong> stored in this browser.
            Export to back it up or move to another device.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="outline" size="sm" onClick={exportLibrary}>⬇ Export JSON</Button>
            <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⬆ Import JSON
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            </label>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="section-block">
        <div className="section-header">
          <div className="section-title" style={{ color: 'var(--accent)' }}>Danger Zone</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid rgba(233,69,96,.2)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
            Permanently delete all your library data from this browser.
          </p>
          <Button variant="danger" onClick={handleClear}>Clear All Data</Button>
        </div>
      </div>

    </div>
  )
}
