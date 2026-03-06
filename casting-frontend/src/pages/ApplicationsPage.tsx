import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowRight, User, GraduationCap, Warning } from "@phosphor-icons/react"
import Logo from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listApplications, type ApplicationOverview, type AppStatus } from "@/api"

const STATUS_CONFIG: Record<
  NonNullable<AppStatus>,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING:        { label: "Pending",       variant: "secondary" },
  SUBMITTED:      { label: "Submitted",     variant: "default"   },
  WITHDRAWN:      { label: "Withdrawn",     variant: "outline"   },
  EVALUATED_YES:  { label: "Yes",           variant: "default"   },
  EVALUATED_NO:   { label: "No",            variant: "destructive"},
  MOVED_IN:       { label: "Moved in",      variant: "default"   },
}

function ApplicationCard({ app, castingId }: { app: ApplicationOverview; castingId: string }) {
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <GraduationCap className="size-3.5 shrink-0" />
            <span>{app.university || app.occupation}</span>
            {app.major && <span className="text-muted-foreground/60">· {app.major}</span>}
          </div>
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

export default function ApplicationsPage() {
  const { castingId } = useParams<{ castingId: string }>()
  const navigate = useNavigate()
  const [apps, setApps]   = useState<ApplicationOverview[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listApplications(castingId!)
      .then(setApps)
      .catch((err: Error) => setError(err.message))
  }, [castingId])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-2xl items-center gap-3 px-4">
          <button onClick={() => navigate("/admin")} className="focus:outline-none">
            <Logo />
          </button>
          <span className="text-muted-foreground/40 select-none">/</span>
          <button
            onClick={() => navigate("/admin/castings")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
          >
            Castings
          </button>
          <span className="text-muted-foreground/40 select-none">/</span>
          <span className="font-mono text-xs text-muted-foreground truncate max-w-32">{castingId}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {apps === null ? "Loading…" : `${apps.length} application${apps.length !== 1 ? "s" : ""} submitted`}
            </p>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-2 py-3 text-sm text-destructive">
              <Warning className="size-4 shrink-0" weight="fill" />
              {error}
            </CardContent>
          </Card>
        )}

        {apps !== null && apps.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground italic">
              No applications yet for this casting.
            </CardContent>
          </Card>
        )}

        {apps !== null && apps.length > 0 && (
          <div className="flex flex-col gap-3">
            {apps.map((app) => (
              <ApplicationCard key={app.id} app={app} castingId={castingId!} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
