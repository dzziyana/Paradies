import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Upload, X, Plus, ChevronDown, DoorOpen } from "lucide-react";
import { getCasting, submitApplication, formatDate, type CastingPublicView } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-white rounded-xl px-4 py-3 font-body text-sm text-on-surface outline outline-1 outline-outline-variant/30 focus:outline-primary focus:outline-2 transition-all appearance-none placeholder:text-on-surface-variant/40";

const labelClass = "font-label text-sm uppercase tracking-[0.1em] text-on-surface-variant/70 font-semibold";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplicationFormPage() {
  const { castingId } = useParams<{ castingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedUniversity = (location.state as { university?: string })?.university ?? "";
  const selectedDegree = (location.state as { degree?: string })?.degree ?? "";

  const [casting, setCasting] = useState<CastingPublicView | null>(null);
  const [roomOpen, setRoomOpen] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [occupation, setOccupation] = useState("Student");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [otherOccupation, setOtherOccupation] = useState("");
  const [letter, setLetter] = useState("");
  const [picture, setPicture] = useState<string | null>(null);
  const [pictureMime, setPictureMime] = useState<string | null>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [extraPics, setExtraPics] = useState<{ data: string; mime: string }[]>([]);
  const [extraPicError, setExtraPicError] = useState<string | null>(null);
  const extraFileRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!castingId) return;
    getCasting(castingId)
      .then(setCasting)
      .catch(() => navigate(`/apply/${castingId}`, { replace: true }));
  }, [castingId]);

  function handlePicture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setPictureError("Image must be under 2 MB.");
      return;
    }
    setPictureError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(",");
      const mime = header.split(":")[1].split(";")[0];
      setPicture(data);
      setPictureMime(mime);
    };
    reader.readAsDataURL(file);
  }

  function handleExtraPicture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setExtraPicError("Image must be under 2 MB.");
      return;
    }
    if (extraPics.length >= 4) {
      setExtraPicError("Maximum 4 additional pictures.");
      return;
    }
    setExtraPicError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(",");
      const mime = header.split(":")[1].split(";")[0];
      setExtraPics((prev) => [...prev, { data, mime }]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function removeExtraPic(index: number) {
    setExtraPics((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!castingId) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await submitApplication(castingId, {
        name: name.trim(),
        occupation,
        age: parseInt(age, 10),
        university: occupation === "Student" ? (selectedUniversity || university.trim()) : "",
        major: occupation === "Student" ? (major.trim() || null) : null,
        otherOccupation: occupation === "Other" ? (otherOccupation.trim() || null) : null,
        email: email.trim(),
        phone: phone.trim() || null,
        letter: letter.trim(),
        pronouns: pronouns.trim() || null,
        profilePicture: picture,
        profilePictureMimeType: pictureMime,
        additionalPictures: extraPics.length > 0 ? extraPics.map((p) => p.data) : null,
        additionalPictureMimeTypes: extraPics.length > 0 ? extraPics.map((p) => p.mime) : null,
      });
      navigate(`/apply/${castingId}/success/${res.applicationId}`, {
        state: { magicLinkToken: res.magicLinkToken },
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const letterValid = letter.trim().length >= 50;
  const canSubmit = name.trim() && age && email.trim() && letterValid && !submitting;
  const room = casting?.room ?? null;

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">

          {/* ── Header: back, title, context chips ── */}
          <div className="flex flex-col gap-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-on-surface-variant font-label text-xs uppercase tracking-[0.1em] font-semibold hover:text-primary transition-colors self-start"
            >
              <ArrowLeft size={15} /> Back
            </button>

            <div className="flex flex-col gap-4">
              <div>
                <p className="font-label text-l uppercase tracking-[0.15em] text-primary font-semibold mb-1.5">
                  KIRCHGASSE 36 / KLEINES PARADIES
                </p>
                <h1 className="font-headline text-4xl lg:text-5xl font-bold italic leading-[1.05]">
                  Your application
                </h1>
              </div>

              {casting && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-3.5 py-1.5 font-body text-sm text-on-surface shadow-sm outline outline-1 outline-outline-variant/15">
                    Move-in {formatDate(casting.moveInDate)}
                  </span>
                  {casting.moveOutDate && (
                    <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-3.5 py-1.5 font-body text-sm text-on-surface shadow-sm outline outline-1 outline-outline-variant/15">
                      Move-out {formatDate(casting.moveOutDate)}
                    </span>
                  )}
                  {casting.sublet && (
                    <span className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3.5 py-1.5 font-label text-xs font-bold uppercase tracking-wider">
                      Sublet
                    </span>
                  )}
                  {casting.applicationUntil && (
                    <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-3.5 py-1.5 font-body text-l text-on-surface-variant shadow-sm outline outline-1 outline-outline-variant/15">
                      Apply by <span className="font-semibold text-on-surface">{formatDate(casting.applicationUntil)}</span>
                    </span>
                  )}
                  {room && (
                    <button
                      type="button"
                      onClick={() => setRoomOpen(!roomOpen)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-label text-xs font-bold uppercase tracking-wider transition-all ${
                        roomOpen
                          ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                          : "bg-white text-primary shadow-sm outline outline-1 outline-primary/20 hover:bg-primary/5"
                      }`}
                    >
                      <DoorOpen size={14} />
                      Room {room.roomNumber}
                      <ChevronDown size={12} className={`transition-transform ${roomOpen ? "rotate-180" : ""}`} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Expandable room info ── */}
          {room && roomOpen && (
            <div className="rounded-3xl bg-white p-6 lg:p-8 shadow-[0_2px_16px_rgba(0,0,0,0.05)] flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-headline text-xl font-bold italic">Room {room.roomNumber}</h3>
                  <p className="font-body text-sm text-on-surface-variant mt-0.5">
                    Floor {room.floor} · {room.sizeM2} m²
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRoomOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-colors shrink-0"
                >
                  <X size={14} className="text-on-surface-variant" />
                </button>
              </div>
              {room.photo && room.photoMimeType && (
                <div className="rounded-2xl overflow-hidden">
                  <img
                    src={`data:${room.photoMimeType};base64,${room.photo}`}
                    alt={`Room ${room.roomNumber}`}
                    className="w-full max-h-[320px] object-cover"
                  />
                </div>
              )}
              {room.description && (
                <p className="font-body text-sm text-on-surface leading-relaxed whitespace-pre-line">
                  {room.description}
                </p>
              )}
            </div>
          )}

          {/* ── Desktop: left = details + photos, right = letter ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-x-14 gap-y-10 items-start">

            {/* ── Left column ── */}
            <div className="flex flex-col gap-8">

              {/* Personal Details */}
              <fieldset className="flex flex-col gap-5">
                <div>
                  <legend className="text-primary font-bold font-headline text-2xl text-on-surface">About you</legend>
                  <p className="text-primary text-m tracking-[0.2em] select-none mt-1.5 mb-1" aria-hidden>⊹₊˚‧︵‿₊୨☆ৎ₊‿︵‧˚₊⊹*ੈ✩‧₊˚༺☆༻*ੈ✩‧₊˚⊹₊˚‧︵‿₊୨☆ৎ₊‿︵‧˚₊⊹</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Full name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:w-44">
                    <label className={labelClass}>Pronouns</label>
                    <input
                      type="text"
                      list="pronoun-suggestions"
                      value={pronouns}
                      onChange={(e) => setPronouns(e.target.value)}
                      placeholder="e.g. she/her"
                      className={inputClass}
                    />
                    <datalist id="pronoun-suggestions">
                      <option value="she/her" />
                      <option value="he/him" />
                      <option value="they/them" />
                      <option value="she/they" />
                      <option value="he/they" />
                      <option value="any pronouns" />
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-[5rem_1fr_1fr] gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Age *</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min={16}
                      max={99}
                      placeholder="24"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+41 79 …"
                      className={inputClass}
                    />
                  </div>
                </div>
              </fieldset>

              {/* Occupation */}
              <fieldset className="flex flex-col gap-5">
                <div>
                  <legend className="text-primary font-bold font-headline text-2xl text-on-surface">Occupation</legend>
                  <p className="text-primary text-m tracking-[0.1em] select-none mt-1.5 mb-1" aria-hidden>₊✩‧₊˚౨ৎ˚₊✩‧₊ ⋆˚☆˖°⋆｡° ✮˖ ࣪ ⊹⋆.˚₊✩‧₊˚౨ৎ˚₊✩‧₊ ⋆˚☆˖°⋆｡° ✮˖ ࣪ ⊹⋆.˚</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>I am a…</label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className={inputClass}
                  >
                    <option>Student</option>
                    <option>Employed</option>
                    <option>Self-employed</option>
                    <option>Other</option>
                  </select>
                </div>

                {occupation === "Student" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>University</label>
                      {selectedUniversity ? (
                        <input
                          type="text"
                          value={selectedUniversity}
                          readOnly
                          className={`${inputClass} opacity-60 cursor-not-allowed`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={university}
                          onChange={(e) => setUniversity(e.target.value)}
                          placeholder="e.g. ETH Zürich"
                          className={inputClass}
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Major or study program</label>
                      <input
                        type="text"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="e.g. Computer Science"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                {occupation === "Other" && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Please describe</label>
                    <input
                      type="text"
                      value={otherOccupation}
                      onChange={(e) => setOtherOccupation(e.target.value)}
                      placeholder="e.g. Freelance designer"
                      className={inputClass}
                    />
                  </div>
                )}
              </fieldset>

              {/* Additional photos */}
              <fieldset className="flex flex-col gap-4">
                <div>
                  <legend className="text-primary font-headline text-2xl text-on-surface">Additional photos</legend>
                  <p className="text-primary text-m tracking-[0.2em] select-none mt-1.5 mb-1" aria-hidden>────୨ৎ────</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {extraPics.map((pic, i) => (
                    <div key={i} className="relative w-[5.5rem] h-[5.5rem] rounded-2xl overflow-hidden group">
                      <img
                        src={`data:${pic.mime};base64,${pic.data}`}
                        alt={`Extra ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExtraPic(i)}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  {extraPics.length < 4 && (
                    <button
                      type="button"
                      onClick={() => extraFileRef.current?.click()}
                      className="w-[5.5rem] h-[5.5rem] rounded-2xl bg-white outline outline-2 outline-dashed outline-outline-variant/25 hover:outline-primary flex flex-col items-center justify-center gap-1 transition-all"
                    >
                      <Plus size={16} className="text-on-surface-variant/30" />
                      <span className="font-label text-[7px] uppercase tracking-wider text-on-surface-variant/40">Add</span>
                    </button>
                  )}
                </div>
                <p className="font-body text-xs text-on-surface-variant/40">
                  Up to 4 extra photos · JPG/PNG · max 2 MB each
                </p>
                {extraPicError && (
                  <p className="font-body text-s text-status-no">{extraPicError}</p>
                )}
              </fieldset>

              <input ref={extraFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleExtraPicture} className="sr-only" />
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePicture} className="sr-only" />
            </div>

            {/* ── Right column: clipboard card with photo + letter ── */}
            <div className="lg:sticky lg:top-8">
              <div className="relative z-10 -mb-5 flex flex-col items-center">
                <div className="w-28 h-7 bg-gradient-to-b from-outline-variant/60 to-outline-variant/40 rounded-t-lg rounded-b-sm shadow-sm" />
                <div className="w-20 h-2.5 bg-gradient-to-b from-outline-variant/30 to-outline-variant/20 rounded-b-md -mt-0.5" />
              </div>
              <div className="rounded-[2rem] bg-rose-100 /40 p-6 lg:p-8 flex flex-col items-center gap-6">

                {/* Profile picture */}
                <div className="flex flex-col items-center gap-2 -mt-1">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-28 h-28 rounded-full bg-white outline-2 outline-dashed outline-outline-variant/30 hover:outline-primary hover:scale-[1.03] flex items-center justify-center transition-all shrink-0 overflow-hidden shadow-sm"
                  >
                    {picture ? (
                      <img
                        src={`data:${pictureMime};base64,${picture}`}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload size={20} className="text-on-surface-variant/30" />
                        <span className="font-label text-[8px] uppercase tracking-wider text-on-surface-variant/40">Photo</span>
                      </div>
                    )}
                  </button>
                  <span className="font-body text-[11px] text-on-secondary-container/50">
                    {picture ? "Click to change" : "Profile picture · optional"}
                  </span>
                  {pictureError && (
                    <p className="font-body text-xs text-status-no">{pictureError}</p>
                  )}
                </div>

                {/* Letter card */}
                <div className="w-full rounded-3xl bg-white p-6 lg:p-8 shadow-sm">
                  <h3 className="font-headline text-2xl font-bold italic tracking-tight mb-1">
                    Motivation Letter
                  </h3>
                  <p className="font-body text-m text-on-surface-variant/50 mb-5 leading-relaxed">
                    Who you are, why Paradies, and what you'd bring to a shared flat.
                  </p>

                  <textarea
                    value={letter}
                    onChange={(e) => setLetter(e.target.value)}
                    placeholder="Write your letter here…"
                    rows={14}
                    required
                    className="w-full bg-surface/50 rounded-2xl px-5 py-4 font-body text-base text-on-surface outline-1 outline-outline-variant/15 focus:outline-primary focus:outline-2 transition-all appearance-none resize-none leading-[1.85] placeholder:text-on-surface-variant/30"
                  />
                  <div className="flex justify-end mt-2 text-[11px] font-label px-1">
                    <span className={letter.trim().length > 0 && !letterValid ? "text-status-no font-semibold" : "text-on-surface-variant/35"}>
                      {letter.trim().length} / 50 min
                    </span>
                  </div>
                </div>

                <p className="text-on-secondary-container text-m tracking-[0.2em] select-none" aria-hidden>⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔</p>
              </div>
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="flex flex-col gap-4 pt-2">
            {submitError && (
              <p className="font-body text-sm text-status-no px-1">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-5 bg-primary text-on-primary rounded-full font-label text-sm font-bold tracking-widest transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-3 shadow-lg shadow-primary/15"
            >
              {submitting ? "Submitting…" : <><span>SUBMIT APPLICATION</span> <ArrowRight size={16} /></>}
            </button>
            <p className="text-center font-body text-[11px] text-on-surface-variant/40 pb-4">
              By submitting you agree to your data being processed for this room application.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
