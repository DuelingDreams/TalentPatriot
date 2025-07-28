import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { nanoid } from 'nanoid'

const router = Router()

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueId = nanoid()
    const ext = path.extname(file.originalname)
    const filename = `resume_${uniqueId}${ext}`
    cb(null, filename)
  }
})

// File filter to allow only specific file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
})

// Resume upload endpoint
router.post('/resume', upload.single('resume'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a resume file to upload'
      })
    }

    const { candidateId } = req.body
    if (!candidateId) {
      return res.status(400).json({ 
        error: 'Missing candidate ID',
        message: 'Candidate ID is required for file upload'
      })
    }

    // Generate file URL
    const fileUrl = `/uploads/resumes/${req.file.filename}`
    
    res.json({
      success: true,
      fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      candidateId,
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

// Resume deletion endpoint
router.delete('/resume/:filename', (req, res) => {
  try {
    const { filename } = req.params
    const filePath = path.join(uploadsDir, filename)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.json({ 
        success: true, 
        message: 'Resume deleted successfully' 
      })
    } else {
      res.status(404).json({ 
        error: 'File not found',
        message: 'The specified resume file does not exist'
      })
    }
  } catch (error) {
    console.error('Resume deletion error:', error)
    res.status(500).json({ 
      error: 'Deletion failed',
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

export { router as uploadRouter }