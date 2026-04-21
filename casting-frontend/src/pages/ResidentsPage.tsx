import { useEffect, useState } from "react";
import { ArrowRight, Cat, Check, Coins, Leaf, Newspaper, Pencil, Plus, Sparkles, Sprout, Trash2, WashingMachine, X, Users, DoorOpen, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getResidents,
  getCleaningDuties,
  getRooms,
  createCleaningDuty,
  getAemtli,
  createAemtli,
  updateAemtliAssignments,
  deleteAemtli,
  formatDate,
  type Resident,
  type CleaningDuty,
  type Room,
  type AemtliView,
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

const SEMESTER_AREA = "Semester Cleaning";

// ─── Section header ──────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-0.5">
          {eyebrow}
        </p>
        <h3 className="font-headline text-2xl font-bold italic tracking-tight leading-[1.1]">
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}

// ─── Semester Cleaning Section ──────────────────────────────────────────────────

function SemesterCleaningSection({
  duties,
  residents,
  onCreated,
}: {
  duties: CleaningDuty[];
  residents: Resident[];
  onCreated: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  const semesterDuties = duties
    .filter((d) => d.area === SEMESTER_AREA)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const uniqueDates = [...new Set(semesterDuties.map((d) => d.dueDate))];

  async function handleAdd() {
    if (!date) return;
    setSaving(true);
    try {
      await Promise.all(
        residents.map((r) => createCleaningDuty(r.id, date, SEMESTER_AREA))
      );
      setAdding(false);
      setDate("");
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <SectionHeader
        eyebrow="Shared duties"
        title="Semester Cleaning ✦"
        action={
          !adding ? (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary text-on-tertiary font-label text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 mb-0.5"
            >
              <Plus size={12} strokeWidth={3} /> Add date
            </button>
          ) : undefined
        }
      />

      {adding && (
        <div className="rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 mb-4">
          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-3">
            New semester cleaning date
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <DateInput
                value={date}
                onChange={setDate}
                placeholder="Pick a date"
                className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline/15 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || !date}
              className="px-5 py-3 rounded-full bg-tertiary text-on-tertiary font-label text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-all active:scale-[0.98]"
            >
              {saving ? "..." : "Add"}
            </button>
            <button
              onClick={() => { setAdding(false); setDate(""); }}
              className="px-4 py-3 rounded-full bg-surface-container text-on-surface-variant font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {uniqueDates.length > 0 ? (
        <div className="space-y-2">
          {uniqueDates.map((d) => {
            const dutiesOnDate = semesterDuties.filter((duty) => duty.dueDate === d);
            const completedCount = dutiesOnDate.filter((duty) => duty.completed).length;
            const allDone = completedCount === dutiesOnDate.length;

            return (
              <div
                key={d}
                className={`rounded-2xl p-4 flex items-center justify-between border transition-colors ${
                  allDone
                    ? "bg-status-yes/5 border-status-yes/20"
                    : "bg-white border-outline/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles
                    size={16}
                    className={allDone ? "text-status-yes" : "text-tertiary/50"}
                  />
                  <div>
                    <p className="font-body font-bold text-on-surface text-sm">
                      {formatDate(d)}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant">
                      Everyone · {completedCount}/{dutiesOnDate.length} done
                    </p>
                  </div>
                </div>
                {allDone && (
                  <span className="bg-status-yes/15 text-status-yes px-2.5 py-1 rounded-lg font-label text-[10px] font-bold">
                    DONE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="font-body text-sm text-on-surface-variant opacity-40 text-center py-4">
          No semester cleaning dates scheduled yet.
        </p>
      )}
    </section>
  );
}

// ─── Ämtli Section ──────────────────────────────────────────────────────────────

const AEMTLI_ICONS: Array<{ match: RegExp; Icon: LucideIcon }> = [
  { match: /compost/i,               Icon: Sprout        },
  { match: /cat|katz/i,              Icon: Cat           },
  { match: /karton|paper|recycl/i,   Icon: Newspaper     },
  { match: /trash|müll|abfall/i,     Icon: Trash2        },
  { match: /financ|kasse|geld/i,     Icon: Coins         },
  { match: /laundry|wäsch|wash/i,    Icon: WashingMachine },
];

function aemtliIcon(name: string): LucideIcon {
  return AEMTLI_ICONS.find((e) => e.match.test(name))?.Icon ?? Leaf;
}

function AemtliSection({ residents }: { residents: Resident[] }) {
  const [aemtli, setAemtli] = useState<AemtliView[]>([]);
  const [managing, setManaging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedResidents, setEditedResidents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [addingSaving, setAddingSaving] = useState(false);

  function load() { getAemtli().then(setAemtli).catch(() => {}); }
  useEffect(() => { load(); }, []);

  function exitManaging() {
    setManaging(false);
    setEditingId(null);
    setConfirmDeleteId(null);
    setAdding(false);
    setNewName("");
  }

  function startEdit(a: AemtliView) {
    setEditingId(a.id);
    setEditedResidents(a.assignedResidents.map((r) => r.id));
    setConfirmDeleteId(null);
  }

  function toggleResident(id: string) {
    setEditedResidents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSave(id: string) {
    setSaving(true);
    try {
      const updated = await updateAemtliAssignments(id, editedResidents);
      setAemtli((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteAemtli(id);
    setAemtli((prev) => prev.filter((a) => a.id !== id));
    setConfirmDeleteId(null);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setAddingSaving(true);
    try {
      await createAemtli(newName.trim());
      setNewName("");
      setAdding(false);
      load();
    } finally {
      setAddingSaving(false);
    }
  }

  function formatLastChange(a: AemtliView): string | null {
    if (!a.lastChange) return null;
    const dt = new Date(a.lastChange.changedAt);
    const d = String(dt.getDate()).padStart(2, "0");
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const y = dt.getFullYear();
    return `${a.lastChange.changedBy.name} · ${d}.${m}.${y}`;
  }

  return (
    <section>
      <SectionHeader
        eyebrow="Permanent duties"
        title="Ämtli ✦"
        action={
          managing ? (
            <button
              onClick={exitManaging}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-label text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors mb-0.5"
            >
              <Check size={11} strokeWidth={3} /> Done
            </button>
          ) : (
            <button
              onClick={() => setManaging(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-label text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors mb-0.5"
            >
              <Pencil size={11} /> Manage
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3">
        {aemtli.map((a) => {
          const Icon = aemtliIcon(a.name);
          const lastChange = formatLastChange(a);
          const isEditing = managing && editingId === a.id;
          const isConfirmingDelete = managing && confirmDeleteId === a.id;

          return (
            <div
              key={a.id}
              className="rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex flex-col items-center gap-3 text-center"
            >
              {/* Name row */}
              <div className="flex items-center justify-between w-full">
                {managing && !isEditing && !isConfirmingDelete && (
                  <button
                    onClick={() => setConfirmDeleteId(a.id)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-status-no hover:bg-status-no/10 transition-colors shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
                <div className={`flex items-center gap-1.5 ${managing && !isEditing && !isConfirmingDelete ? "mx-auto" : "mx-auto"}`}>
                  <Icon size={13} className="text-on-surface-variant/50 shrink-0" />
                  <p className="font-body font-bold text-sm text-on-surface leading-tight">{a.name}</p>
                </div>
                {managing && !isEditing && !isConfirmingDelete && (
                  <button
                    onClick={() => startEdit(a)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                  >
                    <Pencil size={11} />
                  </button>
                )}
              </div>

              {isConfirmingDelete ? (
                <div className="flex flex-col gap-2 w-full">
                  <p className="font-body text-xs text-on-surface-variant">Remove this Ämtli?</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="flex-1 py-1.5 rounded-full bg-status-no/15 text-status-no font-label text-[10px] font-bold uppercase tracking-widest hover:bg-status-no/25 transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ) : isEditing ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {residents.map((r) => {
                      const selected = editedResidents.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          onClick={() => toggleResident(r.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-xs font-bold transition-all ${
                            selected
                              ? `${avatarColor(r.name)} outline outline-2 outline-offset-1 outline-primary/40`
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {r.name[0].toUpperCase()} {r.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleSave(a.id)}
                      disabled={saving}
                      className="flex-1 py-1.5 rounded-full bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-1"
                    >
                      <Check size={11} strokeWidth={3} />
                      {saving ? "..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {a.assignedResidents.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {a.assignedResidents.map((r) => (
                        <span
                          key={r.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-xs font-bold ${avatarColor(r.name)}`}
                        >
                          <span className="text-[11px]">{r.name[0].toUpperCase()}</span>
                          {r.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-body text-xs text-on-surface-variant/40 italic">No one assigned</p>
                  )}
                  {lastChange && (
                    <p className="font-label text-[9px] text-on-surface-variant/40 uppercase tracking-wide leading-tight mt-auto pt-2 border-t border-outline/5 w-full">
                      {lastChange}
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new — only visible in manage mode */}
      {managing && (
        adding ? (
          <div className="mt-3 rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
            <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-3">
              New Ämtli
            </p>
            <div className="flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setAdding(false); setNewName(""); } }}
                placeholder="Name"
                className="flex-1 px-4 py-3 rounded-xl bg-surface-container border border-outline/15 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleCreate}
                disabled={addingSaving || !newName.trim()}
                className="px-5 py-3 rounded-full bg-primary text-on-primary font-label text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-all active:scale-[0.98]"
              >
                {addingSaving ? "..." : "Add"}
              </button>
              <button
                onClick={() => { setAdding(false); setNewName(""); }}
                className="px-4 py-3 rounded-full bg-surface-container text-on-surface-variant font-label text-xs font-bold hover:bg-surface-container-high transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-3 w-full py-3 rounded-2xl border border-dashed border-outline/20 text-on-surface-variant font-label text-[10px] font-bold uppercase tracking-widest hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus size={11} strokeWidth={3} /> New Ämtli
          </button>
        )
      )}
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ResidentsPage() {
  const navigate = useNavigate();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [duties, setDuties] = useState<CleaningDuty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  function loadAll() {
    Promise.all([getResidents(), getCleaningDuties(), getRooms()])
      .then(([r, d, rm]) => {
        setResidents(r.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)));
        setDuties(d);
        setRooms(rm.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  return (
    <div className="flex flex-col gap-8">

      {/* Hero header */}
      <section className="rounded-3xl bg-white/60 backdrop-blur-md outline outline-1 outline-outline/10 shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-4 py-2 flex items-end justify-between">
        <div>
          <p className="font-label text-center text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-semibold mb-0">
            WG Overview
          </p>
        </div>
      </section>

      {loading ? (
        <p className="font-body text-sm text-on-surface-variant opacity-60">Loading...</p>
      ) : (
        <>
          {/* ── Ämtli ── */}
          <AemtliSection residents={residents} />

          {/* ── Semester Cleaning ── */}
          <SemesterCleaningSection
              duties={duties}
              residents={residents}
              onCreated={loadAll}
          />

          {/* ── Residents ── */}
          <section>
            <SectionHeader
              eyebrow={`${residents.length} members`}
              title="Residents"
              action={
                <button
                  onClick={() => navigate("/admin/residents/manage")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 mb-0.5"
                >
                  <Users size={11} strokeWidth={3} /> Manage <ArrowRight size={10} strokeWidth={3} />
                </button>
              }
            />

            <div className="grid grid-cols-2 gap-3">
              {residents.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex flex-col items-center text-center gap-2"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${avatarColor(r.name)}`}
                  >
                    {r.name[0].toUpperCase()}
                  </div>
                  <div className="w-full min-w-0">
                    <p className="font-body font-semibold text-sm text-on-surface truncate">
                      {r.name}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-surface-container font-label text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Room {r.roomNumber}
                    </span>
                    <p className="font-body text-xs text-on-surface-variant mt-1.5">
                      {age(r.birthday)} yo
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="block hover:text-primary transition-colors truncate">
                          {r.phone}
                        </a>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Rooms ── */}
          <section>
            <SectionHeader
              eyebrow={`${rooms.length} rooms`}
              title="Room Catalogue"
              action={
                <button
                  onClick={() => navigate("/admin/rooms")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blush text-on-surface font-label text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 mb-0.5"
                >
                  <DoorOpen size={11} strokeWidth={3} /> Manage <ArrowRight size={10} strokeWidth={3} />
                </button>
              }
            />

            {rooms.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
                  >
                    {/* Photo / placeholder */}
                    {r.photo && r.photoMimeType ? (
                      <div className="h-24 overflow-hidden">
                        <img
                          src={`data:${r.photoMimeType};base64,${r.photo}`}
                          alt={`Room ${r.roomNumber}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-24 bg-surface-container flex items-center justify-center">
                        <DoorOpen size={22} className="text-on-surface-variant/25" />
                      </div>
                    )}
                    {/* Info */}
                    <div className="px-3 py-3">
                      <p className="font-body font-semibold text-sm text-on-surface">
                        Room {r.roomNumber}
                      </p>
                      <p className="font-body text-xs text-on-surface-variant mt-0.5">
                        Floor {r.floor} · {r.sizeM2} m²
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body text-sm text-on-surface-variant opacity-40 text-center py-4">
                No rooms in the catalogue yet.
              </p>
            )}
          </section>




        </>
      )}
    </div>
  );
}
