import { useCallback, useEffect, useState } from "react";
import { Check, ArrowRight, Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getCleaningDuties,
  completeCleaningDuty,
  uncompleteCleaningDuty,
  formatDate,
  type CleaningDuty,
} from "@/lib/api";
import CleaningCelebration from "@/components/CleaningCelebration";
import { useAuth } from "@/lib/AuthContext";

const SEMESTER_AREA = "Semester Cleaning";

/** Returns true if today is within [dueDate − 1 day, dueDate + 2 days]. */
function canMarkDone(dueDateIso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dueDateIso.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const earliest = new Date(due);
  earliest.setDate(due.getDate() - 1);
  const latest = new Date(due);
  latest.setDate(due.getDate() + 2);
  return today >= earliest && today <= latest;
}

/** Pixel cat resting GIF for completed duties */
function PixelCat({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/cleaning_done_card_cats/cat-rest.gif"
      alt=""
      width={size}
      height={size}
      className="shrink-0"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

interface SemesterDuty {
  id: string;
  dueDate: string;
}

export default function CleaningPlanCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const CURRENT_USER = user?.name ?? "";
  const [pendingDuties, setPendingDuties] = useState<CleaningDuty[]>([]);
  const [completedDuties, setCompletedDuties] = useState<CleaningDuty[]>([]);
  const [semester, setSemester] = useState<SemesterDuty | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [uncompleting, setUncompleting] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);

  function isRelevant(dueDateIso: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 2);
    const [y, m, d] = dueDateIso.split("-").map(Number);
    return new Date(y, m - 1, d) >= cutoff;
  }

  function isRecentlyCompleted(dueDateIso: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 7); // show last 7 days
    const [y, m, d] = dueDateIso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date >= cutoff && date <= today;
  }

  function load() {
    getCleaningDuties()
      .then((all) => {
        const nonSemester = all.filter((d) => d.area !== SEMESTER_AREA);
        const pending = nonSemester.filter((d) => !d.completed && isRelevant(d.dueDate));

        // Deduplicate completed duties by date+area (keep only one per slot)
        const completedRaw = nonSemester.filter((d) => d.completed && isRecentlyCompleted(d.dueDate));
        const seen = new Set<string>();
        const completed = completedRaw.filter((d) => {
          const key = `${d.dueDate}:${d.area}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const sem = all.find((d) => d.area === SEMESTER_AREA && !d.completed && isRelevant(d.dueDate));

        setPendingDuties(pending);
        setCompletedDuties(completed);
        setSemester(sem ? { id: sem.id, dueDate: sem.dueDate } : null);
      })
      .catch(() => {
        const today = new Date();
        function mockDate(offsetDays: number) {
          const d = new Date(today);
          d.setDate(today.getDate() + offsetDays);
          return d.toISOString().slice(0, 10);
        }
        setPendingDuties([
          {
            id: "mock-1",
            assignedResident: { id: "r1", name: "Alice", birthday: "2000-05-12", roomNumber: "301", email: "", phone: null },
            dueDate: mockDate(0),
            area: "Wednesday",
            completed: false,
          },
          {
            id: "mock-2",
            assignedResident: { id: "r2", name: "Ben", birthday: "1998-07-04", roomNumber: "302", email: "", phone: null },
            dueDate: mockDate(4),
            area: "Sunday Kitchen",
            completed: false,
          },
          {
            id: "mock-3",
            assignedResident: { id: "r3", name: "Cara", birthday: "1999-09-22", roomNumber: "303", email: "", phone: null },
            dueDate: mockDate(4),
            area: "Sunday Living Room",
            completed: false,
          },
        ]);
        setCompletedDuties([
          {
            id: "mock-done-1",
            assignedResident: { id: "r4", name: "Dan", birthday: "2001-03-30", roomNumber: "304", email: "", phone: null },
            dueDate: mockDate(-1),
            area: "Wednesday",
            completed: true,
          },
        ]);
        setSemester({ id: "mock-sem", dueDate: mockDate(21) });
      });
  }

  useEffect(() => { load(); }, []);

  async function handleComplete(id: string, area: string) {
    setCompleting(id);
    try {
      await completeCleaningDuty(id);
      setCelebration(area);
    } catch {
      setCelebration(area);
    } finally {
      setCompleting(null);
    }
  }

  async function handleUncomplete(id: string) {
    setUncompleting(id);
    try {
      await uncompleteCleaningDuty(id);
      load();
    } catch {
      // ignore for mock
    } finally {
      setUncompleting(null);
    }
  }

  const handleCelebrationDone = useCallback(() => {
    setCelebration(null);
    load();
  }, []);

  const myPending = pendingDuties.find((d) => d.assignedResident.name === CURRENT_USER);
  const otherPending = pendingDuties.filter((d) => d.assignedResident.name !== CURRENT_USER);
  const taskCount = pendingDuties.length;

  return (
    <>
      {celebration && (
        <CleaningCelebration area={celebration} onDone={handleCelebrationDone} />
      )}

      <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-primary-container to-primary p-5 text-on-primary relative overflow-hidden">
        {/* Corner ornament */}
        <span className="absolute top-5 right-5 text-primary-fixed/50 text-2xl select-none">
          ✦
        </span>

        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="font-headline text-2xl font-semibold mb-1">Cleaning Plan</h3>
            <p className="font-body opacity-90 text-sm">Monthly duties</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="bg-primary-fixed text-on-primary-fixed px-4 py-1 rounded-full font-label text-[10px] font-bold tracking-tight">
              {String(taskCount).padStart(2, "0")} TASKS
            </span>
            <button
              onClick={() => navigate("/admin/cleaning")}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white px-3 py-1.5 rounded-full font-label text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
            >
              Update plan <ArrowRight size={11} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* ── Recently completed ── */}
        {completedDuties.length > 0 && (
          <div className="rounded-2xl bg-[#d4edda]/30 backdrop-blur-md border border-[#a3d9a5]/40 p-3 mb-4 flex flex-col gap-2 relative overflow-hidden">
            {/* Shine sweep animation */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.18) 55%, transparent 60%)",
                backgroundSize: "200% 100%",
                animation: "shine-sweep 3s ease-in-out infinite",
              }}
            />
            <p className="font-label text-[9px] uppercase tracking-widest font-bold text-white/70 px-1 relative">
              Recently done ✦
            </p>
            {completedDuties.map((duty) => {
              const isMine = duty.assignedResident.name === CURRENT_USER;
              return (
                <div
                  key={duty.id}
                  className="bg-white/15 rounded-xl px-3.5 py-2.5 flex items-center gap-3 relative"
                >
                  <PixelCat size={30} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-white">
                      {isMine ? "You" : duty.assignedResident.name}
                      <span className="font-normal text-white/60"> · {duty.area}</span>
                    </p>
                    <p className="font-label text-[9px] uppercase tracking-wider text-[#a3d9a5]">
                      {formatDate(duty.dueDate)} · Thank you!
                    </p>
                  </div>
                  {/* Others can be marked "not done" */}
                  {!isMine && (
                    <button
                      onClick={() => handleUncomplete(duty.id)}
                      disabled={uncompleting === duty.id}
                      title="Mark as not done"
                      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-status-no/40 text-white/35 hover:text-white transition-all active:scale-95 disabled:opacity-40"
                    >
                      <Undo2 size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              );
            })}
            <style>{`
              @keyframes shine-sweep {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
          </div>
        )}

        {/* ── My duty — large ── */}
        {myPending && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg border border-white/30">
                {myPending.assignedResident.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-label text-xs uppercase tracking-wider opacity-80">
                  Your turn
                </p>
                <p className="font-body font-semibold">{myPending.area}</p>
              </div>
              <div className="text-right">
                <p className="font-label text-[10px] uppercase tracking-wider opacity-80">Due</p>
                <p className="font-body font-semibold">{formatDate(myPending.dueDate)}</p>
              </div>
            </div>
            {canMarkDone(myPending.dueDate) && (
              <button
                onClick={() => handleComplete(myPending.id, myPending.area)}
                disabled={completing === myPending.id}
                className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full font-label text-sm font-bold tracking-widest transition-all border border-white/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check size={16} strokeWidth={3} />
                {completing === myPending.id ? "MARKING..." : "MARK AS DONE"}
              </button>
            )}
          </div>
        )}

        {/* ── Other pending duties ── */}
        {otherPending.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {otherPending.map((duty) => (
              <div
                key={duty.id}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center font-bold text-xs border border-white/20">
                    {duty.assignedResident.name[0]}
                  </div>
                  <p className="font-body text-sm font-semibold">
                    {duty.assignedResident.name}
                  </p>
                </div>
                <p className="font-label text-[10px] uppercase tracking-wider opacity-70">
                  {duty.area}
                </p>
                <p className="font-body text-xs opacity-80 mt-1">
                  {formatDate(duty.dueDate)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Semester Cleaning ── */}
        {semester && (
          <div className="border border-dashed border-white/30 rounded-xl p-4 flex items-center gap-3">
            <span className="text-primary-fixed/70 text-lg">✦</span>
            <div className="flex-1">
              <p className="font-label text-[10px] uppercase tracking-widest font-bold opacity-80">
                Semester Cleaning
              </p>
              <p className="font-body text-xs opacity-70">
                {formatDate(semester.dueDate)} · Everyone
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
