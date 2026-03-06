import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  GraduationCap,
  Buildings,
  User,
  Envelope,
  Phone,
  PencilLine,
  ArrowSquareOut,
  Sparkle,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { submitApplication } from "@/api"
import Logo from "@/components/Logo"

// ── Eligibility ────────────────────────────────────────────────────────────────

const ELIGIBLE_UNIVERSITIES = [
  { value: "UZH",  label: "University of Zurich (UZH)" },
  { value: "ETH",  label: "ETH Zurich" },
  { value: "ZHDK", label: "Zurich University of the Arts (ZHdK)" },
  { value: "PHZH", label: "Zurich University of Teacher Education (PHZH)" },
  { value: "HFH",  label: "Hochschule für Heilpädagogik Zurich (HfH)" },
  { value: "ZHAW", label: "ZHAW Zurich Campus (Applied Psychology / Social Work / Engineering)" },
  { value: "KME",  label: "Kantonale Maturitätsschule für Erwachsene (KME)" },
]

const DEGREE_LEVELS = [
  { value: "bachelor", label: "Bachelor", note: "Max. 8-year rental period" },
  { value: "master",   label: "Master",   note: "Max. 8-year rental period" },
  { value: "doctoral", label: "Doctoral / PhD", note: "Max. 2-year rental period" },
]

type EligibilityAnswers = {
  enrolled: boolean | null
  university: string | null
  degree: string | null
}

type EligibilityStep = "enrolled" | "university" | "degree" | "result"

const STEPS: EligibilityStep[] = ["enrolled", "university", "degree", "result"]
const PROGRESS_LABELS = ["Enrollment", "University", "Degree"]

function isEligible(answers: EligibilityAnswers) {
  return (
    answers.enrolled === true &&
    answers.university !== null &&
    answers.university !== "other" &&
    answers.degree !== null
  )
}

// ── Option button ──────────────────────────────────────────────────────────────

function OptionButton({
  icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon?: React.ReactNode
  label: string
  description?: string
  selected?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-all outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
      ].join(" ")}
    >
      {icon && (
        <span className={[
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
        ].join(" ")}>
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        <span className={["text-sm font-medium leading-snug", selected ? "text-primary" : "text-foreground"].join(" ")}>
          {label}
        </span>
        {description && (
          <span className="text-xs leading-snug text-muted-foreground">{description}</span>
        )}
      </div>
      {selected && <CheckCircle className="ml-auto mt-0.5 size-4 shrink-0 text-primary" weight="fill" />}
    </button>
  )
}

// ── Eligibility questionnaire ──────────────────────────────────────────────────

function EligibilityQuestionnaire({ onPass }: { onPass: (answers: EligibilityAnswers) => void }) {
  const [step, setStep] = useState<EligibilityStep>("enrolled")
  const [answers, setAnswers] = useState<EligibilityAnswers>({
    enrolled: null,
    university: null,
    degree: null,
  })

  const stepIndex = STEPS.indexOf(step)
  const eligible = isEligible(answers)

  function answer(key: keyof EligibilityAnswers, value: boolean | string | null) {
    const next = { ...answers, [key]: value }
    setAnswers(next)

    if (key === "enrolled" && value === false) { setStep("result"); return }
    if (key === "enrolled")  { setStep("university"); return }
    if (key === "university") { setStep("degree"); return }
    if (key === "degree")    { setStep("result"); return }
  }

  function back() {
    const prev: Record<EligibilityStep, EligibilityStep> = {
      university: "enrolled",
      degree:     "university",
      result:     "degree",
      enrolled:   "enrolled",
    }
    setStep(prev[step])
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress — only shown during active steps, not on result */}
      {step !== "result" && (
        <div className="flex items-center gap-2">
          {PROGRESS_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={[
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < stepIndex
                  ? "bg-primary text-primary-foreground"
                  : i === stepIndex
                  ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                  : "bg-muted text-muted-foreground",
              ].join(" ")}>
                {i < stepIndex
                  ? <CheckCircle className="size-3.5" weight="fill" />
                  : i + 1}
              </div>
              <span className={[
                "hidden text-xs sm:block",
                i === stepIndex ? "font-medium text-foreground" : "text-muted-foreground",
              ].join(" ")}>
                {label}
              </span>
              {i < PROGRESS_LABELS.length - 1 && (
                <div className="mx-1 h-px w-6 bg-border" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step: Enrolled */}
      {step === "enrolled" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              Are you currently enrolled?
            </CardTitle>
            <CardDescription>
              WOKO housing is exclusively for full-time students. Part-time students and non-students are not eligible.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <OptionButton
              label="Yes, I am an immatriculated student"
              description="Bachelor, Master, or Doctoral programme"
              selected={answers.enrolled === true}
              onClick={() => answer("enrolled", true)}
            />
            <OptionButton
              label="No, I am not currently enrolled"
              selected={answers.enrolled === false}
              onClick={() => answer("enrolled", false)}
            />

            <OptionButton
                label="No, I am not currently enrolled but I know for sure I will be at contract start"
                selected={answers.enrolled === false}
                onClick={() => answer("enrolled", true)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step: University */}
      {step === "university" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Buildings className="size-5 text-primary" />
              Which university are you at?
            </CardTitle>
            <CardDescription>
              WOKO cooperates with a specific set of Zurich universities. Only students from these institutions are eligible.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {ELIGIBLE_UNIVERSITIES.map((uni) => (
              <OptionButton
                key={uni.value}
                label={uni.label}
                selected={answers.university === uni.value}
                onClick={() => answer("university", uni.value)}
              />
            ))}
            <OptionButton
              label="Other / Not listed"
              description="Students at other institutions are usually not eligible"
              selected={answers.university === "other"}
              onClick={() => answer("university", "other")}
            />
          </CardContent>
        </Card>
      )}

      {/* Step: Degree */}
      {step === "degree" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              What level of study?
            </CardTitle>
            <CardDescription>
              Maximum rental periods differ by degree: 8 years for Bachelor/Master, 2 years for Doctoral students.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {DEGREE_LEVELS.map((deg) => (
              <OptionButton
                key={deg.value}
                label={deg.label}
                description={deg.note}
                selected={answers.degree === deg.value}
                onClick={() => answer("degree", deg.value)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Result: not eligible */}
      {step === "result" && !eligible && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="size-5" weight="fill" />
              Not eligible to apply
            </CardTitle>
            <CardDescription>
              {answers.enrolled === false
                ? "WOKO housing is reserved exclusively for full-time students enrolled at eligible Zurich universities."
                : "Your university is not part of the WOKO cooperation network. Only students at UZH, ETH, ZHdK, PHZH, HfH, ZHAW, or KME are eligible."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              For more information about eligibility requirements, visit the WOKO website.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.woko.ch/en/our-service/who-is-eligible-to-rent" target="_blank" rel="noopener noreferrer">
                WOKO eligibility criteria <ArrowSquareOut className="size-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Result: eligible ✓ */}
      {step === "result" && eligible && (
        <div className="flex flex-col gap-5">
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 px-6 py-8 text-center">
            {/* decorative rings */}
            <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-primary/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 size-32 rounded-full bg-primary/10 blur-2xl" />

            <div className="relative flex flex-col items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 ring-4 ring-primary/10">
                <Sparkle className="size-7 text-primary" weight="fill" />
              </div>

              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  You're eligible!
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Great news — you meet the criteria for Paradies. Here's what you confirmed:
                </p>
              </div>

              <ul className="w-full max-w-xs space-y-2 text-left">
                <li className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
                  <CheckCircle className="size-4 shrink-0 text-primary" weight="fill" />
                  <span className="text-muted-foreground">Full-time student</span>
                </li>
                <li className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
                  <CheckCircle className="size-4 shrink-0 text-primary" weight="fill" />
                  <span className="text-muted-foreground">
                    {ELIGIBLE_UNIVERSITIES.find((u) => u.value === answers.university)?.label}
                  </span>
                </li>
                <li className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
                  <CheckCircle className="size-4 shrink-0 text-primary" weight="fill" />
                  <span className="text-muted-foreground">
                    {DEGREE_LEVELS.find((d) => d.value === answers.degree)?.label} ·{" "}
                    <span className="text-xs">{DEGREE_LEVELS.find((d) => d.value === answers.degree)?.note}</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={back}>
              <ArrowLeft className="size-4" /> Review answers
            </Button>
            <Button onClick={() => onPass(answers)}>
              Start application <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Back nav for non-result steps */}
      {step !== "result" && (
        <div className="flex">
          {stepIndex > 0 && (
            <Button variant="ghost" size="sm" onClick={back}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Application form ───────────────────────────────────────────────────────────

const OCCUPATIONS = ["Student", "Employed", "Self-employed", "Other"]

const PRONOUN_SUGGESTIONS = ["she/her", "he/him", "they/them", "she/they", "he/they", "other"]

type FormState = {
  name: string
  pronouns: string
  occupation: string
  age: string
  university: string
  major: string
  otherOccupation: string
  email: string
  phone: string
  letter: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = "Name is required."
  if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 16 || Number(form.age) > 99)
    errors.age = "Enter a valid age between 16 and 99."
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email address."
  if (!form.letter.trim() || form.letter.trim().length < 50)
    errors.letter = "Please write at least 50 characters."
  return errors
}

function ApplicationForm({
  castingId,
  eligibilityAnswers,
}: {
  castingId: string
  eligibilityAnswers: EligibilityAnswers
}) {
  const navigate = useNavigate()
  const uniLabel    = ELIGIBLE_UNIVERSITIES.find((u) => u.value === eligibilityAnswers.university)?.label ?? ""
  const degreeLabel = DEGREE_LEVELS.find((d) => d.value === eligibilityAnswers.degree)?.label ?? ""

  const [form, setForm] = useState<FormState>({
    name:             "",
    pronouns:         "",
    occupation:       "Student",
    age:              "",
    university:       uniLabel,
    major:            "",
    otherOccupation:  "",
    email:            "",
    phone:            "",
    letter:           "",
  })
  const [errors,      setErrors]      = useState<FormErrors>({})
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    setSubmitError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { pronouns, ...rest } = form
      const applicationId = await submitApplication(castingId, {
        ...rest,
        age: Number(form.age),
      })
      navigate(`/apply/${castingId}/success/${applicationId}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unknown error")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

      {/* Eligibility summary */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1.5">
          <GraduationCap className="size-3.5" /> {uniLabel}
        </Badge>
        <Badge variant="secondary" className="gap-1.5">
          {degreeLabel}
        </Badge>
      </div>

      {/* Personal details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            <User className="size-4 text-primary" /> Personal details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <Input id="name" value={form.name} onChange={set("name")} placeholder="Your full name" aria-invalid={!!errors.name} />
                <FieldError>{errors.name}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="pronouns">Pronouns</FieldLabel>
                <FieldDescription>Optional</FieldDescription>
                <Input
                  id="pronouns"
                  value={form.pronouns}
                  onChange={set("pronouns")}
                  placeholder="e.g. she/her"
                  list="pronoun-suggestions"
                />
                <datalist id="pronoun-suggestions">
                  {PRONOUN_SUGGESTIONS.map((p) => <option key={p} value={p} />)}
                </datalist>
              </Field>
            </div>
            <Field data-invalid={!!errors.age}>
              <FieldLabel htmlFor="age">Age</FieldLabel>
              <Input id="age" type="number" min={16} max={99} value={form.age} onChange={set("age")} placeholder="e.g. 24" className="max-w-32" aria-invalid={!!errors.age} />
              <FieldError>{errors.age}</FieldError>
            </Field>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">
                  <Envelope className="size-3.5 text-muted-foreground" /> Email
                </FieldLabel>
                <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" aria-invalid={!!errors.email} />
                <FieldError>{errors.email}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">
                  <Phone className="size-3.5 text-muted-foreground" /> Phone
                </FieldLabel>
                <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+41 79 000 00 00" />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Occupation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            <Buildings className="size-4 text-primary" /> Occupation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="occupation">What best describes your situation?</FieldLabel>
              <Select value={form.occupation} onValueChange={(v) => setForm((f) => ({ ...f, occupation: v }))}>
                <SelectTrigger id="occupation" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OCCUPATIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            {form.occupation === "Student" && (
              <Field>
                <FieldLabel htmlFor="major">Field of study</FieldLabel>
                <FieldDescription>Your major or study programme</FieldDescription>
                <Input id="major" value={form.major} onChange={set("major")} placeholder="e.g. Computer Science" />
              </Field>
            )}
            {form.occupation === "Other" && (
              <Field>
                <FieldLabel htmlFor="otherOccupation">Describe your occupation</FieldLabel>
                <Input id="otherOccupation" value={form.otherOccupation} onChange={set("otherOccupation")} placeholder="What do you do?" />
              </Field>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Motivation letter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            <PencilLine className="size-4 text-primary" /> Motivation letter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Field data-invalid={!!errors.letter}>
            <FieldLabel htmlFor="letter">Why do you want to live with us at Paradies
              ?</FieldLabel>
            <FieldDescription>
              Tell us about yourself and why Paradies is the right fit for you. Minimum 50 characters.
            </FieldDescription>
            <Textarea
              id="letter"
              value={form.letter}
              onChange={set("letter")}
              placeholder="Dear WG…"
              rows={8}
              className="mt-1"
              aria-invalid={!!errors.letter}
            />
            <div className="flex items-center justify-between">
              <FieldError>{errors.letter}</FieldError>
              <span className={[
                "ml-auto text-xs tabular-nums",
                form.letter.length < 50 ? "text-muted-foreground" : "text-primary",
              ].join(" ")}>
                {form.letter.length} / 50+
              </span>
            </div>
          </Field>
        </CardContent>
      </Card>

      {submitError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-2 py-3 text-sm text-destructive">
            <XCircle className="size-4 shrink-0" weight="fill" />
            Failed to submit: {submitError}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? "Submitting…" : "Submit application"}
          {!submitting && <ArrowRight className="size-4" />}
        </Button>
      </div>
    </form>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const { castingId } = useParams<{ castingId: string }>()
  const [eligibilityAnswers, setEligibilityAnswers] = useState<EligibilityAnswers | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-2xl items-center px-4">
          <Logo />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {eligibilityAnswers ? "Your application" : "Check eligibility"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {eligibilityAnswers
              ? "Fill in your details and tell us about yourself."
              : "WOKO housing is reserved for students at eligible Zurich universities. Let's confirm you qualify before you apply."}
          </p>
        </div>

        {!eligibilityAnswers ? (
          <EligibilityQuestionnaire onPass={setEligibilityAnswers} />
        ) : (
          <ApplicationForm castingId={castingId!} eligibilityAnswers={eligibilityAnswers} />
        )}
      </main>
    </div>
  )
}