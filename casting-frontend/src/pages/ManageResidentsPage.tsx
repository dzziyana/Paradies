import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getResidents,
  createResident,
  updateResident,
  deleteResident,
  formatDate,
  type Resident,
} from "@/lib/api";
import DateInput from "@/components/DateInput";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function avatarColor(name: string) {
  const colors = [
    "bg-primary text-on-primary",
    "bg-tertiary text-on-tertiary",
    "bg-rose/80 text-white",
    "bg-periwinkle/70 text-white",
    "bg-blush/80 text-on-surface",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

function age(birthday: string): number {
  const [y, m, d] = birthday.split("-").map(Number);
  const today = new Date();
  let a = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) a--;
  return a;
}

// ─── Form ───────────────────────────────────────────────────────────────────────

interface ResidentFormData {
  name: string;
  birthday: string;
  roomNumber: string;
  email: string;
}

const emptyForm: ResidentFormData = { name: "", birthday: "", roomNumber: "", email: "" };

function ResidentForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: ResidentFormData;
  onSubmit: (data: ResidentFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof ResidentFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.birthday) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl bg-surface-container border border-outline/15 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        className={inputCls}
      />
      <div className="grid grid-cols-2 gap-3">
        <DateInput
          value={form.birthday}
          onChange={(iso) => set("birthday", iso)}
          placeholder="Birthday"
          className={inputCls}
        />
        <input
          placeholder="Room #"
          value={form.roomNumber}
          onChange={(e) => set("roomNumber", e.target.value)}
          className={inputCls}
        />
      </div>
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => set("email", e.target.value)}
        className={inputCls}
      />
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !form.name.trim() || !form.email.trim() || !form.birthday}
          className="flex-1 py-3 rounded-full bg-primary text-on-primary font-label text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          <Check size={13} strokeWidth={3} />
          {saving ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 rounded-full bg-surface-container text-on-surface-variant font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────────

function ResidentCard({
  resident,
  onEdit,
  onDelete,
}: {
  resident: Resident;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${avatarColor(resident.name)}`}
        >
          {resident.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body font-bold text-on-surface truncate">{resident.name}</p>
          <p className="font-body text-xs text-on-surface-variant">
            Room {resident.roomNumber} · {age(resident.birthday)} yo · {formatDate(resident.birthday)}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Pencil size={14} />
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={onDelete}
                className="px-2.5 py-1 rounded-full bg-status-no/15 text-status-no font-label text-[10px] font-bold"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-status-no hover:bg-status-no/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {resident.email && (
        <p className="font-body text-[11px] text-on-surface-variant/60 mt-1.5 ml-14 truncate">
          {resident.email}
        </p>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ManageResidentsPage() {
  const navigate = useNavigate();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  function load() {
    getResidents()
      .then((r) => setResidents(r.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(data: ResidentFormData) {
    setCreateError(null);
    try {
      await createResident(data);
      setAdding(false);
      load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create resident");
    }
  }

  async function handleUpdate(id: string, data: ResidentFormData) {
    await updateResident(id, data);
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    await deleteResident(id);
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section>
        <button
          onClick={() => navigate("/admin/residents")}
          className="flex items-center gap-1 text-on-surface-variant font-label text-[0.6em] uppercase tracking-[0.15em] font-semibold mb-4 hover:text-primary transition-colors"
        >
          <ArrowLeft size={15} /> WG Management
        </button>
        <div className="flex items-end justify-between">
          <div>

            <h2 className="font-headline text-2xl font-bold italic tracking-tight leading-[1.1] mb-1.5">
              Manage Residents
            </h2>
            <p className="font-label text-sm uppercase tracking-[0.15em] text-primary font-semibold ">
              Add, edit & remove
            </p>
          </div>
          {!adding && !editingId && (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 mb-1"
            >
              <Plus size={12} strokeWidth={3} /> Add
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <p className="font-body text-sm text-on-surface-variant opacity-60">Loading...</p>
      ) : (
        <>
          {/* Add form */}
          {adding && (
            <div className="rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
              <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-3">
                New Resident
              </p>
              <ResidentForm
                initial={emptyForm}
                onSubmit={handleCreate}
                onCancel={() => { setAdding(false); setCreateError(null); }}
                submitLabel="Add Resident"
              />
              {createError && (
                <p className="font-body text-xs text-status-no mt-3">{createError}</p>
              )}
            </div>
          )}

          {/* Residents list */}
          <div className="space-y-3">
            {residents.map((r) =>
              editingId === r.id ? (
                <div
                  key={r.id}
                  className="rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5"
                >
                  <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-3">
                    Edit Resident
                  </p>
                  <ResidentForm
                    initial={{
                      name: r.name,
                      birthday: r.birthday,
                      roomNumber: r.roomNumber,
                      email: r.email,
                    }}
                    onSubmit={(data) => handleUpdate(r.id, data)}
                    onCancel={() => setEditingId(null)}
                    submitLabel="Save"
                  />
                </div>
              ) : (
                <ResidentCard
                  key={r.id}
                  resident={r}
                  onEdit={() => setEditingId(r.id)}
                  onDelete={() => handleDelete(r.id)}
                />
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
