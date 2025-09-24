import type {
  UserProfile,
  UserSettings,
  Organization,
  UserOrganization,
  InsertUserProfile,
  InsertUserSettings,
  InsertOrganization,
  InsertUserOrganization
} from "@shared/schema";

// Auth domain repository interface
export interface IAuthRepository {
  // User Profiles
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  createUserProfile(userProfile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(id: string, userProfile: Partial<InsertUserProfile>): Promise<UserProfile>;
  ensureUserProfile(userId: string): Promise<UserProfile>;
  
  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizations(ownerId?: string): Promise<Organization[]>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, organization: Partial<InsertOrganization>): Promise<Organization>;
  deleteOrganization(id: string): Promise<void>;
  
  // User Organizations
  getUserOrganization(id: string): Promise<UserOrganization | undefined>;
  getUserOrganizations(userId?: string, orgId?: string): Promise<UserOrganization[]>;
  getUserOrganizationsByUser(userId: string): Promise<UserOrganization[]>;
  getUserOrganizationsByOrg(orgId: string): Promise<UserOrganization[]>;
  createUserOrganization(userOrganization: InsertUserOrganization): Promise<UserOrganization>;
  updateUserOrganization(id: string, userOrganization: Partial<InsertUserOrganization>): Promise<UserOrganization>;
  deleteUserOrganization(id: string): Promise<void>;
  deleteUserOrganizationByUserAndOrg(userId: string, orgId: string): Promise<void>;
}