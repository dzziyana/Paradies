// ─── Types ────────────────────────────────────────────────────────────────────

export type AppStatus =
  | "PENDING"
  | "SUBMITTED"
  | "EVALUATED_YES"
  | "EVALUATED_NO"
  | "REJECTED_AFTER_CASTING"
  | "MOVED_IN"
  | "WITHDRAWN";

export type EvaluationCategory =
  | "YES"
  | "MAYBE"
  | "NO"
  | "VETO"
  | "FRIEND"
  | "NOT_WOKO";

export interface Resident {
  id: string;
  name: string;
  birthday: string; // ISO date "YYYY-MM-DD"
  roomNumber: string;
  email: string;
  phone: string | null;
}

export interface CleaningDuty {
  id: string;
  assignedResident: Resident;
  dueDate: string; // ISO date "YYYY-MM-DD"
  area: string;
  completed: boolean;
}

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  sizeM2: number;
  description: string;
  photo: string | null;
  photoMimeType: string | null;
}

export interface CastingListItem {
  id: string;
  moveInDate: string; // ISO date
  moveOutDate: string | null;
  time: string | null; // ISO datetime
  replacedPersonName: string;
  applicationUntil: string | null;
  applicationOpen: boolean;
  applicationPeriodActive: boolean;
  sublet: boolean;
  applicationCount: number;
  unevaluatedCount: number;
  room: Room | null;
}

export interface ApplicationOverview {
  id: string;
  name: string;
  occupation: string;
  age: number;
  university: string | null;
  major: string | null;
  status: AppStatus;
  hasProfilePicture: boolean;
  extractedKeywords: string | null;
  yesCount: number;
  maybeCount: number;
  noCount: number;
  vetoCount: number;
}

export interface ActiveCastingWithApps extends CastingListItem {
  applications: ApplicationOverview[];
}

export interface Application {
  id: string;
  name: string;
  occupation: string;
  age: number;
  university: string | null;
  major: string | null;
  otherOccupation: string | null;
  email: string;
  phone: string | null;
  letter: string;
  pronouns: string | null;
  profilePicture: string | null;
  profilePictureMimeType: string | null;
  additionalPictures: string | null;       // pipe-separated base64
  additionalPictureMimeTypes: string | null; // pipe-separated mimes
  extractedKeywords: string | null;
  status: AppStatus;
}

export interface EvaluationOverview {
  id: string;
  authorId: string;
  authorName: string;
  judgement: EvaluationCategory;
  time: string; // ISO datetime
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  if (res.status === 204 || res.headers.get("content-length") === "0") return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Residents ────────────────────────────────────────────────────────────────

export interface Me {
  id: string;
  name: string;
  email: string;
  roomNumber: string;
  phone: string | null;
  profilePicture: string | null;
  profilePictureMimeType: string | null;
  subletting: boolean;
}

export const getMe = () => fetchJson<Me>("/auth/me");

export interface LoginRequest {
  email: string;
  password: string;
}

export const login = (req: LoginRequest) =>
  fetchJson<Me>("/auth/login", {
    method: "POST",
    body: JSON.stringify(req),
  });

export const logout = () =>
  fetchJson<void>("/auth/logout", { method: "POST" });

export interface InviteInfo {
  name: string;
  email: string;
  isReset: boolean;
}

export const checkInvite = (token: string) =>
  fetchJson<InviteInfo>(`/auth/invite/${token}`);

export interface UpdateMeRequest {
  phone: string | null;
  profilePicture: string | null;
  profilePictureMimeType: string | null;
}

export const updateMe = (req: UpdateMeRequest) =>
  fetchJson<Me>("/auth/me", {
    method: "PUT",
    body: JSON.stringify(req),
  });

export const forgotPassword = (email: string) =>
  fetchJson<void>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export interface SetupRequest {
  inviteToken: string;
  password: string;
  profilePicture: string | null;
  profilePictureMimeType: string | null;
}

export const setupAccount = (req: SetupRequest) =>
  fetchJson<Me>("/auth/setup", {
    method: "POST",
    body: JSON.stringify(req),
  });

export const getResidents = () => fetchJson<Resident[]>("/residents");

export interface UpcomingBirthday {
  id: string;
  name: string;
  birthday: string; // ISO "YYYY-MM-DD"
  roomNumber: string;
  daysUntil: number;
}

export const getUpcomingBirthdays = () =>
  fetchJson<UpcomingBirthday[]>("/residents/upcoming-birthdays");

export interface CreateResidentRequest {
  name: string;
  birthday: string; // ISO "YYYY-MM-DD"
  roomNumber: string;
  email: string;
}

export interface CreateResidentResponse {
  id: string;
  inviteToken: string;
}

export const createResident = (req: CreateResidentRequest) =>
  fetchJson<CreateResidentResponse>("/residents", {
    method: "POST",
    body: JSON.stringify(req),
  });

export const updateResident = (id: string, req: CreateResidentRequest) =>
  fetchJson<void>(`/residents/${id}`, {
    method: "PUT",
    body: JSON.stringify(req),
  });

export const deleteResident = (id: string) =>
  fetchJson<void>(`/residents/${id}`, { method: "DELETE" });

// ─── Cleaning Duties ──────────────────────────────────────────────────────────

export const getCleaningDuties = () => fetchJson<CleaningDuty[]>("/cleaning-duties");

export const completeCleaningDuty = (id: string) =>
  fetchJson<void>(`/cleaning-duties/${id}/complete`, { method: "PUT" });

export const uncompleteCleaningDuty = (id: string) =>
  fetchJson<void>(`/cleaning-duties/${id}/uncomplete`, { method: "PUT" });

export const deleteCleaningDuty = (id: string) =>
  fetchJson<void>(`/cleaning-duties/${id}`, { method: "DELETE" });

export const deleteAllCleaningDuties = () =>
  fetchJson<void>("/cleaning-duties", { method: "DELETE" });

export const createCleaningDuty = (residentId: string, dueDate: string, area: string) =>
  fetchJson<string>("/cleaning-duties", {
    method: "POST",
    body: JSON.stringify({ residentId, dueDate, area }),
  });

export interface ProposedAssignment {
  dueDate: string;
  area: string;
  residentId: string;
  residentName: string;
}

export const generateCleaningPlan = (year: number, month: number) =>
  fetchJson<ProposedAssignment[]>(`/cleaning-duties/generate?year=${year}&month=${month}`);

// ─── Rooms ────────────────────────────────────────────────────────────────────

export const getRooms = () => fetchJson<Room[]>("/rooms");

export const getRoom = (id: string) => fetchJson<Room>(`/rooms/${id}`);

export interface CreateRoomRequest {
  roomNumber: string;
  floor: number;
  sizeM2: number;
  description: string;
  photo: string | null;
  photoMimeType: string | null;
}

export const createRoom = (req: CreateRoomRequest) =>
  fetchJson<string>("/rooms", {
    method: "POST",
    body: JSON.stringify(req),
  });

export const deleteRoom = (id: string) =>
  fetchJson<void>(`/rooms/${id}`, { method: "DELETE" });

// ─── Castings ─────────────────────────────────────────────────────────────────

export interface CastingPublicView {
  id: string;
  moveInDate: string;
  moveOutDate: string | null;
  replacedPersonName: string;
  applicationUntil: string | null;
  applicationPeriodActive: boolean;
  sublet: boolean;
  room: Room | null;
}

export const getCasting = (castingId: string) =>
  fetchJson<CastingPublicView>(`/castings/${castingId}`);

export const getCastings = () => fetchJson<CastingListItem[]>("/castings");

export interface CreateCastingRequest {
  moveInDate: string;       // ISO "YYYY-MM-DD"
  moveOutDate: string | null;
  replacedPersonName: string;
  applicationUntil: string | null;
  roomId: string | null;
  sublet: boolean;
}

export const createCasting = (req: CreateCastingRequest) =>
  fetchJson<string>("/castings", {
    method: "POST",
    body: JSON.stringify(req),
  });

export const getActiveCastingsWithApps = () =>
  fetchJson<ActiveCastingWithApps[]>("/castings/active/applications");

export interface ApplicationRequest {
  name: string;
  occupation: string;
  age: number;
  university: string;
  major: string | null;
  otherOccupation: string | null;
  email: string;
  phone: string | null;
  letter: string;
  pronouns: string | null;
  profilePicture: string | null;
  profilePictureMimeType: string | null;
  additionalPictures: string[] | null;
  additionalPictureMimeTypes: string[] | null;
}

export interface ApplyResponse {
  applicationId: string;
  magicLinkToken: string;
}

export const submitApplication = (castingId: string, req: ApplicationRequest) =>
  fetchJson<ApplyResponse>(`/castings/${castingId}/application`, {
    method: "POST",
    body: JSON.stringify(req),
  });

export interface MagicLinkView {
  applicationName: string;
  castingMoveInDate: string;
  status: AppStatus;
  applicationId: string;
  castingId: string;
}

export const getMagicLink = (token: string) =>
  fetchJson<MagicLinkView>(`/magic-link/${token}`);

export const withdrawApplication = (token: string) =>
  fetchJson<void>(`/magic-link/${token}/withdraw`, { method: "PUT" });

// ─── Applications ─────────────────────────────────────────────────────────────

export const getApplications = (castingId: string) =>
  fetchJson<ApplicationOverview[]>(`/castings/${castingId}/applications`);

export const getApplication = (castingId: string, applicationId: string) =>
  fetchJson<Application>(`/castings/${castingId}/application?id=${applicationId}`);

export const getEvaluations = (castingId: string, applicationId: string) =>
  fetchJson<EvaluationOverview[]>(
    `/castings/${castingId}/application/${applicationId}/evaluations`
  );

export const submitEvaluation = (
  castingId: string,
  applicationId: string,
  evaluation: EvaluationCategory
) =>
  fetchJson<void>(`/castings/${castingId}/application/${applicationId}/evaluation`, {
    method: "PUT",
    body: JSON.stringify({ evaluation }),
  });

export const retractEvaluation = (castingId: string, applicationId: string) =>
  fetchJson<void>(`/castings/${castingId}/application/${applicationId}/evaluation`, {
    method: "DELETE",
  });

export const closeApplications = (castingId: string) =>
  fetchJson<void>(`/castings/${castingId}/close-applications`, { method: "PUT" });

export const setCastingRoom = (castingId: string, roomId: string | null) =>
  fetchJson<void>(`/castings/${castingId}/room`, {
    method: "PUT",
    body: JSON.stringify({ roomId }),
  });

export interface DispatchSummary {
  invited: number;
  rejected: number;
  skipped: number;
}

export const dispatchCasting = (castingId: string) =>
  fetchJson<DispatchSummary>(`/castings/${castingId}/dispatch`, { method: "POST" });

export const finalizeCasting = (castingId: string, applicationId: string) =>
  fetchJson<void>(`/castings/${castingId}/finalize?applicationId=${applicationId}`, { method: "PUT" });

export const setApplicationUntil = (castingId: string, date: string | null) =>
  fetchJson<void>(`/castings/${castingId}/application-until`, {
    method: "PUT",
    body: JSON.stringify({ applicationUntil: date }),
  });

export const setCastingTime = (castingId: string, time: string) =>
  fetchJson<void>(`/castings/${castingId}/time`, {
    method: "PUT",
    body: JSON.stringify({ time }),
  });

// ─── Ämtli ────────────────────────────────────────────────────────────────────

export interface AemtliResidentRef {
  id: string;
  name: string;
  roomNumber: string;
}

export interface AemtliLastChange {
  changedBy: AemtliResidentRef;
  changedAt: string; // ISO datetime
}

export interface AemtliView {
  id: string;
  name: string;
  assignedResidents: AemtliResidentRef[];
  lastChange: AemtliLastChange | null;
}

export const getAemtli = () => fetchJson<AemtliView[]>("/aemtli");

export const createAemtli = (name: string) =>
  fetchJson<string>("/aemtli", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const updateAemtliAssignments = (id: string, residentIds: string[]) =>
  fetchJson<AemtliView>(`/aemtli/${id}/assignments`, {
    method: "PUT",
    body: JSON.stringify({ residentIds }),
  });

export const deleteAemtli = (id: string) =>
  fetchJson<void>(`/aemtli/${id}`, { method: "DELETE" });

// ─── Calendar Entries ─────────────────────────────────────────────────────────

export type CalendarEntryCategory = "EVENT" | "ABSENCE" | "PARTY";

export interface CalendarEntryDTO {
  id: string;
  title: string;
  startDate: string; // ISO "YYYY-MM-DD"
  endDate: string;   // ISO "YYYY-MM-DD"
  time: string | null; // "HH:MM" for point-wise
  color: number;
  category: CalendarEntryCategory;
  resident: { id: string; name: string } | null; // linked resident (for absences)
}

export interface CreateCalendarEntryRequest {
  title: string;
  startDate: string;
  endDate: string;
  time: string | null;
  color: number;
  category: CalendarEntryCategory;
  residentId: string | null;
}

export const getCalendarEntries = () => fetchJson<CalendarEntryDTO[]>("/calendar-entries");

export const createCalendarEntry = (entry: CreateCalendarEntryRequest) =>
  fetchJson<string>("/calendar-entries", {
    method: "POST",
    body: JSON.stringify(entry),
  });

export const deleteCalendarEntry = (id: string) =>
  fetchJson<void>(`/calendar-entries/${id}`, { method: "DELETE" });

// ─── Date utils ───────────────────────────────────────────────────────────────

/** Format ISO date string "YYYY-MM-DD" to European "DD.MM.YYYY" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** Format ISO date string "YYYY-MM-DD" to "DD.MM" (birthday display) */
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

/** Compute days until next occurrence of a birthday (ISO "YYYY-MM-DD") */
export function daysUntilBirthday(birthdayIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [, m, d] = birthdayIso.split("-").map(Number);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

/** Parse comma-separated extractedKeywords string into an array */
export function parseKeywords(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}

/** Hash a string to a deterministic index (for avatar colors / keyword pill cycling) */
export function hashIndex(str: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}
