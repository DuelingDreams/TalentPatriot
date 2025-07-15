import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopNavbar } from './TopNavbar'

interface DashboardLayoutProps {
  children: React.ReactNode
  pageTitle?: string
}

export function DashboardLayout({ children, pageTitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col lg:pl-0">
        <TopNavbar 
          onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={pageTitle}
        />
        
        <main className="flex-1 overflow-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}
