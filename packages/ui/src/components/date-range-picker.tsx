"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { isValid } from "date-fns"
import type { DateRange } from "react-day-picker"

import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

interface DatePickerWithRangeProps {
  className?: string
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({ className, date, onDateChange }: DatePickerWithRangeProps) {
  const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(date)

  React.useEffect(() => {
    setSelectedDate(date)
  }, [date?.from?.getTime(), date?.to?.getTime()])

  const hasRange = Boolean(
    selectedDate?.from && isValid(selectedDate.from)
  )

  const handleDateChange = (newDate: DateRange | undefined) => {
    setSelectedDate(newDate)
    onDateChange?.(newDate)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("justify-start text-left font-normal", !hasRange && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {hasRange ? (
              selectedDate?.to && isValid(selectedDate.to) ? (
                <>
                  {selectedDate.from!.toLocaleDateString()} - {selectedDate.to.toLocaleDateString()}
                </>
              ) : (
                selectedDate!.from!.toLocaleDateString()
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={hasRange ? selectedDate?.from : undefined}
            selected={hasRange ? selectedDate : undefined}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * TEMP ALIAS — The design system already provides `DatePickerWithRange`.
 * Re-export it as `DateRangePicker` so existing imports keep working.
 *
 *   import { DateRangePicker } from "./ui/date-range-picker";
 */
export { DatePickerWithRange as DateRangePicker }
