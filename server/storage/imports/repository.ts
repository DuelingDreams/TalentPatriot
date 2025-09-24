import { supabase } from '../../lib/supabase';
import type { IImportsRepository } from './interface';
import type {
  DataImport,
  ImportRecord,
  InsertDataImport,
  InsertImportRecord
} from "@shared/schema";

export class ImportsRepository implements IImportsRepository {
  async getDataImport(id: string): Promise<DataImport | undefined> {
    const { data, error } = await supabase
      .from('data_imports')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data as DataImport;
  }

  async getDataImports(orgId: string): Promise<DataImport[]> {
    const { data, error } = await supabase
      .from('data_imports')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as DataImport[];
  }

  async createDataImport(insertDataImport: InsertDataImport): Promise<DataImport> {
    const { data, error } = await supabase
      .from('data_imports')
      .insert(insertDataImport)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as DataImport;
  }

  async updateDataImport(id: string, dataImport: Partial<InsertDataImport>): Promise<DataImport> {
    const { data, error } = await supabase
      .from('data_imports')
      .update(dataImport)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as DataImport;
  }

  async deleteDataImport(id: string): Promise<void> {
    const { error } = await supabase
      .from('data_imports')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  }

  async getImportRecord(id: string): Promise<ImportRecord | undefined> {
    const { data, error } = await supabase
      .from('import_records')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data as ImportRecord;
  }

  async getImportRecords(importId: string): Promise<ImportRecord[]> {
    const { data, error } = await supabase
      .from('import_records')
      .select('*')
      .eq('import_id', importId)
      .order('row_number', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as ImportRecord[];
  }

  async createImportRecord(insertRecord: InsertImportRecord): Promise<ImportRecord> {
    const { data, error } = await supabase
      .from('import_records')
      .insert(insertRecord)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as ImportRecord;
  }

  async updateImportRecord(id: string, record: Partial<InsertImportRecord>): Promise<ImportRecord> {
    const { data, error } = await supabase
      .from('import_records')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as ImportRecord;
  }

  async getImportRecordsByStatus(importId: string, status: string): Promise<ImportRecord[]> {
    const { data, error } = await supabase
      .from('import_records')
      .select('*')
      .eq('import_id', importId)
      .eq('status', status)
      .order('row_number', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as ImportRecord[];
  }
}