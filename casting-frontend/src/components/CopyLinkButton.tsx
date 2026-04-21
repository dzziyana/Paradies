import { useState } from "react";
import { Link, Check } from "lucide-react";

interface Props {
  castingId: string;
  /** "icon" — small icon-only button; "full" — full-width banner style */
  variant?: "icon" | "full";
}

function buildApplyUrl(castingId: string) {
  return `${window.location.origin}/apply/${castingId}`;
}

export default function CopyLinkButton({ castingId, variant = "icon" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(buildApplyUrl(castingId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  if (variant === "full") {
    return (
      <div className="rounded-2xl bg-surface-container-low outline outline-1 outline-outline/15 p-4 flex flex-col gap-3">
        <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
          Application link
        </p>
        <p className="font-body text-xs text-on-surface-variant break-all opacity-70">
          {buildApplyUrl(castingId)}
        </p>
        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-full font-label text-xs font-bold tracking-widest transition-all active:scale-[0.98] ${
            copied
              ? "bg-status-yes/20 text-status-yes"
              : "bg-periwinkle/15 text-periwinkle hover:bg-periwinkle/25"
          }`}
        >
          {copied ? (
            <><Check size={13} strokeWidth={3} /> COPIED!</>
          ) : (
            <><Link size={13} strokeWidth={2.5} /> COPY APPLICATION LINK</>
          )}
        </button>
      </div>
    );
  }

  // icon variant
  return (
    <button
      onClick={handleCopy}
      title="Copy application link"
      className={`flex items-center gap-1 px-2 py-1 rounded-lg font-label text-[10px] font-bold transition-all shrink-0 ${
        copied
          ? "bg-status-yes/20 text-status-yes"
          : "bg-outline/15 text-on-surface-variant hover:bg-primary/15 hover:text-primary"
      }`}
    >
      {copied ? <Check size={11} strokeWidth={3} /> : <Link size={11} strokeWidth={2} />}
      {copied ? "Copied!" : "Link"}
    </button>
  );
}
