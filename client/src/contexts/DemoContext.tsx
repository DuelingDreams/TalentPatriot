import { createContext, useContext, ReactNode } from 'react'

interface DemoContextType {
  isDemoMode: boolean
  demoUser: {
    id: string
    email: string
    name: string
    role: string
  }
}

const DemoContext = createContext<DemoContextType | null>(null)

interface DemoProviderProps {
  children: ReactNode
}

export function DemoProvider({ children }: DemoProviderProps) {
  const demoUser = {
    id: 'cd99579b-1b80-4802-9651-e881fb707583',
    email: 'demo@yourapp.com',
    name: 'Demo User',
    role: 'demo_viewer'
  }

  const value: DemoContextType = {
    isDemoMode: true,
    demoUser
  }

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider')
  }
  return context
}