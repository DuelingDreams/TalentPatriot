import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { InterviewCalendar } from '@/components/calendar/InterviewCalendar'

export default function Calendar() {
  return (
    <DashboardLayout pageTitle="Calendar">
      <div className="p-6">
        <InterviewCalendar />
      </div>
    </DashboardLayout>
  )
}