import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, errorMessage } from '../api'
import type { Category, Product } from '../types'

type Props = {
  product: Product | null
  categories: Category[]
  onSaved: () => void
  onCancel: () => void
}

export default function ProductForm({ product, categories, onSaved, onCancel }: Props) {
  const [name, setName] = useState(product?.name ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [stock, setStock] = useState(product ? String(product.stock) : '0')
  const [categoryId, setCategoryId] = useState(product ? String(product.categoryId) : '')
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mismas reglas que el backend; el servidor sigue siendo quien decide.
  function validate(): string | null {
    if (!name.trim()) return 'El nombre es obligatorio.'
    if (!sku.trim()) return 'El SKU es obligatorio.'
    if (!categoryId) return 'Selecciona una categoría.'
    if (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) <= 0) {
      return 'El precio debe ser mayor que 0 y tener hasta 2 decimales.'
    }
    if (!/^\d+$/.test(stock)) return 'El stock debe ser un entero mayor o igual a 0.'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.saveProduct(product?.id ?? null, {
        name: name.trim(),
        sku: sku.trim(),
        description: description.trim() || null,
        price: Number(price),
        stock: Number(stock),
        categoryId: Number(categoryId),
        isActive,
      })
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form" noValidate>
      {categories.length === 0 && (
        <p className="notice">Primero crea una categoría en la pestaña «Categorías».</p>
      )}

      <label>
        Nombre
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} autoFocus />
      </label>

      <div className="row">
        <label>
          SKU
          <input value={sku} onChange={(e) => setSku(e.target.value)} maxLength={100} />
        </label>
        <label>
          Categoría
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Selecciona…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="row">
        <label>
          Precio
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
        <label>
          Stock
          <input type="number" inputMode="numeric" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} />
        </label>
      </div>

      <label>
        Descripción <span className="muted">(opcional)</span>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <label className="check">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Producto activo
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
          {saving ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}
