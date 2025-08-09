import { getDemoToggleState } from '@/lib/demoToggle'

// Development-only demo toggle component
export const DemoToggleFooter = () => {
  // Only show in development builds
  if (!import.meta.env.DEV) return null
  
  const { isDemoEnabled: currentDemoState, toggle } = getDemoToggleState()
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggle}
        className="bg-slate-800 text-white px-3 py-1 rounded text-xs shadow-lg hover:bg-slate-700 transition-colors"
        title={`${currentDemoState ? 'Disable' : 'Enable'} demo mode`}
      >
        Demo: {currentDemoState ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}