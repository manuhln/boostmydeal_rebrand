"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useWizard, type WizardStep } from "./wizard-context"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface WizardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showSteps?: boolean
  showBackButton?: boolean
  footer?: React.ReactNode
  contentClassName?: string
}

const DISPLAY_STEPS: WizardStep[] = ["business", "tools", "workflow", "ai-agent", "report", "go-live"]

export function WizardLayout({
  children,
  title,
  subtitle,
  showSteps = true,
  showBackButton = true,
  footer,
  contentClassName,
}: WizardLayoutProps) {
  const { currentStep, stepLabels, prevStep, canGoBack } = useWizard()
  const { resolvedTheme } = useTheme()

  const displayStepIndex = DISPLAY_STEPS.indexOf(currentStep)
  const showProgressBar = showSteps && currentStep !== "welcome"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background relative">
      <div className="absolute right-6 top-6 z-10">
        <Image
          src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
          alt="BoostMyDeal"
          width={60}
          height={60}
          className=""
          priority
        />
      </div>

      <main className="mx-auto min-h-screen max-w-6xl px-6 pb-8 pt-12">
        <header className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-normal text-foreground lg:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </header>

        {showProgressBar && (
          <div className="relative mb-8 flex items-center">
            {showBackButton && canGoBack ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>
            ) : (
              <div />
            )}

            <div className="absolute left-1/2 -translate-x-1/2">
              <div className="flex items-center">
                {DISPLAY_STEPS.map((step, index) => {
                  const isCompleted = displayStepIndex > index
                  const isCurrent = step === currentStep
                  const isPending = displayStepIndex < index

                  return (
                    <div key={step} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-all",
                            isCurrent && "bg-primary ring-4 ring-primary/25",
                            isCompleted && "bg-primary",
                            isPending && "bg-gray-300"
                          )}
                        >
                          {isCompleted && (
                            <svg className="h-3 w-3" fill="none" stroke="white" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span
                          className={cn(
                            "mt-2 whitespace-nowrap text-xs transition-all",
                            isCurrent ? "font-bold text-foreground" : "font-normal text-muted-foreground"
                          )}
                        >
                          {stepLabels[step]}
                        </span>
                      </div>

                      {index < DISPLAY_STEPS.length - 1 && (
                        <div
                          className={cn(
                            "mb-5 h-px min-w-12 flex-1 transition-all",
                            isCompleted ? "bg-primary" : "bg-gray-300"
                          )}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className={cn("animate-fade-in rounded-2xl bg-white p-6 shadow-sm md:p-10", contentClassName)}>
          {children}
        </div>

        {footer && <div className="mt-10">{footer}</div>}
      </main>
    </div>
  )
}
