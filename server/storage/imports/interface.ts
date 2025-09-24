import type {
  DataImport,
  ImportRecord,
  InsertDataImport,
  InsertImportRecord
} from "@shared/schema";

// Imports domain repository interface
export interface IImportsRepository {
  // Data Import Management
  getDataImport(id: string): Promise<DataImport | undefined>;
  getDataImports(orgId: string): Promise<DataImport[]>;
  createDataImport(dataImport: InsertDataImport): Promise<DataImport>;
  updateDataImport(id: string, dataImport: Partial<InsertDataImport>): Promise<DataImport>;
  deleteDataImport(id: string): Promise<void>;
  
  // Import Records Management
  getImportRecord(id: string): Promise<ImportRecord | undefined>;
  getImportRecords(importId: string): Promise<ImportRecord[]>;
  createImportRecord(record: InsertImportRecord): Promise<ImportRecord>;
  updateImportRecord(id: string, record: Partial<InsertImportRecord>): Promise<ImportRecord>;
  getImportRecordsByStatus(importId: string, status: string): Promise<ImportRecord[]>;
}