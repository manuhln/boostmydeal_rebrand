
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
  first_name?: string;
  last_name?: string;
  name: string
  avatar?: string
  role: "owner" | "admin" | "user"
  organizationId: string
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

export interface me {
  Tenant: {
    id: string,
    name: string,
  }
  user: {
    data: {
      id: string;
      type: "users";
      attributes: Partial<User>;
    }
  }
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

export type WorkflowTriggerType =
  | "phone_call_connected"
  | "transcript_complete"
  | "call_summary"
  | "phone_call_ended"
  | "live_transcript"
  | "manual"

export type WorkflowNodeType =
  | "trigger"
  | "ai_agent"
  | "condition"
  | "email_tool"
  | "hubspot_tool"
  | "zoho_tool"
  | "outbound_call"
  | "webhook_tool"

export type WorkflowExecutionStatus = "pending" | "running" | "completed" | "failed"

export interface WorkflowNode {
  id: string
  workflow_id: string
  node_type: WorkflowNodeType
  name: string
  description?: string | null
  position_x: number
  position_y: number
  next_node_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface Workflow {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  trigger_type?: WorkflowTriggerType | null
  trigger_config?: Record<string, unknown> | null
  nodes?: WorkflowNode[]
  created_at?: string
  updated_at?: string
}

export interface LaravelPaginated<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  links: Array<{ url: string | null; label: string; active: boolean }>
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export type WorkflowListResponse = LaravelPaginated<Workflow>

export interface WorkflowMutationResponse {
  message: string
  workflow: Workflow
}

export interface CreateWorkflowPayload {
  name: string
  description?: string | null
  is_active?: boolean
  trigger_type?: WorkflowTriggerType | null
  trigger_config?: Record<string, unknown> | null
}

export type UpdateWorkflowPayload = Partial<CreateWorkflowPayload>

export interface TriggerWorkflowPayload {
  input_data?: Record<string, unknown>
  call_id?: string
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  call_id?: string | null
  status: WorkflowExecutionStatus
  input_data?: Record<string, unknown> | null
  output_data?: Record<string, unknown> | null
  error_message?: Record<string, unknown> | null
  started_at?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export type WorkflowExecutionListResponse = LaravelPaginated<WorkflowExecution>

export interface TriggerWorkflowResponse {
  message: string
  execution: WorkflowExecution
}

export interface SaveWorkflowGraphNode {
  id: string
  node_type: WorkflowNodeType
  name: string
  description?: string | null
  position_x: number
  position_y: number
  config?: Record<string, unknown> | null
  conditions?: Record<string, unknown> | null
  next_node_id?: string | null
  true_node_id?: string | null
  false_node_id?: string | null
}

export interface SaveWorkflowGraphPayload {
  nodes: SaveWorkflowGraphNode[]
}

export const WORKFLOW_TRIGGER_TYPES: { value: WorkflowTriggerType; label: string }[] = [
  { value: "phone_call_connected", label: "Phone Call Connected" },
  { value: "transcript_complete", label: "Transcript Complete" },
  { value: "call_summary", label: "Call Summary" },
  { value: "phone_call_ended", label: "Phone Call Ended" },
  { value: "live_transcript", label: "Live Transcript" },
  { value: "manual", label: "Manual Trigger" },
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

// Front-only type: the backend encodes topology as `next_node_id` / `true_node_id` /
// `false_node_id` pointers on each node (no edges table). The adapter in
// lib/workflow-graph.ts converts between React Flow edges and backend pointers.
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
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

export type ProcessingStatus = "pending" | "processing" | "completed" | "failed"

export interface KnowledgeBaseApiItem {
  id: string
  type: string
  attributes: {
    name: string
    description?: string
    document_type: string
    file_name?: string | null
    file_size?: number | null
    s3_url?: string | null
    processing_status?: ProcessingStatus | null
    chunks_count?: number | null
    last_processed_at?: string | null
    created_at: string
    updated_at: string
  }
  relationships?: {
    agents?: { data: Array<{ type: string; id: string }> }
  }
}

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  document_type: string
  file_name?: string | null
  file_size?: number | null
  s3_url?: string | null
  processing_status?: ProcessingStatus | null
  chunks_count?: number | null
  last_processed_at?: string | null
  agents_count?: number
  created_at: string
  updated_at: string
}

export interface KnowledgeBasePayload {
  name: string
  description?: string
  file?: File
}

// ============================================
// Team Types
// ============================================

export type TeamRole = "Owner" | "Admin" | "Member"

export interface RoleIncluded {
  id: string
  type: "roles"
  attributes: { name: TeamRole }
}

export interface UserApiItem {
  id: string
  type: string
  attributes: {
    first_name: string | null
    last_name: string | null
    email: string
    created_at: string
    updated_at: string
  }
  relationships?: {
    roles?: { data: Array<{ id: string; type: string }> }
  }
}

export interface TeamMember {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  role: TeamRole | null
  created_at: string
  updated_at: string
}

export interface TenantInvitationApiItem {
  id: string
  type: string
  attributes: {
    email: string
    name: string | null
    role: TeamRole
    expires_at: string
    accepted_at: string | null
    created_at: string
  }
  relationships?: {
    invitedBy?: { data: { id: string; type: string } | null }
  }
}

export interface TeamInvitation {
  id: string
  email: string
  name: string | null
  role: TeamRole
  expires_at: string
  accepted_at: string | null
  created_at: string
}

// ============================================
// Notification Types
// ============================================

export interface NotificationApiItem {
  id: string
  type: string
  attributes: {
    title: string | null
    body: string | null
    notification_type: string | null
    read_at: string | null
    created_at: string
    updated_at: string
  }
}

export interface Notification {
  id: string
  title: string | null
  body: string | null
  notification_type: string | null
  read_at: string | null
  created_at: string
  updated_at: string
}

// ============================================
// Billing Types
// ============================================

export interface Credits {
  balance: number
  total_purchased: number
  total_used: number
}

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded"

export interface Payment {
  // TODO(backend): Payment model has #[Hidden(['id','created_at','updated_at'])]
  // which strips these from the raw JSON response. Remove them from Hidden or
  // expose via a PaymentResource so the front can show them. Until then `id`
  // and `created_at` are undefined here.
  id?: string
  invoice_id: string | null
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  status: PaymentStatus
  amount: number
  currency: string
  description: string | null
  metadata: Record<string, unknown> | null
  failure_reason: string | null
  paid_at: string | null
  refunded_at: string | null
  created_at?: string
}

export interface LaravelPaginator<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
  first_page_url: string | null
  last_page_url: string | null
  next_page_url: string | null
  prev_page_url: string | null
  path: string
  links: Array<{ url: string | null; label: string; active: boolean }>
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
