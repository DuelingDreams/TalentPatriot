import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { nanoid } from 'nanoid'
import { createClient } from '@supabase/supabase-js'

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

// Resume upload endpoint - REQUIRES AUTHENTICATION
router.post('/resume', requireAuth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a resume file to upload'
      })
    }

    const { candidateId } = req.body
    // Get validated orgId from authentication context (protected from multer overwrite)
    const orgId = req.authContext?.orgId
    
    if (!orgId) {
      return res.status(500).json({
        error: 'Internal error',
        message: 'Organization context not available'
      })
    }

    // Generate unique filename with original extension
    const uniqueId = nanoid()
    const ext = req.file.originalname.split('.').pop()
    const filename = `${orgId}/resume_${uniqueId}.${ext}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(filename, req.file.buffer, {
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

    // Create signed URL for secure access (expires in 24 hours)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(filename, 86400) // 24 hours expiry
    
    if (signedError) {
      console.error('Failed to create signed URL:', signedError)
      return res.status(500).json({
        error: 'Upload completed but failed to generate secure URL',
        message: 'Please contact support'
      })
    }
    
    res.json({
      success: true,
      fileUrl: signedUrlData.signedUrl,
      filename: filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      candidateId: candidateId || 'temp-job-application',
      message: 'Resume uploaded successfully'
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
