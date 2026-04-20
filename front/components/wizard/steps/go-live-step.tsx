"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useWizard } from "../wizard-context"
import { WizardLayout } from "../wizard-layout"

export function GoLiveStep() {
  const { prevStep, completeOnboarding, data, isLoading } = useWizard()

  const businessItemsLeft = [
    `Industry: ${data.businessInfo?.industry || "Not set"}`,
    `Country & Timezone: ${data.businessInfo?.timezone || "Not set"}`,
    `Company Size: ${data.businessInfo?.companySize || "Not set"}`,
    `Sales Goal: ${data.businessInfo?.salesGoal || "Not set"}`,
  ]

  const businessItemsRight = [
    `CRM: ${data.tools?.crm?.provider || "Not set"}`,
    `PBX: ${data.tools?.phoneSystem?.provider || "Not set"}`,
    `Email: ${data.tools?.email?.provider || "Not set"}`,
    `Calendar: ${data.tools?.calendar?.provider || "Not set"}`,
  ]

  const workflowItems =
    data.workflow?.automationRules?.map((rule) => `${rule.name}: Active`) || ["No workflow selected"]

  const messagingItems = [
    `Voice: ${data.aiAgent?.voiceModel || "Not set"}`,
    `Tone: ${data.aiAgent?.tone || "Not set"}`,
    `Language: ${data.aiAgent?.languages?.[0] || "Not set"}`,
  ]

  const reportingItems = [
    `Email reports: ${data.reporting?.emailReports ? "Enabled" : "Disabled"}`,
    `Frequency: ${data.reporting?.reportFrequency || "Not set"}`,
    `Metrics: ${(data.reporting?.metrics || []).join(", ") || "Not set"}`,
  ]

  return (
    <WizardLayout
      title="Review Before You Go Live"
      subtitle="Confirm your business profile, connected tools, workflows, and AI setup before launch."
      footer={
        <div className="flex items-center justify-between">
          <Button type="button" variant="secondary" onClick={prevStep} className="h-12 rounded-2xl px-8 bg-[#d0d0d0] text-white hover:bg-[#c5c5c5]">
            Back
          </Button>
          <div className="flex items-center gap-8">
            <Button onClick={completeOnboarding} disabled={isLoading} className="h-12 rounded-2xl px-8">
              Go Live
            </Button>
          </div>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto">
        <Card className="rounded-xl border-2 border-primary bg-white p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <BriefcaseIcon />
            <h3 className="text-base font-semibold text-gray-800">Business Profile</h3>
          </div>
          <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
            <BulletList items={businessItemsLeft} />
            <BulletList items={businessItemsRight} />
          </div>
        </Card>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SectionCard icon={<ToolsIcon />} title="Connected Tools" items={businessItemsRight.slice(0, 3)} />
          <SectionCard icon={<WorkflowIcon />} title="AI Workflows" items={workflowItems} />
          <SectionCard icon={<MessagingIcon />} title="Messaging & Tone" items={messagingItems} />
          <SectionCard icon={<ReportingIcon />} title="Reporting & Tracking" items={reportingItems} />
        </div>
      </div>
    </WizardLayout>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-300" />
          {item}
        </li>
      ))}
    </ul>
  )
}

function SectionCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode
  title: string
  items: string[]
}) {
  return (
    <Card className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2.5">
        {icon}
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      </div>
      <BulletList items={items} />
    </Card>
  )
}

function BriefcaseIcon() {
  return (
    <svg className="h-7 w-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth={1.6} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 12v.01M2 12h20" />
    </svg>
  )
}

function ToolsIcon() {
  return (
    <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" strokeWidth={1.6} />
    </svg>
  )
}

function WorkflowIcon() {
  return (
    <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="6" height="6" rx="1" strokeWidth={1.6} />
      <rect x="15" y="3" width="6" height="6" rx="1" strokeWidth={1.6} />
      <rect x="9" y="15" width="6" height="6" rx="1" strokeWidth={1.6} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 9v3a3 3 0 003 3h6a3 3 0 003-3V9" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 12v3" />
    </svg>
  )
}

function MessagingIcon() {
  return (
    <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function ReportingIcon() {
  return (
    <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
