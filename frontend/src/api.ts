import type { Category, Page, Product, ProductInput, ProductQuery } from './types'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.')
  }

  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const body = await res.json()
      message = Array.isArray(body.message) ? body.message.join('. ') : (body.message ?? message)
    } catch {
      // La respuesta de error no era JSON; se deja el mensaje por defecto.
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado'
}

export const api = {
  listProducts(query: ProductQuery) {
    const params = new URLSearchParams()
    if (query.search) params.set('search', query.search)
    if (query.categoryId) params.set('categoryId', query.categoryId)
    if (query.isActive) params.set('isActive', query.isActive)
    params.set('page', String(query.page))
    params.set('limit', String(query.limit))
    return request<Page<Product>>(`/products?${params}`)
  },

  saveProduct(id: number | null, input: ProductInput) {
    return id === null
      ? request<Product>('/products', { method: 'POST', body: JSON.stringify(input) })
      : request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
  },

  deleteProduct(id: number) {
    return request<void>(`/products/${id}`, { method: 'DELETE' })
  },

  listCategories() {
    return request<Category[]>('/categories')
  },

  saveCategory(id: number | null, name: string) {
    return id === null
      ? request<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) })
      : request<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) })
  },

  deleteCategory(id: number) {
    return request<void>(`/categories/${id}`, { method: 'DELETE' })
  },
}
