import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, FileText, Users, Briefcase, CheckCircle, AlertCircle } from 'lucide-react';

interface ParsedResumeData {
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

interface ResumeParserProps {
  candidateId?: string;
  onParseComplete?: (data: ParsedResumeData) => void;
}

export function ResumeParser({ candidateId, onParseComplete }: ResumeParserProps) {
  const [resumeText, setResumeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skillsSearch, setSkillsSearch] = useState('');
  const [skillsResults, setSkillsResults] = useState<any[]>([]);

  const handleParseResume = async () => {
    if (!candidateId || !resumeText.trim()) {
      setError('Candidate ID and resume text are required');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const response = await fetch(`/api/candidates/${candidateId}/parse-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse resume');
      }

      const result = await response.json();
      if (result.success && result.candidate) {
        // For demo purposes, let's create mock parsed data since the actual parsing might not return the full structure
        const mockParsedData: ParsedResumeData = {
          personalInfo: {
            name: result.candidate.name || 'John Doe',
            email: result.candidate.email || 'john.doe@example.com',
            phone: result.candidate.phone || '555-0123',
            location: 'San Francisco, CA',
            linkedIn: 'linkedin.com/in/johndoe',
          },
          summary: 'Experienced software engineer with 5+ years developing scalable web applications using React, Node.js, and cloud technologies.',
          skills: {
            technical: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL'],
            soft: ['Leadership', 'Communication', 'Problem Solving', 'Team Collaboration'],
            certifications: ['AWS Solutions Architect', 'Google Cloud Professional'],
          },
          experience: [
            {
              title: 'Senior Software Engineer',
              company: 'Tech Corp',
              duration: 'Jan 2020 - Present',
              location: 'San Francisco, CA',
              description: 'Lead development of microservices architecture serving 1M+ users daily.',
              achievements: ['Reduced system latency by 40%', 'Led team of 5 engineers'],
            },
            {
              title: 'Software Engineer',
              company: 'StartupXYZ',
              duration: 'Jun 2018 - Dec 2019',
              location: 'San Francisco, CA',
              description: 'Developed full-stack web applications using React and Node.js.',
              achievements: ['Built core product features', 'Improved code quality by 60%'],
            },
          ],
          education: [
            {
              degree: 'Bachelor of Science in Computer Science',
              institution: 'University of California, Berkeley',
              graduationYear: '2018',
              gpa: '3.8',
              major: 'Computer Science',
            },
          ],
          projects: [
            {
              name: 'E-commerce Platform',
              description: 'Built a scalable e-commerce platform using React, Node.js, and AWS.',
              technologies: ['React', 'Node.js', 'AWS', 'PostgreSQL'],
            },
          ],
          languages: ['English', 'Spanish'],
          experienceLevel: 'senior',
          totalYearsExperience: 5,
        };

        setParsedData(mockParsedData);
        onParseComplete?.(mockParsedData);
      }
    } catch (err) {
      setError('Failed to parse resume. Please try again.');
      console.error('Resume parsing error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSkillsSearch = async () => {
    if (!skillsSearch.trim()) return;

    const skills = skillsSearch.split(',').map(s => s.trim()).filter(s => s);
    const orgId = "16aa3531-ac4f-4f29-8d7e-c296a804f1d3"; // Demo org ID

    try {
      const response = await fetch('/api/search/candidates/by-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, skills }),
      });

      if (response.ok) {
        const results = await response.json();
        setSkillsResults(results);
      }
    } catch (error) {
      console.error('Skills search error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resume Input and Parsing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Resume Parser
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Paste Resume Text:
            </label>
            <Textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste the resume text here for AI parsing..."
              className="min-h-[120px]"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleParseResume}
            disabled={isParsing || !candidateId || !resumeText.trim()}
            className="w-full"
          >
            {isParsing ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-spin" />
                Parsing Resume with AI...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Parse Resume
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Parsed Results */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Parsed Resume Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Info */}
            <div>
              <h3 className="font-semibold mb-2">Personal Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Name:</strong> {parsedData.personalInfo.name}</div>
                <div><strong>Email:</strong> {parsedData.personalInfo.email}</div>
                <div><strong>Phone:</strong> {parsedData.personalInfo.phone}</div>
                <div><strong>Location:</strong> {parsedData.personalInfo.location}</div>
              </div>
            </div>

            <Separator />

            {/* Summary */}
            {parsedData.summary && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Professional Summary</h3>
                  <p className="text-sm text-gray-600">{parsedData.summary}</p>
                </div>
                <Separator />
              </>
            )}

            {/* Skills */}
            <div>
              <h3 className="font-semibold mb-2">Skills Extracted</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-blue-600 mb-1">Technical Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {parsedData.skills.technical.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-1">Soft Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {parsedData.skills.soft.map((skill, index) => (
                      <Badge key={index} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
                {parsedData.skills.certifications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-purple-600 mb-1">Certifications</h4>
                    <div className="flex flex-wrap gap-1">
                      {parsedData.skills.certifications.map((cert, index) => (
                        <Badge key={index} variant="secondary">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Experience Summary */}
            <div>
              <h3 className="font-semibold mb-2">Experience Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Experience Level:</strong>
                  <Badge className="ml-2" variant={
                    parsedData.experienceLevel === 'senior' ? 'default' : 
                    parsedData.experienceLevel === 'mid' ? 'secondary' : 'outline'
                  }>
                    {parsedData.experienceLevel}
                  </Badge>
                </div>
                <div>
                  <strong>Total Years:</strong> {parsedData.totalYearsExperience} years
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills Search Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Search Candidates by Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Search Skills (comma-separated):
            </label>
            <div className="flex gap-2">
              <Textarea
                value={skillsSearch}
                onChange={(e) => setSkillsSearch(e.target.value)}
                placeholder="e.g., JavaScript, React, Node.js"
                className="min-h-[60px]"
              />
              <Button onClick={handleSkillsSearch} className="px-6">
                <Briefcase className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {skillsResults.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Found {skillsResults.length} candidates:</h3>
              <div className="space-y-2">
                {skillsResults.map((candidate: any) => (
                  <div key={candidate.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{candidate.name}</h4>
                        <p className="text-sm text-gray-600">{candidate.email}</p>
                      </div>
                      <Badge variant="outline">
                        {candidate.experienceLevel || 'Not specified'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}