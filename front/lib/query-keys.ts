
export const queryKey = {
  dashboardStats: "dashboard-stats",
  callsChart: "calls-chart",
  recentCalls: "recent-calls",
  agentPerformance: "agent-performance",

  auth: {
    me: () => ["auth", "me"] as const,
    organizations: () => ["auth", "organizations"] as const,
    selectOrganization: (organizationId: string) => ["auth", "select-organization", organizationId] as const,
  },

  onboarding: {
    status: () => ["onboarding", "status"] as const,
    step: (step: number) => ["onboarding", "step", step] as const,
  },

  users: {
    all: (tenantId: string) => ["users", tenantId] as const,
    lists: (tenantId: string) => ["users", tenantId, "list"] as const,
    list: (tenantId: string, page: number) => ["users", tenantId, "list", page] as const,
    detail: (tenantId: string, id: string) => ["users", tenantId, "detail", id] as const,
  },

  Organization: {
    all: () => ["organizations"] as const,
    list: (page: number) => ["organizations", "list", page] as const,
    detail: (id: string) => ["organizations", id] as const,
    update: (id: string) => ["organizations", id, "update"] as const,
  },

  Agent: {
    all: () => ["agents"] as const,
    list: (page: number) => ["agents", "list", page] as const,
    detail: (id: string) => ["agents", id] as const,
    create: () => ["agents", "create"] as const,
  },

  KnowlegeBase: {
    all: () => ["knowledge-bases"] as const,
    list: (page: number) => ["knowledge-bases", "list", page] as const,
    detail: (id: string) => ["knowledge-bases", id] as const,
    documents: (id: string) => ["knowledge-bases", id, "documents"] as const,
  },

  Calls: {
    all: (page: number) => ["calls", "list", page] as const,
    detail: (id: string) => ["calls", id] as const,
    transcription: (callId: string) => ["calls", callId, "transcription"] as const,
    export: () => ["calls", "export"] as const,
    webhooks: (id: string) => ["calls", "webhooks", id] as const,
  },

  PhoneNumbers: {
    all: () => ["phone-numbers"] as const,
    detail: (id: string) => ["phone-numbers", id] as const,
  },

  Voices: {
    all: (provider?: string) => ["voices", provider ?? "all"] as const,
    elevenLabs: () => ["voices", "elevenlabs"] as const,
    streamElements: () => ["voices", "streamelements"] as const,
    smallestAI: () => ["voices", "smallest-ai"] as const,
    cloned: () => ["voices", "cloned"] as const,
    detail: (id: string) => ["voices", id] as const,
  },

  Integrations: {
    all: () => ["integrations"] as const,
    detail: (id: string) => ["integrations", id] as const,
    test: (type: string) => ["integrations", type, "test"] as const,
  },

  WorkFlows: {
    all: () => ["workflows"] as const,
    list: (page: number) => ["workflows", "list", page] as const,
    detail: (id: string) => ["workflows", id] as const,
    executions: (workflowId: string) => ["workflows", workflowId, "executions"] as const,
  },

  Notifications: {
    all: (page: number) => ["notifications", "list", page] as const,
    unreadCount: () => ["notifications", "unread-count"] as const,
    detail: (id: string) => ["notifications", id] as const,
  },

  Team: {
    members: () => ["team", "members"] as const,
    invitations: () => ["team", "invitations"] as const,
    memberDetail: (id: string) => ["team", "members", id] as const,
    invitationDetail: (id: string) => ["team", "invitations", id] as const,
  },

  Billing: {
    credits: () => ["billing", "credits"] as const,
    payments: (page = 1, status?: string) =>
      ["billing", "payments", page, status ?? "all"] as const,
    payment: (id: string) => ["billing", "payments", id] as const,
  },

  Settings: {
    profile: () => ["settings", "profile"] as const,
    organization: () => ["settings", "organization"] as const,
    changePassword: () => ["settings", "change-password"] as const,
  },

  metrics: {
    dashboard: (startDate?: string, endDate?: string) =>
      ["dashboard", "metrics", startDate ?? "all", endDate ?? "all"] as const,
    callEvolution: (startDate?: string, endDate?: string, groupBy?: string) =>
      ["dashboard", "call-evolution", startDate ?? "all", endDate ?? "all", groupBy ?? "day"] as const,
    agentStats: (startDate?: string, endDate?: string) =>
      ["dashboard", "agent-stats", startDate ?? "all", endDate ?? "all"] as const,
    phoneNumberStats: (startDate?: string, endDate?: string) =>
      ["dashboard", "phone-number-stats", startDate ?? "all", endDate ?? "all"] as const,
  },

  Preferences: {
    get: () => ["preferences"] as const,
  },
}
