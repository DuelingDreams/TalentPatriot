import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Settings() {
  return (
    <DashboardLayout pageTitle="Settings">
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Settings page content will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
