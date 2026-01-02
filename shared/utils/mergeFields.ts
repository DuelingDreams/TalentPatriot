export interface MergeFieldContext {
  candidate?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    currentTitle?: string;
    currentCompany?: string;
  };
  job?: {
    title?: string;
    location?: string;
    department?: string;
    employmentType?: string;
  };
  company?: {
    name?: string;
  };
  recruiter?: {
    name?: string;
    email?: string;
    title?: string;
  };
}

export const MERGE_FIELDS = [
  { label: 'Candidate First Name', value: '{{candidate.firstName}}', category: 'Candidate' },
  { label: 'Candidate Last Name', value: '{{candidate.lastName}}', category: 'Candidate' },
  { label: 'Candidate Full Name', value: '{{candidate.name}}', category: 'Candidate' },
  { label: 'Candidate Email', value: '{{candidate.email}}', category: 'Candidate' },
  { label: 'Candidate Phone', value: '{{candidate.phone}}', category: 'Candidate' },
  { label: 'Candidate Location', value: '{{candidate.location}}', category: 'Candidate' },
  { label: 'Candidate Current Title', value: '{{candidate.currentTitle}}', category: 'Candidate' },
  { label: 'Candidate Current Company', value: '{{candidate.currentCompany}}', category: 'Candidate' },
  { label: 'Job Title', value: '{{job.title}}', category: 'Job' },
  { label: 'Job Location', value: '{{job.location}}', category: 'Job' },
  { label: 'Job Department', value: '{{job.department}}', category: 'Job' },
  { label: 'Employment Type', value: '{{job.employmentType}}', category: 'Job' },
  { label: 'Company Name', value: '{{company.name}}', category: 'Company' },
  { label: 'Recruiter Name', value: '{{recruiter.name}}', category: 'Recruiter' },
  { label: 'Recruiter Email', value: '{{recruiter.email}}', category: 'Recruiter' },
  { label: 'Recruiter Title', value: '{{recruiter.title}}', category: 'Recruiter' },
] as const;

export type MergeField = typeof MERGE_FIELDS[number];

export function renderMergeFields(template: string, context: MergeFieldContext): string {
  let result = template;

  const replacements: Record<string, string | undefined> = {
    '{{candidate.firstName}}': context.candidate?.firstName,
    '{{candidate.lastName}}': context.candidate?.lastName,
    '{{candidate.name}}': context.candidate?.name,
    '{{candidate.email}}': context.candidate?.email,
    '{{candidate.phone}}': context.candidate?.phone,
    '{{candidate.location}}': context.candidate?.location,
    '{{candidate.currentTitle}}': context.candidate?.currentTitle,
    '{{candidate.currentCompany}}': context.candidate?.currentCompany,
    '{{job.title}}': context.job?.title,
    '{{job.location}}': context.job?.location,
    '{{job.department}}': context.job?.department,
    '{{job.employmentType}}': context.job?.employmentType,
    '{{company.name}}': context.company?.name,
    '{{recruiter.name}}': context.recruiter?.name,
    '{{recruiter.email}}': context.recruiter?.email,
    '{{recruiter.title}}': context.recruiter?.title,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    if (value !== undefined) {
      result = result.replace(new RegExp(escapeRegExp(placeholder), 'g'), value);
    }
  }

  return result;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractMergeFieldsFromText(text: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(`{{${match[1]}}}`);
  }
  return [...new Set(matches)];
}

export function validateMergeFields(text: string): { valid: boolean; invalidFields: string[] } {
  const usedFields = extractMergeFieldsFromText(text);
  const validFieldValues = MERGE_FIELDS.map(f => f.value);
  const invalidFields = usedFields.filter(field => !validFieldValues.includes(field as any));
  
  return {
    valid: invalidFields.length === 0,
    invalidFields,
  };
}
