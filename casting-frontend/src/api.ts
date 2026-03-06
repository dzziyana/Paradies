const BASE = "/castings"

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function createCasting(
  castingId: string,
  moveInDate: string,
  moveOutDate: string,
  replacedPersonName: string,
  applicationUntil?: string
) {
  const res = await fetch(`${BASE}/${castingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moveInDate, moveOutDate, replacedPersonName, applicationUntil: applicationUntil || null }),
  })
  return handleResponse(res)
}

export async function closeApplications(castingId: string) {
  const res = await fetch(`${BASE}/${castingId}/close-applications`, { method: "PUT" })
  return handleResponse(res)
}

export async function setApplicationUntil(castingId: string, applicationUntil: string | null) {
  const res = await fetch(`${BASE}/${castingId}/application-until`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicationUntil }),
  })
  return handleResponse(res)
}

export async function setCastingTime(castingId: string, time: string) {
  const res = await fetch(`${BASE}/${castingId}/time`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ time }),
  })
  return handleResponse(res)
}

export async function getCasting(castingId: string) {
  const res = await fetch(`${BASE}/${castingId}`)
  return handleResponse(res)
}

export interface ApplicationData {
  name: string
  occupation: string
  age: number
  university: string
  major: string
  otherOccupation: string
  email: string
  phone: string
  letter: string
}

export async function submitApplication(castingId: string, data: ApplicationData) {
  const res = await fetch(`${BASE}/${castingId}/application`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function getApplication(castingId: string, applicationId: string) {
  const res = await fetch(`${BASE}/${castingId}/application?id=${applicationId}`)
  return handleResponse(res)
}

export type EvaluationCategory = "YES" | "MAYBE" | "NO" | "VETO" | "FRIEND" | "NOT_WOKO"

export interface CastingOverview {
  id: string
  moveInDate: string
  moveOutDate: string
  time: string | null
  applicationCount: number
  applications: ApplicationOverview[]
  replacedPersonName: string
  applicationUntil: string | null
  applicationOpen: boolean
  applicationPeriodActive: boolean
}

export async function listCastings(): Promise<CastingOverview[]> {
  const res = await fetch(`${BASE}`)
  return handleResponse(res)
}

export type AppStatus = "PENDING" | "SUBMITTED" | "WITHDRAWN" | "EVALUATED_YES" | "EVALUATED_NO" | "MOVED_IN"

export interface ApplicationOverview {
  id: string
  name: string
  occupation: string
  age: number
  university: string
  major: string
  status: AppStatus | null
}

export async function listApplications(castingId: string): Promise<ApplicationOverview[]> {
  const res = await fetch(`${BASE}/${castingId}/applications`)
  return handleResponse(res)
}

export async function listActiveApplications(): Promise<CastingOverview[]> {
  const res = await fetch(`${BASE}/active/applications`)
  return handleResponse(res)
}

export async function evaluateApplication(
  castingId: string,
  applicationId: string,
  evaluation: EvaluationCategory,
  userId: string
) {
  const res = await fetch(`${BASE}/${castingId}/application/${applicationId}/evaluation`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ evaluation, userId }),
  })
  return handleResponse(res)
}