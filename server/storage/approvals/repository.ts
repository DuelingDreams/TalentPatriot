import { supabase } from '../../lib/supabase';
import type { IApprovalRepository } from './interface';
import type { ApprovalRequest, InsertApprovalRequest } from "@shared/schema";

export class ApprovalRepository implements IApprovalRepository {
  async getApprovalRequest(id: string): Promise<ApprovalRequest | undefined> {
    const { data, error } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data as ApprovalRequest;
  }

  async getApprovalRequestsByOrg(orgId: string, status?: string): Promise<ApprovalRequest[]> {
    let query = supabase
      .from('approval_requests')
      .select('*')
      .eq('org_id', orgId)
      .order('requested_at', { ascending: false });
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as ApprovalRequest[];
  }

  async getPendingApprovalCount(orgId: string): Promise<number> {
    const { count, error } = await supabase
      .from('approval_requests')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'pending');
    
    if (error) {
      throw new Error(error.message);
    }
    
    return count || 0;
  }

  async createApprovalRequest(data: InsertApprovalRequest): Promise<ApprovalRequest> {
    const { data: result, error } = await supabase
      .from('approval_requests')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return result as ApprovalRequest;
  }

  async updateApprovalRequest(id: string, data: Partial<InsertApprovalRequest>): Promise<ApprovalRequest> {
    const { data: result, error } = await supabase
      .from('approval_requests')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return result as ApprovalRequest;
  }

  async resolveApprovalRequest(
    id: string, 
    resolvedBy: string, 
    status: 'approved' | 'rejected', 
    notes?: string
  ): Promise<ApprovalRequest> {
    const { data: result, error } = await supabase
      .from('approval_requests')
      .update({
        status,
        resolved_by: resolvedBy,
        resolution_notes: notes,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return result as ApprovalRequest;
  }
}
