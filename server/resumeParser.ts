import OpenAI from "openai";
import { textExtractionService } from './textExtraction';

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY not found - resume parsing will be disabled");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'disabled'
});

export interface ParsedResumeData {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    portfolio?: string;
  };
  summary?: string;
  skills: {
    technical: string[];
    soft: string[];
    certifications: string[];
  };
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    location?: string;
    description: string;
    achievements?: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear?: string;
    gpa?: string;
    major?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  languages?: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  totalYearsExperience: number;
}

export class ResumeParsingService {
  async parseResumeText(resumeText: string): Promise<ParsedResumeData> {
    if (!process.env.OPENAI_API_KEY) {
      console.log('Resume parsing disabled - no OpenAI API key configured');
      return this.createEmptyResumeData();
    }

    try {
      const prompt = `
Analyze the following resume and extract structured information. Return the data in valid JSON format matching this exact schema:

{
  "personalInfo": {
    "name": "string (optional)",
    "email": "string (optional)", 
    "phone": "string (optional)",
    "location": "string (optional)",
    "linkedIn": "string (optional)",
    "portfolio": "string (optional)"
  },
  "summary": "string (optional - brief professional summary)",
  "skills": {
    "technical": ["array of technical skills"],
    "soft": ["array of soft skills like leadership, communication"],
    "certifications": ["array of certifications"]
  },
  "experience": [
    {
      "title": "Job title",
      "company": "Company name", 
      "duration": "Duration (e.g., Jan 2020 - Present)",
      "location": "Location (optional)",
      "description": "Job description",
      "achievements": ["array of key achievements (optional)"]
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "institution": "School/University name",
      "graduationYear": "Year (optional)",
      "gpa": "GPA if mentioned (optional)",
      "major": "Major/Field of study (optional)"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Project description", 
      "technologies": ["array of technologies used"]
    }
  ],
  "languages": ["array of languages spoken"],
  "experienceLevel": "entry|mid|senior|executive (based on experience)",
  "totalYearsExperience": "number (estimated total years of professional experience)"
}

Important instructions:
- Return ONLY valid JSON, no additional text
- Use null for missing optional fields
- Estimate experience level based on job titles and years of experience
- Extract all skills mentioned, including programming languages, tools, frameworks
- Be thorough but accurate - don't invent information not in the resume

Resume text:
${resumeText}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert resume parser. Extract structured information from resumes and return valid JSON data only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const parsedContent = response.choices[0].message.content;
      if (!parsedContent) {
        throw new Error('No content returned from OpenAI');
      }

      const parsedData = JSON.parse(parsedContent) as ParsedResumeData;
      
      // Validate and clean the parsed data
      return this.validateAndCleanParsedData(parsedData);

    } catch (error) {
      console.error('Resume parsing error:', error);
      throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async parseResumeFromUrl(storagePath: string): Promise<ParsedResumeData> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Resume parsing disabled - no OpenAI API key configured');
        return this.createEmptyResumeData();
      }

      console.log(`[RESUME PARSER] Extracting text from storage path: ${storagePath}`);
      
      // Extract text from the file in Supabase Storage
      const extractionResult = await textExtractionService.extractFromStoragePath(storagePath);
      
      console.log(`[RESUME PARSER] Extracted ${extractionResult.wordCount} words from resume`);
      
      // Validate extracted text
      if (!textExtractionService.validateExtractedText(extractionResult.text)) {
        throw new Error('Resume text extraction produced insufficient content. File may be corrupted or empty.');
      }

      // Parse the extracted text with OpenAI
      const parsedData = await this.parseResumeText(extractionResult.text);
      
      console.log(`[RESUME PARSER] Successfully parsed resume from ${storagePath}`);
      console.log(`[RESUME PARSER] Parsed data summary:`, {
        hasName: !!parsedData.personalInfo?.name,
        hasSummary: !!parsedData.summary,
        skillsCount: parsedData.skills?.technical?.length || 0,
        experienceCount: parsedData.experience?.length || 0,
        educationCount: parsedData.education?.length || 0,
        experienceLevel: parsedData.experienceLevel,
        yearsExp: parsedData.totalYearsExperience
      });
      
      return parsedData;
    } catch (error) {
      console.error('Resume URL parsing error:', error);
      throw new Error(`Failed to parse resume from storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateAndCleanParsedData(data: any): ParsedResumeData {
    return {
      personalInfo: {
        name: data.personalInfo?.name || undefined,
        email: data.personalInfo?.email || undefined,
        phone: data.personalInfo?.phone || undefined,
        location: data.personalInfo?.location || undefined,
        linkedIn: data.personalInfo?.linkedIn || undefined,
        portfolio: data.personalInfo?.portfolio || undefined,
      },
      summary: data.summary || undefined,
      skills: {
        technical: Array.isArray(data.skills?.technical) ? data.skills.technical : [],
        soft: Array.isArray(data.skills?.soft) ? data.skills.soft : [],
        certifications: Array.isArray(data.skills?.certifications) ? data.skills.certifications : [],
      },
      experience: Array.isArray(data.experience) ? data.experience.map((exp: any) => ({
        title: exp.title || '',
        company: exp.company || '',
        duration: exp.duration || '',
        location: exp.location || undefined,
        description: exp.description || '',
        achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
      })) : [],
      education: Array.isArray(data.education) ? data.education.map((edu: any) => ({
        degree: edu.degree || '',
        institution: edu.institution || '',
        graduationYear: edu.graduationYear || undefined,
        gpa: edu.gpa || undefined,
        major: edu.major || undefined,
      })) : [],
      projects: Array.isArray(data.projects) ? data.projects.map((proj: any) => ({
        name: proj.name || '',
        description: proj.description || '',
        technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
      })) : [],
      languages: Array.isArray(data.languages) ? data.languages : [],
      experienceLevel: ['entry', 'mid', 'senior', 'executive'].includes(data.experienceLevel) 
        ? data.experienceLevel 
        : 'entry',
      totalYearsExperience: typeof data.totalYearsExperience === 'number' 
        ? Math.max(0, data.totalYearsExperience) 
        : 0,
    };
  }

  private createEmptyResumeData(): ParsedResumeData {
    return {
      personalInfo: {
        name: undefined,
        email: undefined,
        phone: undefined,
        location: undefined,
        linkedIn: undefined,
        portfolio: undefined,
      },
      summary: undefined,
      skills: {
        technical: [],
        soft: [],
        certifications: [],
      },
      experience: [],
      education: [],
      projects: [],
      languages: [],
      experienceLevel: 'entry',
      totalYearsExperience: 0,
    };
  }

  // Extract searchable text from parsed resume for enhanced search
  extractSearchableContent(parsedData: ParsedResumeData): string {
    const searchableElements = [
      parsedData.summary || '',
      ...parsedData.skills.technical,
      ...parsedData.skills.soft,
      ...parsedData.skills.certifications,
      ...parsedData.experience.map(exp => `${exp.title} ${exp.company} ${exp.description}`),
      ...parsedData.education.map(edu => `${edu.degree} ${edu.institution} ${edu.major || ''}`),
      ...parsedData.projects?.map(proj => `${proj.name} ${proj.description} ${proj.technologies.join(' ')}`) || [],
      ...(parsedData.languages || []),
    ];

    return searchableElements.join(' ').toLowerCase();
  }
}

export const resumeParsingService = new ResumeParsingService();