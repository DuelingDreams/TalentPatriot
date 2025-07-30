
import React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { useLocation } from 'wouter'

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

export function Breadcrumbs() {
  const [location] = useLocation()
  
  const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
    const parts = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' }
    ]
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const href = '/' + parts.slice(0, i + 1).join('/')
      const isLast = i === parts.length - 1
      
      let label = part.charAt(0).toUpperCase() + part.slice(1)
      
      // Custom labels for specific routes
      switch (part) {
        case 'candidates':
          label = 'Candidates'
          break
        case 'clients':
          label = 'Clients'
          break
        case 'jobs':
          label = 'Jobs'
          break
        case 'pipeline':
          label = 'Pipeline'
          break
      }
      
      breadcrumbs.push({
        label,
        href: isLast ? undefined : href,
        current: isLast
      })
    }
    
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(location)

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Home className="w-4 h-4" />
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          {item.href ? (
            <a 
              href={item.href} 
              className="hover:text-[#264C99] transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className={item.current ? 'text-[#264C99] font-medium' : ''}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
