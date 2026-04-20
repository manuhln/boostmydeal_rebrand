"use client"

import { useEffect, useState } from "react"
import { X, User, Bot, Download, Copy, Check, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api-client"

interface TranscriptSegment {
  speaker: "agent" | "customer"
  text: string
  timestamp: string
  isFinal: boolean
}

interface TranscriptOverlayProps {
  isOpen: boolean
  onClose: () => void
  callId: string
  contactName: string
  status: string
  recordingId?: string
}

type TranscriptResponse = {
  call_id: string
  segments: Array<{
    segment_id?: string
    speaker: "agent" | "customer"
    content: string
    timestamp_ms: number
    sequence: number
    is_final: boolean
  }>
  full_text: string
}

type TemporaryRecordingUrlResponse = {
  url: string
  expires_at: string
}

const formatTimestamp = (timestampMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(timestampMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function TranscriptOverlay({ isOpen, onClose, callId, contactName, status, recordingId }: TranscriptOverlayProps) {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [isLoadingRecording, setIsLoadingRecording] = useState(false)

  useEffect(() => {
    if (!isOpen || !callId) return

    let active = true
    let intervalId: ReturnType<typeof setInterval> | undefined

    const loadTranscript = async () => {
      setIsLoading(true)
      try {
        const response = await api.get<TranscriptResponse>(`/calls/${callId}/transcript`)
        if (!active) return
        setTranscript(
          (response.segments ?? []).map((segment) => ({
            speaker: segment.speaker,
            text: segment.content,
            timestamp: formatTimestamp(segment.timestamp_ms),
            isFinal: segment.is_final,
          }))
        )
      } catch (error) {
        if (active) {
          setTranscript([])
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadTranscript()

    if (status === "in_progress") {
      intervalId = setInterval(() => {
        void loadTranscript()
      }, 1500)
    }

    return () => {
      active = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [isOpen, callId, status])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "answered":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "in-progress":
      case "ringing":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      case "failed":
      case "busy":
      case "no-answer":
      case "canceled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const copyTranscript = () => {
    const text = transcript
      .map(seg => `[${seg.timestamp}] ${seg.speaker === "agent" ? "Agent" : contactName}: ${seg.text}`)
      .join("\n\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openRecording = async () => {
    if (!recordingId) return

    setIsLoadingRecording(true)
    try {
      const response = await api.post<TemporaryRecordingUrlResponse>(`/calls/${callId}/recordings/${recordingId}/temporary-url`)
      setRecordingUrl(response.url)
      window.open(response.url, "_blank", "noopener,noreferrer")
    } finally {
      setIsLoadingRecording(false)
    }
  }

  const downloadTranscript = () => {
    const text = transcript
      .map(seg => `[${seg.timestamp}] ${seg.speaker === "agent" ? "Agent" : contactName}: ${seg.text}`)
      .join("\n\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transcript-${callId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l bg-background shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-semibold">{contactName}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Call ID: {callId.slice(0, 8)}...</span>
              <Badge variant="secondary" className={cn("text-xs", getStatusColor(status))}>
                {status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {recordingId ? (
            <Button variant="ghost" size="icon" onClick={openRecording} disabled={isLoadingRecording}>
              <Play className="h-4 w-4" />
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" onClick={copyTranscript}>
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={downloadTranscript}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Transcript Content */}
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : transcript.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No transcript available for this call.
            </div>
          ) : (
            transcript.map((segment, index) => (
              <div key={index} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={segment.speaker === "agent" ? "bg-primary text-primary-foreground" : "bg-muted"}>
                    {segment.speaker === "agent" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {segment.speaker === "agent" ? "AI Agent" : contactName}
                    </span>
                    <span className="text-xs text-muted-foreground">{segment.timestamp}</span>
                    {!segment.isFinal ? (
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                        live
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{segment.text}</p>
                </div>
              </div>
            ))
          )}
          {recordingUrl ? (
            <audio className="w-full" controls src={recordingUrl}>
              Your browser does not support audio playback.
            </audio>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}
