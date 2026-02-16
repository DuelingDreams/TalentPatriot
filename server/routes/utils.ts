import type { Response } from "express";
import crypto from "crypto";
import multer from "multer";

export type JobDatabaseRow = {
  id: string;
  org_id: string;
  public_slug: string | null;
  title: string;
  description: string | null;
  location: string | null;
  department: string | null;
  job_type: string;
  status: string;
  record_status: string;
  experience_level: string | null;
  remote_option: string | null;
  salary_range: string | null;
  created_at: string;
  updated_at: string | null;
};

export type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  source?: string;
  job?: {
    org_id: string;
  };
  candidate?: {
    id: string;
    name: string;
  };
};

export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

export function generateETag(data: unknown): string {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

export function setResponseCaching(res: Response, options: {
  etag?: string;
  cacheControl?: string;
  lastModified?: Date;
} = {}) {
  if (options.etag) {
    res.setHeader('ETag', `"${options.etag}"`);
  }

  if (options.cacheControl) {
    res.setHeader('Cache-Control', options.cacheControl);
  } else {
    res.setHeader('Cache-Control', 'private, max-age=60, must-revalidate');
  }

  if (options.lastModified) {
    res.setHeader('Last-Modified', options.lastModified.toUTCString());
  }

  res.setHeader('Vary', 'Accept-Encoding, Authorization, X-Org-Id');
}

export function mapPublicJobRow(row: JobDatabaseRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    public_slug: row.public_slug,
    title: row.title,
    description: row.description,
    location: row.location,
    department: row.department,
    jobType: row.job_type,
    status: row.status,
    recordStatus: row.record_status,
    experienceLevel: row.experience_level,
    remoteOption: row.remote_option,
    salaryRange: row.salary_range,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
  };
}
