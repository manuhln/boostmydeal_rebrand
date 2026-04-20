"use client"

import { useState } from "react"
import {
  Phone, Plus, Trash2, Settings, Search, RefreshCw, AlertCircle, Loader2, Eye, EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  usePhoneNumbers, useAddPhoneNumber, useUpdatePhoneNumber, useDeletePhoneNumber,
} from "@/hooks/use-phone-number"
import type { PhoneNumber, PhoneNumberProviderConfig } from "@/lib/types"

type Provider = "twilio" | "voxsun"

interface PhoneFormState {
  did: string
  country_code: string
  provider: Provider
  // Twilio
  account_sid: string
  auth_token: string
  // Voxsun
  username: string
  secret: string
  sip_domain: string
}

const emptyForm: PhoneFormState = {
  did: "", country_code: "US", provider: "twilio",
  account_sid: "", auth_token: "",
  username: "", secret: "", sip_domain: "",
}

const COUNTRY_CODES = [
  { value: "US", label: "🇺🇸 United States (+1)" },
  { value: "CA", label: "🇨🇦 Canada (+1)" },
  { value: "GB", label: "🇬🇧 United Kingdom (+44)" },
  { value: "FR", label: "🇫🇷 France (+33)" },
  { value: "DE", label: "🇩🇪 Germany (+49)" },
  { value: "AU", label: "🇦🇺 Australia (+61)" },
  { value: "IN", label: "🇮🇳 India (+91)" },
  { value: "BR", label: "🇧🇷 Brazil (+55)" },
  { value: "MX", label: "🇲🇽 Mexico (+52)" },
]

function buildProviderConfig(form: PhoneFormState): PhoneNumberProviderConfig {
  if (form.provider === "twilio") {
    return { account_sid: form.account_sid, auth_token: form.auth_token }
  }
  return { username: form.username, secret: form.secret, sip_domain: form.sip_domain }
}

function ProviderBadge({ provider }: { provider: Provider }) {
  return (
    <Badge
      variant="secondary"
      className={
        provider === "twilio"
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      }
    >
      {provider === "twilio" ? "Twilio" : "Voxsun"}
    </Badge>
  )
}

export default function PhoneNumbersPage() {
  const [search, setSearch] = useState("")
  const [providerFilter, setProviderFilter] = useState<"all" | Provider>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPhone, setEditingPhone] = useState<PhoneNumber | null>(null)
  const [deletingPhone, setDeletingPhone] = useState<PhoneNumber | null>(null)
  const [form, setForm] = useState<PhoneFormState>(emptyForm)
  const [showSecret, setShowSecret] = useState(false)

  const { data, isLoading, refetch } = usePhoneNumbers(
    providerFilter !== "all" ? { "filter[provider]": providerFilter } : undefined
  )
  const addPhone = useAddPhoneNumber()
  const updatePhone = useUpdatePhoneNumber()
  const deletePhone = useDeletePhoneNumber()

  const phones = data?.data ?? []
  const filtered = search
    ? phones.filter((p) => p.did.includes(search) || p.country_code.toLowerCase().includes(search.toLowerCase()))
    : phones

  const twilioCount = phones.filter((p) => p.provider === "twilio").length
  const voxsunCount = phones.filter((p) => p.provider === "voxsun").length

  const setField = <K extends keyof PhoneFormState>(k: K, v: PhoneFormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const openCreate = () => {
    setEditingPhone(null)
    setForm(emptyForm)
    setShowSecret(false)
    setIsDialogOpen(true)
  }

  const openEdit = (phone: PhoneNumber) => {
    setEditingPhone(phone)
    setForm({
      ...emptyForm,
      did: phone.did,
      country_code: phone.country_code,
      provider: phone.provider,
    })
    setShowSecret(false)
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    const provider_config = buildProviderConfig(form)

    if (editingPhone) {
      updatePhone.mutate(
        {
          id: editingPhone.id,
          data: {
            did: form.did,
            country_code: form.country_code,
            provider: form.provider,
            provider_config,
          },
        },
        { onSuccess: () => setIsDialogOpen(false) }
      )
    } else {
      addPhone.mutate(
        {
          did: form.did,
          country_code: form.country_code,
          provider: form.provider,
          provider_config,
        },
        { onSuccess: () => setIsDialogOpen(false) }
      )
    }
  }

  const handleDelete = () => {
    if (!deletingPhone) return
    deletePhone.mutate(deletingPhone.id, { onSuccess: () => setDeletingPhone(null) })
  }

  const isSaveDisabled = () => {
    if (!form.did || !form.country_code) return true
    if (form.provider === "twilio") return !form.account_sid || !form.auth_token
    return !form.username || !form.secret || !form.sip_domain
  }

  const isPending = addPhone.isPending || updatePhone.isPending
  const mutationError = addPhone.isError ? addPhone.error : updatePhone.isError ? updatePhone.error : null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Phone Numbers</h1>
          <p className="text-muted-foreground">Manage your SIP trunks and phone numbers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Phone Number
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Numbers</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : phones.length}</div>
            <p className="text-xs text-muted-foreground">Across all providers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Twilio</CardTitle>
            <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30">Twilio</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : twilioCount}</div>
            <p className="text-xs text-muted-foreground">Active SIP trunks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Voxsun</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30">Voxsun</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : voxsunCount}</div>
            <p className="text-xs text-muted-foreground">Active SIP trunks</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by number or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={providerFilter} onValueChange={(v) => setProviderFilter(v as "all" | Provider)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="twilio">Twilio</SelectItem>
            <SelectItem value="voxsun">Voxsun</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number (DID)</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    {search ? "No numbers match your search." : "No phone numbers yet. Add one to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((phone) => (
                  <TableRow key={phone.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-medium">{phone.did}</span>
                      </div>
                    </TableCell>
                    <TableCell><ProviderBadge provider={phone.provider} /></TableCell>
                    <TableCell>
                      <span className="text-sm">{phone.country_code}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(phone.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(phone)}
                          title="Edit credentials"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingPhone(phone)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPhone ? "Update Phone Number" : "Add Phone Number"}
            </DialogTitle>
            <DialogDescription>
              {editingPhone
                ? "Update the credentials for this number. Leave config fields blank to keep existing credentials."
                : "Connect a phone number from Twilio or Voxsun to your account."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Provider */}
            <div className="grid grid-cols-2 gap-3">
              {(["twilio", "voxsun"] as Provider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setField("provider", p)}
                  disabled={!!editingPhone}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    form.provider === p
                      ? p === "twilio"
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-border hover:border-muted-foreground/40"
                  } ${editingPhone ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <p className="font-semibold capitalize">{p}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p === "twilio" ? "Account SID + Auth Token" : "SIP Username + Secret"}
                  </p>
                </button>
              ))}
            </div>

            {/* DID + Country */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone Number (DID) *</Label>
                <Input
                  placeholder="+12025550123"
                  value={form.did}
                  onChange={(e) => setField("did", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country *</Label>
                <Select value={form.country_code} onValueChange={(v) => setField("country_code", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Provider-specific config */}
            {form.provider === "twilio" ? (
              <>
                <div className="space-y-1.5">
                  <Label>Account SID *</Label>
                  <Input
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={form.account_sid}
                    onChange={(e) => setField("account_sid", e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Auth Token *</Label>
                  <div className="relative">
                    <Input
                      type={showSecret ? "text" : "password"}
                      placeholder="••••••••••••••••••••••••••••••••"
                      value={form.auth_token}
                      onChange={(e) => setField("auth_token", e.target.value)}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>SIP Username *</Label>
                  <Input
                    placeholder="john_doe"
                    value={form.username}
                    onChange={(e) => setField("username", e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>SIP Secret *</Label>
                  <div className="relative">
                    <Input
                      type={showSecret ? "text" : "password"}
                      placeholder="••••••••••••••"
                      value={form.secret}
                      onChange={(e) => setField("secret", e.target.value)}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>SIP Domain *</Label>
                  <Input
                    placeholder="sip.voxsun.com"
                    value={form.sip_domain}
                    onChange={(e) => setField("sip_domain", e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </>
            )}

            {editingPhone && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Credentials are stored encrypted. Fill in all fields to replace existing credentials.
                </AlertDescription>
              </Alert>
            )}

            {mutationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {mutationError instanceof Error ? mutationError.message : "An error occurred"}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaveDisabled() || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPhone ? "Update" : "Add Number"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPhone} onOpenChange={() => setDeletingPhone(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Phone Number</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingPhone?.did}</strong>?
              This will disconnect it from any assigned agents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePhone.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePhone.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
