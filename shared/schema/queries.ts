import { z } from "zod";
import type { Job, Candidate, Message } from "./index";

export interface PaginationMetadata {
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  include: z.string().optional(),
});

export const jobsQuerySchema = paginationQuerySchema.extend({
  orgId: z.string().uuid('Invalid organization ID'),
  status: z.enum(['draft', 'open', 'closed', 'on_hold', 'filled']).optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']).optional(),
  search: z.string().optional(),
});

export const candidatesQuerySchema = paginationQuerySchema.extend({
  orgId: z.string().uuid('Invalid organization ID'),
  jobId: z.string().uuid().optional(),
  stage: z.enum(['applied', 'phone_screen', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected']).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const messagesQuerySchema = paginationQuerySchema.extend({
  orgId: z.string().uuid('Invalid organization ID'),
  userId: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
  type: z.enum(['internal', 'client', 'candidate', 'system']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  clientId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  candidateId: z.string().uuid().optional(),
});

export type PaginatedJobs = PaginatedResponse<Job>;
export type PaginatedCandidates = PaginatedResponse<Candidate>;
export type PaginatedMessages = PaginatedResponse<Message>;

export const jobFieldsPresets = {
  list: ['id', 'title', 'status', 'location', 'job_type', 'created_at'],
  detail: ['id', 'title', 'description', 'status', 'location', 'job_type', 'department', 'salary_range', 'experience_level', 'created_at', 'updated_at'],
  public: ['id', 'title', 'description', 'location', 'job_type', 'experience_level', 'remote_option', 'salary_range'],
} as const;

export const candidateFieldsPresets = {
  list: ['id', 'name', 'email', 'stage', 'status', 'created_at'],
  detail: ['id', 'name', 'email', 'phone', 'stage', 'status', 'resume_url', 'notes', 'created_at', 'updated_at'],
} as const;

export const messageFieldsPresets = {
  list: ['id', 'subject', 'type', 'priority', 'is_read', 'created_at'],
  detail: ['id', 'subject', 'content', 'type', 'priority', 'is_read', 'created_at', 'thread_id'],
} as const;

export async function getSchemaColumns(table?: string) {
  const { supabase } = await import("../../server/lib/supabase");
  
  let query = supabase.from("schema_columns_mv").select("*").eq("table_schema", "public");
  if (table) {
    query = query.eq("table_name", table);
  }
  const { data, error } = await query.order("table_name").order("ordinal_position");
  if (error) throw error;
  return data;
}
