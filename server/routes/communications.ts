import { Router } from 'express';
import { storage } from '../storage/index';
import { writeLimiter } from '../middleware/rate-limit';
import { messagesQuerySchema, messageFieldsPresets, type PaginatedMessages } from '../../shared/schema';
import { generateETag, setResponseCaching } from './utils';

export function createCommunicationsRoutes() {
  const router = Router();

  router.get("/api/messages", async (req, res) => {
    try {
      const isPaginatedRequest = 'limit' in req.query || 'cursor' in req.query || 'include' in req.query;
      
      if (isPaginatedRequest) {
        const validationResult = messagesQuerySchema.safeParse(req.query);
        
        if (!validationResult.success) {
          return res.status(400).json({
            error: "Invalid query parameters",
            details: validationResult.error.errors
          });
        }

        const {
          orgId,
          userId,
          limit,
          cursor,
          include,
          threadId,
          type,
          priority,
          clientId,
          jobId,
          candidateId
        } = validationResult.data;

        let fields: string[] | undefined;
        if (include) {
          if (include === 'list') {
            fields = [...messageFieldsPresets.list];
          } else if (include === 'detail') {
            fields = [...messageFieldsPresets.detail];
          } else {
            fields = include.split(',').map(f => f.trim());
          }
        }

        const result = await storage.communications.getMessagesPaginated({
          orgId,
          userId,
          limit,
          cursor,
          fields,
          threadId,
          type,
          priority,
          clientId,
          jobId,
          candidateId
        });

        const etag = generateETag(result);
        
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

        setResponseCaching(res, {
          etag,
          cacheControl: 'private, max-age=60, must-revalidate',
          lastModified: result.data.length > 0 ? new Date(result.data[0].createdAt) : undefined
        });

        console.info('[API] GET /api/messages (paginated) →', { 
          success: true, 
          count: result.data.length,
          hasMore: result.pagination.hasMore,
          totalCount: result.pagination.totalCount
        });

        res.json(result);
      } else {
        const userId = req.query.userId as string;
        const orgId = req.query.org_id as string;
        
        if (!orgId) {
          return res.status(400).json({ error: 'Organization ID required' });
        }
        
        const messages = await storage.communications.getMessages(userId, orgId);
        
        const etag = generateETag(messages);
        
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

        setResponseCaching(res, {
          etag,
          cacheControl: 'private, max-age=60, must-revalidate',
          lastModified: messages.length > 0 ? new Date(messages[0].createdAt) : undefined
        });

        console.info('[API] GET /api/messages (legacy) →', { success: true, count: messages?.length || 0 });
        res.json(messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  router.get("/api/messages/thread/:threadId", async (req, res) => {
    try {
      const orgId = req.query.org_id as string;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }
      
      const messages = await storage.communications.getMessagesByThread(req.params.threadId, orgId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch thread messages" });
    }
  });

  router.get("/api/messages/context", async (req, res) => {
    try {
      const { clientId, jobId, candidateId, org_id } = req.query as Record<string, string>;
      
      if (!org_id) {
        return res.status(400).json({ error: 'Organization ID required' });
      }
      
      const messages = await storage.communications.getMessagesByContext({ 
        clientId, 
        jobId, 
        candidateId,
        orgId: org_id 
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch context messages" });
    }
  });

  router.get("/api/messages/unread-count", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const count = await storage.communications.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  router.post("/api/messages", writeLimiter, async (req, res) => {
    try {
      const message = await storage.communications.createMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Failed to create message" });
    }
  });

  router.patch("/api/messages/:id", writeLimiter, async (req, res) => {
    try {
      const message = await storage.communications.updateMessage(req.params.id, req.body);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Failed to update message" });
    }
  });

  router.post("/api/messages/:id/read", writeLimiter, async (req, res) => {
    try {
      const { userId } = req.body;
      await storage.communications.markMessageAsRead(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to mark message as read" });
    }
  });

  router.post("/api/messages/:id/archive", writeLimiter, async (req, res) => {
    try {
      await storage.communications.archiveMessage(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to archive message" });
    }
  });

  router.get("/api/messages/:id", async (req, res) => {
    try {
      const message = await storage.communications.getMessage(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      console.error("Error fetching message:", error);
      res.status(500).json({ error: "Failed to fetch message" });
    }
  });

  router.get("/api/interviews", async (req, res) => {
    try {
      const { org_id } = req.query;
      if (!org_id) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }
      
      const interviews = await storage.candidates.getInterviews();
      const orgInterviews = interviews.filter(interview => interview.orgId === org_id);
      res.json(orgInterviews);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ error: "Failed to fetch interviews" });
    }
  });

  router.get("/api/interviews/:id", async (req, res) => {
    try {
      const interview = await storage.candidates.getInterview(req.params.id);
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }
      res.json(interview);
    } catch (error) {
      console.error("Error fetching interview:", error);
      res.status(500).json({ error: "Failed to fetch interview" });
    }
  });

  router.post("/api/interviews", writeLimiter, async (req, res) => {
    try {
      const interview = await storage.candidates.createInterview(req.body);
      res.status(201).json(interview);
    } catch (error) {
      console.error("Error creating interview:", error);
      res.status(500).json({ error: "Failed to create interview" });
    }
  });

  router.put("/api/interviews/:id", writeLimiter, async (req, res) => {
    try {
      const interview = await storage.candidates.updateInterview(req.params.id, req.body);
      res.json(interview);
    } catch (error) {
      console.error("Error updating interview:", error);
      res.status(500).json({ error: "Failed to update interview" });
    }
  });

  router.delete("/api/interviews/:id", writeLimiter, async (req, res) => {
    try {
      await storage.candidates.deleteInterview(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting interview:", error);
      res.status(500).json({ error: "Failed to delete interview" });
    }
  });

  router.get("/api/interviews/job-candidate/:jobCandidateId", async (req, res) => {
    try {
      const interviews = await storage.candidates.getInterviewsByJobCandidate(req.params.jobCandidateId);
      res.json(interviews);
    } catch (error) {
      console.error("Error fetching interviews by job candidate:", error);
      res.status(500).json({ error: "Failed to fetch interviews" });
    }
  });

  return router;
}
