import type {
  Message,
  MessageRecipient,
  MessageThread,
  ConnectedAccount,
  CalendarEvent,
  OrganizationEmailSettings,
  EmailTemplate,
  EmailEvent,
  InsertMessage,
  InsertMessageRecipient,
  InsertMessageThread,
  InsertConnectedAccount,
  InsertCalendarEvent,
  InsertOrganizationEmailSettings,
  InsertEmailTemplate,
  InsertEmailEvent
} from "@shared/schema";

// Communications domain repository interface
export interface ICommunicationsRepository {
  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessages(userId?: string, orgId?: string): Promise<Message[]>;
  getMessagesByThread(threadId: string, orgId: string): Promise<Message[]>;
  getMessagesByContext(params: { clientId?: string; jobId?: string; candidateId?: string; orgId?: string }): Promise<Message[]>;
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
  getEmailTemplateByType(orgId: string, templateType: string): Promise<EmailTemplate | undefined>;
  getSystemEmailTemplateByType(templateType: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(templateId: string, orgId: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(templateId: string, orgId: string): Promise<void>;
  getEmailEvents(orgId: string, options?: { limit?: number; eventType?: string; status?: string }): Promise<EmailEvent[]>;
  createEmailEvent(event: InsertEmailEvent): Promise<EmailEvent>;
  
  // Paginated methods
  getMessagesPaginated(params: {
    orgId: string; // REQUIRED for multi-tenant security
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
  
  // Message Threads (Google integration)
  getThreads(orgId: string, params?: { channelType?: string; limit?: number }): Promise<MessageThread[]>;
  getThread(id: string): Promise<MessageThread | undefined>;
  createThread(thread: InsertMessageThread): Promise<MessageThread>;
  updateThread(id: string, thread: Partial<InsertMessageThread>): Promise<MessageThread>;
  
  // Connected Accounts (OAuth providers)
  getConnectedAccount(userId: string, orgId: string, provider: string, includeInactive?: boolean): Promise<ConnectedAccount | undefined>;
  getConnectedAccounts(userId: string, orgId: string): Promise<ConnectedAccount[]>;
  createConnectedAccount(account: InsertConnectedAccount): Promise<ConnectedAccount>;
  updateConnectedAccount(id: string, account: Partial<InsertConnectedAccount>): Promise<ConnectedAccount>;
  deleteConnectedAccount(id: string): Promise<void>;
  
  // Calendar Events (Google Calendar/Meet)
  getCalendarEvents(orgId: string, params?: { startDate?: Date; endDate?: Date; provider?: string }): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
}