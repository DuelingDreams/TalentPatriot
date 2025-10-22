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
  
  async getBatchedCandidateNotes(jobCandidateIds: string[]): Promise<Record<string, CandidateNotes[]>> {
    try {
      console.log('[STORAGE] Fetching batched candidate notes for', jobCandidateIds.length, 'candidates');
      
      if (!jobCandidateIds.length) {
        return {};
      }

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
        .in('job_candidate_id', jobCandidateIds)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Database batched candidate notes fetch error:', error)
        throw new Error(`Failed to fetch batched candidate notes: ${error.message}`)
      }

      console.log('[STORAGE] Raw batched notes data:', data?.length || 0, 'notes found');

      // Get author emails for all notes
      const notes = data || [];
      const authorIds = Array.from(new Set(notes.map(note => note.author_id)));
      
      let authorEmails: Record<string, string> = {};
      
      if (authorIds.length > 0) {
        try {
          // Fetch all author profiles in one query
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
          
          console.log('[STORAGE] Author emails resolved for batched notes:', Object.keys(authorEmails).length);
        } catch (emailError) {
          console.warn('[STORAGE] Failed to fetch author emails for batched notes, using fallback:', emailError);
          authorIds.forEach(authorId => {
            authorEmails[authorId] = `user_${authorId.split('-')[0]}@company.com`;
          });
        }
      }

      // Group notes by jobCandidateId
      const groupedNotes: Record<string, CandidateNotes[]> = {};
      
      // Initialize empty arrays for all requested candidates
      jobCandidateIds.forEach(id => {
        groupedNotes[id] = [];
      });

      // Group notes by job candidate ID
      notes.forEach(note => {
        const enrichedNote = {
          id: note.id,
          orgId: note.org_id,
          jobCandidateId: note.job_candidate_id,
          authorId: note.author_id,
          authorEmail: authorEmails[note.author_id] || `user_${note.author_id.split('-')[0]}@company.com`,
          content: note.content,
          isPrivate: note.is_private === true || note.is_private === 'true',
          createdAt: note.created_at,
          updatedAt: note.updated_at
        } as CandidateNotes & { authorEmail: string };

        if (groupedNotes[note.job_candidate_id]) {
          groupedNotes[note.job_candidate_id].push(enrichedNote);
        }
      });

      console.log('[STORAGE] Returning batched notes for', Object.keys(groupedNotes).length, 'candidates');
      return groupedNotes;
    } catch (err) {
      console.error('Batched candidate notes fetch exception:', err)
      throw err
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
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // Not found
        console.error('Database interview fetch error:', error);
        throw new Error(`Failed to fetch interview: ${error.message}`);
      }

      return {
        id: data.id,
        orgId: data.org_id,
        jobCandidateId: data.job_candidate_id,
        interviewerId: data.interviewer_id,
        title: data.title,
        scheduledAt: data.scheduled_at,
        duration: data.duration,
        location: data.location,
        type: data.type,
        status: data.status,
        notes: data.notes,
        feedback: data.feedback,
        rating: data.rating,
        recordStatus: data.record_status || 'active',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Interview;
    } catch (err) {
      console.error('Interview fetch exception:', err);
      throw err;
    }
  }
  
  async getInterviews(orgId?: string): Promise<Interview[]> {
    try {
      let query = supabase
        .from('interviews')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (orgId) {
        query = query.eq('org_id', orgId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database interviews fetch error:', error);
        throw new Error(`Failed to fetch interviews: ${error.message}`);
      }

      return (data || []).map(interview => ({
        id: interview.id,
        orgId: interview.org_id,
        jobCandidateId: interview.job_candidate_id,
        interviewerId: interview.interviewer_id,
        title: interview.title,
        scheduledAt: interview.scheduled_at,
        duration: interview.duration,
        location: interview.location,
        type: interview.type,
        status: interview.status,
        notes: interview.notes,
        feedback: interview.feedback,
        rating: interview.rating,
        recordStatus: interview.record_status || 'active',
        createdAt: interview.created_at,
        updatedAt: interview.updated_at
      })) as Interview[];
    } catch (err) {
      console.error('Interviews fetch exception:', err);
      throw err;
    }
  }
  
  async getInterviewsByJobCandidate(jobCandidateId: string): Promise<Interview[]> {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('job_candidate_id', jobCandidateId)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Database interviews fetch error:', error);
        throw new Error(`Failed to fetch interviews: ${error.message}`);
      }

      return (data || []).map(interview => ({
        id: interview.id,
        orgId: interview.org_id,
        jobCandidateId: interview.job_candidate_id,
        interviewerId: interview.interviewer_id,
        title: interview.title,
        scheduledAt: interview.scheduled_at,
        duration: interview.duration,
        location: interview.location,
        type: interview.type,
        status: interview.status,
        notes: interview.notes,
        feedback: interview.feedback,
        rating: interview.rating,
        recordStatus: interview.record_status || 'active',
        createdAt: interview.created_at,
        updatedAt: interview.updated_at
      })) as Interview[];
    } catch (err) {
      console.error('Interviews fetch exception:', err);
      throw err;
    }
  }
  
  async getInterviewsByDateRange(startDate: Date, endDate: Date): Promise<Interview[]> {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Database interviews fetch error:', error);
        throw new Error(`Failed to fetch interviews: ${error.message}`);
      }

      return (data || []).map(interview => ({
        id: interview.id,
        orgId: interview.org_id,
        jobCandidateId: interview.job_candidate_id,
        interviewerId: interview.interviewer_id,
        title: interview.title,
        scheduledAt: interview.scheduled_at,
        duration: interview.duration,
        location: interview.location,
        type: interview.type,
        status: interview.status,
        notes: interview.notes,
        feedback: interview.feedback,
        rating: interview.rating,
        recordStatus: interview.record_status || 'active',
        createdAt: interview.created_at,
        updatedAt: interview.updated_at
      })) as Interview[];
    } catch (err) {
      console.error('Interviews fetch exception:', err);
      throw err;
    }
  }
  
  async createInterview(interview: InsertInterview): Promise<Interview> {
    try {
      const dbInterview = {
        org_id: interview.orgId,
        job_candidate_id: interview.jobCandidateId,
        interviewer_id: interview.interviewerId,
        title: interview.title,
        scheduled_at: interview.scheduledAt,
        duration: interview.duration || null,
        location: interview.location || null,
        type: interview.type || 'phone',
        status: interview.status || 'scheduled',
        notes: interview.notes || null,
        feedback: interview.feedback || null,
        rating: interview.rating || null,
        record_status: interview.recordStatus || 'active'
      };

      const { data, error } = await supabase
        .from('interviews')
        .insert(dbInterview)
        .select()
        .single();

      if (error) {
        console.error('Database interview creation error:', error);
        throw new Error(`Failed to create interview: ${error.message}`);
      }

      return {
        id: data.id,
        orgId: data.org_id,
        jobCandidateId: data.job_candidate_id,
        interviewerId: data.interviewer_id,
        title: data.title,
        scheduledAt: data.scheduled_at,
        duration: data.duration,
        location: data.location,
        type: data.type,
        status: data.status,
        notes: data.notes,
        feedback: data.feedback,
        rating: data.rating,
        recordStatus: data.record_status || 'active',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Interview;
    } catch (err) {
      console.error('Interview creation exception:', err);
      throw err;
    }
  }
  
  async updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview> {
    try {
      const dbUpdate: Partial<Record<string, unknown>> = {};
      if (interview.title !== undefined) dbUpdate.title = interview.title;
      if (interview.scheduledAt !== undefined) dbUpdate.scheduled_at = interview.scheduledAt;
      if (interview.duration !== undefined) dbUpdate.duration = interview.duration;
      if (interview.location !== undefined) dbUpdate.location = interview.location;
      if (interview.type !== undefined) dbUpdate.type = interview.type;
      if (interview.status !== undefined) dbUpdate.status = interview.status;
      if (interview.notes !== undefined) dbUpdate.notes = interview.notes;
      if (interview.feedback !== undefined) dbUpdate.feedback = interview.feedback;
      if (interview.rating !== undefined) dbUpdate.rating = interview.rating;
      if (interview.recordStatus !== undefined) dbUpdate.record_status = interview.recordStatus;
      dbUpdate.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('interviews')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Database interview update error:', error);
        throw new Error(`Failed to update interview: ${error.message}`);
      }

      return {
        id: data.id,
        orgId: data.org_id,
        jobCandidateId: data.job_candidate_id,
        interviewerId: data.interviewer_id,
        title: data.title,
        scheduledAt: data.scheduled_at,
        duration: data.duration,
        location: data.location,
        type: data.type,
        status: data.status,
        notes: data.notes,
        feedback: data.feedback,
        rating: data.rating,
        recordStatus: data.record_status || 'active',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Interview;
    } catch (err) {
      console.error('Interview update exception:', err);
      throw err;
    }
  }
  
  async deleteInterview(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database interview deletion error:', error);
        throw new Error(`Failed to delete interview: ${error.message}`);
      }
    } catch (err) {
      console.error('Interview deletion exception:', err);
      throw err;
    }
  }
  
  async getPipelineCandidates(jobId: string, orgId: string): Promise<PipelineCandidate[]> {
    // For now return empty array, should be implemented with real data later
    console.log(`Getting pipeline candidates for job ${jobId} in org ${orgId}`);
    return [];
  }
  
  async submitJobApplication(applicationData: {
    jobId: string;
    name: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
  }): Promise<{ candidateId: string; applicationId: string }> {
    try {
      // Get the job to determine the orgId
      const { data: job } = await supabase
        .from('jobs')
        .select('org_id')
        .eq('id', applicationData.jobId)
        .single();
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      // First create or find the candidate
      let candidate = await this.getCandidateByEmail(applicationData.email, job.org_id);
      
      if (!candidate) {
        const candidateData: InsertCandidate = {
          name: applicationData.name,
          email: applicationData.email,
          phone: applicationData.phone || null,
          orgId: job.org_id,
          status: 'active',
          resumeUrl: applicationData.resumeUrl || null
        };
        candidate = await this.createCandidate(candidateData);
      }

      // Create the job-candidate relationship (application)
      const jobCandidateData = {
        jobId: applicationData.jobId,
        candidateId: candidate.id,
        stage: 'applied' as const,
        status: 'active' as const,
        orgId: job.org_id
      };

      const jobCandidate = await this.createJobCandidate(jobCandidateData);

      return {
        candidateId: candidate.id,
        applicationId: jobCandidate.id
      };
    } catch (err) {
      console.error('Job application submission exception:', err);
      throw err;
    }
  }
  
  async searchCandidatesAdvanced(filters: {
    orgId: string;
    searchTerm?: string;
    jobId?: string;
    stage?: string;
    status?: string;
    skills?: string[];
    dateRange?: { start: Date; end: Date };
  }): Promise<Candidate[]> {
    try {
      let query = supabase
        .from('candidates')
        .select(`
          *,
          job_candidate!inner(
            stage,
            status,
            job_id,
            created_at
          )
        `)
        .eq('org_id', filters.orgId);

      // Filter by search term (name, email)
      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`);
      }

      // Filter by specific job
      if (filters.jobId) {
        query = query.eq('job_candidate.job_id', filters.jobId);
      }

      // Filter by pipeline stage
      if (filters.stage) {
        query = query.eq('job_candidate.stage', filters.stage);
      }

      // Filter by status
      if (filters.status) {
        query = query.eq('job_candidate.status', filters.status);
      }

      // Filter by date range
      if (filters.dateRange) {
        query = query
          .gte('job_candidate.created_at', filters.dateRange.start.toISOString())
          .lte('job_candidate.created_at', filters.dateRange.end.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Advanced candidate search error:', error);
        throw new Error(`Failed to search candidates: ${error.message}`);
      }

      return data as Candidate[];
    } catch (err) {
      console.error('Advanced candidate search exception:', err);
      throw err;
    }
  }
  
  async parseAndUpdateCandidate(candidateId: string, resumeText?: string): Promise<Candidate> {
    try {
      // For now, return the existing candidate without AI parsing
      // This would integrate with OpenAI for resume parsing in full implementation
      const candidate = await this.getCandidate(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }
      
      console.log(`Resume parsing requested for candidate ${candidateId}`);
      console.log('Resume text length:', resumeText?.length || 0);
      
      // TODO: Integrate with OpenAI for actual resume parsing
      // For now, just return the candidate as-is
      return candidate;
    } catch (err) {
      console.error('Resume parsing exception:', err);
      throw err;
    }
  }
  
  async searchCandidatesBySkills(orgId: string, skills: string[]): Promise<Candidate[]> {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('org_id', orgId)
        .overlaps('skills', skills);

      if (error) {
        console.error('Skills-based candidate search error:', error);
        throw new Error(`Failed to search candidates by skills: ${error.message}`);
      }

      return data as Candidate[];
    } catch (err) {
      console.error('Skills-based candidate search exception:', err);
      throw err;
    }
  }
  
  async getCandidatesPaginated(params: {
    orgId: string;
    limit?: number;
    cursor?: string;
    stage?: string;
    status?: string;
    search?: string;
    jobId?: string;
    fields?: string[];
  }): Promise<{
    data: Candidate[];
    pagination: { hasMore: boolean; limit: number; totalCount: number };
  }> {
    try {
      const limit = Math.min(params.limit || 50, 100);
      const selectFields = params.fields?.join(', ') || '*';
      
      let query = supabase
        .from('candidates')
        .select(selectFields)
        .eq('org_id', params.orgId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1);

      // Add filters
      if (params.stage) {
        query = query.eq('stage', params.stage);
      }
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }

      // If jobId is provided, filter through job_candidate junction
      if (params.jobId) {
        const { data: jobCandidates } = await supabase
          .from('job_candidate')
          .select('candidate_id')
          .eq('job_id', params.jobId);
        
        if (jobCandidates && jobCandidates.length > 0) {
          const candidateIds = jobCandidates.map(jc => jc.candidate_id);
          query = query.in('id', candidateIds);
        } else {
          // No candidates for this job
          return {
            data: [],
            pagination: { hasMore: false, limit, totalCount: 0 }
          };
        }
      }

      // Cursor-based pagination with deterministic ordering
      if (params.cursor) {
        try {
          const decodedCursor = JSON.parse(Buffer.from(params.cursor, 'base64').toString('utf8'));
          if (decodedCursor.id) {
            // Use composite cursor for deterministic ordering
            query = query.or(`created_at.lt.${decodedCursor.created_at},and(created_at.eq.${decodedCursor.created_at},id.lt.${decodedCursor.id})`);
          } else {
            // Fallback for old cursor format
            query = query.lt('created_at', decodedCursor.created_at);
          }
        } catch (e) {
          console.warn('Invalid cursor format, ignoring:', e instanceof Error ? e.message : 'unknown error');
        }
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error in getCandidatesPaginated:', error);
        throw error;
      }

      if (!data) {
        console.warn('No data returned from getCandidatesPaginated query');
        return {
          data: [],
          pagination: {
            hasMore: false,
            totalCount: count || 0,
            limit
          }
        };
      }

      const hasMore = data.length > limit;
      const results = hasMore ? data.slice(0, limit) : data;

      return {
        data: results as unknown as Candidate[],
        pagination: {
          hasMore,
          totalCount: count || 0,
          limit
        }
      };
    } catch (err) {
      console.error('Paginated candidates fetch exception:', err);
      throw err;
    }
  }
}