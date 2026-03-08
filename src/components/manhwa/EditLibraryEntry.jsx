import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import { useUpdateLibraryEntry, useRemoveFromLibrary } from '../../hooks/useLibrary.js'
import { useUiStore } from '../../store/uiStore.js'

const schema = z.object({
  readingStatus:  z.enum(['READING', 'WANT_TO_READ', 'COMPLETED', 'DROPPED']),
  currentChapter: z.coerce.number().min(0),
  rating:         z.coerce.number().min(1).max(10).optional().or(z.literal('')),
  notes:          z.string().max(500).optional(),
})

export default function EditLibraryEntry() {
  const closeModal = useUiStore((s) => s.closeModal)
  const entry      = useUiStore((s) => s.modalData)
  const { mutate: update, isPending }          = useUpdateLibraryEntry()
  const { mutate: remove, isPending: removing } = useRemoveFromLibrary()

  const manhwa = entry?.manhwa ?? {}

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      readingStatus:  entry?.readingStatus  ?? 'READING',
      currentChapter: entry?.currentChapter ?? 0,
      rating:         entry?.rating         ?? '',
      notes:          entry?.notes          ?? '',
    },
  })

  if (!entry) return null
  const status = watch('readingStatus')

  const onSubmit = (values) => {
    update({ entryId: entry._id, ...values }, { onSuccess: closeModal })
  }

  const onRemove = () => {
    remove(entry._id, { onSuccess: closeModal })
  }

  // cover gradient fallback
  let hue = 0
  const t = manhwa.title ?? ''
  for (let i = 0; i < t.length; i++) hue = (hue * 31 + t.charCodeAt(i)) % 360
  const coverBg = manhwa.coverUrl
    ? `url(${manhwa.coverUrl}) center/cover`
    : `linear-gradient(135deg,hsl(${hue},38%,12%),hsl(${(hue+50)%360},50%,20%))`

  return (
    <Modal
      title="Edit Entry"
      onClose={closeModal}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button variant="danger" loading={removing} onClick={onRemove}>Remove</Button>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button loading={isPending} onClick={handleSubmit(onSubmit)}>Save</Button>
          </div>
        </div>
      }
    >
      {/* Cover strip */}
      <div style={{
        height: 90, borderRadius: 8, marginBottom: 16,
        background: coverBg,
        display: 'flex', alignItems: 'flex-end', padding: '10px 14px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,.85),transparent)' }} />
        <span style={{ position: 'relative', zIndex: 1, fontFamily: 'var(--font-display)', fontSize: 20 }}>
          {manhwa.title}
        </span>
      </div>

      <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label className="field-label">Status</label>
          <select className="field-input" {...register('readingStatus')}>
            <option value="READING">Reading</option>
            <option value="WANT_TO_READ">Want to Read</option>
            <option value="COMPLETED">Completed</option>
            <option value="DROPPED">Dropped</option>
          </select>
        </div>

        {status !== 'WANT_TO_READ' && (
          <Input
            label="Current Chapter"
            type="number" min={0}
            error={errors.currentChapter?.message}
            {...register('currentChapter')}
          />
        )}

        <Input
          label="Rating (1–10)"
          type="number" min={1} max={10}
          placeholder="Rate it…"
          error={errors.rating?.message}
          {...register('rating')}
        />

        <div className="field">
          <label className="field-label">Notes</label>
          <textarea
            className="field-input" rows={3}
            placeholder="Your thoughts…"
            style={{ resize: 'vertical' }}
            {...register('notes')}
          />
        </div>
      </form>
    </Modal>
  )
}
