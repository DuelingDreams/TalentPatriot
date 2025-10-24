import { supabase } from '../../lib/supabase';
import type { ICommunicationsRepository } from './interface';
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

/**
 * Convert camelCase object keys to snake_case for Supabase REST API
 * Drizzle uses camelCase for TypeScript types, but Supabase expects snake_case column names
 */
function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

/**
 * Convert snake_case object keys to camelCase for frontend consumption
 * Supabase returns snake_case column names, but frontend expects camelCase
 */
function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

export class CommunicationsRepository implements ICommunicationsRepository {
  // TODO: Extract methods from original storage.ts
  async getMessage(id: string): Promise<Message | undefined> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Error fetching message:', error);
      throw new Error(`Failed to fetch message: ${error.message}`);
    }

    return data;
  }
  
  async getMessages(userId?: string): Promise<Message[]> {
    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return data || [];
  }
  
  async getMessagesByThread(threadId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages by thread:', error);
      throw new Error(`Failed to fetch messages by thread: ${error.message}`);
    }

    return data || [];
  }
  
  async getMessagesByContext(params: any): Promise<Message[]> {
    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.clientId) query = query.eq('client_id', params.clientId);
    if (params.jobId) query = query.eq('job_id', params.jobId);
    if (params.candidateId) query = query.eq('candidate_id', params.candidateId);
    if (params.orgId) query = query.eq('org_id', params.orgId);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages by context:', error);
      throw new Error(`Failed to fetch messages by context: ${error.message}`);
    }

    return data || [];
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert(toSnakeCase(message))
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      throw new Error(`Failed to create message: ${error.message}`);
    }

    return data;
  }
  
  async updateMessage(id: string, message: Partial<InsertMessage>): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .update(toSnakeCase(message))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating message:', error);
      throw new Error(`Failed to update message: ${error.message}`);
    }

    return data;
  }
  
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('recipient_id', userId);

    if (error) {
      console.error('Error marking message as read:', error);
      throw new Error(`Failed to mark message as read: ${error.message}`);
    }
  }
  
  async archiveMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_archived: true })
      .eq('id', messageId);

    if (error) {
      console.error('Error archiving message:', error);
      throw new Error(`Failed to archive message: ${error.message}`);
    }
  }
  
  async addMessageRecipients(messageId: string, recipientIds: string[]): Promise<MessageRecipient[]> {
    const recipients = recipientIds.map(id => ({
      message_id: messageId,
      recipient_id: id,
    }));

    const { data, error } = await supabase
      .from('message_recipients')
      .insert(recipients)
      .select();

    if (error) {
      console.error('Error adding message recipients:', error);
      throw new Error(`Failed to add message recipients: ${error.message}`);
    }

    return data || [];
  }
  
  async getUnreadMessageCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error counting unread messages:', error);
      throw new Error(`Failed to count unread messages: ${error.message}`);
    }

    return count || 0;
  }
  
  async getOrganizationEmailSettings(orgId: string): Promise<OrganizationEmailSettings | undefined> {
    throw new Error('Method not implemented.');
  }
  
  async updateOrganizationEmailSettings(orgId: string, settings: Partial<InsertOrganizationEmailSettings>): Promise<OrganizationEmailSettings> {
    throw new Error('Method not implemented.');
  }
  
  async getEmailTemplates(orgId: string): Promise<EmailTemplate[]> {
    throw new Error('Method not implemented.');
  }
  
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    throw new Error('Method not implemented.');
  }
  
  async updateEmailTemplate(templateId: string, orgId: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    throw new Error('Method not implemented.');
  }
  
  async deleteEmailTemplate(templateId: string, orgId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  async getEmailEvents(orgId: string, options?: any): Promise<EmailEvent[]> {
    throw new Error('Method not implemented.');
  }
  
  async createEmailEvent(event: InsertEmailEvent): Promise<EmailEvent> {
    throw new Error('Method not implemented.');
  }
  
  async getMessagesPaginated(params: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  // ==================== Google Integration Methods ====================
  
  // Message Threads
  async getThreads(orgId: string, params?: { channelType?: string; limit?: number }): Promise<MessageThread[]> {
    let query = supabase
      .from('message_threads')
      .select('*')
      .eq('org_id', orgId)
      .order('last_activity_at', { ascending: false });

    if (params?.channelType) {
      query = query.eq('channel_type', params.channelType);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching threads:', error);
      throw new Error(`Failed to fetch message threads: ${error.message}`);
    }

    return data || [];
  }

  async getThread(id: string): Promise<MessageThread | undefined> {
    const { data, error } = await supabase
      .from('message_threads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Error fetching thread:', error);
      throw new Error(`Failed to fetch thread: ${error.message}`);
    }

    return data;
  }

  async createThread(thread: InsertMessageThread): Promise<MessageThread> {
    const { data, error } = await supabase
      .from('message_threads')
      .insert(toSnakeCase(thread))
      .select()
      .single();

    if (error) {
      console.error('Error creating thread:', error);
      throw new Error(`Failed to create thread: ${error.message}`);
    }

    return data;
  }

  async updateThread(id: string, thread: Partial<InsertMessageThread>): Promise<MessageThread> {
    const { data, error } = await supabase
      .from('message_threads')
      .update(toSnakeCase(thread))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating thread:', error);
      throw new Error(`Failed to update thread: ${error.message}`);
    }

    return data;
  }

  // Connected Accounts (OAuth)
  async getConnectedAccount(userId: string, orgId: string, provider: string): Promise<ConnectedAccount | undefined> {
    const { data, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Error fetching connected account:', error);
      throw new Error(`Failed to fetch connected account: ${error.message}`);
    }

    // Convert snake_case from database to camelCase for frontend
    return data ? toCamelCase(data) as ConnectedAccount : undefined;
  }

  async getConnectedAccounts(userId: string, orgId: string): Promise<ConnectedAccount[]> {
    const { data, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('connected_at', { ascending: false });

    if (error) {
      console.error('Error fetching connected accounts:', error);
      throw new Error(`Failed to fetch connected accounts: ${error.message}`);
    }

    // Convert snake_case from database to camelCase for frontend
    return data ? data.map(account => toCamelCase(account) as ConnectedAccount) : [];
  }

  async createConnectedAccount(account: InsertConnectedAccount): Promise<ConnectedAccount> {
    const { data, error } = await supabase
      .from('connected_accounts')
      .insert(toSnakeCase(account))
      .select()
      .single();

    if (error) {
      console.error('Error creating connected account:', error);
      throw new Error(`Failed to create connected account: ${error.message}`);
    }

    // Convert snake_case from database to camelCase for frontend
    return toCamelCase(data) as ConnectedAccount;
  }

  async updateConnectedAccount(id: string, account: Partial<InsertConnectedAccount>): Promise<ConnectedAccount> {
    const { data, error } = await supabase
      .from('connected_accounts')
      .update(toSnakeCase(account))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating connected account:', error);
      throw new Error(`Failed to update connected account: ${error.message}`);
    }

    // Convert snake_case from database to camelCase for frontend
    return toCamelCase(data) as ConnectedAccount;
  }

  async deleteConnectedAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('connected_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting connected account:', error);
      throw new Error(`Failed to delete connected account: ${error.message}`);
    }
  }

  // Calendar Events
  async getCalendarEvents(orgId: string, params?: { startDate?: Date; endDate?: Date; provider?: string }): Promise<CalendarEvent[]> {
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('org_id', orgId)
      .order('start_at', { ascending: true });

    if (params?.startDate) {
      query = query.gte('start_at', params.startDate.toISOString());
    }

    if (params?.endDate) {
      query = query.lte('end_at', params.endDate.toISOString());
    }

    if (params?.provider) {
      query = query.eq('provider', params.provider);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }

    return data || [];
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Error fetching calendar event:', error);
      throw new Error(`Failed to fetch calendar event: ${error.message}`);
    }

    return data;
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert(toSnakeCase(event))
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }

    return data;
  }

  async updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(toSnakeCase(event))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating calendar event:', error);
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }

    return data;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }
}