import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HelpCenter } from '@/components/help/HelpCenter'

export default function Documentation() {
  return (
    <DashboardLayout pageTitle="Documentation">
      <HelpCenter />
    </DashboardLayout>
  )
}