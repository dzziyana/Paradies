import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMagicLink, withdrawApplication, formatDate, type MagicLinkView } from "@/lib/api";

const STATUS_DISPLAY: Record<string, { label: string; color: string; description: string }> = {
  SUBMITTED:    { label: "Under review",      color: "text-primary",        description: "Your application has been received and is being reviewed." },
  PENDING:      { label: "Under review",      color: "text-primary",        description: "Your application has been received and is being reviewed." },
  EVALUATED_YES:{ label: "Invited",           color: "text-status-yes",     description: "Congratulations! You've been invited to the casting event." },
  EVALUATED_NO: { label: "Not proceeding",    color: "text-status-no",      description: "Unfortunately you won't be proceeding to the next round." },
  REJECTED_AFTER_CASTING: { label: "Not selected", color: "text-status-no", description: "Thank you for attending. Unfortunately you weren't selected this time." },
  MOVED_IN:     { label: "Moved in",          color: "text-status-yes",     description: "Welcome home! 🎉" },
  WITHDRAWN:    { label: "Withdrawn",         color: "text-on-surface-variant", description: "Your application has been withdrawn." },
};

export default function MagicLinkPage() {
  const { token } = useParams<{ token: string }>();
  const [view, setView] = useState<MagicLinkView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  useEffect(() => {
    if (!token) return;
    getMagicLink(token)
      .then(setView)
      .catch(() => setError("This link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleWithdraw() {
    if (!token) return;
    setWithdrawing(true);
    try {
      await withdrawApplication(token);
      setWithdrawn(true);
      setConfirmWithdraw(false);
      if (view) setView({ ...view, status: "WITHDRAWN" });
    } catch {
      setError("Could not withdraw. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  }

  const status = view ? (STATUS_DISPLAY[view.status] ?? STATUS_DISPLAY["SUBMITTED"]) : null;
  const canWithdraw = view && !withdrawn &&
    !["WITHDRAWN", "MOVED_IN", "REJECTED_AFTER_CASTING"].includes(view.status);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-lg flex flex-col gap-6">

        <div className="text-center mb-2">
          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-2">
            Paradies WG
          </p>
          <h1 className="font-headline text-4xl font-bold italic">
            Application Status
          </h1>
        </div>

        {loading && (
          <div className="rounded-3xl bg-surface-container-low p-8 outline outline-1 outline-outline/15 text-center">
            <p className="font-body text-sm text-on-surface-variant opacity-60">Loading…</p>
          </div>
        )}

        {error && (
          <div className="rounded-3xl bg-status-no/10 p-8 outline outline-1 outline-status-no/20 text-center">
            <p className="font-headline text-xl font-bold italic mb-2">Link not found</p>
            <p className="font-body text-sm text-on-surface-variant">{error}</p>
          </div>
        )}

        {view && status && (
          <>
            {/* Status card */}
            <div className="rounded-3xl bg-surface-container-low p-7 outline outline-1 outline-outline/15 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-1">
                    Applicant
                  </p>
                  <p className="font-headline text-2xl font-bold italic">{view.applicationName}</p>
                </div>
                <span className={`font-label text-xs font-bold px-3 py-1.5 rounded-full bg-surface-container shrink-0 ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div className="border-t border-outline-variant/20 pt-4 flex flex-col gap-1">
                <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
                  Move-in date
                </p>
                <p className="font-body text-sm font-semibold">{formatDate(view.castingMoveInDate)}</p>
              </div>

              <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                {status.description}
              </p>
            </div>

            {/* Withdraw */}
            {canWithdraw && (
              <div className="rounded-3xl bg-surface-container-low p-6 outline outline-1 outline-outline/15">
                {!confirmWithdraw ? (
                  <button
                    onClick={() => setConfirmWithdraw(true)}
                    className="w-full py-3.5 border border-dashed border-status-no/40 text-status-no rounded-full font-label text-xs font-bold tracking-widest hover:bg-status-no/5 transition-all"
                  >
                    WITHDRAW APPLICATION
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="font-body text-sm text-on-surface-variant text-center leading-relaxed">
                      Are you sure? This cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmWithdraw(false)}
                        className="flex-1 py-3 bg-surface-container text-on-surface-variant rounded-full font-label text-xs font-bold tracking-widest"
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={handleWithdraw}
                        disabled={withdrawing}
                        className="flex-1 py-3 bg-status-no/20 text-status-no rounded-full font-label text-xs font-bold tracking-widest disabled:opacity-50"
                      >
                        {withdrawing ? "…" : "CONFIRM"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
