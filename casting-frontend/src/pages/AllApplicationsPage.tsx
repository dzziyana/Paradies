import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  getActiveCastingsWithApps,
  submitEvaluation,
  parseKeywords,
  hashIndex,
  formatDate,
  type ApplicationOverview,
  type ActiveCastingWithApps,
  type EvaluationCategory,
} from "@/lib/api";
import CopyLinkButton from "@/components/CopyLinkButton";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const PILL_COLORS = [
  "bg-rose/20 text-rose",
  "bg-skin text-on-surface",
  "bg-blush/30 text-on-surface",
  "bg-periwinkle/20 text-on-surface",
  "bg-primary/15 text-primary",
];

function pillColor(keyword: string) {
  return PILL_COLORS[hashIndex(keyword, PILL_COLORS.length)];
}

function avatarColor(name: string) {
  const colors = [
    "bg-primary text-on-primary",
    "bg-tertiary text-on-tertiary",
    "bg-rose/80 text-white",
    "bg-periwinkle/70 text-white",
    "bg-blush/80 text-on-surface",
  ];
  return colors[hashIndex(name, colors.length)];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SUBMITTED: "New",
  EVALUATED_YES: "Yes",
  EVALUATED_NO: "No",
  REJECTED_AFTER_CASTING: "Rejected",
  MOVED_IN: "Moved in",
  WITHDRAWN: "Withdrawn",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-outline/20 text-on-surface-variant",
  SUBMITTED: "bg-primary/15 text-primary",
  EVALUATED_YES: "bg-status-yes/20 text-status-yes",
  EVALUATED_NO: "bg-status-no/20 text-status-no",
  REJECTED_AFTER_CASTING: "bg-status-no/10 text-on-surface-variant",
  MOVED_IN: "bg-status-yes/30 text-status-yes",
  WITHDRAWN: "bg-outline/20 text-on-surface-variant",
};

function isUnevaluated(app: ApplicationOverview) {
  return app.status === "PENDING" || app.status === "SUBMITTED";
}

// ─── Sorting ─────────────────────────────────────────────────────────────────

type SortKey = "default" | "most-yes" | "most-maybe" | "most-no" | "name" | "age";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "most-yes", label: "Most Yes" },
  { key: "most-maybe", label: "Maybe" },
  { key: "most-no", label: "Most No" },
  { key: "name", label: "A–Z" },
  { key: "age", label: "Age" },
];

type AppWithCasting = ApplicationOverview & { castingId: string; castingName: string };

function sortApps(apps: AppWithCasting[], key: SortKey): AppWithCasting[] {
  if (key === "default") return apps;
  const sorted = [...apps];
  switch (key) {
    case "most-yes":
      return sorted.sort((a, b) => b.yesCount - a.yesCount || a.noCount - b.noCount);
    case "most-maybe":
      return sorted.sort((a, b) => b.maybeCount - a.maybeCount);
    case "most-no":
      return sorted.sort((a, b) => b.noCount - a.noCount || b.vetoCount - a.vetoCount);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "age":
      return sorted.sort((a, b) => a.age - b.age);
  }
}

// ─── Vote bar ────────────────────────────────────────────────────────────────

function VoteBar({ app }: { app: ApplicationOverview }) {
  const total = app.yesCount + app.maybeCount + app.noCount + app.vetoCount;
  if (total === 0) return null;

  const segments = [
    { count: app.yesCount, bg: "bg-status-yes" },
    { count: app.maybeCount, bg: "bg-status-maybe" },
    { count: app.noCount, bg: "bg-status-no" },
    { count: app.vetoCount, bg: "bg-status-no" },
  ].filter(s => s.count > 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex h-[5px] rounded-full overflow-hidden bg-outline/8">
        {segments.map((s, i) => (
          <div
            key={i}
            className={`${s.bg} transition-all`}
            style={{ width: `${(s.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex gap-1 shrink-0">
        {app.yesCount > 0 && (
          <span className="font-label text-[9px] font-bold text-status-yes">{app.yesCount}Y</span>
        )}
        {app.maybeCount > 0 && (
          <span className="font-label text-[9px] font-bold text-status-maybe">{app.maybeCount}M</span>
        )}
        {app.noCount > 0 && (
          <span className="font-label text-[9px] font-bold text-status-no">{app.noCount}N</span>
        )}
        {app.vetoCount > 0 && (
          <span className="font-label text-[9px] font-bold text-status-no">V{app.vetoCount}</span>
        )}
      </div>
    </div>
  );
}

// ─── Featured Hero Card ───────────────────────────────────────────────────────

function FeaturedCard({
  app,
  castingId,
  onVote,
}: {
  app: AppWithCasting;
  castingId: string;
  onVote: () => void;
}) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState<EvaluationCategory | null>(null);
  const keywords = parseKeywords(app.extractedKeywords);

  async function vote(verdict: EvaluationCategory) {
    setSubmitting(verdict);
    try {
      await submitEvaluation(castingId, app.id, verdict);
      onVote();
    } catch {} finally {
      setSubmitting(null);
    }
  }

  return (
    <div
      className="rounded-3xl overflow-hidden cursor-pointer"
      onClick={() => navigate(`/admin/casting/${castingId}/application/${app.id}`)}
    >
      <div className="bg-gradient-to-br from-navy via-primary to-periwinkle p-7 text-white relative">
        <span className="absolute top-5 right-6 text-white/15 text-2xl select-none">✦</span>

        <div className="flex items-center gap-4 mb-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${avatarColor(app.name)}`}
          >
            {app.name[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-label text-[10px] uppercase tracking-[0.15em] text-white/50 mb-0.5">
              Next up
            </p>
            <h3 className="font-headline text-2xl font-bold italic pr-1">{app.name}</h3>
            <p className="font-body text-sm text-white/60">
              {app.age} · {app.university ?? app.occupation}
              {app.major ? ` · ${app.major}` : ""}
            </p>
          </div>
        </div>

        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="bg-white/12 text-white/90 px-2 py-0.5 rounded-full font-label text-[10px] font-bold"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        className="bg-white p-3 flex gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {(["YES", "MAYBE", "NO"] as EvaluationCategory[]).map((verdict) => (
          <button
            key={verdict}
            onClick={() => vote(verdict)}
            disabled={submitting !== null}
            className={`flex-1 py-2.5 rounded-xl font-label text-[10px] font-bold tracking-widest transition-all active:scale-[0.97] disabled:opacity-50 ${
              verdict === "YES"
                ? "bg-status-yes/15 text-status-yes hover:bg-status-yes/25"
                : verdict === "MAYBE"
                ? "bg-status-maybe/15 text-status-maybe hover:bg-status-maybe/25"
                : "bg-status-no/15 text-status-no hover:bg-status-no/25"
            }`}
          >
            {submitting === verdict ? "…" : verdict}
          </button>
        ))}
        <button
          onClick={() => navigate(`/admin/casting/${castingId}/application/${app.id}`)}
          className="px-3.5 py-2.5 rounded-xl font-label text-[10px] font-bold tracking-widest bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all"
        >
          MORE
        </button>
      </div>
    </div>
  );
}

// ─── Application card (compact) ──────────────────────────────────────────────

function AppCard({ app, castingId }: { app: AppWithCasting; castingId: string }) {
  const navigate = useNavigate();
  const keywords = parseKeywords(app.extractedKeywords);

  return (
    <div
      onClick={() => navigate(`/admin/casting/${castingId}/application/${app.id}`)}
      className="rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor(app.name)}`}
        >
          {app.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-body font-bold text-sm text-on-surface truncate pr-0.5">{app.name}</p>
            <span
              className={`px-1.5 py-0.5 rounded font-label text-[9px] font-bold shrink-0 ${STATUS_COLORS[app.status] ?? "bg-outline/20 text-on-surface-variant"}`}
            >
              {STATUS_LABELS[app.status] ?? app.status}
            </span>
          </div>
          <p className="font-body text-[11px] text-on-surface-variant truncate">
            {app.age}
            {app.university ? ` · ${app.university}` : ` · ${app.occupation}`}
            {app.major ? ` · ${app.major}` : ""}
          </p>
        </div>
      </div>

      {/* Vote bar */}
      <div className="mt-2.5">
        <VoteBar app={app} />
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {keywords.slice(0, 4).map((kw) => (
            <span
              key={kw}
              className={`px-1.5 py-0.5 rounded-full font-label text-[9px] font-bold ${pillColor(kw)}`}
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Casting section header (open castings only) ─────────────────────────────

function CastingHeader({ casting }: { casting: ActiveCastingWithApps }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl glass px-4 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <p className="font-body text-sm font-bold text-on-surface truncate pr-0.5">
          {casting.replacedPersonName}
        </p>
        {casting.room && (
          <span className="font-body text-[11px] text-on-surface-variant shrink-0">
            Room {casting.room.roomNumber}
          </span>
        )}
        <span className="font-body text-[11px] text-on-surface-variant shrink-0">
          {formatDate(casting.moveInDate)}
        </span>
        <span className="px-1.5 py-0.5 rounded font-label text-[9px] font-bold bg-status-yes/15 text-status-yes shrink-0">
          Open
        </span>
      </div>
      <CopyLinkButton castingId={casting.id} variant="icon" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AllApplicationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterCastingId = searchParams.get("castingId");

  const [castings, setCastings] = useState<ActiveCastingWithApps[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [archiveOpen, setArchiveOpen] = useState(false);

  function load() {
    getActiveCastingsWithApps()
      .then(setCastings)
      .catch(() => setCastings([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  // When filtering to a single casting, flatten all its apps regardless of open/closed
  const filteredCasting = filterCastingId
    ? castings.find((c) => c.id === filterCastingId) ?? null
    : null;

  // Split castings into open / closed
  const openCastings = castings.filter((c) => c.applicationOpen);
  const closedCastings = castings.filter((c) => !c.applicationOpen);

  // Only open-casting apps go into the active review flow
  const activeApps: AppWithCasting[] = openCastings.flatMap((c) =>
    c.applications.map((a) => ({ ...a, castingId: c.id, castingName: c.replacedPersonName }))
  );
  const closedApps: AppWithCasting[] = closedCastings.flatMap((c) =>
    c.applications.map((a) => ({ ...a, castingId: c.id, castingName: c.replacedPersonName }))
  );

  const unevaluated = activeApps.filter((a) => isUnevaluated(a));
  const evaluated = activeApps.filter((a) => !isUnevaluated(a));

  const [featured, ...funnel] = unevaluated;

  const isSorting = sortKey !== "default";
  const sortedEvaluated = useMemo(() => sortApps(evaluated, sortKey), [evaluated, sortKey]);
  const sortedFunnel = useMemo(() => sortApps(funnel, sortKey), [funnel, sortKey]);

  // ── Filtered (single casting) view ──────────────────────────────────────────
  if (filterCastingId) {
    const allApps: AppWithCasting[] = filteredCasting
      ? filteredCasting.applications.map((a) => ({
          ...a,
          castingId: filteredCasting.id,
          castingName: filteredCasting.replacedPersonName,
        }))
      : [];

    const unevaluatedFiltered = allApps.filter(isUnevaluated);
    const evaluatedFiltered = allApps.filter((a) => !isUnevaluated(a));
    const [featuredFiltered, ...funnelFiltered] = unevaluatedFiltered;
    const isSortingFiltered = sortKey !== "default";
    const sortedEvaluatedFiltered = sortApps(evaluatedFiltered, sortKey);
    const sortedFunnelFiltered = sortApps(funnelFiltered, sortKey);

    return (
      <div className="flex flex-col gap-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] uppercase tracking-[0.15em] font-semibold hover:text-primary transition-colors self-start"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <section>
          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-1">
            Applications
          </p>
          <h2 className="font-headline text-4xl font-bold italic tracking-tight leading-[1.1] pr-1">
            {filteredCasting?.replacedPersonName ?? "Casting"}
          </h2>
          {filteredCasting && (
            <p className="font-body text-xs text-on-surface-variant mt-2 flex items-center gap-1.5">
              <span>{allApps.length} applicant{allApps.length !== 1 ? "s" : ""}</span>
              <span className="opacity-30">·</span>
              <span>{formatDate(filteredCasting.moveInDate)}</span>
              {filteredCasting.room && (
                <>
                  <span className="opacity-30">·</span>
                  <span>Room {filteredCasting.room.roomNumber}</span>
                </>
              )}
            </p>
          )}
        </section>

        {loading ? (
          <p className="font-body text-sm text-on-surface-variant opacity-60">Loading…</p>
        ) : !filteredCasting ? (
          <p className="font-body text-sm text-on-surface-variant opacity-40 text-center py-4">
            Casting not found.
          </p>
        ) : allApps.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant opacity-40 text-center py-4">
            No applications yet.
          </p>
        ) : (
          <>
            <div className="flex gap-1.5 flex-wrap">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortKey(opt.key)}
                  className={`px-2.5 py-1.5 rounded-full font-label text-[10px] font-bold uppercase tracking-wider transition-all ${
                    sortKey === opt.key
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {!isSortingFiltered && featuredFiltered && (
              <FeaturedCard
                app={featuredFiltered}
                castingId={featuredFiltered.castingId}
                onVote={load}
              />
            )}

            {(isSortingFiltered ? sortedFunnelFiltered.length + (featuredFiltered ? 1 : 0) : funnelFiltered.length) > 0 && (
              <section>
                <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-3">
                  Pending · {unevaluatedFiltered.length}
                </p>
                <div className="space-y-2.5">
                  {isSortingFiltered
                    ? [...(featuredFiltered ? [featuredFiltered] : []), ...sortedFunnelFiltered].map((a) => (
                        <AppCard key={a.id} app={a} castingId={a.castingId} />
                      ))
                    : sortedFunnelFiltered.map((a) => (
                        <AppCard key={a.id} app={a} castingId={a.castingId} />
                      ))}
                </div>
              </section>
            )}

            {sortedEvaluatedFiltered.length > 0 && (
              <section>
                <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-3">
                  Evaluated · {evaluatedFiltered.length}
                </p>
                <div className="space-y-2.5">
                  {sortedEvaluatedFiltered.map((a) => (
                    <AppCard key={a.id} app={a} castingId={a.castingId} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Default (all castings) view ───────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section>
        <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-1">
          Review
        </p>
        <h2 className="font-headline text-4xl font-bold italic tracking-tight leading-[1.1] pr-1">
          Applications
        </h2>
      </section>

      {/* Open casting headers */}
      {openCastings.length > 0 && (
        <div className="flex flex-col gap-2">
          {openCastings.map((c) => (
            <CastingHeader key={c.id} casting={c} />
          ))}
        </div>
      )}

      {loading ? (
        <p className="font-body text-sm text-on-surface-variant opacity-60">Loading…</p>
      ) : activeApps.length === 0 && closedApps.length === 0 ? (
        <p className="font-body text-sm text-on-surface-variant opacity-40 text-center py-4">
          No applications yet.
        </p>
      ) : (
        <>
          {activeApps.length > 0 && (
            <>
              {/* Sort pills */}
              <div className="flex gap-1.5 flex-wrap">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortKey(opt.key)}
                    className={`px-2.5 py-1.5 rounded-full font-label text-[10px] font-bold uppercase tracking-wider transition-all ${
                      sortKey === opt.key
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Featured (only in default sort) */}
              {!isSorting && featured && (
                <FeaturedCard
                  app={featured}
                  castingId={featured.castingId}
                  onVote={load}
                />
              )}

              {/* Pending */}
              {(isSorting ? sortedFunnel.length + (featured ? 1 : 0) : funnel.length) > 0 && (
                <section>
                  <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-3">
                    Pending · {unevaluated.length}
                  </p>
                  <div className="space-y-2.5">
                    {isSorting
                      ? [...(featured ? [featured] : []), ...sortedFunnel].map((a) => (
                          <AppCard key={a.id} app={a} castingId={a.castingId} />
                        ))
                      : sortedFunnel.map((a) => (
                          <AppCard key={a.id} app={a} castingId={a.castingId} />
                        ))}
                  </div>
                </section>
              )}

              {/* Evaluated */}
              {sortedEvaluated.length > 0 && (
                <section>
                  <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-3">
                    Evaluated · {evaluated.length}
                  </p>
                  <div className="space-y-2.5">
                    {sortedEvaluated.map((a) => (
                      <AppCard key={a.id} app={a} castingId={a.castingId} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {activeApps.length === 0 && openCastings.length === 0 && (
            <p className="font-body text-sm text-on-surface-variant opacity-40 text-center py-4">
              No open castings right now.
            </p>
          )}

          {/* ── Archive (closed castings) ── */}
          {closedCastings.length > 0 && (
            <section>
              <button
                onClick={() => setArchiveOpen((v) => !v)}
                className="w-full flex items-center justify-between py-3 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="font-label text-[10px] uppercase tracking-[0.15em] font-semibold">
                  Archive · {closedCastings.length} closed
                </span>
                <span className="font-label text-[10px] font-bold text-on-surface-variant/50">
                  {archiveOpen ? "Hide" : "Show"}
                </span>
              </button>

              {archiveOpen && (
                <div className="flex flex-col gap-4 mt-1">
                  {closedCastings.map((c) => {
                    const apps: AppWithCasting[] = closedApps.filter((a) => a.castingId === c.id);
                    return (
                      <div key={c.id} className="opacity-50">
                        {/* Closed casting header — no copy link */}
                        <div className="flex items-center gap-2 rounded-xl bg-surface-container/40 px-4 py-2.5 mb-2">
                          <p className="font-body text-sm font-bold text-on-surface truncate pr-0.5">
                            {c.replacedPersonName}
                          </p>
                          <span className="font-body text-[11px] text-on-surface-variant shrink-0">
                            {formatDate(c.moveInDate)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded font-label text-[9px] font-bold bg-outline/20 text-on-surface-variant shrink-0">
                            Closed
                          </span>
                        </div>

                        {apps.length > 0 ? (
                          <div className="space-y-2.5">
                            {apps.map((a) => (
                              <AppCard key={a.id} app={a} castingId={a.castingId} />
                            ))}
                          </div>
                        ) : (
                          <p className="font-body text-xs text-on-surface-variant opacity-40 px-4">
                            No applications.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
