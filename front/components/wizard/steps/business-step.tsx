"use client"

import { useEffect, useRef, useState, type DragEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, FileText, X } from "lucide-react"
import { useWizard } from "../wizard-context"
import { WizardLayout } from "../wizard-layout"

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Retail",
  "Education",
  "Other",
]

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
]

const TIMEZONES = [
  { value: "America/New_York", label: "UTC-5 (EST)" },
  { value: "America/Los_Angeles", label: "UTC-8 (PST)" },
  { value: "Europe/London", label: "UTC+0 (GMT)" },
  { value: "Europe/Paris", label: "UTC+1 (CET)" },
  { value: "Africa/Nairobi", label: "UTC+3 (EAT)" },
]

interface UploadedFile {
  id: string
  name: string
  file: File
  size: number
}

export function BusinessStep() {
  const { nextStep, prevStep, skipOnboarding, updateData, data, isLoading } = useWizard()

  const [formData, setFormData] = useState({
    companyName: data.businessInfo?.companyName || "",
    businessEmail: data.businessInfo?.businessEmail || "",
    businessPhone: data.businessInfo?.businessPhone || "",
    industry: data.businessInfo?.industry || "",
    websiteUrl: data.businessInfo?.websiteUrl || "",
    address: data.businessInfo?.address || "",
    companySize: data.businessInfo?.companySize || "",
    salesGoal: data.businessInfo?.salesGoal || "",
    timezone: data.businessInfo?.timezone || "",
  })
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!data.businessInfo?.knowledgeBaseFiles?.length) return

    setUploadedFiles((prev) => {
      if (prev.length > 0) return prev

      return data.businessInfo!.knowledgeBaseFiles!.map((name, index) => ({
        id: `existing-${index}`,
        name,
        file: new File([], name),
        size: 0,
      }))
    })
  }, [data.businessInfo])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    const remainingSlots = Math.max(0, 2 - uploadedFiles.length)
    const newFiles = Array.from(files).slice(0, remainingSlots).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      file,
      size: file.size,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true)
    } else {
      setDragActive(false)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    handleFileUpload(event.dataTransfer.files)
  }

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const handleContinue = () => {
    updateData({
      businessInfo: {
        ...formData,
        knowledgeBaseFiles: uploadedFiles.map((file) => file.name),
      },
    })
    nextStep()
  }

  const isValid =
    formData.companyName &&
    formData.industry &&
    formData.companySize &&
    formData.salesGoal &&
    formData.timezone

  return (
    <WizardLayout
      title="Tell Us About Your Business"
      subtitle="Provide business context to power AI calls, emails, and workflows."
      contentClassName="p-0"
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
            <Button onClick={handleContinue} disabled={!isValid || isLoading} className="h-12 rounded-2xl px-8">
              Continue
            </Button>
          </div>
        </div>
      }
    >
      <div className="p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] rounded-2xl border border-gray-100 bg-white">
            <div className="space-y-4 p-6 md:p-8">
              <div>
                <h2 className="mb-3 text-2xl font-medium text-[#1f1f1f]">
                  Tell Us About Your Business
                </h2>
                <p className="text-sm text-gray-500">
                  Provide business context to power AI calls, emails, and workflows.
                </p>
              </div>

              <input
                type="text"
                placeholder="Business Name"
                value={formData.companyName}
                onChange={(event) => handleInputChange("companyName", event.target.value)}
                className="h-14 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none shadow-sm transition-colors focus:border-gray-400"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="email"
                  placeholder="Business email"
                  value={formData.businessEmail}
                  onChange={(event) => handleInputChange("businessEmail", event.target.value)}
                  className="h-14 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none shadow-sm transition-colors focus:border-gray-400"
                />
                <input
                  type="text"
                  placeholder="Business phone"
                  value={formData.businessPhone}
                  onChange={(event) => handleInputChange("businessPhone", event.target.value)}
                  className="h-14 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none shadow-sm transition-colors focus:border-gray-400"
                />
              </div>

              <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                <SelectTrigger className="h-14 rounded-2xl border-gray-200 text-sm shadow-sm">
                  <SelectValue placeholder="Industry Selection" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <input
                type="text"
                placeholder="Website URL"
                value={formData.websiteUrl}
                onChange={(event) => handleInputChange("websiteUrl", event.target.value)}
                className="h-14 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none shadow-sm transition-colors focus:border-gray-400"
              />

              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(event) => handleInputChange("address", event.target.value)}
                className="h-14 w-full rounded-2xl border border-gray-200 px-4 text-sm outline-none shadow-sm transition-colors focus:border-gray-400"
              />
            </div>

            <div className="hidden h-auto w-px bg-gray-200 lg:block lg:my-8" />

            <div className="space-y-4 p-6 md:p-8">
              <div className="grid gap-3 md:grid-cols-2">
                <Select value={formData.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                  <SelectTrigger className="h-14 rounded-2xl border-gray-200 text-sm shadow-sm">
                    <SelectValue placeholder="Country / Timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={formData.companySize} onValueChange={(value) => handleInputChange("companySize", value)}>
                  <SelectTrigger className="h-14 rounded-2xl border-gray-200 text-sm shadow-sm">
                    <SelectValue placeholder="Company Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <textarea
                placeholder="Sales Goal  (appointments, deals closed, inbound, outbound)"
                value={formData.salesGoal}
                onChange={(event) => handleInputChange("salesGoal", event.target.value)}
                rows={3}
                className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-4 text-sm outline-none shadow-sm transition-colors focus:border-gray-400"
              />

              <div className="grid gap-3 md:grid-cols-2">
                {[0, 1].map((slot) => (
                  <div
                    key={slot}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 transition-colors ${
                      dragActive ? "border-primary bg-primary/5" : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    onClick={() => inputRef.current?.click()}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <Upload className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-center text-sm font-medium text-black">
                      Choose a file or drag & drop it here.
                    </p>
                    <span className="rounded-md border border-gray-300 px-3 py-1 text-[10px] text-gray-500">
                      Browse Files
                    </span>
                    {uploadedFiles[slot] && (
                      <span className="text-xs text-muted-foreground">{uploadedFiles[slot].name}</span>
                    )}
                  </div>
                ))}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={(event) => handleFileUpload(event.target.files)}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
                    >
                      <FileText className="h-6 w-6 text-gray-600" />
                      <div className="flex-1">
                        <p className="truncate text-sm text-gray-500">{file.name}</p>
                        {file.size > 0 && (
                          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 transition-colors hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  <p className="text-xs font-medium text-primary">{uploadedFiles.length} of 2 sources added</p>
                </div>
              )}
            </div>
          </div>
      </div>
    </WizardLayout>
  )
}
