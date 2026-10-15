import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, errorMessage } from '../api'
import type { Category } from '../types'
import Modal from './Modal'

type Props = {
  categories: Category[]
  onChanged: () => void
}

export default function CategoriesPage({ categories, onChanged }: Props) {
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(category: Category) {
    if (!window.confirm(`¿Eliminar la categoría «${category.name}»?`)) return
    try {
      await api.deleteCategory(category.id)
      setError(null)
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <section>
      <div className="toolbar">
        <div className="grow" />
        <button type="button" className="btn primary" onClick={() => setEditing('new')}>
          Nueva categoría
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th className="num">Productos</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                </td>
                <td className="num">{c.productCount ?? 0}</td>
                <td className="row-actions">
                  <button type="button" className="btn small" onClick={() => setEditing(c)}>
                    Editar
                  </button>
                  <button type="button" className="btn small danger" onClick={() => handleDelete(c)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="empty">
                  Aún no hay categorías.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Nueva categoría' : 'Editar categoría'} onClose={() => setEditing(null)}>
          <CategoryForm
            category={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              setError(null)
              onChanged()
            }}
          />
        </Modal>
      )}
    </section>
  )
}

type FormProps = {
  category: Category | null
  onSaved: () => void
  onCancel: () => void
}

function CategoryForm({ category, onSaved, onCancel }: FormProps) {
  const [name, setName] = useState(category?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.saveCategory(category?.id ?? null, name.trim())
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form" noValidate>
      <label>
        Nombre
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
