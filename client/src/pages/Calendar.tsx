import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { InterviewCalendar } from '@/components/calendar/InterviewCalendar'
import { useAuth } from '@/contexts/AuthContext'
import { DemoCalendar } from '@/components/demo/DemoCalendar'

export default function Calendar() {
  const { userRole } = useAuth()
  
  // Show demo calendar for demo viewers
  if (userRole === 'demo_viewer') {
    return (
      <DashboardLayout pageTitle="Demo Calendar">
        <div className="p-6">
          <DemoCalendar />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Calendar">
      <div className="p-6">
        <InterviewCalendar />
      </div>
    </DashboardLayout>
  )
}