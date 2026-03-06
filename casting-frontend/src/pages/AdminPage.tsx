import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, CalendarBlank, Clock, Plus, Archive, Users, CaretDown, Copy, Check, Link } from "@phosphor-icons/react"
import Logo from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Calendar } from "@/components/ui/calendar"
import { type DateRange } from "react-day-picker"
import {
  createCasting, setCastingTime, listCastings,
  closeApplications, setApplicationUntil,
  type CastingOverview,
} from "@/api"

const STORAGE_KEY = "paradies_active_casting"

function castingColor(castingId: string): string {
  let hash = 0
  for (const ch of castingId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  const hue = Math.abs(hash) % 360
  return `oklch(0.84 0.11 ${hue})`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-CH", { day: "numeric", month: "short", year: "numeric" })
}

function CastingManagementCard({
  casting,
  onRefresh,
}: {
  casting: CastingOverview
  onRefresh: () => void
}) {
  const applyUrl = `${window.location.origin}/apply/${casting.id}`

  // Copy link
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(applyUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Close application period
  const [closing, setClosing] = useState(false)
  async function handleClose() {
    setClosing(true)
    try { await closeApplications(casting.id); onRefresh() }
    finally { setClosing(false) }
  }

  // Set / extend / remove application deadline
  const [deadlineOpen, setDeadlineOpen] = useState(false)
  const [deadlineRange, setDeadlineRange] = useState<DateRange | undefined>(
    casting.applicationUntil
      ? { from: new Date(), to: new Date(casting.applicationUntil + "T00:00:00") }
      : undefined
  )
  const [savingDeadline, setSavingDeadline] = useState(false)
  async function handleSaveDeadline() {
    if (!deadlineRange?.to) return
    setSavingDeadline(true)
    try {
      await setApplicationUntil(casting.id, deadlineRange.to.toISOString().slice(0, 10))
      setDeadlineOpen(false)
      onRefresh()
    } finally { setSavingDeadline(false) }
  }
  const [removingDeadline, setRemovingDeadline] = useState(false)
  async function handleRemoveDeadline() {
    setRemovingDeadline(true)
    try { await setApplicationUntil(casting.id, null); onRefresh() }
    finally { setRemovingDeadline(false) }
  }

  // Set casting time
  const [castingTime, setCastingTimeValue] = useState("")
  const [settingTime, setSettingTime] = useState(false)
  const [timeError, setTimeError] = useState<string | null>(null)
  const [timeDone, setTimeDone] = useState(false)
  async function handleSetTime(e: React.FormEvent) {
    e.preventDefault()
    setSettingTime(true)
    setTimeError(null)
    try { await setCastingTime(casting.id, castingTime); setTimeDone(true) }
    catch (err) { setTimeError(err instanceof Error ? err.message : "Unknown error") }
    finally { setSettingTime(false) }
  }

  const color = castingColor(casting.id)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base leading-snug">
          <span>{casting.replacedPersonName}'s room</span>
          <span className="text-muted-foreground font-normal">·</span>
          <span
            className="rounded-md px-2 py-0.5 text-xs font-semibold"
            style={{ background: color, color: "oklch(0.2 0 0)" }}
          >
            move-in {formatDate(casting.moveInDate)}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">

        {/* Apply link */}
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Link className="size-3.5" /> Application link
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <code className="flex-1 truncate font-mono text-xs text-foreground">{applyUrl}</code>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Copy link"
            >
              {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>

        {/* Application period */}
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarBlank className="size-3.5" /> Application period
          </p>
          {casting.applicationUntil ? (
            <span className="text-sm text-foreground">
              Open until <span className="font-medium">{formatDate(casting.applicationUntil)}</span>
            </span>
          ) : (
            <span className="text-sm text-foreground">Open · no deadline</span>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {casting.applicationUntil ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeadlineOpen((o) => !o)}
                  >
                    Change deadline
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveDeadline}
                    disabled={removingDeadline}
                  >
                    {removingDeadline ? "Removing…" : "Remove deadline"}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeadlineOpen((o) => !o)}
                >
                  Set deadline
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={closing}
                className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive/60"
              >
                {closing ? "Closing…" : "End application period"}
              </Button>
            </div>
            {deadlineOpen && (
              <div className="flex flex-col gap-2">
                <Card className="w-fit p-0">
                  <CardContent className="p-0">
                    <Calendar
                      mode="range"
                      defaultMonth={deadlineRange?.to ?? new Date()}
                      selected={deadlineRange}
                      onSelect={setDeadlineRange}
                      numberOfMonths={2}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </CardContent>
                </Card>
                {deadlineRange && (
                  <span className="text-sm text-muted-foreground">
                    {deadlineRange.from && deadlineRange.to
                      ? `${formatDate(deadlineRange.from.toISOString())} – ${formatDate(deadlineRange.to.toISOString())}`
                      : deadlineRange.from
                        ? `From ${formatDate(deadlineRange.from.toISOString())}`
                        : ""}
                  </span>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!deadlineRange?.to || savingDeadline}
                    onClick={handleSaveDeadline}
                  >
                    {savingDeadline ? "Saving…" : "Save deadline"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setDeadlineOpen(false); setDeadlineRange(undefined) }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Set casting time */}
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Clock className="size-3.5" /> Exact casting time
          </p>
          <form onSubmit={handleSetTime} className="flex flex-col gap-2">
            <DateTimePicker value={castingTime} onChange={setCastingTimeValue} />
            {timeError && <FieldError>{timeError}</FieldError>}
            {timeDone && <p className="text-sm font-medium text-primary">Time saved.</p>}
            <div className="flex">
              <Button type="submit" disabled={settingTime || !castingTime} size="sm">
                {settingTime ? "Saving…" : "Save time"}
              </Button>
            </div>
          </form>
        </div>

      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  const navigate = useNavigate()

  const [castings, setCastings] = useState<CastingOverview[] | null>(null)

  // Create form
  const [justCreated, setJustCreated] = useState(false)
  const [createdCastingId, setCreatedCastingId] = useState<string | null>(null)
  const [moveIn, setMoveIn] = useState("")
  const [moveOut, setMoveOut] = useState("none")
  const [personName, setPersonName] = useState("")
  const [appPeriod, setAppPeriod] = useState<DateRange | undefined>(undefined)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  function fetchCastings() {
    listCastings()
      .then(setCastings)
      .catch(() => setCastings([]))
  }

  useEffect(() => { fetchCastings() }, [])

  const today = new Date().toISOString().slice(0, 10)
  const activeCastings = (castings ?? []).filter((c) => c.moveInDate >= today)
  const castingsWithOpenPeriod = (castings ?? []).filter((c) => c.applicationPeriodActive)
  const hasActiveCastings = activeCastings.length > 0

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const id = crypto.randomUUID()
      const deadlineStr = appPeriod?.to
        ? appPeriod.to.toISOString().slice(0, 10)
        : undefined
      const returnedId = await createCasting(
        id,
        moveIn,
        moveOut === "none" ? "" : moveOut,
        personName,
        deadlineStr
      )
      setCreatedCastingId(returnedId)
      setJustCreated(true)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ castingId: returnedId, moveIn }))
      setCreateOpen(false)
      fetchCastings()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setCreating(false)
    }
  }

  const createForm = (
    <form onSubmit={handleCreate} className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="personName">Name of person leaving</FieldLabel>
          <Input
            id="personName"
            type="text"
            required
            placeholder="e.g. Anna"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Field>
            <FieldLabel htmlFor="moveIn">Move-in date</FieldLabel>
            <Input id="moveIn" type="date" required value={moveIn} onChange={(e) => setMoveIn(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Move-out date <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
            {moveOut !== "none" ? (
              <div className="flex items-center gap-2">
                <Input
                  id="moveOut"
                  type="date"
                  value={moveOut}
                  onChange={(e) => setMoveOut(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setMoveOut("none")}
                  className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setMoveOut("")}
              >
                Set a date
              </Button>
            )}
          </Field>
        </div>
        <Field>
          <FieldLabel>Application period <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
          <div className="flex flex-col gap-2">
            <Card className="w-fit p-0">
              <CardContent className="p-0">
                <Calendar
                  mode="range"
                  defaultMonth={new Date()}
                  selected={appPeriod}
                  onSelect={setAppPeriod}
                  numberOfMonths={2}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </CardContent>
            </Card>
            {appPeriod && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {appPeriod.from && appPeriod.to
                    ? `${formatDate(appPeriod.from.toISOString())} – ${formatDate(appPeriod.to.toISOString())}`
                    : appPeriod.from
                      ? `From ${formatDate(appPeriod.from.toISOString())}`
                      : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setAppPeriod(undefined)}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </Field>
      </FieldGroup>

      {createError && <p className="text-sm text-destructive">{createError}</p>}

      {justCreated && createdCastingId && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Casting created</p>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Apply link</span>
            <code className="font-mono text-xs text-foreground">/apply/{createdCastingId}</code>
          </div>
          <Button variant="outline" size="sm" className="w-fit" onClick={() => navigate(`/apply/${createdCastingId}`)}>
            Open apply form <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}

      <div className="flex">
        <Button type="submit" disabled={creating} size="sm" variant="default">
          <Plus className="size-3.5" />
          {creating ? "Creating…" : "Create casting"}
        </Button>
      </div>
    </form>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-2xl items-center px-4">
          <Logo />
          <Badge variant="secondary" className="ml-3 text-xs">Admin</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Admin panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage castings for Paradies.</p>
        </div>

        {/* Quick nav */}
        <div className={`mb-6 grid gap-3 max-sm:grid-cols-1 ${hasActiveCastings ? "grid-cols-2" : "grid-cols-1"}`}>
          {hasActiveCastings && (
            <div className="animated-gradient-border">
              <button
                onClick={() => navigate("/admin/applications")}
                className="group flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3.5 text-left transition-all hover:bg-muted/60 focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <Users className="size-4" />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Browse applications</span>
                  <span className="text-xs text-muted-foreground">All active castings</span>
                </div>
                <ArrowRight className="ml-auto size-4 text-primary/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            </div>
          )}

          <button
            onClick={() => navigate("/admin/castings")}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-all hover:border-primary/40 hover:bg-muted/40 focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <Archive className="size-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">All castings</span>
              <span className="text-xs text-muted-foreground">Active &amp; archived history</span>
            </div>
            <ArrowRight className="ml-auto size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        </div>

        <div className="flex flex-col gap-4">

          {/* Create casting — full card on top when no open application periods */}
          {castingsWithOpenPeriod.length === 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarBlank className="size-4 text-primary" /> Create casting
                </CardTitle>
              </CardHeader>
              <CardContent>{createForm}</CardContent>
            </Card>
          )}

          {/* One management card per casting with open application period */}
          {castingsWithOpenPeriod.map((casting) => (
            <CastingManagementCard key={casting.id} casting={casting} onRefresh={fetchCastings} />
          ))}

          {/* Create casting — collapsible at bottom when open periods exist */}
          {castingsWithOpenPeriod.length > 0 && (
            <div className="rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setCreateOpen((o) => !o)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <CalendarBlank className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-muted-foreground">Create new casting</span>
                <CaretDown
                  className={`ml-auto size-4 text-muted-foreground/60 transition-transform duration-200 ${createOpen ? "rotate-180" : ""}`}
                />
              </button>
              {createOpen && (
                <div className="border-t border-border px-4 pb-4 pt-4">
                  {createForm}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
