import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Check, AlertTriangle } from "lucide-react";
import { getResidents, getCleaningDuties, createCleaningDuty, deleteCleaningDuty, generateCleaningPlan, type Resident } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type CleaningArea = "Wednesday" | "Sunday Kitchen" | "Sunday Living Room";

interface Slot {
  date: string; // ISO "YYYY-MM-DD"
  area: CleaningArea;
  dayLabel: string;
}

interface Assignment {
  residentId: string;
  residentName: string;
  completed?: boolean;
  dutyId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function toDayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay() === 3 ? "Wednesday" : "Sunday";
  return `${dow} ${pad(d)}.${pad(m)}`;
}

function getSlotsForMonth(year: number, month: number): Slot[] {
  const slots: Slot[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    const iso = toIso(year, month, d);
    const label = toDayLabel(iso);
    if (dow === 3) {
      slots.push({ date: iso, area: "Wednesday", dayLabel: label });
    } else if (dow === 0) {
      slots.push({ date: iso, area: "Sunday Kitchen", dayLabel: label });
      slots.push({ date: iso, area: "Sunday Living Room", dayLabel: label });
    }
  }
  return slots;
}

function isPastDue(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const grace = new Date(today);
  grace.setDate(today.getDate() - 1);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d) < grace;
}

// ─── Area config ──────────────────────────────────────────────────────────────

const AREA_CONFIG: Record<CleaningArea, { label: string; pillCls: string; dotCls: string }> = {
  "Wednesday":          { label: "Wednesday",   pillCls: "bg-primary/15 text-primary",       dotCls: "bg-primary" },
  "Sunday Kitchen":     { label: "Kitchen",      pillCls: "bg-rose/15 text-rose",             dotCls: "bg-rose" },
  "Sunday Living Room": { label: "Living Room",  pillCls: "bg-periwinkle/15 text-periwinkle", dotCls: "bg-periwinkle" },
};

// ─── Resident avatar colors ────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: "bg-primary/20 text-primary border-primary/30",         active: "bg-primary text-on-primary" },
  { bg: "bg-rose/20 text-rose border-rose/30",                  active: "bg-rose text-white" },
  { bg: "bg-periwinkle/20 text-periwinkle border-periwinkle/30",active: "bg-periwinkle text-white" },
  { bg: "bg-tertiary/20 text-tertiary border-tertiary/30",      active: "bg-tertiary text-on-tertiary" },
  { bg: "bg-blush/40 text-on-surface border-blush/30",          active: "bg-blush text-on-surface" },
];

function avatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

// ─── SlotAvatarRow ────────────────────────────────────────────────────────────

function SlotAvatarRow({
  slot,
  assignment,
  residents,
  persisted,
  onChange,
}: {
  slot: Slot;
  assignment: Assignment | undefined;
  residents: Resident[];
  persisted: boolean;
  onChange: (slotKey: string, assignment: Assignment | null) => void;
}) {
  const slotKey = `${slot.date}:${slot.area}`;
  const isCompleted = assignment?.completed === true;
  const isOverdue = persisted && !isCompleted && isPastDue(slot.date);
  const cfg = AREA_CONFIG[slot.area];

  return (
    <div className="flex items-center gap-3">
      {/* Area pill */}
      <span className={`shrink-0 px-2.5 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-wider ${cfg.pillCls}`}>
        {cfg.label}
      </span>

      {/* Avatar buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {isCompleted ? (
          // Completed: show assigned resident as locked green
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-yes/15 border border-status-yes/30">
            <Check size={12} strokeWidth={3} className="text-status-yes" />
            <span className="font-body text-xs text-status-yes font-semibold">
              {assignment!.residentName}
            </span>
          </div>
        ) : isOverdue && assignment ? (
          // Overdue with assignment: show red tinted with warning
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-no/15 border border-status-no/30">
              <AlertTriangle size={11} className="text-status-no" />
              <span className="font-body text-xs text-status-no font-semibold">
                {assignment.residentName}
              </span>
            </div>
            {/* Still allow reassigning overdue */}
            {residents.map((r, i) => {
              if (r.id === assignment.residentId) return null;
              const colors = avatarColor(i);
              return (
                <button
                  key={r.id}
                  title={r.name}
                  onClick={() => onChange(slotKey, { residentId: r.id, residentName: r.name })}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all active:scale-90 ${colors.bg}`}
                >
                  {r.name[0]}
                </button>
              );
            })}
          </div>
        ) : (
          // Normal: toggle buttons for each resident
          residents.map((r, i) => {
            const isAssigned = assignment?.residentId === r.id;
            const colors = avatarColor(i);
            return (
              <div key={r.id} className="relative">
                <button
                  title={r.name}
                  onClick={() =>
                    onChange(slotKey, isAssigned ? null : { residentId: r.id, residentName: r.name })
                  }
                  className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-sm transition-all active:scale-90 ${
                    isAssigned ? colors.active + " shadow-sm" : colors.bg + " hover:scale-105"
                  }`}
                >
                  {r.name[0]}
                </button>
                {/* Saved indicator dot */}
                {isAssigned && persisted && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface ${cfg.dotCls}`} />
                )}
              </div>
            );
          })
        )}

        {/* Unassigned placeholder */}
        {!isCompleted && !assignment && !isOverdue && (
          <span className="font-body text-xs text-on-surface-variant/40 italic pl-1">
            unassigned
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CleaningPlanPage() {
  const navigate = useNavigate();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [residents, setResidents] = useState<Resident[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [persistedKeys, setPersistedKeys] = useState<Set<string>>(new Set());
  const [originalAssignments, setOriginalAssignments] = useState<Record<string, Assignment>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getResidents().then(setResidents).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingMonth(true);
    setSaved(false);
    setError(null);
    const monthStr = `${year}-${pad(month + 1)}`;
    getCleaningDuties()
      .then((all) => {
        const existing: Record<string, Assignment> = {};
        const keys = new Set<string>();
        for (const duty of all) {
          if (duty.dueDate.startsWith(monthStr)) {
            const key = `${duty.dueDate}:${duty.area}`;
            existing[key] = {
              residentId: duty.assignedResident.id,
              residentName: duty.assignedResident.name,
              completed: duty.completed,
              dutyId: duty.id,
            };
            keys.add(key);
          }
        }
        setAssignments(existing);
        setOriginalAssignments(existing);
        setPersistedKeys(keys);
      })
      .catch(() => {
        setAssignments({});
        setOriginalAssignments({});
        setPersistedKeys(new Set());
      })
      .finally(() => setLoadingMonth(false));
  }, [year, month]);

  const slots = getSlotsForMonth(year, month);
  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    (acc[s.date] ??= []).push(s);
    return acc;
  }, {});

  function handleAssign(slotKey: string, assignment: Assignment | null) {
    setAssignments((prev) => {
      const next = { ...prev };
      if (assignment) next[slotKey] = assignment;
      else delete next[slotKey];
      return next;
    });
    setSaved(false);
  }

  async function handleAutoAssign() {
    setGenerating(true);
    setError(null);
    try {
      const proposals = await generateCleaningPlan(year, month + 1);
      setAssignments((prev) => {
        const next = { ...prev };
        for (const p of proposals) {
          const key = `${p.dueDate}:${p.area}`;
          if (!persistedKeys.has(key)) {
            next[key] = { residentId: p.residentId, residentName: p.residentName };
          }
        }
        return next;
      });
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-assign failed.");
    } finally {
      setGenerating(false);
    }
  }

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  async function handleSave() {
    const toCreate: [string, Assignment][] = [];
    const toDelete: string[] = [];

    for (const [key, a] of Object.entries(assignments)) {
      const orig = originalAssignments[key];
      if (!orig) {
        toCreate.push([key, a]);
      } else if (orig.residentId !== a.residentId && !a.completed) {
        if (orig.dutyId) toDelete.push(orig.dutyId);
        toCreate.push([key, a]);
      }
    }

    if (toCreate.length === 0 && toDelete.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await Promise.all(toDelete.map((id) => deleteCleaningDuty(id)));
      await Promise.all(
        toCreate.map(([key, a]) => {
          const [date, area] = key.split(/:(.+)/);
          return createCleaningDuty(a.residentId, date, area);
        })
      );
      const monthStr = `${year}-${pad(month + 1)}`;
      const all = await getCleaningDuties();
      const existing: Record<string, Assignment> = {};
      const keys = new Set<string>();
      for (const duty of all) {
        if (duty.dueDate.startsWith(monthStr)) {
          const k = `${duty.dueDate}:${duty.area}`;
          existing[k] = {
            residentId: duty.assignedResident.id,
            residentName: duty.assignedResident.name,
            completed: duty.completed,
            dutyId: duty.id,
          };
          keys.add(k);
        }
      }
      setAssignments(existing);
      setOriginalAssignments(existing);
      setPersistedKeys(keys);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const changeCount = Object.entries(assignments).filter(([key, a]) => {
    const orig = originalAssignments[key];
    if (!orig) return true;
    if (orig.residentId !== a.residentId && !a.completed) return true;
    return false;
  }).length;

  // Monthly stats
  const assignedCount = slots.filter((s) => assignments[`${s.date}:${s.area}`]).length;
  const doneCount = slots.filter((s) => assignments[`${s.date}:${s.area}`]?.completed).length;
  const unassignedCount = slots.length - assignedCount;

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] uppercase tracking-[0.15em] font-semibold hover:text-primary transition-colors self-start"
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Month hero card */}
      <div className="rounded-3xl bg-gradient-to-br from-primary-container via-primary to-navy overflow-hidden shadow-md">
        <div className="px-6 pt-6 pb-4">
          {/* Top row: label + auto-assign */}
          <div className="flex items-center justify-between mb-3">
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-white/60 font-semibold">
              Cleaning plan
            </p>
            <button
              onClick={handleAutoAssign}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white font-label text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40"
            >
              <Sparkles size={11} />
              {generating ? "Generating…" : "Auto-assign"}
            </button>
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-90"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-headline text-4xl font-bold italic text-white tracking-tight">
              {MONTH_NAMES[month]}
              <span className="font-body text-lg font-normal text-white/50 ml-2">{year}</span>
            </h2>
            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-90"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 font-label text-[10px] font-bold text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed/80 inline-block" />
              {assignedCount} assigned
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 font-label text-[10px] font-bold text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-status-yes inline-block" />
              {doneCount} done
            </span>
            {unassignedCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 font-label text-[10px] font-bold text-white/50">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 inline-block" />
                {unassignedCount} unassigned
              </span>
            )}
          </div>
        </div>

        {/* Legend strip */}
        <div className="px-6 py-2 bg-black/10 flex items-center gap-4">
          <span className="font-label text-[9px] text-white/50 uppercase tracking-widest font-bold">Legend</span>
          <span className="font-body text-[10px] text-white/50">✦ saved</span>
          <span className="font-body text-[10px] text-status-yes/70">✓ done</span>
          <span className="font-body text-[10px] text-status-no/70">⚠ missed</span>
        </div>
      </div>

      {/* Slots */}
      {loadingMonth ? (
        <p className="font-body text-sm text-on-surface-variant opacity-60 text-center py-8">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {Object.entries(slotsByDate).map(([date, dateSlots]) => {
            const isWed = dateSlots[0].area === "Wednesday";
            return (
              <div key={date} className="rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Day header */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant/15">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-headline font-bold text-sm ${
                    isWed ? "bg-primary/10 text-primary" : "bg-periwinkle/10 text-periwinkle"
                  }`}>
                    {isWed ? "W" : "S"}
                  </div>
                  <p className="font-label text-sm uppercase tracking-[0.12em] text-on-surface font-semibold">
                    {dateSlots[0].dayLabel}
                  </p>
                </div>

                {/* Slots */}
                <div className="px-5 py-4 flex flex-col gap-3">
                  {dateSlots.map((slot) => {
                    const slotKey = `${slot.date}:${slot.area}`;
                    return (
                      <SlotAvatarRow
                        key={slot.area}
                        slot={slot}
                        assignment={assignments[slotKey]}
                        residents={residents}
                        persisted={persistedKeys.has(slotKey)}
                        onChange={handleAssign}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback */}
      {error && (
        <p className="font-body text-sm text-status-no px-1">{error}</p>
      )}
      {saved && (
        <p className="font-body text-sm text-status-yes px-1 font-semibold">
          ✦ Plan updated for {MONTH_NAMES[month]}!
        </p>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={submitting || changeCount === 0}
        className="w-full py-4 bg-primary text-on-primary rounded-full font-label text-sm font-bold tracking-widest transition-all active:scale-[0.98] disabled:opacity-40"
      >
        {submitting
          ? "Saving…"
          : changeCount === 0
          ? "UP TO DATE ✦"
          : `SAVE · ${changeCount} NEW`}
      </button>
    </div>
  );
}
