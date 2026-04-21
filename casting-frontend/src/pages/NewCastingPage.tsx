import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { getRooms, createCasting, type Room } from "@/lib/api";
import DateInput from "@/components/DateInput";
import CopyLinkButton from "@/components/CopyLinkButton";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
        {label}
        {hint && (
          <span className="normal-case tracking-normal ml-1 opacity-50">· {hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-surface-container rounded-2xl px-4 py-3.5 font-body text-sm text-on-surface outline outline-1 outline-outline-variant/40 focus:outline-primary focus:outline-2 transition-all appearance-none";

export default function NewCastingPage() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [moveInDate, setMoveInDate] = useState("");
  const [applicationUntil, setApplicationUntil] = useState("");
  const [roomId, setRoomId] = useState("");
  const [replacedPersonName, setReplacedPersonName] = useState("");

  const [showMoveOut, setShowMoveOut] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState("");
  const [sublet, setSublet] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    getRooms().then(setRooms).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!replacedPersonName.trim() || !moveInDate) return;
    setSubmitting(true);
    setError(null);
    try {
      const id = await createCasting({
        replacedPersonName: replacedPersonName.trim(),
        moveInDate,
        moveOutDate: showMoveOut && moveOutDate ? moveOutDate : null,
        applicationUntil: applicationUntil || null,
        roomId: roomId || null,
        sublet: showMoveOut ? sublet : false,
      });
      setCreatedId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = replacedPersonName.trim() && moveInDate;

  if (createdId) {
    return (
      <div className="flex flex-col gap-8">
        <section>
          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-status-yes font-semibold mb-1">
            ✦ Casting created
          </p>
          <h2 className="font-headline text-4xl font-bold italic tracking-tight leading-[1.1]">
            Share the link
          </h2>
        </section>

        <CopyLinkButton castingId={createdId} variant="full" />

        <button
          onClick={() => navigate("/admin/castings")}
          className="w-full py-4 bg-primary text-on-primary rounded-full font-label text-sm font-bold tracking-widest transition-all active:scale-[0.98]"
        >
          GO TO CASTINGS →→→
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <section>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] uppercase tracking-[0.15em] font-semibold mb-4 hover:text-primary transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-1">
          New casting
        </p>
        <h2 className="font-headline text-4xl font-bold italic tracking-tight leading-[1.1]">
          Open a room
        </h2>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="rounded-3xl bg-surface-container-low p-6 outline outline-1 outline-outline/15 flex flex-col gap-5">

          {/* Outgoing resident */}
          <Field label="Outgoing resident" hint="required">
            <input
              type="text"
              value={replacedPersonName}
              onChange={(e) => setReplacedPersonName(e.target.value)}
              placeholder="e.g. Alex"
              required
              className={inputClass}
            />
          </Field>

          {/* Move-in date */}
          <Field label="Move-in date" hint="required">
            <DateInput
              value={moveInDate}
              onChange={setMoveInDate}
              required
              className={inputClass}
            />
          </Field>

          {/* Application deadline */}
          <Field label="Apply by" hint="optional — deadline for applications">
            <DateInput
              value={applicationUntil}
              onChange={setApplicationUntil}
              className={inputClass}
            />
          </Field>

          {/* Room */}
          <Field label="Room" hint="optional">
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={inputClass}
            >
              <option value="">— No room selected —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} · Floor {r.floor} · {r.sizeM2} m²
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Move-out expandable section */}
        <div className="rounded-3xl bg-surface-container-low outline outline-1 outline-outline/15">
          <button
            type="button"
            onClick={() => setShowMoveOut((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold hover:text-primary transition-colors"
          >
            <span>
              {showMoveOut ? "Remove move-out info" : "+ Add move-out date"}
            </span>
            {showMoveOut ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showMoveOut && (
            <div className="px-6 pb-6 flex flex-col gap-5 border-t border-outline-variant/20 pt-5">
              <Field label="Move-out date" hint="optional">
                <DateInput
                  value={moveOutDate}
                  onChange={setMoveOutDate}
                  className={inputClass}
                />
              </Field>

              {/* Sublet checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={sublet}
                    onChange={(e) => setSublet(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      sublet
                        ? "bg-primary border-primary"
                        : "border-outline-variant/60 group-hover:border-primary"
                    }`}
                  >
                    {sublet && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-on-surface">
                    Sublet
                  </p>
                  <p className="font-body text-xs text-on-surface-variant opacity-60">
                    The new roommate will be subletting
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {error && (
          <p className="font-body text-sm text-status-no px-1">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="w-full py-4 bg-primary text-on-primary rounded-full font-label text-sm font-bold tracking-widest transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {submitting ? "Creating…" : "CREATE CASTING →→→"}
        </button>
      </form>
    </div>
  );
}
