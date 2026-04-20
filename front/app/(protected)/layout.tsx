"use client"

import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/dashboard/sidebar"
import { api } from "@/lib/api-client";
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      api.get("/me").catch(() => { });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="container mx-auto p-6 lg:p-8">
          <AuthGuard>
            {children}
          </AuthGuard>
        </div>
      </main>
    </div>
  )
}
