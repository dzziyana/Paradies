import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { getCastings, formatDate, type CastingListItem } from "@/lib/api";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CastingsCard() {
  const navigate = useNavigate();
  const [castings, setCastings] = useState<CastingListItem[]>([]);

  useEffect(() => {
    getCastings()
      .then((all) => setCastings(all.filter((c) => c.applicationPeriodActive)))
      .catch(() => {});
  }, []);

  return (
    <div className="rounded-3xl bg-surface-container-low p-6 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-outline/15 flex flex-col relative">
      {/* Corner ornament */}
      <span className="absolute top-5 right-6 text-tertiary/30 text-xl select-none">✦</span>

      <h3
        onClick={() => navigate("/admin/castings")}
        className="font-headline text-2xl italic font-semibold text-tertiary mb-5 cursor-pointer hover:text-tertiary/80 transition-colors"
      >
        Castings
      </h3>

      {castings.length > 0 ? (
        <>
          {/* Casting list — minimal rows */}
          <div className="flex flex-col gap-3 mb-6">
            {castings.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-body font-bold text-on-surface text-[15px] leading-tight truncate pr-1">
                    {c.replacedPersonName}
                  </p>
                  <p className="font-body text-xs text-on-surface-variant">
                    Move-in: {formatDate(c.moveInDate)}
                  </p>
                </div>
                <span className="bg-rose/15 text-rose px-2.5 py-1 rounded-lg font-label text-[11px] font-bold shrink-0">
                  {pad(c.applicationCount)} APPS
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={() => navigate("/admin/applications")}
              className="flex items-center justify-between w-full px-5 py-3.5 bg-rose/80 text-white rounded-full font-label text-xs font-bold tracking-widest active:scale-[0.98] transition-transform hover:bg-rose/90"
            >
              REVIEW APPLICATIONS <span className="tracking-normal">→→→</span>
            </button>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate("/admin/castings")}
                className="py-3 text-on-surface-variant font-label text-[10px] font-bold tracking-widest hover:text-tertiary transition-colors"
              >
                ALL CASTINGS DETAILS
              </button>
              <span className="text-outline/30 text-[10px]">·</span>
              <button
                onClick={() => navigate("/admin/castings/new")}
                className="py-3 text-on-surface-variant font-label text-[10px] font-bold tracking-widest hover:text-tertiary flex items-center gap-1 transition-colors"
              >
                <Plus size={12} strokeWidth={3} />
                NEW
              </button>
            </div>
          </div>
        </>
      ) : (
        <button
          onClick={() => navigate("/admin/castings/new")}
          className="w-full py-4 border-2 border-dashed border-tertiary/30 rounded-2xl text-tertiary font-label text-xs font-bold tracking-widest hover:border-tertiary/60 hover:bg-tertiary/5 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={15} strokeWidth={3} />
          NEW CASTING
        </button>
      )}
    </div>
  );
}
