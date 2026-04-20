"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWizard } from "../wizard-context"
import { WizardLayout } from "../wizard-layout"

const VOICES = [
  "Default Voice",
  "Male Voice",
  "Female Voice",
  "Neutral Voice",
]

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Arabic",
]

export function AIAgentStep() {
  const { nextStep, prevStep, skipOnboarding, updateData, data, isLoading } = useWizard()

  const [useCases, setUseCases] = useState({
    inbound: true,
    booking: true,
    missedCall: true,
  })
  const [voice, setVoice] = useState(data.aiAgent?.voiceModel || "Default Voice")
  const [tone, setTone] = useState(data.aiAgent?.tone || "Professional")
  const [language, setLanguage] = useState(data.aiAgent?.languages?.[0] || "English")
  const [transferWhen, setTransferWhen] = useState({
    pricingRequest: true,
    objections: false,
    angryLead: false,
  })
  const [transferHow, setTransferHow] = useState({
    bookMeeting: true,
    transferCall: true,
    createTask: true,
  })

  const toggleUseCase = (key: keyof typeof useCases) => {
    setUseCases((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleTransferWhen = (key: keyof typeof transferWhen) => {
    setTransferWhen((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleTransferHow = (key: keyof typeof transferHow) => {
    setTransferHow((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleContinue = () => {
    updateData({
      aiAgent: {
        name: data.aiAgent?.name || "AI Voice Agent",
        description: "Configured from onboarding-style wizard screen",
        gender: "neutral",
        voiceProvider: "openai",
        voiceModel: voice,
        tone,
        openingMessage: "Configured from setup wizard",
        systemPrompt: "Follow the configured use cases and handoff rules.",
        temperature: 0.7,
        maxTokens: 2048,
        languages: [language],
      },
    })
    nextStep()
  }

  const anyUseCaseSelected = Object.values(useCases).some(Boolean)

  return (
    <WizardLayout
      title="Configure Your AI Agent"
      subtitle="Customize how the AI voice agent should engage, qualify, and hand off calls."
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
            <Button onClick={handleContinue} disabled={!anyUseCaseSelected || isLoading} className="h-12 rounded-2xl px-8">
              Continue
            </Button>
          </div>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 border-b border-gray-200 pb-2 text-base font-semibold text-gray-900">Use Cases</h3>
            <div className="space-y-4">
              {[
                { key: "inbound" as const, title: "Inbound qualification", description: "Answer and qualify incoming leads." },
                { key: "booking" as const, title: "Booking & Scheduling", description: "Assist in booking and scheduling." },
                { key: "missedCall" as const, title: "Missed call follow-up", description: "Callback leads who miss your call." },
              ].map((item) => (
                <button key={item.key} type="button" onClick={() => toggleUseCase(item.key)} className="flex items-start gap-3 text-left">
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border",
                      useCases[item.key] ? "border-primary bg-primary text-white" : "border-gray-300 bg-gray-100"
                    )}
                  >
                    {useCases[item.key] && <Check className="h-3 w-3" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-gray-500">
                {anyUseCaseSelected ? "At least one use case is selected." : "Please select one or more use cases."}
              </span>
            </div>
          </Card>

          <Card className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-base font-semibold text-gray-900">Voice & Tone</h3>
              <span className="text-sm text-gray-400">Language</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Voice</label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger className="h-11 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Tone</label>
                <div className="flex overflow-hidden rounded-lg border border-gray-200">
                  {["Professional", "Friendly", "Direct"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTone(option)}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium transition-colors",
                        tone === option ? "bg-primary text-primary-foreground" : "bg-white text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-11 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="rounded-xl border-2 border-primary bg-white p-5">
            <h3 className="mb-4 border-b border-gray-200 pb-2 text-base font-semibold text-gray-900">Handoff Rules (required)</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">When to transfer call:</p>
                {[
                  { key: "pricingRequest" as const, label: "Pricing Request" },
                  { key: "objections" as const, label: "Objections" },
                  { key: "angryLead" as const, label: "Angry Lead" },
                ].map((item) => (
                  <button key={item.key} type="button" onClick={() => toggleTransferWhen(item.key)} className="flex items-center gap-2 text-sm text-gray-700">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border",
                        transferWhen[item.key] ? "border-primary bg-primary text-white" : "border-gray-300 bg-gray-100"
                      )}
                    >
                      {transferWhen[item.key] && <Check className="h-3 w-3" />}
                    </div>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">How to handle transfer:</p>
                {[
                  { key: "bookMeeting" as const, label: "Book Meeting" },
                  { key: "transferCall" as const, label: "Transfer Call" },
                  { key: "createTask" as const, label: "Create Task + notify" },
                ].map((item) => (
                  <button key={item.key} type="button" onClick={() => toggleTransferHow(item.key)} className="flex items-center gap-2 text-sm text-gray-700">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border",
                        transferHow[item.key] ? "border-primary bg-primary text-white" : "border-gray-300 bg-gray-100"
                      )}
                    >
                      {transferHow[item.key] && <Check className="h-3 w-3" />}
                    </div>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </WizardLayout>
  )
}
