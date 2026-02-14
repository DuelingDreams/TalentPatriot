import { supabase } from '../../lib/supabase';
import type { OfferLetter, InsertOfferLetter } from "@shared/schema";
import type { IOfferLettersRepository } from './interface';
import { toCamelCase } from '@shared/utils/caseConversion';

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

export class OfferLettersRepository implements IOfferLettersRepository {
  async getOfferLetter(id: string): Promise<OfferLetter | undefined> {
    const { data, error } = await supabase
      .from('offer_letters')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return toCamelCase(data) as OfferLetter;
  }

  async getOfferLettersByOrg(orgId: string): Promise<OfferLetter[]> {
    const { data, error } = await supabase
      .from('offer_letters')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => toCamelCase(row) as OfferLetter);
  }

  async getOfferLettersByJob(jobId: string): Promise<OfferLetter[]> {
    const { data, error } = await supabase
      .from('offer_letters')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => toCamelCase(row) as OfferLetter);
  }

  async getOfferLettersByCandidate(candidateId: string): Promise<OfferLetter[]> {
    const { data, error } = await supabase
      .from('offer_letters')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => toCamelCase(row) as OfferLetter);
  }

  async getOfferLettersByClient(clientId: string): Promise<OfferLetter[]> {
    const { data, error } = await supabase
      .from('offer_letters')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => toCamelCase(row) as OfferLetter);
  }

  async getAcceptedOfferLettersByOrg(orgId: string): Promise<OfferLetter[]> {
    const { data, error } = await supabase
      .from('offer_letters')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => toCamelCase(row) as OfferLetter);
  }

  async createOfferLetter(insertData: InsertOfferLetter): Promise<OfferLetter> {
    const snakeData = toSnakeCase(insertData as Record<string, any>);
    const { data, error } = await supabase
      .from('offer_letters')
      .insert(snakeData)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data) as OfferLetter;
  }

  async updateOfferLetter(id: string, updateData: Partial<InsertOfferLetter>): Promise<OfferLetter> {
    const snakeData = toSnakeCase(updateData as Record<string, any>);
    const { data, error } = await supabase
      .from('offer_letters')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data) as OfferLetter;
  }

  async deleteOfferLetter(id: string): Promise<void> {
    const { error } = await supabase
      .from('offer_letters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
