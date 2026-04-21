import { useEffect, useState } from "react";
import { Cake } from "lucide-react";
import { getUpcomingBirthdays, formatDateShort, type UpcomingBirthday } from "@/lib/api";

const MOCK: UpcomingBirthday[] = [
  { id: "1", name: "Alice", roomNumber: "301", birthday: "2000-05-12", daysUntil: 13 },
  { id: "2", name: "Ben", roomNumber: "302", birthday: "1998-07-04", daysUntil: 56 },
  { id: "3", name: "Cara", roomNumber: "303", birthday: "1999-09-22", daysUntil: 79 },
];

export default function BirthdaysCard() {
  const [entries, setEntries] = useState<UpcomingBirthday[]>(MOCK);

  useEffect(() => {
    getUpcomingBirthdays()
      .then((data) => setEntries(data.slice(0, 3)))
      .catch(() => {}); // keep mock on error
  }, []);

  return (
    <div className="rounded-3xl bg-gradient-to-tr from-tertiary-fixed to-surface-container-high p-5 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-outline/15">
      <h3 className="font-headline text-2xl font-semibold text-on-surface mb-4">
        Birthdays
      </h3>

      <div className="space-y-3">
        {entries.map((person, i) => {
          const opacity =
            i === 0 ? "" : i === 1 ? "opacity-80" : "opacity-60";

          return (
            <div key={person.id} className={`flex items-center gap-3 ${opacity}`}>
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                {i === 0 ? (
                  <Cake size={18} className="text-tertiary" />
                ) : (
                  <span className="font-body text-xs font-bold text-on-surface-variant">
                    {person.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-bold truncate">{person.name}</p>
                <p className="font-body text-[10px] opacity-60">
                  Room {person.roomNumber} · {formatDateShort(person.birthday)}
                </p>
              </div>
              <div className="bg-white/70 px-2 py-1 rounded font-label text-[10px] font-bold shrink-0">
                IN {person.daysUntil}D
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
