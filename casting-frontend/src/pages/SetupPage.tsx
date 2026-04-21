import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { checkInvite, type InviteInfo } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function SetupPage() {
  const { token } = useParams<{ token: string }>();
  const { setup } = useAuth();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profileMime, setProfileMime] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    checkInvite(token)
      .then(setInvite)
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setProfileMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setProfilePicture(base64);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await setup({
        inviteToken: token!,
        password,
        profilePicture,
        profilePictureMimeType: profileMime,
      });
      navigate("/admin", { replace: true });
    } catch {
      setError(invite?.isReset
        ? "Reset failed. The link may have expired — request a new one."
        : "Setup failed. The invite link may have already been used.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="font-headline italic text-2xl text-primary animate-pulse">
          Paradies <span className="text-primary/50">✦</span>
        </p>
      </div>
    );
  }

  if (invalid || !invite) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center flex flex-col gap-6">
          <h1 className="font-headline italic font-bold text-4xl tracking-tight text-primary">
            Paradies <span className="text-primary/50">✦</span>
          </h1>
          <div className="rounded-3xl bg-status-no/10 p-8 outline outline-1 outline-status-no/20">
            <p className="font-headline text-xl font-bold italic mb-2">Invalid invite</p>
            <p className="font-body text-sm text-on-surface-variant">
              This invite link is invalid or has already been used.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="font-headline italic font-bold text-4xl tracking-tight text-primary mb-3">
            Paradies <span className="text-primary/50">✦</span>
          </h1>
          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-1">
            {invite.isReset ? "Reset your password" : "Welcome to the WG"}
          </p>
          <p className="font-headline text-2xl font-bold italic">{invite.name}</p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-surface-container-low p-7 outline outline-1 outline-outline/15 flex flex-col gap-5"
        >
          {/* Profile picture — only for initial setup */}
          {!invite.isReset && (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-full bg-surface-container outline outline-1 outline-outline/15 flex items-center justify-center overflow-hidden hover:outline-primary/50 transition-all"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-headline text-2xl italic text-primary/40">
                    {invite.name.charAt(0)}
                  </span>
                )}
              </button>
              <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60 font-semibold">
                Tap to add a photo
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </div>
          )}

          {/* Email (read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
              Email
            </label>
            <input
              type="email"
              value={invite.email}
              readOnly
              className="w-full px-4 py-3 rounded-2xl bg-surface-container-high text-on-surface-variant font-body text-sm outline outline-1 outline-outline/10"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-2xl bg-surface-container text-on-surface font-body text-sm outline outline-1 outline-outline/15 focus:outline-primary/50 focus:outline-2 transition-all placeholder:text-on-surface-variant/40"
              placeholder="At least 6 characters"
            />
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
              Confirm password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-2xl bg-surface-container text-on-surface font-body text-sm outline outline-1 outline-outline/15 focus:outline-primary/50 focus:outline-2 transition-all placeholder:text-on-surface-variant/40"
              placeholder="Repeat your password"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="font-body text-sm text-error text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-primary text-on-primary rounded-full font-label text-xs font-bold tracking-widest uppercase hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50"
          >
            {submitting
              ? invite.isReset ? "Saving..." : "Setting up..."
              : invite.isReset ? "Set new password" : "Create account"}
          </button>
        </form>

        <p className="text-center font-body text-xs text-on-surface-variant/50">
          {invite.isReset ? "⊹ ₊˚ ｡ ₊°༺❤︎༻°₊ ｡ ˚₊ ⊹" : "⊹ ₊˚ Living together, beautifully ˚₊ ⊹"}
        </p>
      </div>
    </div>
  );
}
