import { pgEnum } from "drizzle-orm/pg-core";

export const jobStatusEnum = pgEnum('job_status', ['draft', 'open', 'closed', 'on_hold', 'filled', 'archived', 'pending_approval', 'approved', 'closed_cancelled', 'closed_no_hire']);
export const jobTypeEnum = pgEnum('job_type', ['full-time', 'part-time', 'contract', 'freelance', 'internship']);
export const candidateStageEnum = pgEnum('candidate_stage', ['applied', 'phone_screen', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected']);
export const recordStatusEnum = pgEnum('record_status', ['active', 'inactive', 'demo']);
export const userRoleEnum = pgEnum('user_role', ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer', 'platform_admin', 'user']);
export const orgRoleEnum = pgEnum('org_role', ['owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer']);
export const interviewTypeEnum = pgEnum('interview_type', ['phone', 'video', 'in_person', 'technical']);
export const interviewStatusEnum = pgEnum('interview_status', ['scheduled', 'completed', 'cancelled', 'no_show']);
export const messageTypeEnum = pgEnum('message_type', ['general', 'interview', 'application', 'team', 'internal', 'client', 'candidate', 'system']);
export const messagePriorityEnum = pgEnum('message_priority', ['low', 'normal', 'high', 'urgent']);
export const experienceLevelEnum = pgEnum('experience_level', ['entry', 'mid', 'senior', 'executive']);
export const remoteOptionEnum = pgEnum('remote_option', ['onsite', 'remote', 'hybrid']);
export const importStatusEnum = pgEnum('import_status', ['pending', 'processing', 'completed', 'failed', 'cancelled']);
export const importTypeEnum = pgEnum('import_type', ['candidates', 'jobs', 'both']);
export const providerEnum = pgEnum('provider', ['google', 'microsoft', 'zoom']);
export const channelTypeEnum = pgEnum('channel_type', ['internal', 'email', 'client_portal']);
export const calendarEventStatusEnum = pgEnum('calendar_event_status', ['confirmed', 'tentative', 'cancelled']);
export const parsingStatusEnum = pgEnum('parsing_status', ['pending', 'processing', 'completed', 'failed']);
export const connectionHealthEnum = pgEnum('connection_health', ['healthy', 'needs_reconnect', 'error', 'unknown']);

export const onboardingStatusEnum = pgEnum('onboarding_status_enum', ['not_started', 'profile_incomplete', 'awaiting_admin', 'ready_to_launch', 'live']);
export const careersStatusEnum = pgEnum('careers_status_enum', ['draft', 'review_requested', 'published', 'paused', 'archived']);
export const membershipStatusEnum = pgEnum('membership_status_enum', ['pending', 'active', 'suspended', 'revoked']);
export const brandingChannelEnum = pgEnum('branding_channel_enum', ['careers', 'email', 'portal']);
