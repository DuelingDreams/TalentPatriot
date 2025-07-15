import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Projects() {
  return (
    <DashboardLayout pageTitle="Projects">
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Projects page content will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
