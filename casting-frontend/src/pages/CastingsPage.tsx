import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, CalendarBlank, Users, Clock, Archive, Sparkle } from "@phosphor-icons/react"
import Logo from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { listCastings, type CastingOverview } from "@/api"

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-CH", { day: "numeric", month: "short", year: "numeric" })
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString("en-CH", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function isActive(casting: CastingOverview) {
  return new Date(casting.moveInDate) >= new Date(new Date().toDateString())
}

function CastingCard({ casting }: { casting: CastingOverview }) {
  const navigate = useNavigate()
  const active = isActive(casting)

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarBlank className="size-4 text-primary shrink-0" />
              {formatDate(casting.moveInDate)}{casting.moveOutDate ? ` – ${formatDate(casting.moveOutDate)}` : ""}
            </CardTitle>
            {casting.time && (
              <CardDescription className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Viewing: {formatDateTime(casting.time)}
              </CardDescription>
            )}
          </div>
          <Badge variant={active ? "default" : "secondary"} className="shrink-0">
            {active ? "Active" : "Archived"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" />
          {casting.applicationCount} application{casting.applicationCount !== 1 ? "s" : ""}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/admin/applications?casting=${casting.id}`)}
        >
          View applications <ArrowRight className="size-3.5" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default function CastingsPage() {
  const [castings, setCastings] = useState<CastingOverview[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    listCastings()
      .then(setCastings)
      .catch((err: Error) => setError(err.message))
  }, [])

  const active   = castings?.filter(isActive)   ?? []
  const archived = castings?.filter((c) => !isActive(c)) ?? []

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-2xl items-center gap-3 px-4">
          <button onClick={() => navigate("/admin")} className="focus:outline-none">
            <Logo />
          </button>
          <span className="text-muted-foreground/40 select-none">/</span>
          <span className="text-sm text-muted-foreground">All castings</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Castings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of all active and archived casting periods.
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/30 bg-destructive/5">
            <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {castings === null && !error && (
          <p className="text-sm text-muted-foreground italic">Loading…</p>
        )}

        {castings !== null && castings.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground italic">
              No castings found. Create one from the admin panel.
            </CardContent>
          </Card>
        )}

        {/* Active */}
        {active.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <Sparkle className="size-4 text-primary" weight="fill" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Active
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {active.map((c) => <CastingCard key={c.id} casting={c} />)}
            </div>
          </section>
        )}

        {/* Archived */}
        {archived.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Archive className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Archived
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {archived.map((c) => <CastingCard key={c.id} casting={c} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
