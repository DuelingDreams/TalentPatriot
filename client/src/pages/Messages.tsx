import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Messages() {
  return (
    <DashboardLayout pageTitle="Messages">
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Messages & Communication</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Messages and communication page content will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}