import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Analytics() {
  return (
    <DashboardLayout pageTitle="Analytics">
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Analytics page content will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
