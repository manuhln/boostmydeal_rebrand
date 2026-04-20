"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWizard } from "../wizard-context"
import { WizardLayout } from "../wizard-layout"

type ReportOption = "daily" | "weekly" | "monthly" | "none"

export function ReportStep() {
  const { nextStep, prevStep, skipOnboarding, updateData, data, isLoading } = useWizard()
  const [selected, setSelected] = useState<ReportOption>(data.reporting?.reportFrequency || "daily")

  const handleContinue = () => {
    updateData({
      reporting: {
        emailReports: selected !== "none",
        reportFrequency: selected === "none" ? "weekly" : selected,
        metrics: ["calls", "leads", "automations"],
      },
    })
    nextStep()
  }

  return (
    <WizardLayout
      title="Set Your Reporting Preferences"
      subtitle="Choose how often you want reporting updates from your AI system."
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              id: "daily" as const,
              label: "Daily Summary",
              title: "Daily Summary",
              description: "Get a daily summary of calls, leads and automations.",
              badge: "D",
            },
            {
              id: "weekly" as const,
              label: "Weekly Summary",
              title: "Weekly Summary",
              description: "Get a weekly summary of calls, leads and automations.",
              badge: "W",
            },
            {
              id: "monthly" as const,
              label: "Monthly Report",
              title: "Monthly Summary",
              description: "Receive a detailed monthly report with key metrics.",
              badge: "M",
            },
            {
              id: "none" as const,
              label: "No Reports",
              title: "No Reports",
              description: "Skip these notifications for now.",
              badge: "X",
            },
          ].map((option) => (
            <div key={option.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    selected === option.id ? "border-primary bg-primary text-white" : "border-gray-300 bg-white"
                  )}
                >
                  {selected === option.id && <CheckCircle2 className="h-2.5 w-2.5" />}
                </div>
                <span className={cn("text-sm font-medium", selected === option.id ? "text-gray-900" : "text-gray-500")}>
                  {option.label}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelected(option.id)}
                className="rounded-xl border border-gray-200 bg-white p-5 text-center transition-all hover:shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700">
                  {option.badge}
                </div>
                <p className="text-sm font-semibold text-gray-800">{option.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">{option.description}</p>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <div className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-500">
            {selected === "none" ? "Reports disabled for now." : `Current selection: ${selected}`}
          </div>
        </div>
      </div>
    </WizardLayout>
  )
}
