import { useState } from "react"
import { CalendarBlank } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value: string // "YYYY-MM-DDTHH:mm" (datetime-local format)
  onChange: (value: string) => void
  className?: string
}

function formatDisplay(value: string): string {
  if (!value) return ""
  const [datePart, timePart] = value.split("T")
  if (!datePart) return ""
  const date = new Date(datePart + "T00:00:00")
  const dateStr = date.toLocaleDateString("en-CH", { day: "numeric", month: "short", year: "numeric" })
  return timePart ? `${dateStr} · ${timePart}` : dateStr
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const [open, setOpen] = useState(false)

  const datePart = value?.split("T")[0] ?? ""
  const timePart = value?.split("T")[1] ?? ""
  const selectedDate = datePart ? new Date(datePart + "T00:00:00") : undefined

  function handleDaySelect(day: Date | undefined) {
    if (!day) return
    const d = day.toISOString().split("T")[0]
    onChange(d + "T" + (timePart || "00:00"))
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = datePart || new Date().toISOString().split("T")[0]
    onChange(d + "T" + e.target.value)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarBlank className="size-4 shrink-0" />
          {value ? formatDisplay(value) : "Pick date & time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDaySelect}
          initialFocus
        />
        <div className="border-t border-border px-3 py-2.5 flex flex-col gap-1.5">
          <FieldLabel className="text-xs">Time</FieldLabel>
          <Input
            type="time"
            value={timePart}
            onChange={handleTimeChange}
            className="h-8 text-sm"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
