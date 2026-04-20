"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Zap } from "lucide-react"
import { useWizard } from "../wizard-context"
import { WizardLayout } from "../wizard-layout"

export function WorkflowStep() {
  const { nextStep, prevStep, skipOnboarding, updateData, isLoading } = useWizard()

  const [workflows, setWorkflows] = useState({
    leadFollowUp: true,
    quoteOffer: false,
    appointmentScheduling: false,
    missedAppointment: false,
  })

  const toggleWorkflow = (key: keyof typeof workflows) => {
    setWorkflows((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleContinue = () => {
    const enabledRules = [
      { id: "lead_follow_up", name: "Lead Follow-Up Automation", enabled: workflows.leadFollowUp },
      { id: "quote_offer", name: "Quote & Offer Automation", enabled: workflows.quoteOffer },
      { id: "appointment_scheduling", name: "Appointment Scheduling & Reminders", enabled: workflows.appointmentScheduling },
      { id: "missed_appointment", name: "Missed Appointment Recovery", enabled: workflows.missedAppointment },
    ].filter((rule) => rule.enabled)

    updateData({
      workflow: {
        triggers: ["MANUAL"],
        automationRules: enabledRules.map((rule) => ({
          id: rule.id,
          name: rule.name,
          condition: "always",
          action: rule.id,
          enabled: true,
        })),
      },
    })
    nextStep()
  }

  const activeCount = Object.values(workflows).filter(Boolean).length

  return (
    <WizardLayout
      title="Configure Your Workflow"
      subtitle="Choose which automation blocks should be active when your AI system goes live."
      footer={
        <div className="flex items-center justify-between">
          <Button type="button" variant="secondary" onClick={prevStep} className="h-12 rounded-2xl px-8 bg-[#d0d0d0] text-white hover:bg-[#c5c5c5]">
            Back
          </Button>
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={skipOnboarding}
              className="text-sm font-semibold text-gray-500 underline underline-offset-2 transition-colors hover:text-gray-800"
            >
              Skip for now
            </button>
            <Button onClick={handleContinue} disabled={isLoading} className="h-12 rounded-2xl px-8">
              Continue
            </Button>
          </div>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            {
              key: "leadFollowUp" as const,
              title: "Lead Follow-Up Automation",
              description: "AI calls and follows up with leads automatically until response or unsubscribe.",
              disabled: false,
              warning: "",
            },
            {
              key: "quoteOffer" as const,
              title: "Quote & Offer Automation",
              description: "AI sends quotes automatically after qualification.",
              disabled: true,
              warning: "Connect your CRM to enable this workflow",
            },
            {
              key: "appointmentScheduling" as const,
              title: "Appointment Scheduling & Reminders",
              description: "AI books meetings and sends reminders.",
              disabled: true,
              warning: "Connect your calendar to enable this workflow",
            },
            {
              key: "missedAppointment" as const,
              title: "Missed Appointment Recovery",
              description: "Follows up on no-shows and cancellations.",
              disabled: false,
              warning: "",
            },
          ].map((item) => (
            <Card key={item.key} className="flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                <Switch
                  checked={workflows[item.key]}
                  disabled={item.disabled}
                  onCheckedChange={() => toggleWorkflow(item.key)}
                />
              </div>
              <p className="text-sm text-gray-500">{item.description}</p>
              {item.warning && (
                <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500">
                  {item.warning}
                </div>
              )}
            </Card>
          ))}
        </div>

        <Card className="mt-6 bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Workflow Summary</p>
              <p className="text-xs text-muted-foreground">
                {activeCount} automation block{activeCount > 1 ? "s" : ""} selected
              </p>
            </div>
            <Zap className="h-5 w-5 text-primary" />
          </div>
        </Card>
      </div>
    </WizardLayout>
  )
}
