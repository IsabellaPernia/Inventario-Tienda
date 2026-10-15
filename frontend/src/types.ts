export type Category = {
  id: number
  name: string
  productCount?: number
  createdAt: string
  updatedAt: string
}

export type Product = {
  id: number
  name: string
  sku: string
  description: string | null
  price: number
  stock: number
  categoryId: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  category?: Category
}

export type ProductInput = {
  name: string
  sku: string
  description: string | null
  price: number
  stock: number
  categoryId: number
  isActive: boolean
}

export type Page<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type ProductQuery = {
  search: string
  categoryId: string
  isActive: string
  page: number
  limit: number
}
