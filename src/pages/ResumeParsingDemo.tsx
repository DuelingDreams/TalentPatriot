import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Brain, FileText, Users, Briefcase, CheckCircle, AlertCircle, Upload } from 'lucide-react';

export default function ResumeParsingDemo() {
  const [resumeText, setResumeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Sample resume text for demo
  const sampleResume = `John Doe
Senior Software Engineer
Email: john.doe@techcorp.com
Phone: (555) 123-4567
Location: San Francisco, CA
LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced full-stack software engineer with 6+ years developing scalable web applications. 
Expertise in React, Node.js, and cloud technologies. Led teams of 5+ engineers and delivered 
products serving 1M+ users. AWS certified solutions architect.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java, SQL
Frontend: React, Vue.js, Angular, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express, Django, Spring Boot, GraphQL
Databases: PostgreSQL, MongoDB, Redis, MySQL
Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins, GitHub Actions
Tools: Git, Jira, Figma, Postman

PROFESSIONAL EXPERIENCE

Senior Software Engineer | TechCorp Inc. | Jan 2020 - Present
• Led development of microservices architecture serving 1M+ daily active users
• Reduced system latency by 40% through performance optimization and caching strategies
• Mentored team of 5 junior engineers and established code review processes
• Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes
• Technologies: React, Node.js, AWS, PostgreSQL, Docker

Software Engineer | StartupXYZ | Jun 2018 - Dec 2019
• Built full-stack e-commerce platform from scratch using React and Node.js
• Developed RESTful APIs and real-time features using WebSocket
• Improved application performance by 60% through code optimization
• Collaborated with product team to define technical requirements
• Technologies: React, Express, MongoDB, Stripe API

Junior Developer | WebSolutions LLC | Aug 2017 - May 2018
• Developed responsive websites using HTML, CSS, and JavaScript
• Worked on bug fixes and feature enhancements for client projects
• Learned agile development methodologies and version control with Git
• Technologies: JavaScript, PHP, MySQL, WordPress

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2017
GPA: 3.8/4.0
Relevant Coursework: Data Structures, Algorithms, Database Systems, Software Engineering

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (2021)
• Google Cloud Professional Cloud Architect (2022)
• Certified Kubernetes Administrator (CKA) (2023)

PROJECTS
E-Commerce Platform | Personal Project
• Built scalable e-commerce platform using React, Node.js, and PostgreSQL
• Implemented payment processing with Stripe and inventory management
• Deployed on AWS with auto-scaling and load balancing
• GitHub: github.com/johndoe/ecommerce-platform

LANGUAGES
• English (Native)
• Spanish (Conversational)
• Mandarin (Basic)`;

  const handleParseResume = async () => {
    if (!resumeText.trim()) {
      setError('Please provide resume text to parse');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      // Simulate API call to OpenAI for parsing
      // In real implementation, this would call the backend endpoint
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

      // Mock parsed data that would come from OpenAI
      const mockParsedData = {
        personalInfo: {
          name: 'John Doe',
          email: 'john.doe@techcorp.com',
          phone: '(555) 123-4567',
          location: 'San Francisco, CA',
          linkedIn: 'linkedin.com/in/johndoe',
        },
        summary: 'Experienced full-stack software engineer with 6+ years developing scalable web applications. Expertise in React, Node.js, and cloud technologies.',
        skills: {
          technical: ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'AWS', 'PostgreSQL', 'Docker', 'Kubernetes'],
          soft: ['Leadership', 'Team Management', 'Mentoring', 'Problem Solving', 'Communication'],
          certifications: ['AWS Certified Solutions Architect', 'Google Cloud Professional Cloud Architect', 'Certified Kubernetes Administrator'],
        },
        experience: [
          {
            title: 'Senior Software Engineer',
            company: 'TechCorp Inc.',
            duration: 'Jan 2020 - Present',
            location: 'San Francisco, CA',
            description: 'Led development of microservices architecture serving 1M+ daily active users',
            achievements: ['Reduced system latency by 40%', 'Mentored team of 5 engineers', 'Implemented CI/CD pipelines'],
          },
          {
            title: 'Software Engineer',
            company: 'StartupXYZ',
            duration: 'Jun 2018 - Dec 2019',
            location: 'San Francisco, CA',
            description: 'Built full-stack e-commerce platform from scratch using React and Node.js',
            achievements: ['Improved application performance by 60%', 'Developed RESTful APIs'],
          },
        ],
        education: [
          {
            degree: 'Bachelor of Science in Computer Science',
            institution: 'University of California, Berkeley',
            graduationYear: '2017',
            gpa: '3.8',
            major: 'Computer Science',
          },
        ],
        projects: [
          {
            name: 'E-Commerce Platform',
            description: 'Built scalable e-commerce platform using React, Node.js, and PostgreSQL',
            technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'AWS'],
          },
        ],
        languages: ['English', 'Spanish', 'Mandarin'],
        experienceLevel: 'senior' as const,
        totalYearsExperience: 6,
      };

      setParsedData(mockParsedData);
    } catch (err) {
      setError('Failed to parse resume. Please try again.');
      console.error('Resume parsing error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const loadSampleResume = () => {
    setResumeText(sampleResume);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          AI Resume Parsing Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience intelligent resume parsing that extracts key information, auto-populates candidate fields, and enables advanced search by skills and experience.
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Extraction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Extract skills, experience, education</li>
              <li>• Parse contact information</li>
              <li>• Identify experience level</li>
              <li>• Generate searchable content</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Auto-Population
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Auto-fill candidate profiles</li>
              <li>• Update contact information</li>
              <li>• Set experience level automatically</li>
              <li>• Track years of experience</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Skills Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Search by technical skills</li>
              <li>• Filter by certifications</li>
              <li>• Find by experience level</li>
              <li>• Advanced filtering options</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="parser" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="parser">Resume Parser</TabsTrigger>
          <TabsTrigger value="results">Parsed Results</TabsTrigger>
        </TabsList>

        <TabsContent value="parser" className="space-y-6">
          {/* Resume Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Resume Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button onClick={loadSampleResume} variant="outline" size="sm">
                  Load Sample Resume
                </Button>
                <Button 
                  onClick={() => setResumeText('')} 
                  variant="outline" 
                  size="sm"
                  disabled={!resumeText}
                >
                  Clear
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Paste Resume Text:
                </label>
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste the resume text here for AI parsing..."
                  className="min-h-[300px] font-mono text-sm"
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
                disabled={isParsing || !resumeText.trim()}
                className="w-full"
                size="lg"
              >
                {isParsing ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-pulse" />
                    Parsing Resume with AI...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Parse Resume with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {parsedData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Extracted Resume Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Info */}
                <div>
                  <h3 className="font-semibold mb-3 text-blue-600">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm bg-blue-50 p-4 rounded-lg">
                    <div><strong>Name:</strong> {parsedData.personalInfo.name}</div>
                    <div><strong>Email:</strong> {parsedData.personalInfo.email}</div>
                    <div><strong>Phone:</strong> {parsedData.personalInfo.phone}</div>
                    <div><strong>Location:</strong> {parsedData.personalInfo.location}</div>
                  </div>
                </div>

                <Separator />

                {/* Summary */}
                <div>
                  <h3 className="font-semibold mb-3 text-green-600">Professional Summary</h3>
                  <p className="text-sm text-gray-700 bg-green-50 p-4 rounded-lg leading-relaxed">
                    {parsedData.summary}
                  </p>
                </div>

                <Separator />

                {/* Skills */}
                <div>
                  <h3 className="font-semibold mb-3 text-purple-600">Extracted Skills</h3>
                  <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-blue-700 mb-2">Technical Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills.technical.map((skill: string, index: number) => (
                          <Badge key={index} variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">Soft Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills.soft.map((skill: string, index: number) => (
                          <Badge key={index} variant="outline" className="border-green-300 text-green-700">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-purple-700 mb-2">Certifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills.certifications.map((cert: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Experience Summary */}
                <div>
                  <h3 className="font-semibold mb-3 text-orange-600">Experience Analysis</h3>
                  <div className="grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded-lg">
                    <div className="text-sm">
                      <strong>Experience Level:</strong>
                      <Badge className="ml-2 bg-orange-200 text-orange-800" variant="secondary">
                        {parsedData.experienceLevel}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <strong>Total Experience:</strong> {parsedData.totalYearsExperience} years
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Work Experience */}
                <div>
                  <h3 className="font-semibold mb-3 text-indigo-600">Work Experience</h3>
                  <div className="space-y-4">
                    {parsedData.experience.map((exp: any, index: number) => (
                      <div key={index} className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-indigo-800">{exp.title}</h4>
                            <p className="text-sm text-indigo-600">{exp.company}</p>
                          </div>
                          <Badge variant="outline" className="border-indigo-300 text-indigo-700">
                            {exp.duration}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{exp.description}</p>
                        {exp.achievements && (
                          <div>
                            <strong className="text-xs text-indigo-600">Key Achievements:</strong>
                            <ul className="text-xs text-gray-600 mt-1">
                              {exp.achievements.map((achievement: string, i: number) => (
                                <li key={i} className="ml-4">• {achievement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Resume Parsed Yet</h3>
                <p className="text-gray-500">Go to the Resume Parser tab to analyze a resume with AI</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Search by Skills Demo */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Skills-Based Search Capability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Searchable Skills Extracted:</h4>
              <div className="flex flex-wrap gap-1">
                {parsedData.skills.technical.slice(0, 8).map((skill: string, index: number) => (
                  <Badge key={index} variant="outline" className="border-yellow-400 text-yellow-700 text-xs">
                    {skill}
                  </Badge>
                ))}
                {parsedData.skills.technical.length > 8 && (
                  <Badge variant="outline" className="border-yellow-400 text-yellow-700 text-xs">
                    +{parsedData.skills.technical.length - 8} more
                  </Badge>
                )}
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                Beta testers can now search for candidates using these extracted skills, making talent discovery much more efficient.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}