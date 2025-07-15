import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Users() {
  return (
    <DashboardLayout pageTitle="Users">
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Users Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Users page content will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
