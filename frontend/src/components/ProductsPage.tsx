import { useEffect, useState } from 'react'
import { api, errorMessage } from '../api'
import type { Category, Page, Product } from '../types'
import Modal from './Modal'
import ProductForm from './ProductForm'

const LIMIT = 10
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

type Props = {
  categories: Category[]
  onChanged: () => void
}

export default function ProductsPage({ categories, onChanged }: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const [result, setResult] = useState<Page<Product> | null>(null)
  const [loadedKey, setLoadedKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // La búsqueda espera 300 ms sin teclear antes de consultar la API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // "loading" se deriva: hay una consulta pendiente mientras el resultado
  // cargado no corresponde a los filtros actuales.
  const queryKey = JSON.stringify([search, categoryId, status, page, reloadKey])
  const loading = loadedKey !== queryKey

  useEffect(() => {
    let cancelled = false
    api
      .listProducts({ search, categoryId, isActive: status, page, limit: LIMIT })
      .then((r) => {
        if (cancelled) return
        setResult(r)
        setError(null)
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e))
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(queryKey)
      })
    return () => {
      cancelled = true
    }
  }, [search, categoryId, status, page, reloadKey, queryKey])

  function reload() {
    setReloadKey((k) => k + 1)
    onChanged()
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`¿Eliminar «${product.name}»? Esta acción no se puede deshacer.`)) return
    try {
      await api.deleteProduct(product.id)
      // Si era el único producto de la última página, se retrocede una página.
      if (result && result.data.length === 1 && page > 1) setPage(page - 1)
      reload()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setCategoryId('')
    setStatus('')
    setPage(1)
  }

  const hasFilters = searchInput !== '' || categoryId !== '' || status !== ''
  const products = result?.data ?? []

  return (
    <section>
      <div className="toolbar">
        <input
          type="search"
          className="grow"
          placeholder="Buscar por nombre o SKU…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Buscar productos"
        />
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            setPage(1)
          }}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          aria-label="Filtrar por estado"
        >
          <option value="">Activos e inactivos</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
        {hasFilters && (
          <button type="button" className="btn" onClick={clearFilters}>
            Limpiar
          </button>
        )}
        <button type="button" className="btn primary" onClick={() => setEditing('new')}>
          Nuevo producto
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className={`table-wrap${loading ? ' loading' : ''}`}>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th className="num">Precio</th>
              <th className="num">Stock</th>
              <th>Estado</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.sku}</td>
                <td>
                  <strong>{p.name}</strong>
                  {p.description && <div className="muted small">{p.description}</div>}
                </td>
                <td>{p.category?.name}</td>
                <td className="num">{money.format(p.price)}</td>
                <td className="num">
                  {p.stock === 0 ? <span className="badge danger">Sin stock</span> : p.stock}
                </td>
                <td>
                  <span className={`badge ${p.isActive ? 'ok' : 'off'}`}>{p.isActive ? 'Activo' : 'Inactivo'}</span>
                </td>
                <td className="row-actions">
                  <button type="button" className="btn small" onClick={() => setEditing(p)}>
                    Editar
                  </button>
                  <button type="button" className="btn small danger" onClick={() => handleDelete(p)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  {hasFilters ? 'Ningún producto coincide con los filtros.' : 'Aún no hay productos.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {result && result.total > 0 && (
        <div className="pager">
          <span className="muted">
            {result.total} producto{result.total === 1 ? '' : 's'} · página {result.page} de {result.totalPages}
          </span>
          <div>
            <button type="button" className="btn small" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <button
              type="button"
              className="btn small"
              disabled={page >= result.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Nuevo producto' : 'Editar producto'} onClose={() => setEditing(null)}>
          <ProductForm
            product={editing === 'new' ? null : editing}
            categories={categories}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              reload()
            }}
          />
        </Modal>
      )}
    </section>
  )
}
