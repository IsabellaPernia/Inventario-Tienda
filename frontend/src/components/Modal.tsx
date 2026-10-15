import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onClose}
      onClick={(e) => {
        // Un clic sobre el fondo (el propio <dialog>) cierra el modal.
        if (e.target === ref.current) ref.current?.close()
      }}
    >
      <header className="modal-header">
        <h2>{title}</h2>
        <button type="button" className="icon-btn" aria-label="Cerrar" onClick={() => ref.current?.close()}>
          ×
        </button>
      </header>
      {children}
    </dialog>
  )
}
