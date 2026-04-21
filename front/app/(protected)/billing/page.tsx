"use client"

import { useState } from "react"
import { CreditCard, Receipt, Zap, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useCredits, usePaymentHistory, useCreatePaymentIntent } from "@/hooks/use-billing"
import type { PaymentStatus } from "@/lib/types"

const CREDIT_PACKAGES = [
  { credits: 500, amount: 500, label: "500 credits", price: "$5.00" },
  { credits: 1000, amount: 1000, label: "1,000 credits", price: "$10.00" },
  { credits: 5000, amount: 5000, label: "5,000 credits", price: "$50.00" },
  { credits: 10000, amount: 10000, label: "10,000 credits", price: "$100.00" },
]

const STATUS_COLORS: Record<PaymentStatus, string> = {
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  refunded: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
}

function formatAmount(amountCents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100)
}

// Build a windowed page list: [1, '…', 4, 5, 6, '…', 20]
function buildPageWindow(current: number, last: number): Array<number | "ellipsis"> {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const pages: Array<number | "ellipsis"> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(last - 1, current + 1)
  if (start > 2) pages.push("ellipsis")
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < last - 1) pages.push("ellipsis")
  pages.push(last)
  return pages
}

export default function BillingPage() {
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1])
  const [customCredits, setCustomCredits] = useState("")
  const [page, setPage] = useState(1)

  const { data: credits, isLoading: creditsLoading } = useCredits()
  const { data: paymentsData, isLoading: paymentsLoading, isFetching } = usePaymentHistory({ page })
  const createIntent = useCreatePaymentIntent()

  const payments = paymentsData?.data ?? []
  const lastPage = paymentsData?.last_page ?? 1
  const usagePercent = credits
    ? Math.min(100, Math.round((credits.total_used / (credits.total_purchased || 1)) * 100))
    : 0

  const handlePurchase = () => {
    const credits_amount = customCredits ? parseInt(customCredits) : selectedPackage.credits
    const amount = customCredits ? parseInt(customCredits) * 100 : selectedPackage.amount * 100
    createIntent.mutate(
      { amount, credits_amount, currency: "usd" },
      {
        onSuccess: () => {
          // Option (a): intent created, dialog closes. Credits are only granted
          // once Stripe fires `payment_intent.succeeded` on the backend webhook
          // — so the user isn't actually charged from this UI yet.
          //
          // TODO(stripe-checkout): to enable option (b) — a real checkout flow —
          //   1. Install Stripe SDKs:  npm i @stripe/stripe-js @stripe/react-stripe-js
          //   2. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local.
          //   3. Wrap this component (or a sub-component) in <Elements stripe={loadStripe(pk)}
          //      options={{ clientSecret: data.client_secret }}>.
          //   4. Render <PaymentElement /> inside the dialog and call
          //      stripe.confirmPayment({ elements, confirmParams: { return_url } }) on submit.
          //   5. BACKEND: switch PaymentController::createIntent from createSetupIntent()
          //      to Cashier's $user->pay(amount, options) or Stripe\PaymentIntent::create()
          //      — SetupIntent only saves a card, it does not charge.
          setIsPurchaseOpen(false)
          setCustomCredits("")
        },
      }
    )
  }

  const pageWindow = buildPageWindow(page, lastPage)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your credits and payment history</p>
      </div>

      {/* Credit Balance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Credit Balance
                {creditsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <CardDescription>Your current credit usage</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{creditsLoading ? "—" : credits?.balance ?? 0}</p>
              <p className="text-sm text-muted-foreground">credits remaining</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Usage</span>
              <span className="font-medium">{credits?.total_used ?? 0} / {credits?.total_purchased ?? 0} used</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
            <p className="text-xs text-muted-foreground">{usagePercent}% of purchased credits used</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Balance", value: credits?.balance ?? 0, icon: Zap },
              { label: "Total Purchased", value: credits?.total_purchased ?? 0, icon: CreditCard },
              { label: "Total Used", value: credits?.total_used ?? 0, icon: Zap },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{creditsLoading ? "—" : value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button onClick={() => setIsPurchaseOpen(true)}>
            <Zap className="mr-2 h-4 w-4" />
            Purchase Credits
          </Button>
        </CardFooter>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
            {isFetching && !paymentsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>Your past credit purchases</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {paymentsLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payment history</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {/* TODO(backend): id column hidden because Payment model's
                      #[Hidden(['id','created_at','updated_at'])] strips them
                      from the raw JSON response. Re-enable once backend exposes id. */}
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid at</TableHead>
                  {/* TODO(invoice-pdf): download button hidden — no PDF endpoint yet on backend */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment, idx) => (
                  <TableRow key={payment.id ?? payment.stripe_payment_intent_id ?? `row-${idx}`}>
                    <TableCell className="font-medium">
                      {payment.description ?? "Credit purchase"}
                    </TableCell>
                    <TableCell>{formatAmount(payment.amount, payment.currency)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_COLORS[payment.status]}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {lastPage > 1 && (
          <CardFooter className="border-t py-3">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={page <= 1}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1) }}
                  />
                </PaginationItem>
                {pageWindow.map((p, i) =>
                  p === "ellipsis" ? (
                    <PaginationItem key={`e-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === page}
                        onClick={(e) => { e.preventDefault(); setPage(p) }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={page >= lastPage}
                    className={page >= lastPage ? "pointer-events-none opacity-50" : ""}
                    onClick={(e) => { e.preventDefault(); if (page < lastPage) setPage(page + 1) }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>

      {/* Purchase Dialog */}
      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Purchase Credits</DialogTitle>
            <DialogDescription>Choose a package or enter a custom amount</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.credits}
                  onClick={() => { setSelectedPackage(pkg); setCustomCredits("") }}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedPackage.credits === pkg.credits && !customCredits
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold">{pkg.price}</p>
                  <p className="text-sm text-muted-foreground">{pkg.label}</p>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customCredits">Custom amount (credits)</Label>
              <Input
                id="customCredits"
                type="number"
                min="100"
                max="10000"
                placeholder="e.g. 2500"
                value={customCredits}
                onChange={(e) => setCustomCredits(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Min 100 · Max 10,000 · $0.01 per credit</p>
            </div>
            {createIntent.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {createIntent.error instanceof Error ? createIntent.error.message : "Payment failed"}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseOpen(false)}>Cancel</Button>
            <Button onClick={handlePurchase} disabled={createIntent.isPending}>
              {createIntent.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
