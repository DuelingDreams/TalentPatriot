import { Router } from 'express'
import multer from 'multer'
import { nanoid } from 'nanoid'
import { createClient } from '@supabase/supabase-js'

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

// Resume upload endpoint - uploads to Supabase Storage
router.post('/resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a resume file to upload'
      })
    }

    const { candidateId, orgId } = req.body
    
    if (!orgId) {
      return res.status(400).json({
        error: 'Organization ID required',
        message: 'Resume uploads must be associated with an organization'
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

    // Get the public URL (requires RLS policy for authenticated access)
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filename)
    
    res.json({
      success: true,
      fileUrl: urlData.publicUrl,
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

// Resume deletion endpoint - deletes from Supabase Storage
router.delete('/resume/:filename(*)', async (req, res) => {
  try {
    const { filename } = req.params
    
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

// Authenticated resume download endpoint
router.get('/resume/:filename(*)', async (req, res) => {
  try {
    const { filename } = req.params
    
    // Download file from Supabase Storage
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
