import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Trash2, Plus, ChevronUp, X, Cake } from "lucide-react";
import { formatDate, getCalendarEntries, createCalendarEntry, deleteCalendarEntry, getResidents, type CalendarEntryDTO, type CalendarEntryCategory, type Resident } from "@/lib/api";
// Date inputs here use plain text (DD.MM.YYYY) — the big calendar grid handles date picking

// ─── Types ────────────────────────────────────────────────────────────────────

type LocalCategory = "absence" | "party" | "event";

interface CalendarEntry {
  id: string;
  title: string;
  startDate: string;      // ISO "YYYY-MM-DD"
  endDate: string;         // ISO "YYYY-MM-DD"
  time: string | null;
  color: number;
  category: LocalCategory;
  residentId: string | null;
  residentName: string | null;
  virtual?: boolean;       // birthdays — not deletable
}

interface BarSegment {
  entry: CalendarEntry;
  startCol: number;
  spanCols: number;
  lane: number;
  isStart: boolean;
  isEnd: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_BARS = 3;
const MAX_DOTS = 1;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const COLORS = [
  { name: "Teal",   bg: "bg-primary/20",      bgDeep: "bg-primary/45",      text: "text-on-primary-container", dot: "bg-primary",       chipBg: "bg-primary/15",      chipText: "text-primary" },
  { name: "Rose",   bg: "bg-rose/18",         bgDeep: "bg-rose/40",         text: "text-rose",                 dot: "bg-rose",          chipBg: "bg-rose/15",         chipText: "text-rose" },
  { name: "Violet", bg: "bg-periwinkle/22",   bgDeep: "bg-periwinkle/45",   text: "text-navy",                 dot: "bg-periwinkle",    chipBg: "bg-periwinkle/15",   chipText: "text-navy" },
  { name: "Blush",  bg: "bg-blush/28",        bgDeep: "bg-blush/50",        text: "text-on-surface",           dot: "bg-blush",         chipBg: "bg-blush/20",        chipText: "text-on-surface" },
  { name: "Green",  bg: "bg-status-yes/18",   bgDeep: "bg-status-yes/40",   text: "text-status-yes",           dot: "bg-status-yes",    chipBg: "bg-status-yes/15",   chipText: "text-status-yes" },
  { name: "Gold",   bg: "bg-status-maybe/18", bgDeep: "bg-status-maybe/40", text: "text-on-surface",           dot: "bg-status-maybe",  chipBg: "bg-status-maybe/15", chipText: "text-on-surface" },
];

const BIRTHDAY_COLOR = 3; // Blush

const CATEGORY_CFG: Record<LocalCategory, { label: string; badge: string }> = {
  event:   { label: "Event",   badge: "bg-primary/15 text-primary" },
  absence: { label: "Away",    badge: "bg-status-maybe/15 text-on-surface" },
  party:   { label: "Party",   badge: "bg-rose/15 text-rose" },
};

type Filter = "all" | LocalCategory;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, "0"); }

function isoD(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function isPointwise(e: CalendarEntry) { return e.startDate === e.endDate; }

function dtoToLocal(dto: CalendarEntryDTO): CalendarEntry {
  return {
    id: dto.id,
    title: dto.title,
    startDate: dto.startDate,
    endDate: dto.endDate,
    time: dto.time,
    color: dto.color,
    category: dto.category.toLowerCase() as LocalCategory,
    residentId: dto.resident?.id ?? null,
    residentName: dto.resident?.name ?? null,
  };
}

function localToCreateReq(e: Omit<CalendarEntry, "id">) {
  return {
    title: e.title,
    startDate: e.startDate,
    endDate: e.endDate,
    time: e.time,
    color: e.color,
    category: e.category.toUpperCase() as CalendarEntryCategory,
    residentId: e.residentId,
  };
}

/** Synthesize birthday entries for a given year from resident data */
function birthdayEntries(residents: Resident[], year: number): CalendarEntry[] {
  return residents
    .filter(r => r.birthday)
    .map(r => {
      const [, m, d] = r.birthday.split("-");
      const iso = `${year}-${m}-${d}`;
      return {
        id: `birthday-${r.id}-${year}`,
        title: `${r.name}'s Birthday`,
        startDate: iso,
        endDate: iso,
        time: null,
        color: BIRTHDAY_COLOR,
        category: "event" as LocalCategory,
        residentId: r.id,
        residentName: r.name,
        virtual: true,
      };
    });
}

// ─── Calendar math ────────────────────────────────────────────────────────────

function getWeeks(y: number, m: number): (number | null)[][] {
  const dim = new Date(y, m + 1, 0).getDate();
  const off = (new Date(y, m, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(off).fill(null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const out: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
  return out;
}

function weekBars(
  week: (number | null)[],
  entries: CalendarEntry[],
  y: number, m: number,
): BarSegment[] {
  const days = week.filter((d): d is number => d !== null);
  if (!days.length) return [];
  const wStart = isoD(y, m, days[0]);
  const wEnd = isoD(y, m, days[days.length - 1]);

  const raw: Omit<BarSegment, "lane">[] = [];
  for (const e of entries) {
    if (isPointwise(e)) continue;
    if (e.startDate > wEnd || e.endDate < wStart) continue;
    const cs = e.startDate < wStart ? wStart : e.startDate;
    const ce = e.endDate > wEnd ? wEnd : e.endDate;
    const sc = week.indexOf(+cs.split("-")[2]);
    const ec = week.lastIndexOf(+ce.split("-")[2]);
    if (sc < 0 || ec < 0) continue;
    raw.push({
      entry: e, startCol: sc, spanCols: ec - sc + 1,
      isStart: e.startDate >= wStart, isEnd: e.endDate <= wEnd,
    });
  }

  const sorted = [...raw].sort((a, b) => a.startCol - b.startCol || b.spanCols - a.spanCols);
  const ends: number[] = [];
  const laneMap = new Map<string, number>();
  for (const s of sorted) {
    let l = ends.findIndex(e => e < s.startCol);
    if (l < 0) { l = ends.length; ends.push(-1); }
    laneMap.set(s.entry.id, l);
    ends[l] = s.startCol + s.spanCols - 1;
  }
  return raw.map(s => ({ ...s, lane: laneMap.get(s.entry.id) ?? 0 }));
}

function entriesOnDay(entries: CalendarEntry[], dayIso: string): CalendarEntry[] {
  return entries.filter(e => e.startDate <= dayIso && e.endDate >= dayIso);
}

// ─── Date-picking mode ───────────────────────────────────────────────────────

type PickState = { step: "start" } | { step: "end"; start: string };


// ─── MonthCalendar ────────────────────────────────────────────────────────────

function MonthCalendar({
  year, month, entries, selectedDay, onSelectDay,
  highlightedId, pickState, onPickDay,
  startDate, endDate,
}: {
  year: number; month: number; entries: CalendarEntry[];
  selectedDay: string | null; onSelectDay: (d: string | null) => void;
  highlightedId: string | null;
  pickState: PickState | null;
  onPickDay: (dayIso: string) => void;
  startDate: string; endDate: string;
}) {
  const now = new Date();
  const weeks = getWeeks(year, month);
  const mp = `${year}-${pad(month + 1)}`;

  // point-wise lookup
  const singles: Record<string, CalendarEntry[]> = {};
  for (const e of entries)
    if (isPointwise(e) && e.startDate.startsWith(mp))
      (singles[e.startDate] ??= []).push(e);

  const isToday = (d: number) =>
    now.getFullYear() === year && now.getMonth() === month && now.getDate() === d;

  const dimmed = highlightedId !== null;

  return (
    <div className="rounded-3xl bg-surface overflow-hidden ring-1 ring-outline/8 shadow-sm">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-surface-container/60 border-b border-outline-variant/10">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <div key={d} className={`py-3 text-center font-label text-[10px] font-bold uppercase tracking-widest ${
            i >= 5 ? "text-on-surface-variant/40" : "text-on-surface-variant/70"
          }`}>{d}</div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => {
        const bars = weekBars(week, entries, year, month);
        const visibleBars = bars.filter(b => b.lane < MAX_BARS);
        const maxLane = visibleBars.length ? Math.max(...visibleBars.map(b => b.lane)) : -1;
        const barH = (maxLane + 1) * 24;

        return (
          <div key={wi} className="border-t border-outline-variant/12">
            {/* Date row */}
            <div className="grid grid-cols-7">
              {week.map((day, col) => {
                if (day === null) return <div key={col} className={`min-h-[44px] ${col >= 5 ? "bg-surface/60" : ""}`} />;
                const dayIso = isoD(year, month, day);
                const dots = singles[dayIso] ?? [];
                const sel = selectedDay === dayIso;
                const today = isToday(day);

                // picking highlight
                const isPicking = pickState !== null;
                const isPickStart = pickState?.step === "end" && pickState.start === dayIso;
                // Highlight range: either completed range (start+end set) or partial (start set, picking end)
                const inFormRange =
                  (startDate && endDate && startDate <= dayIso && endDate >= dayIso) ||
                  (pickState?.step === "end" && pickState.start <= dayIso && startDate <= dayIso);

                const hiddenBars = bars.filter(b =>
                  b.lane >= MAX_BARS && col >= b.startCol && col < b.startCol + b.spanCols
                ).length;
                const hiddenDots = Math.max(0, dots.length - MAX_DOTS);
                const overflow = hiddenBars + hiddenDots;

                // Weekend bg unless overridden by range/selection highlight
                const weekendBg = col >= 5 && !inFormRange && !sel && !isPickStart ? "bg-surface/60" : "";

                return (
                  <div
                    key={col}
                    onClick={() => {
                      if (isPicking) {
                        onPickDay(dayIso);
                      } else {
                        onSelectDay(sel ? null : dayIso);
                      }
                    }}
                    className={`min-h-[48px] flex flex-col items-center pt-[6px] cursor-pointer transition-colors ${
                      weekendBg
                    } ${sel && !today ? "bg-primary/5" : ""} ${
                      inFormRange ? "bg-primary/10" : ""
                    } ${isPickStart ? "bg-primary/15" : ""} ${
                      isPicking ? "hover:bg-primary/8" : ""
                    }`}
                  >
                    <span className={`w-[28px] h-[28px] rounded-full flex items-center justify-center font-body text-[13px] leading-none transition-all ${
                      today
                        ? `bg-primary text-on-primary font-bold ${sel ? "ring-2 ring-primary ring-offset-1" : ""}`
                        : sel
                        ? "ring-2 ring-primary text-primary font-bold"
                        : isPickStart
                        ? "bg-primary/20 text-primary font-bold"
                        : "text-on-surface font-medium"
                    }`}>
                      {day}
                    </span>
                    {/* Point-wise chips */}
                    {dots.length > 0 && (
                      <div className="flex gap-[2px] mt-[2px] flex-wrap justify-center max-w-full px-[2px]">
                        {dots.slice(0, MAX_DOTS).map(ev => {
                          const c = COLORS[ev.color];
                          const isHL = highlightedId === ev.id;
                          const isDimmed = dimmed && !isHL;
                          return (
                            <div
                              key={ev.id}
                              className={`h-[14px] rounded-[3px] px-[3px] flex items-center gap-[2px] max-w-full transition-opacity ${
                                isDimmed ? "opacity-20" : isHL ? "opacity-100" : ""
                              } ${isHL ? c.bgDeep : c.chipBg}`}
                            >
                              {ev.virtual && <Cake size={8} className={c.chipText} />}
                              <span className={`text-[8px] font-bold leading-none truncate ${c.chipText}`}>
                                {ev.time ? ev.time : ev.title.length > 6 ? ev.title.slice(0, 5) + "…" : ev.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {overflow > 0 && (
                      <span className="text-[9px] font-bold text-primary leading-none mt-[1px]">
                        +{overflow}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Multi-day bars */}
            {barH > 0 && (
              <div className="relative mb-1.5" style={{ height: barH }}>
                {visibleBars.map(bar => {
                  const c = COLORS[bar.entry.color];
                  const isHL = highlightedId === bar.entry.id;
                  const isDimmed = dimmed && !isHL;
                  const rnd =
                    bar.isStart && bar.isEnd ? "rounded-[6px]" :
                    bar.isStart ? "rounded-l-[6px]" :
                    bar.isEnd ? "rounded-r-[6px]" : "";
                  return (
                    <div
                      key={`${bar.entry.id}-${wi}`}
                      className={`absolute h-[20px] flex items-center overflow-hidden ${rnd} transition-opacity ${
                        isDimmed ? "opacity-20" : ""
                      } ${isHL ? c.bgDeep : c.bg}`}
                      style={{
                        top: bar.lane * 24,
                        left: `calc(${(bar.startCol / 7) * 100}% + 3px)`,
                        width: `calc(${(bar.spanCols / 7) * 100}% - 6px)`,
                      }}
                    >
                      {bar.isStart && (
                        <span className={`text-[10px] font-semibold leading-none truncate px-[7px] ${c.text}`}>
                          {bar.entry.title}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Pick hint */}
      {pickState && (
        <div className="px-4 py-2 bg-primary/5 text-center">
          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-primary font-bold">
            {pickState.step === "start" ? "Tap a day to set start date" : "Tap a day to set end date"}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── DayDetail panel ──────────────────────────────────────────────────────────

function DayDetail({
  dayIso, entries, onClose, onHighlight, highlightedId,
}: {
  dayIso: string; entries: CalendarEntry[]; onClose: () => void;
  onHighlight: (id: string | null) => void; highlightedId: string | null;
}) {
  const items = entriesOnDay(entries, dayIso);

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-outline/10 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="font-headline text-base font-semibold">{formatDate(dayIso)}</p>
        <button onClick={onClose} className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
          <X size={14} />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="font-body text-sm text-on-surface-variant opacity-40">Nothing on this day.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(e => {
            const cat = CATEGORY_CFG[e.category];
            const pw = isPointwise(e);
            const isHL = highlightedId === e.id;
            return (
              <div
                key={e.id}
                onClick={() => onHighlight(isHL ? null : e.id)}
                className={`flex items-center gap-2.5 cursor-pointer rounded-xl px-2 py-1.5 transition-all ${
                  isHL ? "bg-primary/8 ring-1 ring-primary/20" : "hover:bg-surface-container"
                }`}
              >
                <div className={`w-2.5 h-2.5 shrink-0 rounded-sm ${COLORS[e.color].dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold truncate">
                    {e.virtual && <Cake size={12} className="inline mr-1 -mt-0.5" />}
                    {e.title}
                  </p>
                  <p className="font-body text-[11px] text-on-surface-variant">
                    {pw
                      ? (e.time ? e.time : "All day")
                      : `${formatDate(e.startDate)} → ${formatDate(e.endDate)}`}
                  </p>
                </div>
                <span className={`px-1.5 py-0.5 rounded font-label text-[9px] font-bold uppercase shrink-0 ${cat.badge}`}>
                  {cat.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AddEntryPanel ────────────────────────────────────────────────────────────

const inputCls =
  "w-full min-w-0 bg-white rounded-xl px-3 py-2.5 font-body text-sm text-on-surface border border-outline/20 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all appearance-none placeholder:text-on-surface-variant/40";

/** ISO "YYYY-MM-DD" → "DD.MM.YYYY" */
function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** "DD.MM.YYYY" → ISO "YYYY-MM-DD" or null */
function displayToIso(display: string): string | null {
  const match = display.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(+y, +m - 1, +d);
  if (date.getFullYear() !== +y || date.getMonth() !== +m - 1 || date.getDate() !== +d) return null;
  return `${y}-${m}-${d}`;
}

function AddEntryPanel({
  onAdd, startDate, endDate, setStartDate, setEndDate,
  pickState, setPickState, residents,
}: {
  onAdd: (e: Omit<CalendarEntry, "id">) => void;
  startDate: string; endDate: string;
  setStartDate: (v: string) => void; setEndDate: (v: string) => void;
  pickState: PickState | null; setPickState: (p: PickState | null) => void;
  residents: Resident[];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [color, setColor] = useState(0);
  const [category, setCategory] = useState<LocalCategory>("event");
  const [residentId, setResidentId] = useState<string>("");

  const pw = startDate && endDate && startDate === endDate;

  function handleAdd() {
    if (!title.trim() || !startDate || !endDate) return;
    const linkedResident = category === "absence" ? residents.find(r => r.id === residentId) : null;
    onAdd({
      title: title.trim(),
      startDate, endDate,
      time: pw && time ? time : null,
      color, category,
      residentId: linkedResident?.id ?? null,
      residentName: linkedResident?.name ?? null,
    });
    setTitle(""); setStartDate(""); setEndDate(""); setTime(""); setColor(0); setCategory("event"); setResidentId(""); setOpen(false);
    setPickState(null);
  }

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (!next) {
      setPickState(null);
      setStartDate(""); setEndDate("");
    } else {
      setPickState({ step: "start" });
    }
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 font-label text-[10px] uppercase tracking-[0.15em] text-primary font-semibold hover:opacity-70 transition-opacity"
      >
        {open ? <ChevronUp size={12} /> : <Plus size={12} strokeWidth={3} />}
        {open ? "Cancel" : "Add"}
      </button>
      {open && (
        <div className="mt-4 flex flex-col gap-3 overflow-hidden">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title — e.g. Alice away, WG party…"
            className={inputCls}
          />

          {/* Dates — set by tapping calendar grid, or typed manually */}
          <div className="flex gap-2 min-w-0">
            <input
              type="text"
              inputMode="numeric"
              value={isoToDisplay(startDate)}
              onChange={(e) => {
                const iso = displayToIso(e.target.value);
                if (iso) { setStartDate(iso); setPickState(null); }
              }}
              onFocus={() => setPickState({ step: "start" })}
              placeholder="Start DD.MM.YYYY"
              className={`${inputCls} flex-1 min-w-0 ${pickState?.step === "start" ? "border-primary! ring-2 ring-primary/20" : ""}`}
            />
            <input
              type="text"
              inputMode="numeric"
              value={isoToDisplay(endDate)}
              onChange={(e) => {
                const iso = displayToIso(e.target.value);
                if (iso) { setEndDate(iso); setPickState(null); }
              }}
              onFocus={() => startDate ? setPickState({ step: "end", start: startDate }) : undefined}
              placeholder="End DD.MM.YYYY"
              className={`${inputCls} flex-1 min-w-0 ${pickState?.step === "end" ? "border-primary! ring-2 ring-primary/20" : ""}`}
            />
          </div>
          <p className="font-body text-[11px] text-on-surface-variant opacity-50 -mt-1">
            Tap days in the calendar above to pick dates
          </p>

          {/* Time */}
          {pw && (
            <div>
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold mb-1 block">
                Time <span className="normal-case tracking-normal opacity-50">· optional</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          {/* Category */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold shrink-0">
              Type
            </span>
            <div className="flex gap-1.5">
              {(Object.entries(CATEGORY_CFG) as [LocalCategory, typeof CATEGORY_CFG[LocalCategory]][]).map(([val, cfg]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCategory(val)}
                  className={`px-3 py-1.5 rounded-full font-label text-[10px] font-bold uppercase tracking-wider transition-all ${
                    category === val
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resident picker — only for absences */}
          {category === "absence" && (
            <div className="flex items-center gap-2">
              <span className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold shrink-0">
                Who
              </span>
              <div className="flex-1 relative">
                <select
                  value={residentId}
                  onChange={e => setResidentId(e.target.value)}
                  className={`${inputCls} pr-8`}
                >
                  <option value="">— Select resident —</option>
                  {residents.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          )}

          {/* Color picker */}
          <div className="flex items-center gap-3">
            <span className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold shrink-0">
              Color
            </span>
            <div className="flex gap-2">
              {COLORS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setColor(i)}
                  className={`w-7 h-7 rounded-full ${c.dot} transition-all ${
                    color === i
                      ? "ring-2 ring-offset-2 ring-on-surface/25 scale-110"
                      : "opacity-40 hover:opacity-70"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!title.trim() || !startDate || !endDate}
            className="w-full py-3 bg-primary text-on-primary rounded-full font-label text-xs font-bold tracking-widest disabled:opacity-40 transition-all active:scale-[0.98]"
          >
            ADD
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WgCalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Date picking state for the form
  const [pickState, setPickState] = useState<PickState | null>(null);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  // Load from API
  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getCalendarEntries(), getResidents()])
      .then(([dtos, res]) => {
        setEntries(dtos.map(dtoToLocal));
        setResidents(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Clear selection on month change
  useEffect(() => { setSelectedDay(null); setHighlightedId(null); }, [year, month]);

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  }

  // Merge DB entries + birthday virtual entries
  const birthdays = birthdayEntries(residents, year);
  const allEntries = [...entries, ...birthdays];

  // Entries overlapping this month
  const dim = new Date(year, month + 1, 0).getDate();
  const mStart = isoD(year, month, 1);
  const mEnd = isoD(year, month, dim);
  const thisMonth = allEntries
    .filter(e => e.startDate <= mEnd && e.endDate >= mStart)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const filtered = filter === "all" ? thisMonth : thisMonth.filter(e => e.category === filter);

  async function handleAdd(data: Omit<CalendarEntry, "id">) {
    try {
      const id = await createCalendarEntry(localToCreateReq(data));
      setEntries(p => [...p, { ...data, id }]);
    } catch {}
  }

  async function handleDelete(id: string) {
    try {
      await deleteCalendarEntry(id);
      setEntries(p => p.filter(e => e.id !== id));
      if (highlightedId === id) setHighlightedId(null);
    } catch {}
  }

  function handlePickDay(dayIso: string) {
    if (!pickState) return;
    if (pickState.step === "start") {
      setFormStartDate(dayIso);
      setFormEndDate("");
      setPickState({ step: "end", start: dayIso });
    } else {
      const end = dayIso >= pickState.start ? dayIso : pickState.start;
      const start = dayIso >= pickState.start ? pickState.start : dayIso;
      setFormStartDate(start);
      setFormEndDate(end);
      setPickState(null);
    }
  }

  function handleHighlight(id: string | null) {
    setHighlightedId(id);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header + month nav */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-headline text-3xl font-bold italic tracking-tight leading-none shrink-0">Calendar</h2>
        <div className="flex items-center gap-1.5">
          <button onClick={prev} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="font-headline italic text-base font-bold w-[118px] text-center leading-none">
            {MONTHS[month]} {year}
          </span>
          <button onClick={next} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <p className="font-body text-sm text-on-surface-variant opacity-40 text-center py-8">Loading…</p>
      ) : (
        <MonthCalendar
          year={year} month={month} entries={allEntries}
          selectedDay={selectedDay} onSelectDay={setSelectedDay}
          highlightedId={highlightedId}
          pickState={pickState} onPickDay={handlePickDay}
          startDate={formStartDate} endDate={formEndDate}
        />
      )}

      {/* Day detail panel */}
      {selectedDay && (
        <DayDetail
          dayIso={selectedDay}
          entries={allEntries}
          onClose={() => { setSelectedDay(null); setHighlightedId(null); }}
          onHighlight={handleHighlight}
          highlightedId={highlightedId}
        />
      )}

      {/* This month */}
      <div className="rounded-3xl bg-white p-6 ring-1 ring-outline/8 shadow-sm flex flex-col gap-4">
        <p className="text-center font-label text-xs uppercase tracking-[0.15em] bg-blacktext-on-surface-variant/60 font-semibold">
          ── ✦ This month ✦ ──
        </p>

        {/* Filter pills */}
        <div className="flex gap-1.5 justify-center flex-wrap">
          {(["all", "absence", "party", "event"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full font-label text-[10px] font-bold uppercase tracking-wider transition-all ${
                filter === f
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:text-primary"
              }`}
            >
              {f === "all" ? "All" : CATEGORY_CFG[f].label}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="flex flex-col">
            {filtered.map(e => {
              const cat = CATEGORY_CFG[e.category];
              const pw = isPointwise(e);
              const isHL = highlightedId === e.id;
              return (
                <div
                  key={e.id}
                  onClick={() => handleHighlight(isHL ? null : e.id)}
                  className={`flex items-center gap-3 py-3 border-b border-outline-variant/10 last:border-b-0 cursor-pointer rounded-xl px-2 transition-all ${
                    isHL ? "bg-primary/8 ring-1 ring-primary/20" : "hover:bg-surface-container/50"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-sm shrink-0 ${COLORS[e.color].dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-on-surface truncate">
                      {e.virtual && <Cake size={12} className="inline mr-1 -mt-0.5" />}
                      {e.title}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant">
                      {formatDate(e.startDate)}
                      {!pw && <span className="opacity-60"> → {formatDate(e.endDate)}</span>}
                      {pw && e.time && <span className="opacity-60"> · {e.time}</span>}
                    </p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded font-label text-[9px] font-bold uppercase shrink-0 ${cat.badge}`}>
                    {cat.label}
                  </span>
                  {!e.virtual && (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}
                      className="shrink-0 text-on-surface-variant/25 hover:text-status-no transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="font-body text-sm text-on-surface-variant opacity-40 text-center py-2">
            {filter === "all" ? "Nothing planned yet." : "No matching entries."}
          </p>
        )}

        <AddEntryPanel
          onAdd={handleAdd}
          startDate={formStartDate} endDate={formEndDate}
          setStartDate={setFormStartDate} setEndDate={setFormEndDate}
          pickState={pickState} setPickState={setPickState}
          residents={residents}
        />
      </div>
    </div>
  );
}
