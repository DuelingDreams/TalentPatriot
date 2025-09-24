import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SupportCenter } from '@/components/help/SupportCenter'

export default function Help() {
  return (
    <DashboardLayout pageTitle="Help & Support">
      <SupportCenter />
    </DashboardLayout>
  )
}