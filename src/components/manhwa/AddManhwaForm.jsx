import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import { useAddToLibrary } from '../../hooks/useLibrary.js'
import { useUiStore } from '../../store/uiStore.js'

const schema = z.object({
  title:          z.string().min(1, 'Title is required'),
  readingStatus:  z.enum(['READING', 'WANT_TO_READ', 'COMPLETED', 'DROPPED']),
  currentChapter: z.coerce.number().min(0).optional(),
})

export default function AddManhwaForm() {
  const closeModal = useUiStore((s) => s.closeModal)
  const modalData  = useUiStore((s) => s.modalData)   // pre-filled from Discover
  const { mutate } = useAddToLibrary()

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title:          modalData?.title  ?? '',
      readingStatus:  'WANT_TO_READ',
      currentChapter: 0,
    },
  })

  const status = watch('readingStatus')

  const onSubmit = (values) => {
    // Merge form values with any extra metadata from Discover (coverUrl, genres, etc.)
    mutate({ ...modalData, ...values }, { onSuccess: closeModal })
  }

  return (
    <Modal
      title="Add Manhwa"
      onClose={closeModal}
      footer={
        <>
          <Button variant="ghost" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)}>Add to Library</Button>
        </>
      }
    >
      {/* Show cover preview if coming from Discover */}
      {modalData?.coverUrl && (
        <div style={{
          height: 80, borderRadius: 8, marginBottom: 16, overflow: 'hidden',
          background: `url(${modalData.coverUrl}) center/cover`,
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,.7),transparent)' }} />
          <div style={{ position: 'absolute', bottom: 8, left: 12, fontFamily: 'var(--font-display)', fontSize: 18, color: '#fff' }}>
            {modalData.title}
          </div>
        </div>
      )}

      <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Title"
          placeholder="e.g. Solo Leveling"
          error={errors.title?.message}
          {...register('title')}
        />

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
      </form>
    </Modal>
  )
}
