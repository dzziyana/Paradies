import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import Logo from "@/components/Logo"
import {
  CheckCircle,
  XCircle,
  Question,
  Prohibit,
  Heart,
  UserMinus,
  Warning,
  User,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getApplication, evaluateApplication, type EvaluationCategory } from "@/api"

const VERDICTS: {
  value: EvaluationCategory
  label: string
  icon: React.ReactNode
  className: string
  activeClass: string
}[] = [
  {
    value: "YES",
    label: "Yes",
    icon: <CheckCircle weight="fill" className="size-4" />,
    className: "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/50",
    activeClass: "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500",
  },
  {
    value: "MAYBE",
    label: "Maybe",
    icon: <Question weight="fill" className="size-4" />,
    className: "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/50",
    activeClass: "bg-amber-500 text-white border-amber-500",
  },
  {
    value: "NO",
    label: "No",
    icon: <XCircle weight="fill" className="size-4" />,
    className: "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/50",
    activeClass: "bg-red-600 text-white border-red-600 dark:bg-red-500 dark:border-red-500",
  },
  {
    value: "VETO",
    label: "Veto",
    icon: <Prohibit weight="fill" className="size-4" />,
    className: "border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/50",
    activeClass: "bg-purple-600 text-white border-purple-600 dark:bg-purple-500 dark:border-purple-500",
  },
  {
    value: "FRIEND",
    label: "Friend",
    icon: <Heart weight="fill" className="size-4" />,
    className: "border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/50",
    activeClass: "bg-sky-500 text-white border-sky-500",
  },
  {
    value: "NOT_WOKO",
    label: "Not WOKO",
    icon: <UserMinus weight="fill" className="size-4" />,
    className: "border-stone-300 text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-800/50",
    activeClass: "bg-stone-600 text-white border-stone-600 dark:bg-stone-500 dark:border-stone-500",
  },
]

type ApplicationData = {
  name: string
  age: number
  occupation: string
  university: string
  major: string
  email: string
  phone: string
  letter: string
}

export default function EvaluatePage() {
  const { castingId, applicationId } = useParams<{ castingId: string; applicationId: string }>()

  const [app, setApp] = useState<ApplicationData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<EvaluationCategory | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    getApplication(castingId!, applicationId!)
      .then(setApp)
      .catch((err: Error) => setLoadError(err.message))
  }, [castingId, applicationId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await evaluateApplication(castingId!, applicationId!, selected, crypto.randomUUID())
      setDone(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-2xl items-center px-4">
          <Logo />
          <Badge variant="secondary" className="ml-3 text-xs">Jury</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Evaluate application</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review the applicant and cast your vote.</p>
        </div>

        {loadError && (
          <Card className="mb-5 border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-2 py-3 text-sm text-destructive">
              <Warning className="size-4 shrink-0" weight="fill" />
              Could not load application: {loadError}
            </CardContent>
          </Card>
        )}

        {/* Applicant card */}
        {app ? (
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-4 text-primary" />
                {app.name}
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-x-3 gap-y-1">
                <span>{app.age} years old</span>
                {app.occupation && <span>· {app.occupation}</span>}
                {app.university && <span>· {app.university}{app.major ? `, ${app.major}` : ""}</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {app.email && <span>{app.email}</span>}
                {app.phone && <span>· {app.phone}</span>}
              </div>

              {app.letter && (
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Motivation letter
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{app.letter}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : !loadError ? (
          <Card className="mb-5">
            <CardContent className="py-6 text-center text-sm text-muted-foreground italic">
              Loading application…
            </CardContent>
          </Card>
        ) : null}

        {/* Verdict form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Your verdict
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                {VERDICTS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => !done && setSelected(v.value)}
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all outline-none",
                      "focus-visible:ring-3 focus-visible:ring-ring/50",
                      selected === v.value ? v.activeClass : v.className,
                      done ? "opacity-60 cursor-default" : "cursor-pointer",
                    ].join(" ")}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>

              {submitError &&<p className="text-sm text-destructive">{submitError}</p>}

              {done && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
                  <CheckCircle className="size-4" weight="fill" />
                  Evaluation submitted.
                </div>
              )}

              <div className="flex">
                <Button type="submit" disabled={!selected || submitting || done}>
                  {submitting ? "Submitting…" : done ? "Submitted" : selected ? `Submit: ${selected}` : "Select a verdict"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  )
}