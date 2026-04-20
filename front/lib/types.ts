import { Tenant } from './types';
// ============================================
// Authentication & User Types
// ============================================


export interface PaginatedResponse<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  links: { first: string; last: string; prev: string | null; next: string | null };
}


export interface LoginResponse {
  data: {
    accessToken: string;
    tenant: {
      data: {
        id: string;
        attributes: {
          id: string;
          name: string;
          slug: string;
          status: string;
        }
      }
    }
  },
  message: string;
}

export interface Tenant {
  id: string
  name: string
  slug: string
}

export interface TenantData {
  attributes: Tenant
  id: string
  type: string
}
export interface VerifyOtpResponse {
  tenants: Tenant[]
}


export interface SignupResponse {
  id: number
  name: string
  slug: string
  email: string
}




export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: "owner" | "admin" | "user"
  organizationId: string
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}


export interface UserPreferences {
  id?: number
  language: string
  email_notifications: boolean
  push_notifications: boolean
  theme: "light" | "dark" | "auto"
  timezone: string
}

export interface Organization {
  id: string
  name: string
  industry?: string
  companySize?: string
  salesGoal?: string
  timezone?: string
  onboardingCompleted: boolean
  onboardingStep: number
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  organization: Organization
  token: string
}

// ============================================
// Onboarding Types
// ============================================

export interface OnboardingData {
  // Step 1: Business Information
  businessInfo: {
    companyName: string
    businessEmail?: string
    businessPhone?: string
    industry: string
    websiteUrl?: string
    address?: string
    companySize: string
    salesGoal: string
    timezone: string
    knowledgeBaseFiles?: string[]
  }
  // Step 2: Tools & Integrations
  tools: {
    crm?: CRMIntegration
    phoneSystem?: PhoneIntegration
    email?: EmailIntegration
    calendar?: CalendarIntegration
  }
  // Step 3: Workflow
  workflow: {
    triggers: WorkflowTriggerType[]
    automationRules: AutomationRule[]
  }
  // Step 4: AI Agent
  aiAgent: {
    name: string
    description?: string
    languages: string[]
    mode?: string
    gender?: "male" | "female" | "neutral"
    voiceProvider?: string
    voiceModel?: string
    tone?: string
    openingMessage?: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
  }
  // Step 5: Reporting
  reporting: {
    emailReports: boolean
    reportFrequency: "daily" | "weekly" | "monthly"
    metrics: string[]
  }
  // Step 6: Go Live
  goLive: {
    phonesTested: boolean
    emailsTested: boolean
    calendarTested: boolean
    crmConnected: boolean
    workflowEnabled: boolean
    leadSource?: string
  }
}

// ============================================
// Integration Types
// ============================================

export interface Integration {
  id: string
  type: IntegrationType
  name: string
  status: "connected" | "disconnected" | "error"
  config: Record<string, unknown>
  lastSync?: string
  createdAt: string
}

export type IntegrationType =
  | "hubspot"
  | "zoho"
  | "salesforce"
  | "smtp"
  | "twilio"
  | "voxsun"
  | "google_calendar"
  | "outlook_calendar"
  | "elevenlabs"
  | "vapi"
  | "webhook"

export interface CRMIntegration {
  provider: "hubspot" | "zoho" | "salesforce" | "boostmydeal" | "none"
  apiKey?: string
  connected: boolean
}

export interface PhoneIntegration {
  provider: "twilio" | "voxsun" | "boostmydeal" | "none"
  phoneNumbers: PhoneNumber[]
  connected: boolean
}

// Raw JSON:API item returned by PhoneNumberResource
export interface PhoneNumberApiItem {
  id: string
  type: string
  attributes: {
    did: string
    country_code: string
    provider: "voxsun" | "twilio"
    created_at: string
    updated_at: string
  }
}

// Flat shape used in components
export interface PhoneNumber {
  id: string
  did: string
  country_code: string
  provider: "voxsun" | "twilio"
  created_at: string
  updated_at: string
}

export interface PhoneNumberProviderConfig {
  // Twilio
  account_sid?: string
  auth_token?: string
  // Voxsun
  username?: string
  secret?: string
  sip_domain?: string
}

export interface AddPhoneNumberPayload {
  did: string
  country_code: string
  provider: "voxsun" | "twilio"
  provider_config: PhoneNumberProviderConfig
}

export interface EmailIntegration {
  provider: "smtp" | "sendgrid" | "google" | "microsoft" | "none"
  config?: SMTPConfig
  connected: boolean
}

export interface SMTPConfig {
  host: string
  port: number
  username: string
  password: string
  fromEmail: string
  fromName: string
}

export interface CalendarIntegration {
  provider: "google" | "google_calendar" | "outlook" | "outlook_calendar" | "calendly" | "zoho_calendar" | "none"
  connected: boolean
  calendarId?: string
}

// ============================================
// AI Agent Types
// ============================================

// Raw JSON:API item returned by AgentResource
export interface AgentApiItem {
  id: string
  type: string
  attributes: {
    name: string
    description?: string
    language: string
    mode: "pipeline" | "realtime"
    llm_provider?: string
    llm_model?: string
    stt_provider?: string
    stt_model?: string
    tts_provider?: string
    tts_voice?: string
    realtime_provider?: string
    first_message?: string
    user_speaks_first: boolean
    identity?: string
    style?: string
    goal?: string
    voicemail_message?: string
    response_guideline?: string
    fallback?: string
    temperature: number
    call_recording: boolean
    recording_format?: string
    remember_lead_preference: boolean
    enable_human_transfer: boolean
    enable_background_sound: boolean
    background_sound?: boolean
    enable_interruptions: boolean
    enable_vad: boolean
    created_at: string
    updated_at: string
  }
}

// Flat shape used in components (id + attributes merged)
export interface AIAgent {
  id: string
  name: string
  description?: string
  language: string
  mode: "pipeline" | "realtime"
  llm_provider?: string
  llm_model?: string
  stt_provider?: string
  stt_model?: string
  tts_provider?: string
  tts_voice?: string
  realtime_provider?: string
  first_message?: string
  user_speaks_first: boolean
  identity?: string
  style?: string
  goal?: string
  voicemail_message?: string
  response_guideline?: string
  fallback?: string
  temperature: number
  call_recording: boolean
  recording_format?: string
  remember_lead_preference: boolean
  enable_human_transfer: boolean
  enable_background_sound: boolean
  background_sound?: boolean
  enable_interruptions: boolean
  enable_vad: boolean
  created_at: string
  updated_at: string
}

export interface AgentFormData {
  // Tab 1: Basics
  name: string
  description: string
  language: string
  modelProvider: "ChatGPT" | "Gemini Live"
  aiModel: string
  phoneNumberId: string
  firstMessage: string
  userSpeaksFirst: boolean
  workflowIds: string[]

  // Tab 2: Persona
  identity: string
  style: string
  goals: string
  responseGuidelines: string
  errorHandling: string

  // Tab 3: Media & Knowledge
  voiceProvider: "ElevenLabs" | "Rime" | "StreamElements" | "Smallest AI"
  transcriber: "Deepgram" | "OpenAI Whisper"
  voice: string
  geminiLiveVoice: string
  knowledgeBase: string[]
  speed: number

  // Tab 4: Settings
  callRecording: boolean
  callRecordingFormat: "mp3" | "wav" | "m4a"
  rememberLeadPreference: boolean
  voicemailDetection: boolean
  voicemailMessage: string
  enableCallTransfer: boolean
  transferPhoneNumber: string
  keyboardSound: boolean
  temperature: number
  maxTokens: number

  // Tab 5: Post Call Analysis
  userTags: string[]
  systemTags: string[]
}

export const SYSTEM_TAGS = [
  "interested",
  "not_interested",
  "voicemail",
  "demo_scheduled",
  "callback_requested",
  "wrong_number",
  "do_not_call",
  "decision_maker",
  "gatekeeper",
  "needs_follow_up",
  "hot_lead",
  "cold_lead",
  "qualified"
] as const

export const AI_MODELS = {
  ChatGPT: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo"
  ],
  "Gemini Live": [
    "gemini-2.0-flash-live-preview",
    "gemini-1.5-flash-live-preview",
    "gemini-1.5-pro-live-preview"
  ]
} as const

export const GEMINI_VOICES = [
  "Puck", "Charon", "Kore", "Fenrir", "Aoede", "Leda", "Orus", "Zephyr",
  "Atlas", "Helios", "Selene", "Artemis", "Apollo", "Demeter", "Hermes",
  "Iris", "Nike", "Thalia", "Calliope", "Clio", "Erato", "Euterpe",
  "Melpomene", "Polyhymnia", "Terpsichore", "Urania", "Ares", "Athena", "Hera", "Zeus"
] as const

export const RIME_VOICES = [
  { id: "mist", name: "Mist", gender: "female" },
  { id: "grove", name: "Grove", gender: "male" },
  { id: "bay", name: "Bay", gender: "female" },
  { id: "creek", name: "Creek", gender: "male" },
  { id: "lagoon", name: "Lagoon", gender: "female" },
  { id: "marsh", name: "Marsh", gender: "male" },
  { id: "brook", name: "Brook", gender: "female" },
  { id: "summit", name: "Summit", gender: "male" },
  { id: "glen", name: "Glen", gender: "female" },
  { id: "ridge", name: "Ridge", gender: "male" },
  { id: "vale", name: "Vale", gender: "female" },
  { id: "cove", name: "Cove", gender: "male" },
  { id: "meadow", name: "Meadow", gender: "female" },
  { id: "peak", name: "Peak", gender: "male" }
] as const

export interface Voice {
  id: string
  name: string
  provider: string
  gender: "male" | "female" | "neutral"
  language: string
  country?: string
  preview?: string
  isCloned: boolean
}

// ============================================
// Call Types
// ============================================

// Raw JSON:API item shape returned by the backend
export interface CallApiItem {
  id: string
  type: string
  attributes: {
    direction: "inbound" | "outbound"
    status: CallStatus
    from_number: string
    to_number: string
    duration_seconds: number
    cost: number
    recording_url: string | null
    livekit_room: string | null
    created_at: string
    updated_at: string
  }
}

// Flat shape used in components (id + attributes merged)
export interface Call {
  id: string
  direction: "inbound" | "outbound"
  status: CallStatus
  from_number: string
  to_number: string
  duration_seconds: number
  cost: number
  recording_url: string | null
  livekit_room: string | null
  created_at: string
  updated_at: string
}

export interface CreateCall {
  phone_number_id: string
  agent_id: string
  direction: string
  status: string
}

export type CallStatus =
  | "initiated"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "missed"
  | "answered"
  | "unknown"
  | "failed"

export interface CallFilters extends PaginatedRequest {
  "filter[status]"?: CallStatus
  "filter[direction]"?: "inbound" | "outbound"
  "filter[phone_number_id]"?: string
  "filter[agent_id]"?: string
  "filter[from_number]"?: string
  "filter[to_number]"?: string
}

export interface StartCallRequest {
  agent_id: string
  contact_name: string
  to_number: string
}

export interface InitiateCallRequest {
  assistantId: string
  toNumber: string
  contactName: string
  message?: string
}

export interface Transcription {
  id: string
  callId: string
  segments: TranscriptionSegment[]
  fullText: string
  createdAt: string
}

export interface TranscriptionSegment {
  id: string
  speaker: "agent" | "customer"
  text: string
  startTime: number
  endTime: number
  confidence: number
}

// ============================================
// Workflow Types
// ============================================

export interface Workflow {
  id: string
  organizationId: string
  name: string
  description?: string
  isActive: boolean
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: string
  updatedAt: string
}

export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  position: { x: number; y: number }
  data: WorkflowNodeData
}

export interface WorkflowNodeData {
  label: string
  config: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
}

export type WorkflowNodeType =
  | "TRIGGER"
  | "AI_AGENT"
  | "EMAIL_TOOL"
  | "HUBSPOT_TOOL"
  | "ZOHO_TOOL"

export type WorkflowTriggerType =
  | "PHONE_CALL_CONNECTED"
  | "TRANSCRIPT_COMPLETE"
  | "CALL_SUMMARY"
  | "PHONE_CALL_ENDED"
  | "LIVE_TRANSCRIPT"
  | "MANUAL"
  | "WEBHOOK"

export const WORKFLOW_TRIGGER_TYPES: { value: WorkflowTriggerType; label: string }[] = [
  { value: "PHONE_CALL_CONNECTED", label: "Phone Call Connected" },
  { value: "TRANSCRIPT_COMPLETE", label: "Transcript Complete" },
  { value: "CALL_SUMMARY", label: "Call Summary" },
  { value: "PHONE_CALL_ENDED", label: "Phone Call Ended" },
  { value: "LIVE_TRANSCRIPT", label: "Live Transcript" },
  { value: "MANUAL", label: "Manual Trigger" },
  { value: "WEBHOOK", label: "Webhook" },
]

export const HUBSPOT_ACTIONS = [
  { value: "create_deal", label: "Create Deal" },
  { value: "update_deal", label: "Update Deal" },
  { value: "get_deal", label: "Get Deal" },
  { value: "create_contact", label: "Create Contact" },
  { value: "update_contact", label: "Update Contact" },
  { value: "create_note", label: "Create Note" },
] as const

export const ZOHO_ACTIONS = [
  { value: "create_deal", label: "Create Deal" },
  { value: "update_deal", label: "Update Deal" },
  { value: "get_deal", label: "Get Deal" },
  { value: "create_lead", label: "Create Lead" },
  { value: "update_lead", label: "Update Lead" },
  { value: "create_note", label: "Create Note" },
] as const

export interface WorkflowExecution {
  id: string
  workflowId: string
  callId?: string
  assistantName?: string
  phoneNumber?: string
  triggerType: WorkflowTriggerType
  status: "RUNNING" | "COMPLETED" | "FAILED"
  duration?: number
  startedAt: string
  completedAt?: string
  error?: string
  nodeOutputs: Record<string, unknown>
  callSessionPayloads?: {
    timestamp: string
    payload: Record<string, unknown>
  }[]
}

export interface AutomationRule {
  id: string
  name: string
  condition: string
  action: string
  enabled: boolean
}

// ============================================
// Knowledge Base Types
// ============================================

export interface KnowledgeBase {
  id: string
  organizationId: string
  name: string
  description?: string
  documents: KnowledgeDocument[]
  createdAt: string
  updatedAt: string
}

export interface KnowledgeDocument {
  id: string
  name: string
  type: "pdf" | "txt" | "doc" | "url"
  size: number
  url: string
  status: "processing" | "ready" | "error"
  createdAt: string
}

// ============================================
// Team Types
// ============================================

export interface TeamMember {
  id: string
  userId: string
  organizationId: string
  email: string
  name: string
  avatar?: string
  role: "owner" | "admin" | "user"
  status: "active" | "pending"
  invitedAt?: string
  joinedAt?: string
}

export interface TeamInvitation {
  id: string
  email: string
  role: "admin" | "user"
  status: "pending" | "accepted" | "expired"
  invitedBy: string
  createdAt: string
  expiresAt: string
}

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: number
  notification_type: string
  data: Record<string, unknown>
  read_at: string | null
}

// ============================================
// Billing Types
// ============================================

export interface Credits {
  balance: number
  total_purchased: number
  total_used: number
}

export interface Payment {
  id: number
  amount: number
  status: string
  paid_at: string | null
  user?: Record<string, unknown>
  invoice?: Record<string, unknown>
}

export interface PaymentIntent {
  client_secret: string
  payment_intent_id: string
  amount: number
  credits_amount: number
  currency: string
}

export interface CreatePaymentIntentRequest {
  amount: number
  credits_amount: number
  currency?: "usd" | "eur" | "gbp"
  description?: string
}

// ============================================
// Analytics Types
// ============================================

export interface DashboardMetrics {
  total_calls: number
  completed_calls: number
  missed_calls: number
  failed_calls: number
  average_duration: number
  total_cost: number
  inbound_calls: number
  outbound_calls: number
  success_rate: number
}

export interface CallEvolution {
  date: string
  total_calls: number
  completed_calls: number
  missed_calls: number
  average_duration: number
}

export interface AgentStats {
  id: number
  name: string
  total_calls: number
  completed_calls: number
  missed_calls: number
  average_duration: number
  total_cost: number
}

export interface PhoneNumberStats {
  id: number
  did: string
  total_calls: number
  completed_calls: number
  missed_calls: number
  average_duration: number
  total_cost: number
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  pagination?: Pagination
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedRequest {
  [key: string]: unknown
  page?: number
  per_page?: number
  sort?: string
}
