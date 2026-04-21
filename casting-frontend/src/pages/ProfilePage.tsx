import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState(user?.phone ?? "");
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.profilePicture ?? null);
  const [profileMime, setProfileMime] = useState<string | null>(user?.profilePictureMimeType ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.profilePicture && user.profilePictureMimeType
      ? `data:${user.profilePictureMimeType};base64,${user.profilePicture}`
      : null
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setProfileMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicture((reader.result as string).split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateProfile({
        phone: phone.trim() || null,
        profilePicture,
        profilePictureMimeType: profileMime,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <section>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] uppercase tracking-[0.15em] font-semibold mb-4 hover:text-primary transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-1">
          My account
        </p>
        <h2 className="font-headline text-2xl font-bold italic tracking-tight leading-[1.1]">
          Edit Profile
        </h2>
      </section>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full bg-surface-container outline outline-1 outline-outline/15 flex items-center justify-center overflow-hidden hover:outline-primary/50 transition-all group"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="font-headline text-3xl italic text-primary/40">
                {user?.name.charAt(0)}
              </span>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
          </button>
          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60 font-semibold">
            Tap to change photo
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {/* Read-only info */}
        <div className="rounded-2xl bg-surface-container-low outline outline-1 outline-outline/10 divide-y divide-outline/10">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
              Name
            </span>
            <span className="font-body text-sm text-on-surface">{user?.name}</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
              Email
            </span>
            <span className="font-body text-sm text-on-surface-variant truncate max-w-[60%] text-right">
              {user?.email}
            </span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
              Room
            </span>
            <span className="font-body text-sm text-on-surface">{user?.roomNumber}</span>
          </div>
        </div>

        {/* Editable fields */}
        <div className="flex flex-col gap-1.5">
          <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
            Phone number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className="w-full px-4 py-3 rounded-2xl bg-surface-container-low text-on-surface font-body text-sm outline outline-1 outline-outline/15 focus:outline-primary/50 focus:outline-2 transition-all placeholder:text-on-surface-variant/40"
            placeholder="+41 79 123 45 67"
          />
          <p className="font-body text-xs text-on-surface-variant/50 px-1">
            Visible to other WG members
          </p>
        </div>

        {error && (
          <p className="font-body text-sm text-error text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-primary text-on-primary rounded-full font-label text-xs font-bold tracking-widest uppercase hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved ✦" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
