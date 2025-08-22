import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HelpCenter } from '@/components/help/HelpCenter'

export default function Help() {
  return (
    <DashboardLayout pageTitle="Help Center">
      <HelpCenter />
    </DashboardLayout>
  )
}