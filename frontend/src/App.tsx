import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from './api'
import CategoriesPage from './components/CategoriesPage'
import ProductsPage from './components/ProductsPage'
import type { Category } from './types'

type Tab = 'products' | 'categories'

export default function App() {
  const [tab, setTab] = useState<Tab>('products')
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  // Las categorías se comparten entre pestañas (filtro, formulario y conteos).
  useEffect(() => {
    let cancelled = false
    api
      .listCategories()
      .then((list) => {
        if (cancelled) return
        setCategories(list)
        setError(null)
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e))
      })
    return () => {
      cancelled = true
    }
  }, [version])

  const reloadCategories = useCallback(() => setVersion((v) => v + 1), [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Inventario</h1>
        <nav>
          <button type="button" className={tab === 'products' ? 'tab active' : 'tab'} onClick={() => setTab('products')}>
            Productos
          </button>
          <button
            type="button"
            className={tab === 'categories' ? 'tab active' : 'tab'}
            onClick={() => setTab('categories')}
          >
            Categorías
          </button>
        </nav>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <main>
        {tab === 'products' ? (
          <ProductsPage categories={categories} onChanged={reloadCategories} />
        ) : (
          <CategoriesPage categories={categories} onChanged={reloadCategories} />
        )}
      </main>
    </div>
  )
}
