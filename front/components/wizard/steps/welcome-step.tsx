"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useWizard } from "../wizard-context"
import { AlertCircle } from "lucide-react"
import { Images } from "@/utils/image"

export function WelcomeStep() {
  const { nextStep, skipOnboarding, isLoading } = useWizard()
  const { resolvedTheme } = useTheme()

  return (
    <div className="min-h-screen bg-[#ececeb] px-6 py-16">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white px-8 py-6 shadow-sm">
        <header className="flex items-center justify-between border-b border-gray-200 pb-6">
          <Image
            src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
            alt="BoostMyDeal"
            width={44}
            height={44}
            className="h-11 w-11"
            priority
          />
          <Link href="/help" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-800">
            Help / Docs
          </Link>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-8 text-center">
          <h1 className="mb-4 text-4xl font-normal tracking-tight text-[#1f1f1f] md:text-6xl">
            Get Ready to Launch BoostMyDeal
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-9 text-gray-500">
            This guide setup takes about <span className="font-semibold text-gray-700">15 minutes</span> and well configure AI agents
            <br className="hidden md:block" />
            to match your sales workflow.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-0 rounded-xl border border-[#efeaf7] bg-white md:grid-cols-3">
            {[
              {
                src: Images.wizardIntro1,
                alt: "Business Information",
                title: "Business Information",
                items: ["Industry, company size,", "sales goals"],
              },
              {
                src: Images.wizardIntro2,
                alt: "Tools & Integrations",
                title: "Tools & Integrations",
                items: ["CRM, phone system,", "email & calendar"],
              },
              {
                src: Images.wizardIntro3,
                alt: "AI Behavior & Messaging",
                title: "AI Behavior & Messaging",
                items: ["Call tone, email style,", "Automation rules"],
              },
            ].map((item, index) => (
              <div
                key={item.alt}
                className={`px-10 py-8 text-left ${index < 2 ? "border-b md:border-b-0 md:border-r md:border-[#f2edf8]" : ""}`}
              >
                <div className="mb-5 flex justify-center">
                  <Image src={item.src} alt={item.alt} width={72} height={72} className="h-[72px] w-[72px] object-contain" />
                </div>
                <h3 className="mb-4 text-center text-2xl font-medium text-[#43435d]">{item.title}</h3>
                <ul className="space-y-3 text-[15px] text-[#86869a]">
                  {item.items.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-4">
                      <span className="h-2 w-2 rounded-full bg-[#c9c9d9]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-6 flex max-w-3xl items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-gray-400" />
            <p className="text-center text-sm text-gray-500">
              You can pause and edit everything later. Nothing goes live without your confirmation.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-6">
            <Button onClick={nextStep} disabled={isLoading} className="h-12 rounded-2xl px-8 text-base">
              Start Setup
            </Button>
            <button
              onClick={skipOnboarding}
              disabled={isLoading}
              className="text-sm font-medium text-gray-500 underline underline-offset-2 transition-colors hover:text-gray-800"
            >
              {"I’ll gather this information later"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
