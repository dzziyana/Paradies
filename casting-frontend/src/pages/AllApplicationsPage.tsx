import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowRight, User, GraduationCap, Warning, CalendarBlank, X } from "@phosphor-icons/react"
import Logo from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listActiveApplications, type ApplicationOverview, type AppStatus, type CastingOverview } from "@/api"

const STATUS_CONFIG: Record<
  NonNullable<AppStatus>,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING:        { label: "Pending",   variant: "secondary"  },
  SUBMITTED:      { label: "Submitted", variant: "default"    },
  WITHDRAWN:      { label: "Withdrawn", variant: "outline"    },
  EVALUATED_YES:  { label: "Yes",       variant: "default"    },
  EVALUATED_NO:   { label: "No",        variant: "destructive"},
  MOVED_IN:       { label: "Moved in",  variant: "default"    },
}

function castingColor(castingId: string): string {
  let hash = 0
  for (const ch of castingId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  const hue = Math.abs(hash) % 360
  return `oklch(0.84 0.11 ${hue})`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-CH", { day: "numeric", month: "short", year: "numeric" })
}

function ApplicationCard({
  app,
  castingId,
}: {
  app: ApplicationOverview
  castingId: string
}) {
  const navigate = useNavigate()
  const statusCfg = app.status ? STATUS_CONFIG[app.status] : null

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <User className="size-4 text-primary shrink-0" />
            {app.name}
            <span className="text-sm font-normal text-muted-foreground">{app.age}</span>
          </CardTitle>
          {statusCfg && (
            <Badge variant={statusCfg.variant} className="shrink-0 text-xs">
              {statusCfg.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <GraduationCap className="size-3.5 shrink-0" />
          <span>{app.university || app.occupation}</span>
          {app.major && <span className="text-muted-foreground/60">· {app.major}</span>}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/admin/casting/${castingId}/application/${app.id}`)}
        >
          Evaluate <ArrowRight className="size-3.5" />
        </Button>
      </CardContent>
    </Card>
  )
}

function CastingSection({ group }: { group: CastingOverview }) {
  const color = castingColor(group.id)
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <CalendarBlank className="size-4 text-muted-foreground shrink-0" />
        <span
          className="rounded-md px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: color, color: "oklch(0.2 0 0)" }}
        >
          Move-in {formatDate(group.moveInDate)}
        </span>
        <span className="text-xs text-muted-foreground">
          {group.applications.length} application{group.applications.length !== 1 ? "s" : ""}
        </span>
      </div>
      {group.applications.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground italic">
            No applications yet.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {group.applications.map((app) => (
            <ApplicationCard key={app.id} app={app} castingId={group.id} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function AllApplicationsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterCastingId = searchParams.get("casting")

  const [groups, setGroups] = useState<CastingOverview[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listActiveApplications()
      .then(setGroups)
      .catch((err: Error) => setError(err.message))
  }, [])

  const displayed = filterCastingId
    ? (groups ?? []).filter((g) => g.id === filterCastingId)
    : (groups ?? [])
  const totalApps = displayed.reduce((sum, g) => sum + g.applications.length, 0)
  const filterName = filterCastingId
    ? displayed[0]?.replacedPersonName
    : null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-2xl items-center gap-3 px-4">
          <button onClick={() => navigate("/admin")} className="focus:outline-none">
            <Logo />
          </button>
          <span className="text-muted-foreground/40 select-none">/</span>
          <span className="text-sm text-muted-foreground">Active applications</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Active applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {groups === null
              ? "Loading…"
              : `${totalApps} application${totalApps !== 1 ? "s" : ""} across ${displayed.length} casting${displayed.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {filterCastingId && (
          <div className="mb-6 flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1.5 text-xs">
              {filterName ? `${filterName}'s room` : "Filtered"}
              <button
                onClick={() => setSearchParams({})}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="size-3" />
              </button>
            </Badge>
          </div>
        )}

        {error && (
          <Card className="mb-6 border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-2 py-3 text-sm text-destructive">
              <Warning className="size-4 shrink-0" weight="fill" />
              {error}
            </CardContent>
          </Card>
        )}

        {groups !== null && displayed.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground italic">
              {filterCastingId ? "No applications for this casting." : "No active castings found."}
            </CardContent>
          </Card>
        )}

        {displayed.length > 0 && (
          <div className="flex flex-col gap-8">
            {displayed.map((g) => (
              <CastingSection key={g.id} group={g} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
