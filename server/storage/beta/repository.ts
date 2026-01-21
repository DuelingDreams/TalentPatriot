import { supabase } from '../../lib/supabase';
import type { IBetaRepository } from './interface';
import type {
  BetaApplication,
  InsertBetaApplication
} from "@shared/schema";
import { toSnakeCase, toCamelCase } from "@shared/utils/caseConversion";

export class BetaRepository implements IBetaRepository {
  async getBetaApplication(id: string): Promise<BetaApplication | undefined> {
    const { data, error } = await supabase
      .from('beta_applications')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    // Convert snake_case response to camelCase
    return toCamelCase(data) as BetaApplication;
  }

  async getBetaApplications(): Promise<BetaApplication[]> {
    const { data, error } = await supabase
      .from('beta_applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Convert snake_case response to camelCase
    return (data || []).map(item => toCamelCase(item)) as BetaApplication[];
  }

  async createBetaApplication(insertBetaApplication: InsertBetaApplication): Promise<BetaApplication> {
    // Convert camelCase to snake_case for Supabase
    const snakeCaseData = toSnakeCase(insertBetaApplication);
    
    const { data, error } = await supabase
      .from('beta_applications')
      .insert(snakeCaseData)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Convert snake_case response back to camelCase
    return toCamelCase(data) as BetaApplication;
  }

  async updateBetaApplication(id: string, betaApplication: Partial<InsertBetaApplication>): Promise<BetaApplication> {
    // Convert camelCase to snake_case for Supabase
    const snakeCaseData = toSnakeCase(betaApplication);
    
    const { data, error } = await supabase
      .from('beta_applications')
      .update(snakeCaseData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Convert snake_case response back to camelCase
    return toCamelCase(data) as BetaApplication;
  }

  async deleteBetaApplication(id: string): Promise<void> {
    const { error } = await supabase
      .from('beta_applications')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  }
}