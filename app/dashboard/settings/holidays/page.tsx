import { HolidayCalendar } from "@/components/holidays/holiday-calendar"

export default function PublicHolidaysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Public Holidays</h2>
        <p className="text-muted-foreground">Manage company-wide holidays on a calendar</p>
      </div>
      <HolidayCalendar />
    </div>
  )
}
