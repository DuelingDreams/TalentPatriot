import { supabase } from '../../lib/supabase';
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
import type { IAuthRepository } from './interface';

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

export class AuthRepository implements IAuthRepository {
  // User Profiles
  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    // Convert snake_case from database to camelCase for frontend
    return data ? toCamelCase(data) as UserProfile : undefined;
  }

  async createUserProfile(insertUserProfile: InsertUserProfile): Promise<UserProfile> {
    const { data, error} = await supabase
      .from('user_profiles')
      .insert(toSnakeCase(insertUserProfile))
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Convert snake_case from database to camelCase for frontend
    return toCamelCase(data) as UserProfile;
  }

  async updateUserProfile(id: string, userProfile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(toSnakeCase(userProfile))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Convert snake_case from database to camelCase for frontend
    return toCamelCase(data) as UserProfile;
  }

  async ensureUserProfile(userId: string): Promise<UserProfile> {
    // First try to get existing profile
    const existingProfile = await this.getUserProfile(userId);
    if (existingProfile) {
      return existingProfile;
    }

    // Create new profile if it doesn't exist
    const newProfile: InsertUserProfile = {
      id: userId,
      role: 'user',
    };

    return this.createUserProfile(newProfile);
  }

  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data as UserSettings;
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    // First try to update existing settings
    const { data: updateData, error: updateError } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single();

    if (!updateError) {
      return updateData as UserSettings;
    }

    // If no existing settings, create new ones
    if (updateError.code === 'PGRST116') {
      const newSettings = { userId, ...settings };
      const { data: insertData, error: insertError } = await supabase
        .from('user_settings')
        .insert(newSettings)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      return insertData as UserSettings;
    }

    throw new Error(updateError.message);
  }

  // Organizations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data as Organization;
  }

  async getOrganizations(ownerId?: string): Promise<Organization[]> {
    let query = supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Organization[];
  }

  async createOrganization(insertOrganization: InsertOrganization): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .insert(insertOrganization)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Organization;
  }

  async updateOrganization(id: string, organization: Partial<InsertOrganization>): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update(organization)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Organization;
  }

  async deleteOrganization(id: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  }

  // User Organizations
  async getUserOrganization(id: string): Promise<UserOrganization | undefined> {
    const { data, error } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data as UserOrganization;
  }

  async getUserOrganizations(userId?: string, orgId?: string): Promise<UserOrganization[]> {
    let query = supabase
      .from('user_organizations')
      .select('*')
      .order('joined_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (orgId) {
      query = query.eq('org_id', orgId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as UserOrganization[];
  }

  async getUserOrganizationsByUser(userId: string): Promise<UserOrganization[]> {
    const { data, error } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as UserOrganization[];
  }

  async getUserOrganizationsByOrg(orgId: string): Promise<UserOrganization[]> {
    const { data, error } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('org_id', orgId)
      .order('joined_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as UserOrganization[];
  }

  async createUserOrganization(insertUserOrganization: InsertUserOrganization): Promise<UserOrganization> {
    const { data, error } = await supabase
      .from('user_organizations')
      .insert(insertUserOrganization)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as UserOrganization;
  }

  async updateUserOrganization(id: string, userOrganization: Partial<InsertUserOrganization>): Promise<UserOrganization> {
    const { data, error } = await supabase
      .from('user_organizations')
      .update(userOrganization)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as UserOrganization;
  }

  async deleteUserOrganization(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_organizations')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  }

  async deleteUserOrganizationByUserAndOrg(userId: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('user_organizations')
      .delete()
      .eq('user_id', userId)
      .eq('org_id', orgId);
    
    if (error) {
      throw new Error(error.message);
    }
  }
}