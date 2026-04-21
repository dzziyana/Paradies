import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, X, Check, Upload, DoorOpen } from "lucide-react";
import {
  getRooms,
  createRoom,
  deleteRoom,
  type Room,
} from "@/lib/api";

// ─── Room Form ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-surface-container border border-outline/15 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30";

function RoomForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [sizeM2, setSizeM2] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be under 5 MB.");
      return;
    }
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(",");
      const mime = header.split(":")[1].split(";")[0];
      setPhoto(data);
      setPhotoMime(mime);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomNumber.trim() || !floor || !sizeM2) return;
    setSaving(true);
    try {
      await createRoom({
        roomNumber: roomNumber.trim(),
        floor: parseInt(floor, 10),
        sizeM2: parseFloat(sizeM2),
        description: description.trim(),
        photo,
        photoMimeType: photoMime,
      });
      onSubmit();
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = roomNumber.trim() && floor && sizeM2;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <input
          placeholder="Room #"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          className={inputClass}
        />
        <input
          type="number"
          placeholder="Floor"
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          className={inputClass}
        />
        <input
          type="number"
          step="0.1"
          placeholder="m²"
          value={sizeM2}
          onChange={(e) => setSizeM2(e.target.value)}
          className={inputClass}
        />
      </div>

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className={`${inputClass} resize-none`}
      />

      {/* Photo upload */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-20 h-20 rounded-2xl bg-surface-container outline outline-2 outline-dashed outline-outline-variant/40 hover:outline-primary flex items-center justify-center transition-all shrink-0 overflow-hidden"
        >
          {photo ? (
            <img
              src={`data:${photoMime};base64,${photo}`}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <Upload size={18} className="text-on-surface-variant opacity-40" />
          )}
        </button>
        <div>
          <p className="font-body text-sm text-on-surface-variant">
            {photo ? "Tap to change photo" : "Room photo (optional)"}
          </p>
          <p className="font-body text-xs text-on-surface-variant opacity-50">
            JPG or PNG · max 5 MB
          </p>
          {photoError && (
            <p className="font-body text-xs text-status-no mt-1">{photoError}</p>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhoto}
          className="sr-only"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="flex-1 py-3 rounded-full bg-primary text-on-primary font-label text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          <Check size={13} strokeWidth={3} />
          {saving ? "Saving..." : "Add Room"}
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

// ─── Room Card ──────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  onDelete,
}: {
  room: Room;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Photo */}
      {room.photo && room.photoMimeType && (
        <div className="h-36 bg-surface-container">
          <img
            src={`data:${room.photoMimeType};base64,${room.photo}`}
            alt={`Room ${room.roomNumber}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <DoorOpen size={14} className="text-primary shrink-0" />
              <p className="font-body font-bold text-on-surface">
                Room {room.roomNumber}
              </p>
            </div>
            <p className="font-body text-xs text-on-surface-variant">
              Floor {room.floor} · {room.sizeM2} m²
            </p>
            {room.description && (
              <p className="font-body text-xs text-on-surface-variant/70 mt-2 line-clamp-2">
                {room.description}
              </p>
            )}
          </div>

          <div className="shrink-0">
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
                  className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-status-no hover:bg-status-no/10 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function RoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  function load() {
    getRooms()
      .then((r) => setRooms(r.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    await deleteRoom(id);
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section>
        <button
          onClick={() => navigate("/admin/residents")}
          className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] uppercase tracking-[0.15em] font-semibold mb-4 hover:text-primary transition-colors"
        >
          <ArrowLeft size={15} /> WG Management
        </button>
        <div className="flex items-end justify-between">
          <div>

            <h2 className="font-headline text-2xl font-bold italic tracking-tight leading-[1.1] mb-1">
              Rooms
            </h2>
            <p className="font-label text-sm uppercase tracking-[0.15em] text-primary font-semibold mb-0">
              Room Catalogue
            </p>
          </div>
          {!adding && (
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
          {adding && (
            <div className="rounded-2xl bg-white outline outline-1 outline-outline/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
              <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-3">
                New Room
              </p>
              <RoomForm
                onSubmit={() => { setAdding(false); load(); }}
                onCancel={() => setAdding(false)}
              />
            </div>
          )}

          {rooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rooms.map((r) => (
                <RoomCard
                  key={r.id}
                  room={r}
                  onDelete={() => handleDelete(r.id)}
                />
              ))}
            </div>
          ) : (
            <p className="font-body text-sm text-on-surface-variant opacity-40 text-center py-8">
              No rooms in the catalogue yet.
            </p>
          )}
        </>
      )}
    </div>
  );
}
