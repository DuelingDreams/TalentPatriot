import { useAuth } from '@/contexts/AuthContext'

// Define what each role can do
export interface RolePermissions {
  canCreateJobs: boolean
  canEditJobs: boolean
  canDeleteJobs: boolean
  canViewAllCandidates: boolean
  canEditCandidates: boolean
  canDeleteCandidates: boolean
  canViewAnalytics: boolean
  canViewAdvancedAnalytics: boolean
  canManageTeam: boolean
  canManageOrganization: boolean
  canExportData: boolean
  canImportData: boolean
  canManageIntegrations: boolean
  canViewAIInsights: boolean
  canScheduleInterviews: boolean
  canViewReports: boolean
  canManageClients: boolean
}

const rolePermissionsMap: Record<string, RolePermissions> = {
  admin: {
    canCreateJobs: true,
    canEditJobs: true,
    canDeleteJobs: true,
    canViewAllCandidates: true,
    canEditCandidates: true,
    canDeleteCandidates: true,
    canViewAnalytics: true,
    canViewAdvancedAnalytics: true,
    canManageTeam: true,
    canManageOrganization: true,
    canExportData: true,
    canImportData: true,
    canManageIntegrations: true,
    canViewAIInsights: true,
    canScheduleInterviews: true,
    canViewReports: true,
    canManageClients: true,
  },
  hiring_manager: {
    canCreateJobs: true,
    canEditJobs: true,
    canDeleteJobs: true,
    canViewAllCandidates: true,
    canEditCandidates: true,
    canDeleteCandidates: false, // Hiring managers can't permanently delete
    canViewAnalytics: true,
    canViewAdvancedAnalytics: true,
    canManageTeam: false,
    canManageOrganization: false,
    canExportData: true,
    canImportData: false,
    canManageIntegrations: false,
    canViewAIInsights: true,
    canScheduleInterviews: true,
    canViewReports: true,
    canManageClients: true,
  },
  recruiter: {
    canCreateJobs: true,
    canEditJobs: true,
    canDeleteJobs: false,
    canViewAllCandidates: true,
    canEditCandidates: true,
    canDeleteCandidates: false,
    canViewAnalytics: true,
    canViewAdvancedAnalytics: false, // Limited analytics access
    canManageTeam: false,
    canManageOrganization: false,
    canExportData: true,
    canImportData: false,
    canManageIntegrations: false,
    canViewAIInsights: true,
    canScheduleInterviews: true,
    canViewReports: false,
    canManageClients: false,
  },
  interviewer: {
    canCreateJobs: false,
    canEditJobs: false,
    canDeleteJobs: false,
    canViewAllCandidates: false, // Only candidates assigned to them
    canEditCandidates: false, // Can only add notes/feedback
    canDeleteCandidates: false,
    canViewAnalytics: false,
    canViewAdvancedAnalytics: false,
    canManageTeam: false,
    canManageOrganization: false,
    canExportData: false,
    canImportData: false,
    canManageIntegrations: false,
    canViewAIInsights: false,
    canScheduleInterviews: true, // Can schedule their own interviews
    canViewReports: false,
    canManageClients: false,
  },
  demo_viewer: {
    canCreateJobs: false,
    canEditJobs: false,
    canDeleteJobs: false,
    canViewAllCandidates: true,
    canEditCandidates: false,
    canDeleteCandidates: false,
    canViewAnalytics: true,
    canViewAdvancedAnalytics: false,
    canManageTeam: false,
    canManageOrganization: false,
    canExportData: false,
    canImportData: false,
    canManageIntegrations: false,
    canViewAIInsights: true,
    canScheduleInterviews: false,
    canViewReports: false,
    canManageClients: false,
  },
}

export function useRolePermissions(): RolePermissions {
  const { userRole } = useAuth()
  
  if (!userRole) {
    // Default permissions for unauthenticated users
    return {
      canCreateJobs: false,
      canEditJobs: false,
      canDeleteJobs: false,
      canViewAllCandidates: false,
      canEditCandidates: false,
      canDeleteCandidates: false,
      canViewAnalytics: false,
      canViewAdvancedAnalytics: false,
      canManageTeam: false,
      canManageOrganization: false,
      canExportData: false,
      canImportData: false,
      canManageIntegrations: false,
      canViewAIInsights: false,
      canScheduleInterviews: false,
      canViewReports: false,
      canManageClients: false,
    }
  }
  
  return rolePermissionsMap[userRole] || rolePermissionsMap.interviewer // Default to most restrictive
}

export function useCanAccess(permission: keyof RolePermissions): boolean {
  const permissions = useRolePermissions()
  return permissions[permission]
}