import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Check, Copy } from "lucide-react";

export default function SuccessPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const magicLinkToken: string | undefined = state?.magicLinkToken;

  const [copied, setCopied] = useState(false);

  async function copyId() {
    if (!applicationId) return;
    await navigator.clipboard.writeText(applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusUrl = magicLinkToken
    ? `${window.location.origin}/status/${magicLinkToken}`
    : null;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-lg flex flex-col gap-8">

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-navy via-primary to-periwinkle p-10 text-white text-center relative overflow-hidden">
          <span className="absolute top-5 right-7 text-white/15 text-3xl select-none">✦</span>
          <span className="absolute bottom-5 left-7 text-white/10 text-2xl select-none">✦</span>

          <div className="w-16 h-16 rounded-full bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-5">
            <Check size={28} strokeWidth={2.5} />
          </div>
          <h1 className="font-headline text-4xl font-bold italic mb-3 leading-tight">
            Application sent ✦
          </h1>
          <p className="font-body text-white/70 text-sm leading-relaxed">
            Thank you for applying. We'll review your application and get back to you via email.
          </p>
        </div>

        {/* Application ID */}
        {applicationId && (
          <div className="rounded-3xl bg-surface-container-low p-6 outline outline-1 outline-outline/15 flex flex-col gap-3">
            <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
              Your application ID
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 font-mono text-xs text-on-surface bg-surface-container rounded-xl px-3 py-2.5 truncate">
                {applicationId}
              </code>
              <button
                onClick={copyId}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-label text-[10px] font-bold transition-all ${
                  copied
                    ? "bg-status-yes/20 text-status-yes"
                    : "bg-outline/15 text-on-surface-variant hover:bg-primary/15 hover:text-primary"
                }`}
              >
                {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Status link */}
        {statusUrl && (
          <div className="rounded-3xl bg-surface-container-low p-6 outline outline-1 outline-outline/15 flex flex-col gap-3">
            <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
              Track your application
            </p>
            <p className="font-body text-xs text-on-surface-variant opacity-70 leading-relaxed">
              Bookmark this link to check your status or withdraw your application at any time.
            </p>
            <button
              onClick={() => navigate(`/status/${magicLinkToken}`)}
              className="w-full py-3.5 bg-primary text-on-primary rounded-full font-label text-xs font-bold tracking-widest transition-all active:scale-[0.98]"
            >
              VIEW STATUS →→→
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
