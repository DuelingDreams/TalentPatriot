import { createClient } from '@supabase/supabase-js';
import type { IBetaRepository } from './interface';
import type {
  BetaApplication,
  InsertBetaApplication
} from "@shared/schema";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'public' },
  global: { headers: { 'x-client-info': 'ats-backend@1.0.0' } },
});

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
    
    return data as BetaApplication;
  }

  async getBetaApplications(): Promise<BetaApplication[]> {
    const { data, error } = await supabase
      .from('beta_applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as BetaApplication[];
  }

  async createBetaApplication(insertBetaApplication: InsertBetaApplication): Promise<BetaApplication> {
    const { data, error } = await supabase
      .from('beta_applications')
      .insert(insertBetaApplication)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as BetaApplication;
  }

  async updateBetaApplication(id: string, betaApplication: Partial<InsertBetaApplication>): Promise<BetaApplication> {
    const { data, error } = await supabase
      .from('beta_applications')
      .update(betaApplication)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as BetaApplication;
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