import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { nanoid } from 'nanoid'
import { createClient } from '@supabase/supabase-js'
import rateLimit from 'express-rate-limit'
import { storage } from '../storage/index'

// Extend Express Request to include authentication context
declare global {
  namespace Express {
    interface Request {
      authContext?: {
        userId: string
        orgId: string
      }
    }
  }
}

const router = Router()

// Rate limiter for public resume uploads (prevents abuse)
const publicUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 uploads per 15 minutes
  message: {
    error: 'Too many file uploads from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Configure multer for in-memory file uploads (will upload to Supabase Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'))
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
})

// Initialize Supabase client for storage operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials not configured for file uploads')
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

// REAL authentication middleware that verifies Supabase session
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token'
      })
    }

    // Get user's organizations from database
    const { data: userOrgs, error: orgsError } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)

    if (orgsError) {
      console.error('Failed to fetch user organizations:', orgsError)
      return res.status(500).json({
        error: 'Authentication failed',
        message: 'Failed to verify organization membership'
      })
    }

    if (!userOrgs || userOrgs.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not a member of any organization'
      })
    }

    // Get requested org ID from header or query
    const requestedOrgId = req.headers['x-org-id'] as string || req.query.orgId as string

    let validatedOrgId: string

    // If specific org requested, verify user is a member
    if (requestedOrgId) {
      const isMember = userOrgs.some(org => org.org_id === requestedOrgId)
      
      if (!isMember) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not a member of this organization'
        })
      }
      
      validatedOrgId = requestedOrgId
    } else {
      // Use first org if none specified (for backward compatibility)
      validatedOrgId = userOrgs[0].org_id
    }

    // Store auth context in dedicated property (NOT req.body - multer overwrites it!)
    req.authContext = {
      userId: user.id,
      orgId: validatedOrgId
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Internal server error'
    })
  }
}

// PUBLIC resume upload endpoint for job applications (NO AUTHENTICATION REQUIRED)
// This is used by public job application forms on careers pages
router.post('/public/resume', publicUploadLimiter, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a resume file to upload'
      })
    }

    const { jobId } = req.body
    
    // Validate jobId is provided
    if (!jobId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Job ID is required'
      })
    }

    // Fetch job to get organization ID (validates job exists and gets org_id)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, org_id, title, status')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.error('Job lookup error:', jobError)
      return res.status(404).json({
        error: 'Job not found',
        message: 'The specified job posting does not exist'
      })
    }

    // Verify job is published (only allow uploads for active job postings)
    if (job.status !== 'open') {
      return res.status(403).json({
        error: 'Job not available',
        message: 'This job posting is not currently accepting applications'
      })
    }

    const orgId = job.org_id

    // Generate unique filename with original extension
    const uniqueId = nanoid()
    const ext = req.file.originalname.split('.').pop()
    // Store as: {orgId}/{jobId}/resume_{uniqueId}.{ext}
    const storagePath = `${orgId}/${jobId}/resume_${uniqueId}.${ext}`

    // Upload to Supabase Storage (PRIVATE bucket)
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      return res.status(500).json({
        error: 'Upload failed',
        message: 'Failed to upload resume. Please try again.'
      })
    }

    // Return STORAGE PATH (not signed URL)
    // Frontend will store this path in database
    // Signed URLs will be generated on-demand when viewing
    res.json({
      success: true,
      storagePath: storagePath,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      jobId: jobId,
      orgId: orgId,
      message: 'Resume uploaded successfully'
    })
    
    // NOTE: Auto-parsing will be triggered after candidate record is created
    // The frontend will call POST /api/candidates with the storagePath,
    // and then we'll trigger parsing asynchronously using the candidate ID

  } catch (error) {
    console.error('Public resume upload error:', error)
    res.status(500).json({ 
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// Resume upload endpoint - REQUIRES AUTHENTICATION (for internal use)
// This endpoint now creates BOTH the storage file AND the database record atomically
router.post('/resume', requireAuth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a resume file to upload'
      })
    }

    const { candidateId } = req.body
    // Get validated orgId and userId from authentication context
    const orgId = req.authContext?.orgId
    const userId = req.authContext?.userId
    
    if (!orgId) {
      return res.status(500).json({
        error: 'Internal error',
        message: 'Organization context not available'
      })
    }

    // Validate candidateId is provided for document association
    if (!candidateId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Candidate ID is required for resume upload'
      })
    }

    // Generate unique filename with candidate ID in path for proper organization
    const uniqueId = nanoid()
    const ext = req.file.originalname.split('.').pop()
    // Path format: {orgId}/{candidateId}/resume_{uniqueId}.{ext}
    const storagePath = `${orgId}/${candidateId}/resume_${uniqueId}.${ext}`

    // Step 1: Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      return res.status(500).json({
        error: 'Upload failed',
        message: 'Failed to upload resume to secure storage'
      })
    }

    // Step 2: Insert document record into candidate_documents table
    // Truncate filename to 255 chars to fit varchar(255) column
    const truncatedName = req.file.originalname.substring(0, 255)
    
    const { data: docRecord, error: docError } = await supabase
      .from('candidate_documents')
      .insert({
        org_id: orgId,
        candidate_id: candidateId,
        name: truncatedName,
        file_url: storagePath,
        file_type: 'resume',
        file_size: req.file.size,
        uploaded_by: userId
      })
      .select()
      .single()

    if (docError) {
      console.error('Failed to create document record:', docError)
      // Attempt to clean up the uploaded file since DB insert failed
      await supabase.storage.from('resumes').remove([storagePath])
      return res.status(500).json({
        error: 'Upload failed',
        message: 'Failed to save document record. Please try again.'
      })
    }

    // Step 3: Also update candidate's resume_url for backward compatibility
    const { error: updateError } = await supabase
      .from('candidates')
      .update({ resume_url: storagePath })
      .eq('id', candidateId)

    if (updateError) {
      console.warn('Failed to update candidate resume_url (non-critical):', updateError)
    }

    // Step 4: Create signed URL for immediate access
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(storagePath, 86400) // 24 hours expiry
    
    if (signedError) {
      console.error('Failed to create signed URL:', signedError)
    }
    
    // Only now show success - both storage AND database are updated
    res.json({
      success: true,
      fileUrl: signedUrlData?.signedUrl || null,
      storagePath: storagePath,
      filename: storagePath,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      candidateId: candidateId,
      documentId: docRecord.id,
      message: 'Resume uploaded and saved successfully'
    })

  } catch (error) {
    console.error('Resume upload error:', error)
    res.status(500).json({ 
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// Resume deletion endpoint - REQUIRES AUTHENTICATION
router.delete('/resume/:filename(*)', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params
    const validatedOrgId = req.authContext?.orgId
    
    if (!validatedOrgId) {
      return res.status(500).json({
        error: 'Internal error',
        message: 'Organization context not available'
      })
    }
    
    // Extract orgId from filename (format: orgId/resume_*.ext)
    const fileOrgId = filename.split('/')[0]
    
    // Ensure user can only delete files from their own organization
    if (fileOrgId !== validatedOrgId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete files from your own organization'
      })
    }
    
    const { error } = await supabase.storage
      .from('resumes')
      .remove([filename])

    if (error) {
      console.error('Supabase storage deletion error:', error)
      return res.status(500).json({
        error: 'Deletion failed',
        message: 'Failed to delete resume from secure storage'
      })
    }

    res.json({ 
      success: true, 
      message: 'Resume deleted successfully' 
    })
  } catch (error) {
    console.error('Resume deletion error:', error)
    res.status(500).json({ 
      error: 'Deletion failed',
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// Generate signed URL for resume viewing (PUBLIC - for viewing uploaded resumes)
// Takes a storage path and returns a 24-hour signed URL
router.post('/resume/signed-url', async (req, res) => {
  try {
    const { storagePath } = req.body

    console.log(`[SIGNED-URL] Requesting signed URL for path: "${storagePath}"`)

    if (!storagePath) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Storage path is required'
      })
    }

    // Validate storagePath format: {orgId}/{jobId}/resume_{id}.{ext} or {orgId}/resume_{id}.{ext}
    const pathParts = storagePath.split('/')
    if (pathParts.length < 2) {
      console.error(`[SIGNED-URL] Invalid path format. Parts: ${JSON.stringify(pathParts)}`)
      return res.status(400).json({
        error: 'Invalid storage path',
        message: 'Storage path format is invalid'
      })
    }

    // Check if file exists first
    const { data: listData, error: listError } = await supabase.storage
      .from('resumes')
      .list(pathParts[0], {
        search: pathParts.slice(1).join('/')
      })

    if (listError) {
      console.error(`[SIGNED-URL] Error checking file existence:`, listError)
    } else {
      console.log(`[SIGNED-URL] Files found in ${pathParts[0]}:`, listData?.map(f => f.name))
    }

    // Generate signed URL (24 hours)
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(storagePath, 86400) // 24 hour expiry

    if (error) {
      console.error(`[SIGNED-URL] Failed to create signed URL for "${storagePath}":`, error)
      return res.status(500).json({
        error: 'Failed to generate URL',
        message: 'File not found in storage. The resume may have been deleted or never uploaded.'
      })
    }

    console.log(`[SIGNED-URL] Successfully generated signed URL for "${storagePath}"`)

    res.json({
      success: true,
      signedUrl: data.signedUrl,
      expiresIn: 86400
    })

  } catch (error) {
    console.error('[SIGNED-URL] Signed URL generation error:', error)
    res.status(500).json({
      error: 'Failed to generate URL',
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// Authenticated resume download endpoint - REQUIRES AUTHENTICATION
router.get('/resume/:filename(*)', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params
    const validatedOrgId = req.authContext?.orgId
    
    if (!validatedOrgId) {
      return res.status(500).json({
        error: 'Internal error',
        message: 'Organization context not available'
      })
    }
    
    // Extract orgId from filename (format: orgId/resume_*.ext)
    const fileOrgId = filename.split('/')[0]
    
    // Ensure user can only access files from their own organization
    if (fileOrgId !== validatedOrgId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access files from your own organization'
      })
    }
    
    // Download file from Supabase Storage using service role
    const { data, error } = await supabase.storage
      .from('resumes')
      .download(filename)

    if (error || !data) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The specified resume file does not exist'
      })
    }

    // Convert blob to buffer and send with proper headers
    const buffer = Buffer.from(await data.arrayBuffer())
    
    res.setHeader('Content-Type', data.type)
    res.setHeader('Content-Disposition', `inline; filename="${filename.split('/').pop()}"`)
    res.send(buffer)

  } catch (error) {
    console.error('Resume download error:', error)
    res.status(500).json({ 
      error: 'Download failed',
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

export { router as uploadRouter }
