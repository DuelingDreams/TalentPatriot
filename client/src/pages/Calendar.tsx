import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Calendar() {
  return (
    <DashboardLayout pageTitle="Calendar">
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Interview Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Calendar and scheduling page content will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}