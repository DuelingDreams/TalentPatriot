import { useState } from 'react'
import { DemoSidebar } from './DemoSidebar'
import { TopNavbar } from './TopNavbar'

interface DemoDashboardLayoutProps {
  children: React.ReactNode
  pageTitle?: string
}

export function DemoDashboardLayout({ children, pageTitle = "Demo" }: DemoDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <DemoSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main content */}
      <div className="lg:ml-72">
        {/* Top navigation */}
        <TopNavbar 
          onMobileMenuToggle={() => setSidebarOpen(true)}
          pageTitle={pageTitle}
        />
        
        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}