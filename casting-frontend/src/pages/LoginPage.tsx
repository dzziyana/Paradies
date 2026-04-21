import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch {
      setError("Invalid email or password.");
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
            Sign in to your account
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-surface-container-low p-7 outline outline-1 outline-outline/15 flex flex-col gap-5"
        >
          {/* Email */}
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

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-2xl bg-surface-container text-on-surface font-body text-sm outline outline-1 outline-outline/15 focus:outline-primary/50 focus:outline-2 transition-all placeholder:text-on-surface-variant/40"
              placeholder="Your password"
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
            {submitting ? "Signing in..." : "Sign in"}
          </button>

          <Link
            to="/forgot-password"
            className="text-center font-body text-xs text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
          >
            Forgot password?
          </Link>
        </form>

        <p className="text-center font-body text-xs text-on-surface-variant/50">
          ⊹ ₊˚ ｡ ₊°༺❤︎༻°₊ ｡ ˚₊ ⊹
        </p>
      </div>
    </div>
  );
}
