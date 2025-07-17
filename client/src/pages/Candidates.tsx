import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { DemoCandidates } from '@/components/demo/DemoCandidates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function Candidates() {
  const { userRole } = useAuth()
  
  // Show demo candidates view for demo viewers
  if (userRole === 'demo_viewer') {
    return (
      <DashboardLayout pageTitle="Demo Candidates">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Candidate Database</h1>
            <p className="text-slate-600 mt-1">Browse our demo talent pool</p>
          </div>
          <DemoCandidates />
        </div>
      </DashboardLayout>
    )
  }
  
  // Regular candidates view for authenticated users
  return (
    <DashboardLayout pageTitle="Candidates">
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="w-5 h-5" />
            <CardTitle>Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Candidate management features coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}