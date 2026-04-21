"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle2, AlertCircle, Info, Clock, Check } from "lucide-react"
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/use-notification"

const typeIcon = (type: string | null) => {
  const t = type ?? ""
  if (t.includes("fail") || t.includes("error")) return AlertCircle
  if (t.includes("complet") || t.includes("success")) return CheckCircle2
  return Info
}


const typeStyle = (type: string | null) => {
  const t = type ?? ""
  if (t.includes("fail") || t.includes("error")) return "bg-red-500/10 text-red-600"
  if (t.includes("complet") || t.includes("success")) return "bg-green-500/10 text-green-600"
  return "bg-blue-500/10 text-blue-600"
}

const formatTime = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const { data, isLoading } = useNotifications({
    ...(activeTab === "unread" ? { "filter[read]": false } : {}),
  })
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const notifications = data?.data ?? []
  const unreadCount = notifications.filter((n) => n.read_at === null).length

  const filtered = activeTab === "unread"
    ? notifications.filter((n) => n.read_at === null)
    : notifications

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Stay updated with your AI agents activity</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}>
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>


      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: notifications.length, icon: Bell, color: "bg-primary/10 text-primary" },
          { label: "Unread", value: unreadCount, icon: Clock, color: "bg-blue-500/10 text-blue-500" },
          { label: "Success", value: notifications.filter((n) => (n.notification_type ?? "").includes("complet")).length, icon: CheckCircle2, color: "bg-green-500/10 text-green-500" },
          { label: "Alerts", value: notifications.filter((n) => (n.notification_type ?? "").includes("fail") || (n.notification_type ?? "").includes("error")).length, icon: AlertCircle, color: "bg-red-500/10 text-red-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-semibold">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">{unreadCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((notification) => {
                const isRead = notification.read_at !== null
                const Icon = typeIcon(notification.notification_type)
                const heading = notification.title ?? (notification.notification_type ?? "notification").replace(/_/g, " ")
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${isRead ? "bg-muted/30" : "bg-primary/5 border border-primary/10"}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeStyle(notification.notification_type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={`font-medium capitalize ${!isRead ? "text-foreground" : "text-muted-foreground"}`}>
                            {heading}
                          </h4>
                          {notification.body && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {notification.body}
                            </p>
                          )}
                        </div>
                        {!isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        {notification.created_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.created_at)}
                          </span>
                        )}
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={markAsRead.isPending}
                            onClick={() => markAsRead.mutate(notification.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
