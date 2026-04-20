"use client"

import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Images } from "@/utils/image"
import { useWizard } from "../wizard-context"
import { WizardLayout } from "../wizard-layout"

interface IntegrationOption {
  id: string
  name: string
  image: string
}

interface ConnectionCardProps {
  title: string
  options: IntegrationOption[]
  selected: string
  onSelect: (id: string) => void
  highlighted?: boolean
  compact?: boolean
}

const CRM_OPTIONS: IntegrationOption[] = [
  { id: "hubspot", name: "HubSpot", image: Images.hubspot },
  { id: "zoho", name: "Zoho", image: Images.zohocrm },
  { id: "boostmydeal", name: "Use BoostMyDeal CRM", image: Images.boostmydeal },
]

const PHONE_OPTIONS: IntegrationOption[] = [
  { id: "voxsun", name: "VoxSun (Recommended)", image: Images.voxsun },
  { id: "twilio", name: "Twilio", image: Images.twilio },
]

const EMAIL_OPTIONS: IntegrationOption[] = [
  { id: "smtp", name: "SMTP", image: Images.smtp },
  { id: "google", name: "Google", image: Images.google },
  { id: "microsoft", name: "Microsoft", image: Images.microsoft },
]

const CALENDAR_OPTIONS: IntegrationOption[] = [
  { id: "google_calendar", name: "Google Calendar", image: Images.googleCalendar },
  { id: "outlook_calendar", name: "Outlook Calendar", image: Images.outlook },
  { id: "calendly", name: "Calendly", image: Images.calendly },
  { id: "zoho_calendar", name: "Zoho Calendar", image: Images.zohoCalendar },
]

function RadioOption({
  option,
  selected,
  onSelect,
}: {
  option: IntegrationOption
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      className="flex items-center gap-2 text-sm text-gray-700"
    >
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border-2",
          selected === option.id ? "border-primary" : "border-gray-300"
        )}
      >
        {selected === option.id && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </div>
      <div className="relative h-5 w-5 overflow-hidden">
        <Image src={option.image} alt={option.name} fill className="object-contain" />
      </div>
      <span>{option.name}</span>
    </button>
  )
}

function ConnectionCard({
  title,
  options,
  selected,
  onSelect,
  highlighted = false,
  compact = false,
}: ConnectionCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl border bg-white p-4",
        highlighted ? "border-primary border-2" : "border-gray-200"
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              highlighted ? "bg-green-500 text-white" : "border-2 border-gray-300"
            )}
          >
            {highlighted && <Check className="h-3.5 w-3.5" />}
          </div>
          <span className="text-sm font-semibold text-gray-800">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {!compact && (
            <Button type="button" size="sm" className="h-8 px-4 text-xs">
              Connect
            </Button>
          )}
          <Button type="button" size="sm" variant="secondary" className="h-8 px-4 text-xs">
            Test
          </Button>
          <div className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-400">
            {selected ? "Connected" : "Not Connected"}
          </div>
        </div>
      </div>

      <div className={cn("flex flex-wrap gap-6", compact && "grid grid-cols-2 gap-3")}>
        {options.map((option) => (
          <RadioOption key={option.id} option={option} selected={selected} onSelect={onSelect} />
        ))}
      </div>
    </Card>
  )
}

export function ToolsStep() {
  const { nextStep, prevStep, skipOnboarding, updateData, data, isLoading } = useWizard()

  const [selectedCRM, setSelectedCRM] = useState(data.tools?.crm?.provider || "hubspot")
  const [selectedPhone, setSelectedPhone] = useState(data.tools?.phoneSystem?.provider || "voxsun")
  const [selectedEmail, setSelectedEmail] = useState(data.tools?.email?.provider || "smtp")
  const [selectedCalendar, setSelectedCalendar] = useState(data.tools?.calendar?.provider || "google_calendar")

  const handleContinue = () => {
    updateData({
      tools: {
        crm: {
          provider: selectedCRM as "hubspot" | "zoho" | "salesforce" | "boostmydeal" | "none",
          connected: true,
        },
        phoneSystem: {
          provider: selectedPhone as "twilio" | "voxsun" | "boostmydeal" | "none",
          phoneNumbers: [],
          connected: true,
        },
        email: {
          provider: selectedEmail as "smtp" | "sendgrid" | "google" | "microsoft" | "none",
          connected: true,
        },
        calendar: {
          provider: selectedCalendar as "google" | "google_calendar" | "outlook" | "outlook_calendar" | "calendly" | "zoho_calendar" | "none",
          connected: true,
        },
      },
    })
    nextStep()
  }

  return (
    <WizardLayout
      title="Connect Your Tools"
      subtitle="Link your CRM, phone, email, and calendar systems to activate the full setup."
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
      <div className="max-w-5xl mx-auto space-y-4">
        <ConnectionCard
          title="CRM Connection"
          options={CRM_OPTIONS}
          selected={selectedCRM}
          onSelect={setSelectedCRM}
          highlighted
        />

        <ConnectionCard
          title="Phone System Connection"
          options={PHONE_OPTIONS}
          selected={selectedPhone}
          onSelect={setSelectedPhone}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <ConnectionCard
            title="Email System Connection"
            options={EMAIL_OPTIONS}
            selected={selectedEmail}
            onSelect={setSelectedEmail}
            compact
          />
          <ConnectionCard
            title="Calendar Connection"
            options={CALENDAR_OPTIONS}
            selected={selectedCalendar}
            onSelect={setSelectedCalendar}
            compact
          />
        </div>
      </div>
    </WizardLayout>
  )
}
