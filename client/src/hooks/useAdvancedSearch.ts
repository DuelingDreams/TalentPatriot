
import { useState, useMemo, useCallback } from 'react'
import { useDebounce } from './useDebounce'

interface SearchFilters {
  [key: string]: any
}

interface UseAdvancedSearchOptions<T> {
  data: T[]
  searchFields: (keyof T)[]
  filterFields?: (keyof T)[]
}

export function useAdvancedSearch<T extends Record<string, any>>({
  data,
  searchFields,
  filterFields = []
}: UseAdvancedSearchOptions<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [sortBy, setSortBy] = useState<keyof T | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const filteredAndSortedData = useMemo(() => {
    let result = [...data]

    // Apply text search
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field]
          return value && String(value).toLowerCase().includes(searchLower)
        })
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter(item => {
          const itemValue = item[field]
          if (Array.isArray(value)) {
            return value.includes(itemValue)
          }
          return itemValue === value
        })
      }
    })

    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        const aValue = a[sortBy]
        const bValue = b[sortBy]
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, debouncedSearchTerm, filters, sortBy, sortOrder, searchFields])

  const setFilter = useCallback((field: keyof T, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setSearchTerm('')
  }, [])

  const toggleSort = useCallback((field: keyof T) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }, [sortBy])

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    sortBy,
    sortOrder,
    toggleSort,
    filteredData: filteredAndSortedData,
    hasActiveFilters: Object.keys(filters).length > 0 || searchTerm.length > 0
  }
}
