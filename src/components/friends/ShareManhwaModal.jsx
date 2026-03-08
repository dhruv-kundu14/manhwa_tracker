import React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { useUiStore } from '../../store/uiStore.js'
import { useSendShare } from '../../hooks/useShares.js'
import { useLibrary } from '../../hooks/useLibrary.js'

export default function ShareManhwaModal() {
  const closeModal  = useUiStore((s) => s.closeModal)
  const modalData   = useUiStore((s) => s.modalData)   // { friendId, friendName }
  const { mutate: send, isPending } = useSendShare()
  const { data: library = [] } = useLibrary()

  const { register, handleSubmit } = useForm()

  const onSubmit = ({ manhwaId, message }) => {
    send({ manhwaId, sharedToId: modalData.friendId, message }, { onSuccess: closeModal })
  }

  return (
    <Modal
      title={`Share with ${modalData?.friendName}`}
      onClose={closeModal}
      footer={
        <>
          <Button variant="ghost" onClick={closeModal}>Cancel</Button>
          <Button loading={isPending} onClick={handleSubmit(onSubmit)}>Share</Button>
        </>
      }
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label className="field-label">Pick a Manhwa from your library</label>
          <select className="field-input" {...register('manhwaId', { required: true })}>
            <option value="">— Select —</option>
            {library.map((e) => (
              <option key={e._id} value={e.manhwa?._id ?? e._id}>
                {e.manhwa?.title ?? e.title}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label">Message (optional)</label>
          <textarea
            className="field-input"
            rows={3}
            placeholder="Why are you recommending this?"
            style={{ resize: 'vertical' }}
            {...register('message')}
          />
        </div>
      </form>
    </Modal>
  )
}
