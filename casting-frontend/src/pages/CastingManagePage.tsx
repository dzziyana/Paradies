import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, Users, Send, Crown, Check } from "lucide-react";
import {
  getCasting,
  getApplications,
  getRooms,
  closeApplications,
  setApplicationUntil,
  setCastingTime,
  setCastingRoom,
  dispatchCasting,
  finalizeCasting,
  formatDate,
  type CastingPublicView,
  type ApplicationOverview,
  type DispatchSummary,
  type Room,
} from "@/lib/api";
import DateInput from "@/components/DateInput";
import CopyLinkButton from "@/components/CopyLinkButton";

const inputClass =
  "w-full bg-surface-container rounded-2xl px-4 py-3.5 font-body text-sm text-on-surface outline outline-1 outline-outline-variant/40 focus:outline-primary focus:outline-2 transition-all appearance-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
        {label}
        {hint && <span className="normal-case tracking-normal ml-1 opacity-50">· {hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function CastingManagePage() {
  const { castingId } = useParams<{ castingId: string }>();
  const navigate = useNavigate();

  const [casting, setCasting] = useState<CastingPublicView | null>(null);
  const [loading, setLoading] = useState(true);

  // Casting time (split into date + time)
  const [castingDate, setCastingDate] = useState("");
  const [castingTimeStr, setCastingTimeStr] = useState("");
  const [savingTime, setSavingTime] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [timeSaved, setTimeSaved] = useState(false);

  // Application deadline
  const [deadline, setDeadline] = useState("");
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);
  const [deadlineSaved, setDeadlineSaved] = useState(false);

  // Room
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [savingRoom, setSavingRoom] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [roomSaved, setRoomSaved] = useState(false);

  // Close applications
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  // Dispatch
  const [apps, setApps] = useState<ApplicationOverview[]>([]);
  const [showDispatchConfirm, setShowDispatchConfirm] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<DispatchSummary | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Finalize
  const [showFinalize, setShowFinalize] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

  useEffect(() => {
    if (!castingId) return;
    getCasting(castingId)
      .then((c) => {
        setCasting(c);
        if (c.applicationUntil) setDeadline(c.applicationUntil);
        if (c.room) setSelectedRoomId(c.room.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    getApplications(castingId).then(setApps).catch(() => {});
    getRooms().then(setRooms).catch(() => {});
  }, [castingId]);

  async function handleSaveTime() {
    if (!castingId || !castingDate || !castingTimeStr) return;
    setSavingTime(true);
    setTimeError(null);
    setTimeSaved(false);
    try {
      await setCastingTime(castingId, `${castingDate}T${castingTimeStr}:00`);
      setTimeSaved(true);
      setTimeout(() => setTimeSaved(false), 2500);
    } catch (e) {
      setTimeError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingTime(false);
    }
  }

  async function handleSaveDeadline() {
    if (!castingId) return;
    setSavingDeadline(true);
    setDeadlineError(null);
    setDeadlineSaved(false);
    try {
      await setApplicationUntil(castingId, deadline || null);
      setDeadlineSaved(true);
      setTimeout(() => setDeadlineSaved(false), 2500);
    } catch (e) {
      setDeadlineError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingDeadline(false);
    }
  }

  async function handleSaveRoom() {
    if (!castingId) return;
    setSavingRoom(true);
    setRoomError(null);
    setRoomSaved(false);
    try {
      await setCastingRoom(castingId, selectedRoomId || null);
      setRoomSaved(true);
      // Update local casting state to reflect new room
      const updated = await getCasting(castingId);
      setCasting(updated);
      setTimeout(() => setRoomSaved(false), 2500);
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingRoom(false);
    }
  }

  async function handleClose() {
    if (!castingId) return;
    setClosing(true);
    setCloseError(null);
    try {
      await closeApplications(castingId);
      setCasting((c) => c ? { ...c, applicationPeriodActive: false } : c);
    } catch (e) {
      setCloseError(e instanceof Error ? e.message : "Failed to close");
    } finally {
      setClosing(false);
    }
  }

  async function handleDispatch() {
    if (!castingId) return;
    setDispatching(true);
    setDispatchError(null);
    try {
      const result = await dispatchCasting(castingId);
      setDispatchResult(result);
      setShowDispatchConfirm(false);
      // Refresh apps to reflect new statuses
      getApplications(castingId).then(setApps).catch(() => {});
    } catch (e) {
      setDispatchError(e instanceof Error ? e.message : "Dispatch failed");
    } finally {
      setDispatching(false);
    }
  }

  async function handleFinalize() {
    if (!castingId || !selectedAppId) return;
    setFinalizing(true);
    setFinalizeError(null);
    try {
      await finalizeCasting(castingId, selectedAppId);
      setFinalized(true);
      setShowFinalize(false);
      getApplications(castingId).then(setApps).catch(() => {});
    } catch (e) {
      setFinalizeError(e instanceof Error ? e.message : "Finalize failed");
    } finally {
      setFinalizing(false);
    }
  }

  // Derived state for dispatch/finalize visibility
  const yesApps = apps.filter((a) => a.status === "EVALUATED_YES");
  const noApps = apps.filter((a) => a.status === "EVALUATED_NO");
  const canDispatch = (yesApps.length > 0 || noApps.length > 0) && !dispatchResult && !finalized;
  const canFinalize = yesApps.length > 0 && !finalized;
  const movedIn = apps.find((a) => a.status === "MOVED_IN");

  if (loading) {
    return (
      <div className="pt-12 text-center font-body text-sm text-on-surface-variant opacity-60">
        Loading…
      </div>
    );
  }

  if (!casting) {
    return (
      <div className="pt-12 text-center font-body text-sm text-on-surface-variant opacity-60">
        Casting not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <button
        onClick={() => navigate("/admin/castings")}
        className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] uppercase tracking-[0.15em] font-semibold hover:text-primary transition-colors self-start"
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header */}
      <section>
        <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-1">
          Manage casting
        </p>
        <h2 className="font-headline text-3xl font-bold italic tracking-tight leading-[1.1]">
          {casting.replacedPersonName}
        </h2>
        <p className="font-body text-xs text-on-surface-variant mt-2 flex items-center gap-1.5">
          <span className="font-label text-[10px] uppercase tracking-[0.12em] font-semibold text-primary/60">Move-in</span>
          <span className="opacity-30">·</span>
          <span>{formatDate(casting.moveInDate)}</span>
          {casting.room && (
            <>
              <span className="opacity-30">·</span>
              <span>Room {casting.room.roomNumber}</span>
            </>
          )}
        </p>
      </section>

      {/* Application link */}
      {castingId && <CopyLinkButton castingId={castingId} variant="full" />}

      {/* View applications shortcut */}
      <button
        onClick={() => navigate(`/admin/applications?castingId=${castingId}`)}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-secondary/10 text-secondary font-label text-[11px] font-bold uppercase tracking-wider hover:bg-secondary/20 transition-colors"
      >
        <Users size={14} strokeWidth={2} />
        View all applications
      </button>

      {/* Settings card */}
      <div className="rounded-3xl bg-surface-container-low p-6 outline outline-1 outline-outline/15 flex flex-col gap-5">
        <p className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant font-semibold text-center">
          ── Settings ──
        </p>

        {/* Casting time */}
        <Field label="Casting time" hint="optional — date & time of the casting event">
          <div className="grid grid-cols-[1fr_6.5rem] gap-2">
            <DateInput
              value={castingDate}
              onChange={setCastingDate}
              placeholder="Date"
              className={inputClass}
            />
            <input
              type="time"
              value={castingTimeStr}
              onChange={(e) => setCastingTimeStr(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            onClick={handleSaveTime}
            disabled={!castingDate || !castingTimeStr || savingTime}
            className={`w-full mt-2 py-3 rounded-2xl font-label text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 ${
              timeSaved
                ? "bg-status-yes/20 text-status-yes"
                : "bg-primary/15 text-primary hover:bg-primary/25"
            }`}
          >
            {savingTime ? "Saving…" : timeSaved ? "Saved ✦" : "Save casting time"}
          </button>
          {timeError && (
            <p className="font-body text-xs text-status-no">{timeError}</p>
          )}
        </Field>

        {/* Application deadline */}
        <Field label="Application deadline" hint="leave empty to remove">
          <DateInput
            value={deadline}
            onChange={setDeadline}
            className={inputClass}
          />
          <button
            onClick={handleSaveDeadline}
            disabled={savingDeadline}
            className={`w-full mt-2 py-3 rounded-2xl font-label text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 ${
              deadlineSaved
                ? "bg-status-yes/20 text-status-yes"
                : "bg-primary/15 text-primary hover:bg-primary/25"
            }`}
          >
            {savingDeadline ? "Saving…" : deadlineSaved ? "Saved ✦" : "Save deadline"}
          </button>
          {deadlineError && (
            <p className="font-body text-xs text-status-no">{deadlineError}</p>
          )}
        </Field>

        {/* Room */}
        <Field label="Room" hint="which room is being filled">
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className={inputClass}
          >
            <option value="">— No room selected —</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.roomNumber} · Floor {r.floor} · {r.sizeM2} m²
              </option>
            ))}
          </select>
          <button
            onClick={handleSaveRoom}
            disabled={savingRoom}
            className={`w-full mt-2 py-3 rounded-2xl font-label text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 ${
              roomSaved
                ? "bg-status-yes/20 text-status-yes"
                : "bg-primary/15 text-primary hover:bg-primary/25"
            }`}
          >
            {savingRoom ? "Saving…" : roomSaved ? "Saved ✦" : "Save room"}
          </button>
          {roomError && (
            <p className="font-body text-xs text-status-no">{roomError}</p>
          )}
        </Field>
      </div>

      {/* Close applications */}
      {casting.applicationPeriodActive && (
        <div className="rounded-3xl bg-status-no/5 p-6 outline outline-1 outline-status-no/20 flex flex-col gap-4">
          <p className="font-label text-xs uppercase tracking-[0.15em] text-status-no font-semibold text-center">
            ── Danger Zone ──
          </p>
          <p className="font-body text-sm text-on-surface-variant text-center">
            Closing applications prevents new submissions. This cannot be undone automatically.
          </p>
          {closeError && (
            <p className="font-body text-xs text-status-no text-center">{closeError}</p>
          )}
          <button
            onClick={handleClose}
            disabled={closing}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-status-no text-white font-label text-sm font-bold tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Ban size={16} strokeWidth={2} />
            {closing ? "Closing…" : "Close Applications"}
          </button>
        </div>
      )}

      {!casting.applicationPeriodActive && !canDispatch && !dispatchResult && (
        <div className="rounded-2xl bg-surface-container px-4 py-3 flex items-center gap-2">
          <Ban size={14} className="text-on-surface-variant opacity-50" />
          <p className="font-body text-sm text-on-surface-variant opacity-60">
            Applications are closed for this casting.
          </p>
        </div>
      )}

      {/* ── Dispatch: bulk invite / reject ── */}
      {canDispatch && (
        <div className="rounded-3xl bg-secondary/5 p-6 outline outline-1 outline-secondary/20 flex flex-col gap-4">
          <p className="font-label text-xs uppercase tracking-[0.15em] text-secondary font-semibold text-center">
            ── Dispatch Emails ──
          </p>
          <p className="font-body text-sm text-on-surface-variant text-center">
            Send invitation emails to accepted applicants and rejection emails to declined ones.
          </p>

          <div className="flex items-center justify-center gap-4 font-body text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-yes" />
              {yesApps.length} to invite
            </span>
            <span className="text-outline/30">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-no" />
              {noApps.length} to reject
            </span>
          </div>

          {!showDispatchConfirm ? (
            <button
              onClick={() => setShowDispatchConfirm(true)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-secondary text-on-secondary font-label text-sm font-bold tracking-widest transition-all active:scale-[0.98]"
            >
              <Send size={16} />
              DISPATCH EMAILS
            </button>
          ) : (
            <div className="rounded-2xl bg-white p-5 outline outline-1 outline-outline/15 flex flex-col gap-4">
              <p className="font-body text-sm font-semibold text-on-surface text-center">
                Are you sure? This will send {yesApps.length + noApps.length} emails.
              </p>

              {yesApps.length > 0 && (
                <div>
                  <p className="font-label text-[10px] uppercase tracking-wider text-status-yes font-bold mb-1.5">Inviting:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {yesApps.map((a) => (
                      <span key={a.id} className="bg-status-yes/10 text-status-yes px-2.5 py-1 rounded-lg font-body text-xs font-semibold">
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {noApps.length > 0 && (
                <div>
                  <p className="font-label text-[10px] uppercase tracking-wider text-status-no font-bold mb-1.5">Rejecting:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {noApps.map((a) => (
                      <span key={a.id} className="bg-status-no/10 text-status-no px-2.5 py-1 rounded-lg font-body text-xs font-semibold">
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {dispatchError && (
                <p className="font-body text-xs text-status-no text-center">{dispatchError}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDispatchConfirm(false)}
                  className="flex-1 py-3 rounded-full bg-surface-container font-label text-xs font-bold tracking-widest transition-all hover:bg-surface-container-high"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDispatch}
                  disabled={dispatching}
                  className="flex-1 py-3 rounded-full bg-secondary text-on-secondary font-label text-xs font-bold tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {dispatching ? "Sending…" : "CONFIRM & SEND"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dispatch result */}
      {dispatchResult && (
        <div className="rounded-2xl bg-status-yes/10 px-5 py-4 flex items-center gap-3">
          <Check size={18} className="text-status-yes shrink-0" />
          <p className="font-body text-sm text-on-surface">
            Dispatched — {dispatchResult.invited} invited, {dispatchResult.rejected} rejected
            {dispatchResult.skipped > 0 ? `, ${dispatchResult.skipped} skipped` : ""}.
          </p>
        </div>
      )}

      {/* ── Finalize: pick the new roommate ── */}
      {canFinalize && (
        <div className="rounded-3xl bg-gradient-to-br from-tertiary-fixed/40 to-surface-container-low p-6 outline outline-1 outline-tertiary/15 flex flex-col gap-4">
          <p className="font-label text-xs uppercase tracking-[0.15em] text-tertiary font-semibold text-center">
            ── After the Casting ──
          </p>
          <p className="font-body text-sm text-on-surface-variant text-center">
            Choose the new roommate. Everyone else will be notified by email.
          </p>

          {!showFinalize ? (
            <button
              onClick={() => setShowFinalize(true)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-tertiary/15 text-tertiary font-label text-sm font-bold tracking-widest transition-all hover:bg-tertiary/25 active:scale-[0.98]"
            >
              <Crown size={16} />
              CHOOSE NEW ROOMMATE
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              {yesApps.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAppId(a.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl outline outline-1 transition-all ${
                    selectedAppId === a.id
                      ? "outline-tertiary bg-tertiary/10 outline-2"
                      : "outline-outline-variant/30 bg-white hover:outline-tertiary/50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-tertiary/15 flex items-center justify-center shrink-0">
                    <span className="font-body text-sm font-bold text-tertiary">
                      {a.name[0]}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-body text-sm font-semibold">{a.name}</p>
                    <p className="font-body text-xs text-on-surface-variant">
                      {a.age} · {a.university || a.occupation}
                    </p>
                  </div>
                  {selectedAppId === a.id && (
                    <Check size={18} className="text-tertiary shrink-0" />
                  )}
                </button>
              ))}

              {finalizeError && (
                <p className="font-body text-xs text-status-no text-center">{finalizeError}</p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => { setShowFinalize(false); setSelectedAppId(null); }}
                  className="flex-1 py-3 rounded-full bg-surface-container font-label text-xs font-bold tracking-widest transition-all hover:bg-surface-container-high"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={!selectedAppId || finalizing}
                  className="flex-1 py-3 rounded-full bg-tertiary text-on-tertiary font-label text-xs font-bold tracking-widest transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {finalizing ? "Finalizing…" : "CONFIRM"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finalized state */}
      {(finalized || movedIn) && (
        <div className="rounded-3xl bg-status-yes/10 p-6 flex flex-col items-center gap-3">
          <span className="text-3xl select-none">✦</span>
          <p className="font-headline text-xl font-bold italic text-status-yes">
            Casting complete!
          </p>
          <p className="font-body text-sm text-on-surface-variant text-center">
            {movedIn ? `${movedIn.name} is moving in.` : "The new roommate has been chosen."}
          </p>
        </div>
      )}
    </div>
  );
}
