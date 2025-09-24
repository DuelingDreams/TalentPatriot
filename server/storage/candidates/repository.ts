import { supabase } from '../../lib/supabase';
import type { ICandidatesRepository, PipelineCandidate } from './interface';
import type {
  Candidate,
  JobCandidate,
  CandidateNotes,
  Interview,
  InsertCandidate,
  InsertJobCandidate,
  InsertCandidateNotes,
  InsertInterview
} from "@shared/schema";

export class CandidatesRepository implements ICandidatesRepository {
  async getCandidate(id: string): Promise<Candidate | undefined> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data as Candidate;
  }
  
  async getCandidates(): Promise<Candidate[]> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Candidate[];
  }
  
  async getCandidatesByOrg(orgId: string): Promise<Candidate[]> {
    try {
      console.log(`Fetching candidates for orgId: ${orgId}`);
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('org_id', orgId)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch candidates: ${error.message}`);
      }
      
      console.log(`Found ${data?.length || 0} candidates for orgId: ${orgId}`);
      return data as Candidate[];
    } catch (err) {
      console.error('Exception in getCandidatesByOrg:', err);
      throw err;
    }
  }
  
  async getCandidateByEmail(email: string, orgId: string): Promise<Candidate | undefined> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('email', email)
      .eq('org_id', orgId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data as Candidate;
  }
  
  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    try {
      const dbCandidate = {
        name: insertCandidate.name,
        email: insertCandidate.email,
        org_id: insertCandidate.orgId,
        phone: insertCandidate.phone || null,
        resume_url: insertCandidate.resumeUrl || null,
        status: insertCandidate.status || 'active',
        skills: insertCandidate.skills || null,
        experience_level: insertCandidate.experienceLevel || null,
        total_years_experience: insertCandidate.totalYearsExperience || null,
        education: insertCandidate.education || null,
        summary: insertCandidate.summary || null,
        created_by: insertCandidate.createdBy || null,
      };
      
      const { data, error } = await supabase
        .from('candidates')
        .insert(dbCandidate)
        .select()
        .single();
      
      if (error) {
        console.error('Database candidate creation error:', error);
        throw new Error(`Failed to create candidate: ${error.message}`);
      }
      
      return data as Candidate;
    } catch (err) {
      console.error('Candidate creation exception:', err);
      throw err;
    }
  }
  
  async updateCandidate(id: string, updateData: Partial<InsertCandidate>): Promise<Candidate> {
    try {
      const dbUpdate: Partial<Record<string, unknown>> = {};
      if (updateData.name !== undefined) dbUpdate.name = updateData.name;
      if (updateData.email !== undefined) dbUpdate.email = updateData.email;
      if (updateData.phone !== undefined) dbUpdate.phone = updateData.phone;
      if (updateData.resumeUrl !== undefined) dbUpdate.resume_url = updateData.resumeUrl;
      if (updateData.status !== undefined) dbUpdate.status = updateData.status;
      if (updateData.skills !== undefined) dbUpdate.skills = updateData.skills;
      if (updateData.experienceLevel !== undefined) dbUpdate.experience_level = updateData.experienceLevel;
      if (updateData.totalYearsExperience !== undefined) dbUpdate.total_years_experience = updateData.totalYearsExperience;
      if (updateData.education !== undefined) dbUpdate.education = updateData.education;
      if (updateData.summary !== undefined) dbUpdate.summary = updateData.summary;
      
      const { data, error } = await supabase
        .from('candidates')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Database candidate update error:', error);
        throw new Error(`Failed to update candidate: ${error.message}`);
      }
      
      return data as Candidate;
    } catch (err) {
      console.error('Candidate update exception:', err);
      throw err;
    }
  }
  
  async deleteCandidate(id: string): Promise<void> {
    const { error } = await supabase
      .from('candidates')
      .update({ status: 'deleted' })
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  }
  
  async searchCandidates(searchTerm: string, orgId: string): Promise<Candidate[]> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('org_id', orgId)
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Candidate[];
  }
  
  async getJobCandidate(id: string): Promise<JobCandidate | undefined> {
    const { data, error } = await supabase
      .from('job_candidate')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data as JobCandidate;
  }
  
  async getJobCandidatesByJob(jobId: string): Promise<JobCandidate[]> {
    const { data, error } = await supabase
      .from('job_candidate')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as JobCandidate[];
  }
  
  async getJobCandidatesByCandidate(candidateId: string): Promise<JobCandidate[]> {
    const { data, error } = await supabase
      .from('job_candidate')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as JobCandidate[];
  }
  
  async getJobCandidatesByOrg(orgId: string): Promise<JobCandidate[]> {
    try {
      console.log(`Fetching job candidates for orgId: ${orgId}`);
      const { data, error } = await supabase
        .from('job_candidate')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch job candidates: ${error.message}`);
      }
      
      console.log(`Found ${data?.length || 0} job candidates for orgId: ${orgId}`);
      return data as JobCandidate[];
    } catch (err) {
      console.error('Exception in getJobCandidatesByOrg:', err);
      throw err;
    }
  }
  
  async createJobCandidate(insertJobCandidate: InsertJobCandidate & { pipelineColumnId?: string }): Promise<JobCandidate> {
    try {
      const dbJobCandidate = {
        org_id: insertJobCandidate.orgId,
        job_id: insertJobCandidate.jobId,
        candidate_id: insertJobCandidate.candidateId,
        stage: insertJobCandidate.stage || 'applied',
        notes: insertJobCandidate.notes || null,
        assigned_to: insertJobCandidate.assignedTo || null,
        status: insertJobCandidate.status || 'active',
        pipeline_column_id: insertJobCandidate.pipelineColumnId || null,
      };
      
      const { data, error } = await supabase
        .from('job_candidate')
        .insert(dbJobCandidate)
        .select()
        .single();
      
      if (error) {
        console.error('Database job candidate creation error:', error);
        throw new Error(`Failed to create job candidate: ${error.message}`);
      }
      
      return data as JobCandidate;
    } catch (err) {
      console.error('Job candidate creation exception:', err);
      throw err;
    }
  }
  
  async updateJobCandidate(id: string, updateData: Partial<InsertJobCandidate>): Promise<JobCandidate> {
    try {
      const dbUpdate: Partial<Record<string, unknown>> = {};
      if (updateData.stage !== undefined) dbUpdate.stage = updateData.stage;
      if (updateData.notes !== undefined) dbUpdate.notes = updateData.notes;
      if (updateData.assignedTo !== undefined) dbUpdate.assigned_to = updateData.assignedTo;
      if (updateData.status !== undefined) dbUpdate.status = updateData.status;
      
      const { data, error } = await supabase
        .from('job_candidate')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Database job candidate update error:', error);
        throw new Error(`Failed to update job candidate: ${error.message}`);
      }
      
      return data as JobCandidate;
    } catch (err) {
      console.error('Job candidate update exception:', err);
      throw err;
    }
  }
  
  async moveJobCandidate(jobCandidateId: string, newColumnId: string): Promise<JobCandidate> {
    try {
      const { data, error } = await supabase
        .from('job_candidate')
        .update({ 
          pipeline_column_id: newColumnId,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobCandidateId)
        .select()
        .single();
      
      if (error) {
        console.error('Database job candidate move error:', error);
        throw new Error(`Failed to move job candidate: ${error.message}`);
      }
      
      return data as JobCandidate;
    } catch (err) {
      console.error('Job candidate move exception:', err);
      throw err;
    }
  }
  
  async rejectJobCandidate(jobCandidateId: string): Promise<JobCandidate> {
    try {
      const { data, error } = await supabase
        .from('job_candidate')
        .update({ 
          stage: 'rejected',
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobCandidateId)
        .select()
        .single();
      
      if (error) {
        console.error('Database job candidate rejection error:', error);
        throw new Error(`Failed to reject job candidate: ${error.message}`);
      }
      
      return data as JobCandidate;
    } catch (err) {
      console.error('Job candidate rejection exception:', err);
      throw err;
    }
  }
  
  async getJobCandidateByJobAndCandidate(jobId: string, candidateId: string): Promise<JobCandidate | undefined> {
    const { data, error } = await supabase
      .from('job_candidate')
      .select('*')
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data as JobCandidate;
  }
  
  async getCandidateNotes(jobCandidateId: string): Promise<CandidateNotes[]> {
    try {
      console.log('[STORAGE] Fetching candidate notes for jobCandidateId:', jobCandidateId);
      
      const { data, error } = await supabase
        .from('candidate_notes')
        .select(`
          id,
          org_id,
          job_candidate_id,
          author_id,
          content,
          is_private,
          created_at,
          updated_at
        `)
        .eq('job_candidate_id', jobCandidateId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Database candidate notes fetch error:', error);
        throw new Error(`Failed to fetch candidate notes: ${error.message}`);
      }

      console.log('[STORAGE] Raw notes data:', data?.length || 0, 'notes found');

      // Get author emails for the notes
      const notes = data || [];
      const authorIds = Array.from(new Set(notes.map(note => note.author_id)));
      
      let authorEmails: Record<string, string> = {};
      
      if (authorIds.length > 0) {
        try {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name')
            .in('id', authorIds);
          
          authorIds.forEach(authorId => {
            const profile = profiles?.find(p => p.id === authorId);
            if (profile && profile.first_name && profile.last_name) {
              const name = `${profile.first_name} ${profile.last_name}`.toLowerCase().replace(/\s+/g, '');
              authorEmails[authorId] = `${name}@company.com`;
            } else {
              authorEmails[authorId] = `user_${authorId.split('-')[0]}@company.com`;
            }
          });
          
          console.log('[STORAGE] Author emails resolved:', Object.keys(authorEmails).length);
        } catch (emailError) {
          console.warn('[STORAGE] Failed to fetch author emails, using fallback:', emailError);
          authorIds.forEach(authorId => {
            authorEmails[authorId] = `user_${authorId.split('-')[0]}@company.com`;
          });
        }
      }

      return notes.map(note => ({
        id: note.id,
        orgId: note.org_id,
        jobCandidateId: note.job_candidate_id,
        authorId: note.author_id,
        authorEmail: authorEmails[note.author_id] || 'unknown@company.com',
        content: note.content,
        isPrivate: note.is_private,
        createdAt: note.created_at,
        updatedAt: note.updated_at
      })) as CandidateNotes[];
    } catch (err) {
      console.error('Candidate notes fetch exception:', err);
      throw err;
    }
  }
  
  async createCandidateNote(insertNote: InsertCandidateNotes): Promise<CandidateNotes> {
    try {
      const dbNote = {
        org_id: insertNote.orgId,
        job_candidate_id: insertNote.jobCandidateId,
        author_id: insertNote.authorId,
        content: insertNote.content,
        is_private: insertNote.isPrivate || false,
      };
      
      const { data, error } = await supabase
        .from('candidate_notes')
        .insert(dbNote)
        .select()
        .single();
      
      if (error) {
        console.error('Database candidate note creation error:', error);
        throw new Error(`Failed to create candidate note: ${error.message}`);
      }
      
      return {
        id: data.id,
        orgId: data.org_id,
        jobCandidateId: data.job_candidate_id,
        authorId: data.author_id,
        authorEmail: `user_${data.author_id.split('-')[0]}@company.com`,
        content: data.content,
        isPrivate: data.is_private,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as CandidateNotes;
    } catch (err) {
      console.error('Candidate note creation exception:', err);
      throw err;
    }
  }
  
  // Simplified implementations for remaining methods
  async getInterview(id: string): Promise<Interview | undefined> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
  
  async getInterviews(): Promise<Interview[]> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
  
  async getInterviewsByJobCandidate(jobCandidateId: string): Promise<Interview[]> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
  
  async getInterviewsByDateRange(startDate: Date, endDate: Date): Promise<Interview[]> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
  
  async createInterview(interview: InsertInterview): Promise<Interview> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
  
  async updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
  
  async deleteInterview(id: string): Promise<void> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
  
  async getPipelineCandidates(jobId: string, orgId: string): Promise<PipelineCandidate[]> {
    // For now return empty array, should be implemented with real data later
    console.log(`Getting pipeline candidates for job ${jobId} in org ${orgId}`);
    return [];
  }
  
  async submitJobApplication(applicationData: any): Promise<{ candidateId: string; applicationId: string }> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
  
  async searchCandidatesAdvanced(filters: any): Promise<Candidate[]> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
  
  async parseAndUpdateCandidate(candidateId: string, resumeText?: string): Promise<Candidate> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
  
  async searchCandidatesBySkills(orgId: string, skills: string[]): Promise<Candidate[]> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
  
  async getCandidatesPaginated(params: any): Promise<any> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
}