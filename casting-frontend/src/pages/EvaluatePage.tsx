import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle, CircleHelp, XCircle, Ban, Heart, UserMinus } from "lucide-react";
import {
  getCasting,
  getApplication,
  getEvaluations,
  getMe,
  submitEvaluation,
  retractEvaluation,
  parseKeywords,
  hashIndex,
  formatDate,
  type CastingPublicView,
  type Application,
  type EvaluationCategory,
  type EvaluationOverview,
  type Me,
} from "@/lib/api";

// ─── Verdict config ───────────────────────────────────────────────────────────

// Used for history log lookup
const VERDICTS: {
  value: EvaluationCategory;
  label: string;
  Icon: React.ElementType;
  color: string;
}[] = [
  { value: "YES",      label: "Yes",      Icon: CheckCircle, color: "text-status-yes" },
  { value: "MAYBE",    label: "Maybe",    Icon: CircleHelp,  color: "text-status-maybe" },
  { value: "NO",       label: "No",       Icon: XCircle,     color: "text-status-no" },
  { value: "VETO",     label: "Veto",     Icon: Ban,         color: "text-status-veto" },
  { value: "FRIEND",   label: "Friend",   Icon: Heart,       color: "text-status-friend" },
  { value: "NOT_WOKO", label: "Not WOKO", Icon: UserMinus,   color: "text-on-surface-variant" },
];

// Flower arrangement — 4 large circles
const FLOWER: {
  value: EvaluationCategory;
  label: string;
  Icon: React.ElementType;
  pos: string;
  bg: string;
  activeBg: string;
  textCls: string;
}[] = [
  { value: "YES",   label: "Yes",   Icon: CheckCircle, pos: "top-0 left-0",    bg: "bg-status-yes/20",   activeBg: "bg-status-yes/45 ring-2 ring-status-yes/50",   textCls: "text-status-yes" },
  { value: "MAYBE", label: "Maybe", Icon: CircleHelp,  pos: "top-0 right-0",   bg: "bg-status-maybe/20", activeBg: "bg-status-maybe/45 ring-2 ring-status-maybe/50", textCls: "text-status-maybe" },
  { value: "NO",    label: "No",    Icon: XCircle,     pos: "bottom-0 left-0", bg: "bg-status-no/20",    activeBg: "bg-status-no/45 ring-2 ring-status-no/50",     textCls: "text-status-no" },
  { value: "VETO",  label: "Veto",  Icon: Ban,         pos: "bottom-0 right-0",bg: "bg-status-veto/20",  activeBg: "bg-status-veto/45 ring-2 ring-status-veto/50", textCls: "text-status-veto" },
];

// Secondary — pill chips
const CHIPS: {
  value: EvaluationCategory;
  label: string;
  Icon: React.ElementType;
  activeCls: string;
}[] = [
  { value: "FRIEND",   label: "Friend",   Icon: Heart,     activeCls: "bg-status-friend/20 border-status-friend/50 text-status-friend" },
  { value: "NOT_WOKO", label: "Not WOKO", Icon: UserMinus, activeCls: "bg-outline/20 border-outline/50 text-on-surface-variant" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH") + " " + d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvaluatePage() {
  const { castingId, applicationId } = useParams<{ castingId: string; applicationId: string }>();
  const navigate = useNavigate();

  const [casting, setCasting] = useState<CastingPublicView | null>(null);
  const [app, setApp] = useState<Application | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationOverview[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EvaluationCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retracting, setRetracting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const voted = me !== null && evaluations.some((e) => e.authorId === me.id);

  function loadEvals() {
    if (!castingId || !applicationId) return;
    getEvaluations(castingId, applicationId).then(setEvaluations).catch(() => {});
  }

  useEffect(() => {
    if (!castingId || !applicationId) return;
    Promise.all([
      getCasting(castingId),
      getApplication(castingId, applicationId),
      getEvaluations(castingId, applicationId),
      getMe(),
    ])
      .then(([c, a, evals, currentUser]) => { setCasting(c); setApp(a); setEvaluations(evals); setMe(currentUser); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [castingId, applicationId]);

  async function handleRetract() {
    if (!castingId || !applicationId) return;
    setRetracting(true);
    setSubmitError(null);
    try {
      await retractEvaluation(castingId, applicationId);
      loadEvals();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRetracting(false);
    }
  }

  async function handleSubmit() {
    if (!selected || !castingId || !applicationId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitEvaluation(castingId, applicationId, selected);
      setSelected(null);
      loadEvals();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-12 text-center font-body text-sm text-on-surface-variant opacity-60">
        Loading…
      </div>
    );
  }

  if (!app) {
    return (
      <div className="pt-12 text-center font-body text-sm text-on-surface-variant opacity-60">
        Application not found.
      </div>
    );
  }

  const keywords = parseKeywords(app.extractedKeywords);

  return (
    <div className="flex flex-col gap-6">
      {/* Back + casting context */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/admin/applications?castingId=${castingId}`)}
          className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] uppercase tracking-[0.15em] font-semibold hover:text-primary transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>
        {casting && (
          <p className="font-body text-xs text-on-surface-variant">
            <span className="font-semibold text-on-surface">{casting.replacedPersonName}</span>
            {casting.room ? ` · Room ${casting.room.roomNumber}` : ""}
            {" · "}
            {formatDate(casting.moveInDate)}
          </p>
        )}
      </div>

      {/* Hero */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-md outline outline-1 outline-outline/10 shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6 relative">
        <span className="absolute top-4 right-6 text-on-surface/8 text-2xl select-none">✦</span>
        <span className="absolute bottom-4 left-6 text-on-surface/5 text-lg select-none">✦</span>

        {/* Avatar + info */}
        <div className="flex items-center gap-4 mb-5">
          {app.profilePicture ? (
            <img
              src={`data:${app.profilePictureMimeType};base64,${app.profilePicture}`}
              alt={app.name}
              className="w-20 h-20 rounded-full object-cover shrink-0 outline outline-2 outline-outline/10"
            />
          ) : (
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl shrink-0 ${avatarColor(app.name)}`}
            >
              {app.name[0].toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="font-headline text-3xl font-bold italic leading-tight text-on-surface">
              {app.name}
              {app.pronouns && (
                <span className="font-body text-sm font-normal text-on-surface-variant/60 ml-2">
                  ({app.pronouns})
                </span>
              )}
            </h2>
            <p className="font-body text-sm text-on-surface-variant mt-0.5">
              {app.age} years
              {app.university ? ` · ${app.university}` : ` · ${app.occupation}`}
              {app.major ? ` · ${app.major}` : ""}
              {app.otherOccupation ? ` · ${app.otherOccupation}` : ""}
            </p>
          </div>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {keywords.map((kw) => (
              <span key={kw} className="bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full font-label text-[10px] font-bold">
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Contact */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-on-surface-variant/60 font-body text-xs">
          <span>{app.email}</span>
          {app.phone && <span>{app.phone}</span>}
        </div>
      </div>

      {/* Verdict buttons */}
      <div className="rounded-3xl bg-surface-container-low p-6 outline outline-1 outline-outline/15">
        <p className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-5 text-center">
          Your verdict
        </p>

        {voted && (
          <div className="mb-5 flex items-center justify-between bg-status-yes/10 text-status-yes rounded-2xl px-4 py-3">
            <span className="font-body text-sm font-semibold">Vote recorded ✦</span>
            <button
              onClick={handleRetract}
              disabled={retracting}
              className="font-label text-[10px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-opacity"
            >
              {retracting ? "…" : "Retract"}
            </button>
          </div>
        )}
        {submitError && (
          <div className="mb-5 bg-status-no/10 text-status-no rounded-2xl px-4 py-3 font-body text-sm font-semibold">
            {submitError}
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          {/* Flower: 4 circles + centre submit */}
          <div className="relative w-[208px] h-[192px]">
            {FLOWER.map(({ value, label, Icon, pos, bg, activeBg, textCls }) => (
              <button
                key={value}
                onClick={() => setSelected(selected === value ? null : value)}
                className={`absolute ${pos} w-[104px] h-[104px] rounded-full flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  selected === value ? activeBg : bg
                }`}
              >
                <Icon size={30} className={textCls} strokeWidth={1.5} />
                <span className={`font-label text-xs font-bold uppercase tracking-wider ${textCls}`}>
                  {label}
                </span>
              </button>
            ))}

            {/* Centre submit button */}
            <button
              onClick={handleSubmit}
              disabled={!selected || submitting}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-md transition-all ${
                selected
                  ? "bg-primary text-on-primary scale-110 shadow-primary/40"
                  : "bg-surface-container text-on-surface-variant/30"
              }`}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight size={20} strokeWidth={2.5} />
              )}
            </button>
          </div>

          {/* FRIEND + NOT_WOKO chips */}
          <div className="flex gap-3">
            {CHIPS.map(({ value, label, Icon, activeCls }) => (
              <button
                key={value}
                onClick={() => setSelected(selected === value ? null : value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all active:scale-95 font-label text-xs font-bold uppercase tracking-wider ${
                  selected === value
                    ? activeCls
                    : "border-outline-variant/30 bg-transparent text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Motivation letter */}
      <div className="rounded-3xl bg-white p-6 outline outline-1 outline-outline/15">
        <p className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-4 text-center">
          ── Motivation Letter ──
        </p>
        <p className="font-body text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
          {app.letter}
        </p>
      </div>

      {/* Additional pictures */}
      {app.additionalPictures && app.additionalPictureMimeTypes && (() => {
        const pics = app.additionalPictures!.split("|");
        const mimes = app.additionalPictureMimeTypes!.split("|");
        if (pics.length === 0 || !pics[0]) return null;
        return (
          <div className="rounded-3xl bg-surface-container-low p-6 outline outline-1 outline-outline/15">
            <p className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-4 text-center">
              ── Additional Photos ──
            </p>
            <div className="grid grid-cols-2 gap-3">
              {pics.map((pic, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <img
                    src={`data:${mimes[i]};base64,${pic}`}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-48 object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Evaluation history */}
      {evaluations.length > 0 && (
        <div className="rounded-3xl bg-surface-container-low p-6 outline outline-1 outline-outline/15">
          <p className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-4 text-center">
            ── Evaluation History ──
          </p>
          <div className="space-y-3">
            {evaluations.map((ev) => {
              const verdict = VERDICTS.find((v) => v.value === ev.judgement);
              return (
                <div key={ev.id} className="flex items-center gap-3">
                  <div className={`shrink-0 ${verdict?.color ?? "text-on-surface-variant"}`}>
                    {verdict && <verdict.Icon size={18} strokeWidth={1.5} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold">
                      {verdict?.label ?? ev.judgement}
                      <span className="font-normal text-on-surface-variant"> · {ev.authorName}</span>
                    </p>
                    <p className="font-body text-[10px] text-on-surface-variant opacity-60">
                      {formatDateTime(ev.time)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
