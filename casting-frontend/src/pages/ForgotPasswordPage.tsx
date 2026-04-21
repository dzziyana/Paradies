import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="font-headline italic font-bold text-4xl tracking-tight text-primary mb-1">
            Paradies <span className="text-primary/50">✦</span>
          </h1>
          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
            Reset your password
          </p>
        </div>

        {sent ? (
          <div className="rounded-3xl bg-surface-container-low p-7 outline outline-1 outline-outline/15 flex flex-col gap-4 text-center">
            <p className="font-headline text-xl font-bold italic">Check your inbox ✦</p>
            <p className="font-body text-sm text-on-surface-variant">
              If that email is registered, you'll receive a reset link shortly.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-surface-container-low p-7 outline outline-1 outline-outline/15 flex flex-col gap-5"
          >
            <p className="font-body text-sm text-on-surface-variant">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-2xl bg-surface-container text-on-surface font-body text-sm outline outline-1 outline-outline/15 focus:outline-primary/50 focus:outline-2 transition-all placeholder:text-on-surface-variant/40"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <p className="font-body text-sm text-error text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-primary text-on-primary rounded-full font-label text-xs font-bold tracking-widest uppercase hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 font-body text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
        >
          <ArrowLeft size={15} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
