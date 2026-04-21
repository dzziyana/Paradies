import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Plus, Settings, Users } from "lucide-react";
import { getCastings, formatDate, type CastingListItem } from "@/lib/api";

function CastingCard({ casting }: { casting: CastingListItem }) {
  const navigate = useNavigate();

  const hasRoom = casting.room !== null;
  const roomLabel = hasRoom ? `Room ${casting.room!.roomNumber}` : null;

  return (
    <div className="rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header strip */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <p className="font-headline text-lg font-bold italic tracking-tight text-on-surface truncate pr-1">
              {casting.replacedPersonName}
            </p>
            {roomLabel && (
              <p className="font-body text-[11px] text-on-surface-variant">{roomLabel}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <span className="bg-primary/12 text-primary px-2 py-0.5 rounded-lg font-label text-[10px] font-bold">
              {casting.applicationCount}
            </span>
            {casting.unevaluatedCount > 0 && (
              <span className="bg-rose/15 text-rose px-2 py-0.5 rounded-lg font-label text-[10px] font-bold">
                {casting.unevaluatedCount} new
              </span>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-on-surface-variant">
          <p className="font-body text-xs flex items-center gap-1">
            <Calendar size={11} className="opacity-50" />
            {formatDate(casting.moveInDate)}
          </p>
          {casting.time && (
            <p className="font-body text-xs flex items-center gap-1">
              <Clock size={11} className="opacity-50" />
              {casting.time.slice(0, 16).replace("T", " ")}
            </p>
          )}
          {casting.applicationUntil && (
            <p className="font-body text-xs opacity-60">
              Until {formatDate(casting.applicationUntil)}
            </p>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="border-t border-outline-variant/10 px-4 py-3 flex gap-2">
        <button
          onClick={() => navigate(`/admin/applications?castingId=${casting.id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/8 text-primary font-label text-[10px] font-bold uppercase tracking-widest hover:bg-primary/15 transition-colors active:scale-[0.98]"
        >
          <Users size={12} strokeWidth={2.5} />
          Applications
        </button>
        <button
          onClick={() => navigate(`/admin/castings/${casting.id}/manage`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-container text-on-surface-variant font-label text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors active:scale-[0.98]"
        >
          <Settings size={12} strokeWidth={2.5} />
          Manage
        </button>
      </div>
    </div>
  );
}

export default function CastingsPage() {
  const navigate = useNavigate();
  const [castings, setCastings] = useState<CastingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCastings()
      .then(setCastings)
      .catch(() => setCastings([]))
      .finally(() => setLoading(false));
  }, []);

  const active = castings.filter((c) => c.applicationPeriodActive);
  const archived = castings.filter((c) => !c.applicationPeriodActive);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <section>
        <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-1">
          All castings
        </p>
        <div className="flex items-end justify-between">
          <h2 className="font-headline text-4xl font-bold italic tracking-tight leading-[1.1]">
            Castings
          </h2>
          <button
            onClick={() => navigate("/admin/castings/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 mb-1"
          >
            <Plus size={12} strokeWidth={3} /> New
          </button>
        </div>
      </section>

      {loading ? (
        <p className="font-body text-sm text-on-surface-variant opacity-60">Loading…</p>
      ) : (
        <>
          {/* Active */}
          {active.length > 0 && (
            <section>
              <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-4">
                Active · {active.length}
              </p>
              <div className="space-y-3">
                {active.map((c) => <CastingCard key={c.id} casting={c} />)}
              </div>
            </section>
          )}

          {active.length === 0 && (
            <p className="font-body text-sm text-on-surface-variant opacity-40 text-center py-4">
              No active castings right now.
            </p>
          )}

          {/* Archived */}
          {archived.length > 0 && (
            <section>
              <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-4">
                Archived · {archived.length}
              </p>
              <div className="space-y-3">
                {archived.map((c) => (
                  <div key={c.id} className="opacity-50 hover:opacity-80 transition-opacity">
                    <CastingCard casting={c} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
