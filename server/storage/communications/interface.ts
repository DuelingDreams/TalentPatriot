import type {
  Message,
  MessageRecipient,
  OrganizationEmailSettings,
  EmailTemplate,
  EmailEvent,
  InsertMessage,
  InsertMessageRecipient,
  InsertOrganizationEmailSettings,
  InsertEmailTemplate,
  InsertEmailEvent
} from "@shared/schema";

// Communications domain repository interface
export interface ICommunicationsRepository {
  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessages(userId?: string): Promise<Message[]>;
  getMessagesByThread(threadId: string): Promise<Message[]>;
  getMessagesByContext(params: { clientId?: string; jobId?: string; candidateId?: string }): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, message: Partial<InsertMessage>): Promise<Message>;
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  archiveMessage(messageId: string): Promise<void>;
  
  // Message Recipients
  addMessageRecipients(messageId: string, recipientIds: string[]): Promise<MessageRecipient[]>;
  getUnreadMessageCount(userId: string): Promise<number>;
  
  // Email Management
  getOrganizationEmailSettings(orgId: string): Promise<OrganizationEmailSettings | undefined>;
  updateOrganizationEmailSettings(orgId: string, settings: Partial<InsertOrganizationEmailSettings>): Promise<OrganizationEmailSettings>;
  getEmailTemplates(orgId: string): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(templateId: string, orgId: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(templateId: string, orgId: string): Promise<void>;
  getEmailEvents(orgId: string, options?: { limit?: number; eventType?: string; status?: string }): Promise<EmailEvent[]>;
  createEmailEvent(event: InsertEmailEvent): Promise<EmailEvent>;
  
  // Paginated methods
  getMessagesPaginated(params: {
    userId?: string;
    limit?: number;
    cursor?: string;
    fields?: string[];
    threadId?: string;
    type?: string;
    priority?: string;
    clientId?: string;
    jobId?: string;
    candidateId?: string;
  }): Promise<{
    data: Message[];
    pagination: {
      hasMore: boolean;
      nextCursor?: string;
      totalCount?: number;
      limit: number;
    };
  }>;
}