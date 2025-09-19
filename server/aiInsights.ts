import OpenAI from 'openai'
import { z } from 'zod'

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface RecruitmentData {
  totalJobs: number
  totalCandidates: number
  totalApplications: number
  applicationsTrend: number
  avgTimeToHire: number
  topSources: Array<{ source: string; count: number }>
  pipelineStages: Array<{ stage: string; count: number }>
  recentActivity: Array<{ type: string; count: number; date: string }>
}

// Zod schema for AI response validation
const AIRecommendationSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['optimization', 'risk', 'opportunity', 'action']),
  priority: z.enum(['high', 'medium', 'low']),
  title: z.string(),
  description: z.string(),
  impact: z.string(),
  actionItems: z.array(z.string()),
  confidence: z.number()
})

const AIInsightResponseSchema = z.object({
  summary: z.string(),
  recommendations: z.array(AIRecommendationSchema)
})

interface AIInsightResponse {
  summary: string
  recommendations: Array<{
    id: string
    type: 'optimization' | 'risk' | 'opportunity' | 'action'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    impact: string
    actionItems: string[]
    confidence: number
  }>
  metrics: {
    trendsAnalyzed: number
    patternsDetected: number
    recommendationsGenerated: number
  }
  lastUpdated: string
}

export async function generateAIInsights(orgId: string, recruitmentData: RecruitmentData): Promise<AIInsightResponse> {
  try {
    const prompt = `You are an AI recruitment analytics expert analyzing ATS data for a hiring organization. Based on the following recruitment metrics, provide intelligent insights and actionable recommendations.

Recruitment Data:
- Total Jobs: ${recruitmentData.totalJobs}
- Total Candidates: ${recruitmentData.totalCandidates}
- Total Applications: ${recruitmentData.totalApplications}
- Applications Trend: ${recruitmentData.applicationsTrend > 0 ? '+' : ''}${recruitmentData.applicationsTrend}% this month
- Average Time to Hire: ${recruitmentData.avgTimeToHire} days
- Top Sources: ${recruitmentData.topSources.map(s => `${s.source} (${s.count})`).join(', ')}
- Pipeline Distribution: ${recruitmentData.pipelineStages.map(s => `${s.stage}: ${s.count}`).join(', ')}

Analyze this data and provide insights in the following JSON format:
{
  "summary": "A concise 2-3 sentence summary of the overall recruitment health and key patterns",
  "recommendations": [
    {
      "id": "unique-id",
      "type": "optimization|risk|opportunity|action",
      "priority": "high|medium|low",
      "title": "Short recommendation title",
      "description": "Detailed explanation of the recommendation",
      "impact": "Expected positive outcome",
      "actionItems": ["Specific action 1", "Specific action 2"],
      "confidence": 85
    }
  ]
}

Generate 3-5 recommendations covering different aspects like sourcing strategy, pipeline efficiency, time-to-hire optimization, candidate experience, and process improvements. Focus on actionable insights that can improve recruitment outcomes.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert recruitment analytics AI that provides data-driven insights and recommendations to improve hiring processes. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    })

    const rawOutput = JSON.parse(response.choices[0].message.content || '{}')
    
    // Parse and validate the AI response using Zod schema
    const parsedResponse = AIInsightResponseSchema.parse(rawOutput)

    // Add unique IDs to recommendations if missing - now type-safe
    const recommendationsWithIds = parsedResponse.recommendations.map((rec, index: number) => ({
      id: rec.id || `rec-${Date.now()}-${index}`,
      type: rec.type,
      priority: rec.priority,
      title: rec.title,
      description: rec.description,
      impact: rec.impact,
      actionItems: rec.actionItems,
      confidence: rec.confidence,
    }))
    
    const aiOutput = {
      summary: parsedResponse.summary,
      recommendations: recommendationsWithIds
    }

    return {
      summary: aiOutput.summary,
      recommendations: aiOutput.recommendations,
      metrics: {
        trendsAnalyzed: recruitmentData.topSources.length + recruitmentData.pipelineStages.length,
        patternsDetected: aiOutput.recommendations.length + 2,
        recommendationsGenerated: aiOutput.recommendations.length,
      },
      lastUpdated: new Date().toISOString(),
    }

  } catch (error) {
    console.error('Error generating AI insights:', error)
    
    // Fallback response in case of API failure
    return {
      summary: "AI insights are temporarily unavailable. Please check your OpenAI API configuration and try again.",
      recommendations: [
        {
          id: "fallback-1",
          type: "action",
          priority: "high",
          title: "Configure AI Insights",
          description: "Set up your OpenAI API key to enable intelligent recruitment recommendations.",
          impact: "Access to data-driven insights and optimization suggestions",
          actionItems: [
            "Verify OpenAI API key is configured",
            "Check API quota and billing status",
            "Refresh insights after configuration"
          ],
          confidence: 100
        }
      ],
      metrics: {
        trendsAnalyzed: 0,
        patternsDetected: 0,
        recommendationsGenerated: 1,
      },
      lastUpdated: new Date().toISOString(),
    }
  }
}

export async function analyzeResumeWithAI(resumeText: string): Promise<{
  skills: string[]
  experience: string
  education: string
  summary: string
  matchScore?: number
}> {
  try {
    const prompt = `Analyze this resume and extract key information in JSON format:

Resume Text:
${resumeText}

Extract the following information and return as JSON:
{
  "skills": ["skill1", "skill2", "skill3"],
  "experience": "Brief summary of work experience",
  "education": "Education background summary",
  "summary": "2-3 sentence professional summary"
}

Focus on technical skills, relevant experience, and key qualifications.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert resume analyzer that extracts structured information from resumes. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1000,
    })

    const analysis = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      skills: analysis.skills || [],
      experience: analysis.experience || '',
      education: analysis.education || '',
      summary: analysis.summary || '',
    }

  } catch (error) {
    console.error('Error analyzing resume with AI:', error)
    throw new Error('Failed to analyze resume with AI')
  }
}