import React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'

interface VirtualizedListProps<T> {
  items: T[]
  estimateSize: (index: number) => number
  renderItem: (item: T, index: number) => React.ReactNode
  containerHeight: number
  containerClassName?: string
  itemClassName?: string
  overscan?: number
  getItemKey: (item: T, index: number) => string | number // Required for stable keys
  onScroll?: (scrollTop: number) => void
  measurementEnabled?: boolean // For dynamic height measurement
  itemSpacing?: number // CSS-based spacing instead of gap
}

export function VirtualizedList<T>({
  items,
  estimateSize,
  renderItem,
  containerHeight,
  containerClassName,
  itemClassName,
  overscan = 5,
  getItemKey,
  onScroll,
  measurementEnabled = false,
  itemSpacing = 0
}: VirtualizedListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan
    // Removed gap option for better compatibility - spacing handled via CSS
  })

  React.useEffect(() => {
    if (onScroll) {
      const element = parentRef.current
      if (element) {
        const handleScrollEvent = () => onScroll(element.scrollTop)
        element.addEventListener('scroll', handleScrollEvent)
        return () => element.removeEventListener('scroll', handleScrollEvent)
      }
    }
  }, [onScroll])

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div
      ref={parentRef}
      className={cn('h-full overflow-auto', containerClassName)}
      style={{
        height: containerHeight
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualItems.map(virtualItem => {
          const item = items[virtualItem.index]
          const key = getItemKey(item, virtualItem.index) // Always use provided key function
          
          return (
            <div
              key={key}
              ref={measurementEnabled ? virtualizer.measureElement : undefined}
              className={cn('absolute top-0 left-0 w-full', itemClassName)}
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                // Add spacing via padding if itemSpacing was specified
                paddingBottom: itemSpacing > 0 ? `${itemSpacing}px` : undefined
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}