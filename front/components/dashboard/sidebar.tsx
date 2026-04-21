"use client"

import {
  LayoutDashboard,
  Bot,
  Phone,
  PhoneCall,
  GitBranch,
  Users,
  Plug,
  BookOpen,
  Settings,
  HelpCircle,
  LogOut,
  CreditCard,
  Bell
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogoIcon } from "@/components/ui/logo"
import { useMe } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Skeleton } from "../ui/skeleton"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Bot, label: "AI Agents", href: "/agents" },
  { icon: Phone, label: "Call Logs", href: "/calls" },
  { icon: PhoneCall, label: "Phone Numbers", href: "/phone-numbers" },
  { icon: GitBranch, label: "Workflows", href: "/workflows" },
  { icon: BookOpen, label: "Knowledge Base", href: "/knowledge" },
  { icon: Plug, label: "Integrations", href: "/integrations" },
]

const teamItems = [
  { icon: Users, label: "Team", href: "/team" },
  // TODO(sidebar-unread-badge): badge "5" is hardcoded. To wire the real unread
  // count: call `useNotifications({ "filter[read]": false })` from this component
  // (needs to become a client subtree) and use `data?.data.length` — or, better,
  // ask the backend to add GET /api/v1/notifications/unread-count and use
  // queryKey.Notifications.unreadCount() which already exists in query-keys.ts.
  { icon: Bell, label: "Notifications", badge: "5", href: "/notifications" },
]

const generalItems = [
  { icon: CreditCard, label: "Billing", href: "/billing" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
  { icon: LogOut, label: "Logout", href: "/logout" },
]

export function Sidebar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const pathname = usePathname()
  const { data: me, isLoading } = useMe()
  const user = me?.user?.data.attributes


  function getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.trim()[0] ?? "";
    const last = lastName?.trim()[0] ?? "";
    return (first + last).toUpperCase() || "?";
  }

  const renderNavItem = (item: typeof menuItems[0]) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
    return (
      <Link
        key={item.label}
        href={item.href}
        onMouseEnter={() => setHoveredItem(item.label)}
        onMouseLeave={() => setHoveredItem(null)}
        className={cn(
          "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-300",
          isActive
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          hoveredItem === item.label && !isActive && "translate-x-1",
        )}
      >
        <item.icon className="w-4 h-4" />
        <span className="text-sm">{item.label}</span>
        {/* {"badge" in item && item.badge && (
          <span className={cn(
            "ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
            isActive
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-primary text-primary-foreground"
          )}>
            {item.badge}
          </span>
        )} */}
      </Link>
    )
  }

  return (
    <aside className=" sideBar fixed top-0 left-0 w-64 bg-card border-r border-border p-4 h-screen overflow-y-auto  lg:block custom-scrollbar">
      <div className="flex items-center justify-start mb-6 group cursor-pointer">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoIcon size="xl" />
          <span className="text-2xl font-semibold text-foreground">
            <span className="text-primary">B</span>oostMyDeal
          </span>
        </Link>
      </div>
      <div className="space-y-6 pb-20">
        {/* Main Menu */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Main Menu
          </p>
          <nav className="space-y-0.5">
            {menuItems.map(renderNavItem)}
          </nav>
        </div>

        {/* Team */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Team
          </p>
          <nav className="space-y-0.5">
            {teamItems.map(renderNavItem)}
          </nav>
        </div>

        {/* General */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            General
          </p>
          <nav className="space-y-0.5">
            {generalItems.map(renderNavItem)}
          </nav>
        </div>
      </div>

      <div className="fixed bottom-0  backdrop-blur-xs backdrop-grayscale  pb-4 ">
        {/* User Profile */}
        {isLoading ? (
          <>
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </>
        ) : (
          <div className="flex space-x-2">
            <Avatar className="w-9 h-9">
              <AvatarImage src={user?.avatar} alt={user?.first_name} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {getInitials(user?.first_name, user?.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
