import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { storage } from '../storage';
import { 
  insertCandidateSchema, 
  insertJobSchema,
  type InsertCandidate,
  type InsertJob,
  type DataImport,
  type ImportRecord 
} from '../../shared/schema';

// CSV/Excel parsing service for data imports
export class ImportService {
  // Define field mappings for candidates
  private static readonly CANDIDATE_FIELD_MAPPINGS: Record<string, string> = {
    'first_name': 'firstName',
    'firstname': 'firstName',
    'first name': 'firstName',
    'last_name': 'lastName',
    'lastname': 'lastName',
    'last name': 'lastName',
    'email': 'email',
    'email_address': 'email',
    'email address': 'email',
    'phone': 'phone',
    'phone_number': 'phone',
    'phone number': 'phone',
    'mobile': 'phone',
    'location': 'location',
    'city': 'location',
    'address': 'location',
    'skills': 'skills',
    'skill': 'skills',
    'technologies': 'skills',
    'experience': 'experienceLevel',
    'experience_level': 'experienceLevel',
    'experience level': 'experienceLevel',
    'years_experience': 'experienceLevel',
    'years experience': 'experienceLevel',
    'salary': 'salaryExpectation',
    'salary_expectation': 'salaryExpectation',
    'salary expectation': 'salaryExpectation',
    'expected_salary': 'salaryExpectation',
    'expected salary': 'salaryExpectation',
    'availability': 'availability',
    'available': 'availability',
    'start_date': 'availability',
    'start date': 'availability',
    'source': 'source',
    'how_did_you_hear': 'source',
    'how did you hear': 'source',
    'referral': 'source',
    'notes': 'notes',
    'note': 'notes',
    'comments': 'notes',
    'comment': 'notes'
  };

  // Define field mappings for jobs
  private static readonly JOB_FIELD_MAPPINGS: Record<string, string> = {
    'title': 'title',
    'job_title': 'title',
    'job title': 'title',
    'position': 'title',
    'role': 'title',
    'description': 'description',
    'job_description': 'description',
    'job description': 'description',
    'responsibilities': 'description',
    'location': 'location',
    'city': 'location',
    'office': 'location',
    'work_location': 'location',
    'work location': 'location',
    'salary': 'salaryRange',
    'salary_range': 'salaryRange',
    'salary range': 'salaryRange',
    'compensation': 'salaryRange',
    'pay': 'salaryRange',
    'type': 'employmentType',
    'employment_type': 'employmentType',
    'employment type': 'employmentType',
    'job_type': 'employmentType',
    'job type': 'employmentType',
    'level': 'experienceLevel',
    'experience_level': 'experienceLevel',
    'experience level': 'experienceLevel',
    'seniority': 'experienceLevel',
    'requirements': 'requirements',
    'requirement': 'requirements',
    'qualifications': 'requirements',
    'qualification': 'requirements',
    'skills': 'requirements',
    'skill': 'requirements',
    'remote': 'isRemote',
    'remote_work': 'isRemote',
    'remote work': 'isRemote',
    'work_from_home': 'isRemote',
    'work from home': 'isRemote',
    'status': 'status',
    'job_status': 'status',
    'job status': 'status',
    'priority': 'priority',
    'urgency': 'priority'
  };

  /**
   * Parse CSV file content
   */
  private static async parseCSV(fileContent: Buffer): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      const records: Record<string, any>[] = [];
      
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true,
        cast_date: false // We'll handle dates manually
      })
      .on('data', (record) => {
        records.push(record);
      })
      .on('error', (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      })
      .on('end', () => {
        resolve(records);
      });
    });
  }

  /**
   * Parse Excel file content
   */
  private static parseExcel(fileContent: Buffer): Record<string, any>[] {
    try {
      const workbook = XLSX.read(fileContent, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      
      if (!sheetName) {
        throw new Error('No sheets found in Excel file');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        dateNF: 'yyyy-mm-dd'
      });
      
      if (jsonData.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }
      
      const headers = jsonData[0] as string[];
      const records: Record<string, any>[] = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        const record: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          if (header && header.trim()) {
            record[header.toLowerCase().trim()] = row[index] || '';
          }
        });
        
        records.push(record);
      }
      
      return records;
    } catch (error) {
      throw new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Normalize field names using mappings
   */
  private static normalizeFields(
    record: Record<string, any>, 
    fieldMappings: Record<string, string>
  ): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    Object.entries(record).forEach(([key, value]) => {
      const normalizedKey = key.toLowerCase().trim().replace(/[_\s]+/g, '_');
      const mappedField = fieldMappings[normalizedKey] || fieldMappings[key.toLowerCase().trim()];
      
      if (mappedField) {
        normalized[mappedField] = value;
      } else {
        // Keep unmapped fields for potential manual mapping later
        normalized[key] = value;
      }
    });
    
    return normalized;
  }

  /**
   * Validate and transform candidate data
   */
  private static validateCandidateRecord(
    record: Record<string, any>, 
    orgId: string
  ): { isValid: boolean; data?: InsertCandidate; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Normalize the record
      const normalized = this.normalizeFields(record, this.CANDIDATE_FIELD_MAPPINGS);
      
      // Required fields validation
      if (!normalized.firstName && !normalized.lastName) {
        errors.push('Either first name or last name is required');
      }
      
      if (!normalized.email) {
        errors.push('Email is required');
      }
      
      // Email validation
      if (normalized.email && !z.string().email().safeParse(normalized.email).success) {
        errors.push('Invalid email format');
      }
      
      // Transform data to match schema
      const candidateData: InsertCandidate = {
        orgId,
        firstName: normalized.firstName || '',
        lastName: normalized.lastName || '',
        email: normalized.email,
        phone: normalized.phone || null,
        location: normalized.location || null,
        skills: normalized.skills ? 
          (typeof normalized.skills === 'string' ? 
            normalized.skills.split(',').map(s => s.trim()) : 
            Array.isArray(normalized.skills) ? normalized.skills : []) : [],
        experienceLevel: normalized.experienceLevel || null,
        salaryExpectation: normalized.salaryExpectation || null,
        availability: normalized.availability || null,
        source: normalized.source || 'import',
        notes: normalized.notes || null,
        resumeUrl: null,
        resumeContent: null,
        linkedinUrl: null,
        githubUrl: null,
        portfolioUrl: null
      };
      
      // Validate with schema
      const result = insertCandidateSchema.safeParse(candidateData);
      
      if (!result.success) {
        result.error.errors.forEach(err => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });
      }
      
      return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? candidateData : undefined,
        errors
      };
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Validate and transform job data
   */
  private static validateJobRecord(
    record: Record<string, any>, 
    orgId: string
  ): { isValid: boolean; data?: InsertJob; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Normalize the record
      const normalized = this.normalizeFields(record, this.JOB_FIELD_MAPPINGS);
      
      // Required fields validation
      if (!normalized.title) {
        errors.push('Job title is required');
      }
      
      if (!normalized.description) {
        errors.push('Job description is required');
      }
      
      // Transform boolean values
      const isRemote = normalized.isRemote ? 
        (typeof normalized.isRemote === 'string' ? 
          ['true', 'yes', '1', 'remote'].includes(normalized.isRemote.toLowerCase()) : 
          Boolean(normalized.isRemote)) : false;
      
      // Transform data to match schema
      const jobData: InsertJob = {
        orgId,
        title: normalized.title,
        description: normalized.description,
        location: normalized.location || null,
        salaryRange: normalized.salaryRange || null,
        employmentType: normalized.employmentType || 'full-time',
        experienceLevel: normalized.experienceLevel || null,
        requirements: normalized.requirements ? 
          (typeof normalized.requirements === 'string' ? 
            normalized.requirements.split(',').map(s => s.trim()) : 
            Array.isArray(normalized.requirements) ? normalized.requirements : []) : [],
        isRemote,
        status: normalized.status || 'draft',
        priority: normalized.priority || 'medium'
      };
      
      // Validate with schema
      const result = insertJobSchema.safeParse(jobData);
      
      if (!result.success) {
        result.error.errors.forEach(err => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });
      }
      
      return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? jobData : undefined,
        errors
      };
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Process import file and create records
   */
  static async processImport(
    importData: DataImport,
    fileContent: Buffer,
    fileName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[ImportService] Starting processing for import ${importData.id}`);
      
      // Update import status to processing
      await storage.updateDataImport(importData.id, {
        status: 'processing',
        processingStartedAt: new Date()
      });
      
      // Parse file based on extension
      let records: Record<string, any>[] = [];
      const fileExtension = fileName.toLowerCase().split('.').pop();
      
      if (fileExtension === 'csv') {
        records = await this.parseCSV(fileContent);
      } else if (['xls', 'xlsx'].includes(fileExtension || '')) {
        records = await this.parseExcel(fileContent);
      } else {
        throw new Error('Unsupported file format. Please use CSV, XLS, or XLSX files.');
      }
      
      if (records.length === 0) {
        throw new Error('No data records found in file');
      }
      
      console.log(`[ImportService] Parsed ${records.length} records from file`);
      
      // Update total records count
      await storage.updateDataImport(importData.id, {
        totalRecords: records.length
      });
      
      let successCount = 0;
      let failureCount = 0;
      const batchSize = 10; // Process in batches to avoid overwhelming the system
      
      // Process records in batches
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        for (let j = 0; j < batch.length; j++) {
          const rowNumber = i + j + 1;
          const record = batch[j];
          
          try {
            let validationResult: { isValid: boolean; data?: any; errors: string[] };
            let entityId: string | null = null;
            
            // Validate based on import type
            if (importData.importType === 'candidates') {
              validationResult = this.validateCandidateRecord(record, importData.orgId);
              
              if (validationResult.isValid && validationResult.data) {
                const candidate = await storage.createCandidate(validationResult.data);
                entityId = candidate.id;
              }
            } else if (importData.importType === 'jobs') {
              validationResult = this.validateJobRecord(record, importData.orgId);
              
              if (validationResult.isValid && validationResult.data) {
                const job = await storage.createJob(validationResult.data);
                entityId = job.id;
              }
            } else {
              throw new Error(`Unsupported import type: ${importData.importType}`);
            }
            
            // Create import record
            await storage.createImportRecord({
              importId: importData.id,
              rowNumber,
              originalData: record,
              processedData: validationResult.data || null,
              status: validationResult.isValid ? 'success' : 'failed',
              errorMessage: validationResult.errors.length > 0 ? validationResult.errors.join('; ') : null,
              entityId,
              entityType: importData.importType === 'candidates' ? 'candidate' : 'job'
            });
            
            if (validationResult.isValid) {
              successCount++;
            } else {
              failureCount++;
            }
            
          } catch (error) {
            failureCount++;
            
            await storage.createImportRecord({
              importId: importData.id,
              rowNumber,
              originalData: record,
              processedData: null,
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown processing error',
              entityId: null,
              entityType: importData.importType === 'candidates' ? 'candidate' : 'job'
            });
          }
        }
        
        // Update progress after each batch
        await storage.updateDataImport(importData.id, {
          successfulRecords: successCount,
          failedRecords: failureCount
        });
        
        console.log(`[ImportService] Processed batch ${Math.floor(i / batchSize) + 1}, Success: ${successCount}, Failed: ${failureCount}`);
      }
      
      // Final update
      const finalStatus = failureCount === 0 ? 'completed' : (successCount === 0 ? 'failed' : 'completed');
      const errorSummary = failureCount > 0 ? 
        `${failureCount} out of ${records.length} records failed to import` : null;
      
      await storage.updateDataImport(importData.id, {
        status: finalStatus,
        successfulRecords: successCount,
        failedRecords: failureCount,
        errorSummary,
        processingCompletedAt: new Date()
      });
      
      console.log(`[ImportService] Import ${importData.id} completed. Success: ${successCount}, Failed: ${failureCount}`);
      
      return {
        success: true,
        message: `Import completed. ${successCount} records imported successfully, ${failureCount} failed.`
      };
      
    } catch (error) {
      console.error(`[ImportService] Import ${importData.id} failed:`, error);
      
      // Update import status to failed
      await storage.updateDataImport(importData.id, {
        status: 'failed',
        errorSummary: error instanceof Error ? error.message : 'Unknown processing error',
        processingCompletedAt: new Date()
      });
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Import processing failed'
      };
    }
  }

  /**
   * Get suggested field mappings based on CSV headers
   */
  static getSuggestedMappings(headers: string[], importType: 'candidates' | 'jobs'): Record<string, string> {
    const mappings = importType === 'candidates' ? this.CANDIDATE_FIELD_MAPPINGS : this.JOB_FIELD_MAPPINGS;
    const suggestions: Record<string, string> = {};
    
    headers.forEach(header => {
      const normalized = header.toLowerCase().trim().replace(/[_\s]+/g, '_');
      const mapped = mappings[normalized] || mappings[header.toLowerCase().trim()];
      
      if (mapped) {
        suggestions[header] = mapped;
      }
    });
    
    return suggestions;
  }
}