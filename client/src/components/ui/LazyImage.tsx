import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Default placeholder: 40x40 gray rectangle in base64 SVG format
const DEFAULT_PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNmMWYxZjEiLz48L3N2Zz4="

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  className?: string
  fallback?: React.ReactNode
  // Loading behavior options
  rootMargin?: string
  threshold?: number
  // Loading state customization
  loadingOpacity?: number
  loadedOpacity?: number
  transitionDuration?: string
  // Error handling
  onLoadStart?: () => void
  onLoadEnd?: () => void
  onError?: () => void
  // Additional image types support
  variant?: 'avatar' | 'logo' | 'document' | 'banner' | 'thumbnail' | 'default'
}

export function LazyImage({ 
  src, 
  alt, 
  placeholder = DEFAULT_PLACEHOLDER,
  className,
  fallback,
  rootMargin = '100px',
  threshold = 0.01,
  loadingOpacity = 0.3,
  loadedOpacity = 1,
  transitionDuration = '300ms',
  onLoadStart,
  onLoadEnd,
  onError,
  variant = 'default',
  ...props 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const imgRef = useRef<HTMLImageElement>(null)

  // Set up Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [rootMargin, threshold])

  // Load image when in view
  useEffect(() => {
    if (isInView && src) {
      onLoadStart?.()
      
      const img = new Image()
      img.src = src
      
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
        setIsError(false)
        onLoadEnd?.()
      }
      
      img.onerror = () => {
        setIsError(true)
        setIsLoaded(false)
        onError?.()
      }
    }
  }, [isInView, src, onLoadStart, onLoadEnd, onError])

  // Handle direct load events
  const handleLoad = () => {
    setIsLoaded(true)
    setIsError(false)
    onLoadEnd?.()
  }

  const handleError = () => {
    setIsError(true)
    setIsLoaded(false)
    onError?.()
  }

  // Return fallback component if error and fallback is provided
  if (isError && fallback) {
    return <>{fallback}</>
  }

  // Variant-specific classes
  const variantClasses = {
    avatar: 'rounded-full object-cover',
    logo: 'object-contain',
    document: 'object-contain bg-gray-50',
    banner: 'object-cover w-full',
    thumbnail: 'object-cover rounded',
    default: ''
  }

  return (
    <img
      ref={imgRef}
      src={isInView ? imageSrc : placeholder}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        'transition-opacity',
        variantClasses[variant],
        isLoaded ? `opacity-${Math.round(loadedOpacity * 100)}` : `opacity-${Math.round(loadingOpacity * 100)}`,
        className
      )}
      style={{
        transitionDuration,
        opacity: isLoaded ? loadedOpacity : loadingOpacity,
        ...props.style
      }}
      data-testid={`lazy-image-${variant}`}
      {...props}
    />
  )
}

// Convenience components for common use cases
export function LazyAvatar(props: Omit<LazyImageProps, 'variant'>) {
  return <LazyImage {...props} variant="avatar" />
}

export function LazyLogo(props: Omit<LazyImageProps, 'variant'>) {
  return <LazyImage {...props} variant="logo" />
}

export function LazyThumbnail(props: Omit<LazyImageProps, 'variant'>) {
  return <LazyImage {...props} variant="thumbnail" />
}

export function LazyBanner(props: Omit<LazyImageProps, 'variant'>) {
  return <LazyImage {...props} variant="banner" />
}

// Default export for backward compatibility
export default LazyImage