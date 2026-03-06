import { useParams } from "react-router-dom"
import { CheckCircle, CopySimple } from "@phosphor-icons/react"
import { useState } from "react"
import Logo from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function SuccessPage() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(applicationId ?? "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-2xl items-center px-4">
          <Logo />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-16">
        <div className="mb-8 flex flex-col items-center text-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="size-8 text-primary" weight="fill" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Application submitted</h1>
          <p className="text-sm text-muted-foreground">
            Your application has been received. We will be in touch via the email you provided.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Application ID
            </CardTitle>
            <CardDescription>
              Save this ID for future reference.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <code className="block rounded-md bg-muted px-3 py-2.5 font-mono text-xs text-foreground break-all">
              {applicationId}
            </code>
            <Button variant="outline" size="sm" onClick={copy} className="w-full">
              <CopySimple className="size-3.5" />
              {copied ? "Copied!" : "Copy to clipboard"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}