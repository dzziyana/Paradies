import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

// ─── Conversion helpers ─────────────────────────────────────────────────────────

/** ISO "YYYY-MM-DD" → display "DD.MM.YYYY" */
function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** Display "DD.MM.YYYY" → ISO "YYYY-MM-DD", or null if invalid */
function displayToIso(display: string): string | null {
  const match = display.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(+y, +m - 1, +d);
  if (date.getFullYear() !== +y || date.getMonth() !== +m - 1 || date.getDate() !== +d)
    return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Mini Calendar ──────────────────────────────────────────────────────────────

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function MiniCalendar({
  selectedIso,
  onSelect,
}: {
  selectedIso: string;
  onSelect: (iso: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = toIso(today);

  // If a date is already selected, open the calendar to that month
  const initial = selectedIso
    ? new Date(+selectedIso.slice(0, 4), +selectedIso.slice(5, 7) - 1, 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  function prev() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function next() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-full">
      {/* Month/year header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={prev}
          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="font-label text-xs font-bold uppercase tracking-wider text-on-surface">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </p>
        <button
          type="button"
          onClick={next}
          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-center font-label text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/50 py-1"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = iso === selectedIso;
          const isToday = iso === todayIso;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(iso)}
              className={`
                mx-auto w-9 h-9 rounded-full flex items-center justify-center
                font-body text-sm transition-all
                ${isSelected
                  ? "bg-primary text-on-primary font-bold"
                  : isToday
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-on-surface hover:bg-primary/8 active:scale-95"
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── DateInput ──────────────────────────────────────────────────────────────────

interface DateInputProps {
  value: string; // ISO "YYYY-MM-DD" or ""
  onChange: (iso: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function DateInput({
  value,
  onChange,
  placeholder = "DD.MM.YYYY",
  required,
  className,
}: DateInputProps) {
  const [display, setDisplay] = useState(isoToDisplay(value));
  const [invalid, setInvalid] = useState(false);
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync display when value changes externally
  useEffect(() => {
    setDisplay(isoToDisplay(value));
    setInvalid(false);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setDisplay(raw);
    setInvalid(false);
    if (raw === "") {
      onChange("");
    } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) {
      const iso = displayToIso(raw);
      if (iso) {
        onChange(iso);
        setInvalid(false);
      } else {
        setInvalid(true);
      }
    }
  }

  function handleBlur() {
    if (display === "") {
      onChange("");
      setInvalid(false);
      return;
    }
    const iso = displayToIso(display);
    if (iso) {
      setDisplay(isoToDisplay(iso));
      onChange(iso);
      setInvalid(false);
    } else {
      setInvalid(true);
    }
  }

  function openCalendar() {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      // Calendar is ~300px tall; bottom nav is ~90px; flip upward if not enough space
      setOpenUpward(window.innerHeight - rect.bottom < 340);
    }
    setOpen(true);
  }

  function handleCalendarSelect(iso: string) {
    onChange(iso);
    setDisplay(isoToDisplay(iso));
    setInvalid(false);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => openCalendar()}
          placeholder={placeholder}
          required={required}
          className={`${className ?? ""} ${invalid ? "outline-status-no!" : ""} pr-10`}
        />
        <button
          type="button"
          onClick={() => { if (open) setOpen(false); else openCalendar(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors"
        >
          <Calendar size={16} />
        </button>
      </div>

      {open && (
        <div className={`absolute z-50 left-0 min-w-[280px] bg-white rounded-2xl shadow-lg border border-outline/10 p-4 animate-in fade-in duration-150 ${openUpward ? "bottom-full mb-2 slide-in-from-bottom-1" : "top-full mt-2 slide-in-from-top-1"}`}>
          <MiniCalendar selectedIso={value} onSelect={handleCalendarSelect} />
        </div>
      )}
    </div>
  );
}
