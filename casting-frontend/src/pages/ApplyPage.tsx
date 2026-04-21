import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { getCasting, formatDate, type CastingPublicView } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const WOKO_UNIVERSITIES = [
  "ETH Zürich",
  "Universität Zürich (UZH)",
  "ZHdK",
  "PHZH",
  "HfH",
  "ZHAW",
  "KME",
];

const DEGREE_OPTIONS = [
  { value: "Bachelor", note: "max. 8 years contract" },
  { value: "Master",   note: "max. 8 years contract" },
  { value: "Doctoral", note: "max. 2 years contract" },
];

type Step = "loading" | "closed" | "welcome" | "q1" | "q2" | "q3" | "ineligible" | "eligible" | "room";

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: "q1" | "q2" | "q3" }) {
  const steps = [
    { id: "q1", label: "Enrollment" },
    { id: "q2", label: "University" },
    { id: "q3", label: "Degree" },
  ];
  const current = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center justify-center gap-3 font-label text-[10px] uppercase tracking-[0.12em] text-on-surface-variant mb-8">
      {steps.map((s, i) => (
        <span key={s.id} className="flex items-center gap-3">
          <span className={i <= current ? "text-primary font-bold" : "opacity-40"}>
            {String(i + 1).padStart(2, "0")} {s.label}
          </span>
          {i < steps.length - 1 && <span className="opacity-30">→</span>}
        </span>
      ))}
    </div>
  );
}

function OptionButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-6 py-5 rounded-2xl bg-surface-container outline outline-1 outline-outline-variant/30 hover:outline-primary hover:bg-primary/5 font-body text-lg font-semibold transition-all active:scale-[0.99]"
    >
      {children}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const { castingId } = useParams<{ castingId: string }>();
  const navigate = useNavigate();

  const [casting, setCasting] = useState<CastingPublicView | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [letsGoVisible, setLetsGoVisible] = useState(false);
  const letsGoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = letsGoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setLetsGoVisible(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [step]);

  useEffect(() => {
    if (!castingId) return;
    getCasting(castingId)
      .then((c) => {
        setCasting(c);
        setStep(c.applicationPeriodActive ? (c.sublet ? "eligible" : "welcome") : "closed");
      })
      .catch(() => setStep("closed"));
  }, [castingId]);

  function goToForm() {
    navigate(`/apply/${castingId}/form`, {
      state: { university: selectedUniversity, degree: selectedDegree },
    });
  }

  const shell = (children: React.ReactNode, wide = false) => (
    <div className="min-h-screen bg-surface">
      {casting && (
        <div className="bg-white border-b border-outline-variant/15 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className={`${wide ? "max-w-7xl" : "max-w-2xl"} mx-auto px-6 py-6`}>
            <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-2">
              KIRCHGASSE 36 / KLEINES PARADIES
            </p>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-body text-base text-on-surface">
              <span>
                Room vacancy · Move-in <span className="font-semibold">{formatDate(casting.moveInDate)}</span>
              </span>
              {casting.sublet && (
                <span className="text-on-surface-variant">(sublet)</span>
              )}
              {casting.applicationUntil && (
                <span className="text-on-surface-variant text-sm">
                  Apply by <span className="font-semibold text-on-surface">{formatDate(casting.applicationUntil)}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      <div key={step} className={`${wide ? "max-w-7xl" : "max-w-2xl"} mx-auto px-6 py-12 animate-in`}>
        {children}
      </div>
    </div>
  );

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="font-body text-sm text-on-surface-variant opacity-60">Loading…</p>
      </div>
    );
  }

  // ─── Closed ────────────────────────────────────────────────────────────────

  if (step === "closed") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center flex flex-col gap-4">
          <span className="text-4xl select-none">︵‿︵</span>
          <h1 className="font-headline text-4xl font-bold italic">Applications closed</h1>
          <p className="font-body text-sm text-on-surface-variant">
            This casting is no longer accepting applications.
          </p>
        </div>
      </div>
    );
  }

  // ─── Welcome ───────────────────────────────────────────────────────────────

  if (step === "welcome") return (
    <>
    {shell(
    <div className="flex flex-col gap-10">
      <div>
        <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-3">
          ✦ Room casting
        </p>
        <h1 className="font-headline text-4xl lg:text-5xl font-bold italic leading-[1.05] mb-4">
          Welcome to<br />Kleines Paradies
        </h1>
        <p className="font-body text-l text-on-surface-variant leading-relaxed max-w-lg">
          Lorem ipsum dolor sit we're a student WG in Zürich looking for a new flatmate. Here's how our casting works:
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {[
          { num: "01", title: "Eligibility check", desc: "A few quick questions to confirm you're eligible for WOKO housing." },
          { num: "02", title: "Your application", desc: "Tell us about yourself, who you are, what you study, and why you'd like to live here." },
          { num: "03", title: "We review", desc: "Our WG reads every application. If we think it's a good fit, we'll invite you to meet us in person." },
          { num: "04", title: "The casting", desc: "You visit the flat, meet the WG, and we all get to know each other." },
        ].map((item) => (
          <div
            key={item.num}
            className="flex gap-5 items-start rounded-2xl bg-surface-container p-5 outline outline-1 outline-outline-variant/20"
          >
            <span className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-bold mt-0.5 shrink-0">
              {item.num}
            </span>
            <div>
              <p className="font-body text-base font-semibold text-on-surface">{item.title}</p>
              <p className="font-body text-sm text-on-surface-variant mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-skin/40 px-5 py-4 flex gap-3 items-start">
        <span className="text-on-surface-variant/50 mt-0.5 shrink-0 text-sm">ℹ</span>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">
          The room shown in this listing may (with a small probability) change before move-in. Rooms at Kirchgasse 36 range from <span className="font-semibold text-on-surface">CHF 400 – 500 / month</span> depending on size and floor. You'll be informed of the final assignment before signing.
        </p>
      </div>

      <button
        ref={letsGoRef}
        onClick={() => setStep("q1")}
        className="flex items-center justify-between w-full px-6 py-5 bg-primary text-on-primary rounded-full font-label text-sm font-bold tracking-widest active:scale-[0.98] transition-transform"
      >
        LET'S GO <ArrowRight size={16} />
      </button>
    </div>
    )}
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-none z-10 animate-bounce transition-opacity duration-300 ${letsGoVisible ? "opacity-0" : "opacity-100"}`}>
      <div className="flex items-center gap-2 px-5 py-3 rounded-full glass shadow-lg">
        <ArrowDown size={22} className="text-primary" strokeWidth={2.5} />
        <span className="font-label text-[11px] font-bold uppercase tracking-[0.15em] text-primary">Scroll</span>
      </div>
    </div>
    </>
  );

  // ─── Q1: Enrollment ────────────────────────────────────────────────────────

  if (step === "q1") return shell(
    <>
      <ProgressBar step="q1" />
      <button
        onClick={() => setStep("welcome")}
        className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] uppercase tracking-[0.15em] font-semibold mb-6 hover:text-primary transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <h1 className="font-headline text-4xl font-bold italic leading-[1.05] mb-3">
        Are you enrolled at a Zurich-based university?
      </h1>
      <p className="font-body text-on-surface-variant mb-9">
        WOKO housing is reserved for students at partner universities in Zürich.
      </p>
      <div className="flex flex-col gap-4">
        <OptionButton onClick={() => setStep("q2")}>
          Yes, I am currently enrolled
        </OptionButton>
        <OptionButton onClick={() => setStep("q2")}>
          Not yet, but I will be enrolled at contract start
        </OptionButton>
        <OptionButton onClick={() => setStep("ineligible")}>
          No
        </OptionButton>
      </div>
    </>
  );

  // ─── Q2: University ────────────────────────────────────────────────────────

  if (step === "q2") return shell(
    <>
      <ProgressBar step="q2" />
      <button
        onClick={() => setStep("q1")}
        className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] uppercase tracking-[0.15em] font-semibold mb-6 hover:text-primary transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <h1 className="font-headline text-4xl font-bold italic leading-[1.05] mb-8">
        Which university?
      </h1>
      <div className="flex flex-col gap-3">
        {WOKO_UNIVERSITIES.map((uni) => (
          <OptionButton
            key={uni}
            onClick={() => { setSelectedUniversity(uni); setStep("q3"); }}
          >
            {uni}
          </OptionButton>
        ))}
        <OptionButton onClick={() => setStep("ineligible")}>
          Other
        </OptionButton>
      </div>
    </>
  );

  // ─── Q3: Degree ────────────────────────────────────────────────────────────

  if (step === "q3") return shell(
    <>
      <ProgressBar step="q3" />
      <button
        onClick={() => setStep("q2")}
        className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] uppercase tracking-[0.15em] font-semibold mb-6 hover:text-primary transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <h1 className="font-headline text-4xl font-bold italic leading-[1.05] mb-8">
        What are you studying?
      </h1>
      <div className="flex flex-col gap-3">
        {DEGREE_OPTIONS.map(({ value, note }) => (
          <OptionButton
            key={value}
            onClick={() => { setSelectedDegree(value); setStep("eligible"); }}
          >
            <span>{value}</span>
            <span className="font-normal text-on-surface-variant ml-2 text-xs">· {note}</span>
          </OptionButton>
        ))}
      </div>
    </>
  );

  // ─── Not eligible ──────────────────────────────────────────────────────────

  if (step === "ineligible") return shell(
    <div className="text-center flex flex-col items-center gap-6 py-8">
      <span className="text-5xl select-none">︵‿︵</span>
      <div>
        <h1 className="font-headline text-4xl font-bold italic mb-3">
          Unfortunately not eligible
        </h1>
        <p className="font-body text-on-surface-variant leading-relaxed max-w-sm mx-auto">
          WOKO housing is available to students at partner universities in Zürich.
          Check the full eligibility criteria on the WOKO website.
        </p>
      </div>
      <button
        onClick={() => setStep("welcome")}
        className="flex items-center gap-2 text-primary font-label text-xs font-bold uppercase tracking-widest hover:underline"
      >
        <ArrowLeft size={15} /> Start over
      </button>
    </div>
  );

  // ─── Eligible confirmation ─────────────────────────────────────────────────

  if (step === "eligible") {
    const isSublet = casting?.sublet;
    return shell(
      <div className="flex flex-col gap-8">
        <div className="rounded-3xl bg-gradient-to-br from-primary-container to-primary p-8 text-on-primary relative overflow-hidden">
          <span className="absolute top-5 right-6 text-primary-fixed/40 text-2xl select-none">✦</span>
          <p className="font-label text-[10px] uppercase tracking-[0.15em] font-semibold opacity-80 mb-2">
            {isSublet ? "✦ Sublet opening" : "✦ You're eligible"}
          </p>
          <h2 className="font-headline text-3xl font-bold italic mb-4 leading-tight">
            {isSublet ? "Apply for this sublet!" : "Great, you can apply!"}
          </h2>
          {!isSublet && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 font-body text-sm opacity-90">
              <span>{selectedUniversity}</span>
              <span>{selectedDegree}</span>
            </div>
          )}
          {isSublet && casting && (
            <p className="font-body text-sm opacity-80">
              Move-in {formatDate(casting.moveInDate)}
              {casting.moveOutDate && ` · Move-out ${formatDate(casting.moveOutDate)}`}
            </p>
          )}
        </div>

        <button
          onClick={() => casting?.room ? setStep("room") : goToForm()}
          className="flex items-center justify-between w-full px-6 py-5 bg-primary text-on-primary rounded-full font-label text-sm font-bold tracking-widest active:scale-[0.98] transition-transform"
        >
          {casting?.room ? "SEE THE ROOM" : "START APPLICATION"} <ArrowRight size={16} />
        </button>

        {!isSublet && (
          <button
            onClick={() => setStep("q1")}
            className="text-center text-on-surface-variant font-label text-xs uppercase tracking-[0.15em] font-semibold hover:text-primary transition-colors"
          >
            <ArrowLeft size={15} className="inline mr-1" />
            Back to questions
          </button>
        )}
      </div>
    );
  }

  // ─── Room description ──────────────────────────────────────────────────────

  if (step === "room" && casting?.room) {
    const room = casting.room;
    return shell(
      <div className="flex flex-col gap-8">
        <button
          type="button"
          onClick={() => setStep("eligible")}
          className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] uppercase tracking-[0.15em] font-semibold hover:text-primary transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-2">
            ✦ The room
          </p>
          <h1 className="font-headline text-5xl font-bold italic leading-[1.05] mb-2">
            Room {room.roomNumber}
          </h1>
          <p className="font-body text-on-surface-variant">
            Floor {room.floor} · {room.sizeM2} m²
          </p>
        </div>

        {room.photo && room.photoMimeType && (
          <div className="rounded-3xl overflow-hidden outline outline-1 outline-outline/10 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <img
              src={`data:${room.photoMimeType};base64,${room.photo}`}
              alt={`Room ${room.roomNumber}`}
              className="w-full max-h-[400px] object-cover"
            />
          </div>
        )}

        {room.description && (
          <div className="rounded-3xl bg-surface-container-low p-6 outline outline-1 outline-outline/15">
            <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-3">
              ── About this room ──
            </p>
            <p className="font-body text-sm text-on-surface leading-relaxed whitespace-pre-line">
              {room.description}
            </p>
          </div>
        )}

        <button
          onClick={goToForm}
          className="flex items-center justify-between w-full px-6 py-5 bg-primary text-on-primary rounded-full font-label text-sm font-bold tracking-widest active:scale-[0.98] transition-transform"
        >
          START APPLICATION <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return null;
}
