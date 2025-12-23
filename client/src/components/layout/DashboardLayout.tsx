import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopNavbar } from './TopNavbar'
import { SkipLink } from '../accessibility/SkipLink'

interface DashboardLayoutProps {
  children: React.ReactNode
  pageTitle?: string
}

export function DashboardLayout({ children, pageTitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-tp-page">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col lg:pl-0">
        <TopNavbar 
          onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={pageTitle}
        />
        
        <main 
          id="main-content" 
          className="flex-1 overflow-auto bg-tp-page"
          role="main"
          aria-label={pageTitle ? `${pageTitle} content` : 'Main content'}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
