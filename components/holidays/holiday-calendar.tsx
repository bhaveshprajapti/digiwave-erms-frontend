"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { useHolidays } from "@/hooks/use-holidays"
import { Holiday } from "@/lib/schemas"
import { ChevronLeft, ChevronRight, Trash2, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { DataTable } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Swal from 'sweetalert2'

export function HolidayCalendar() {
  const { holidays, isLoading, addHoliday, updateHoliday, deleteHoliday } = useHolidays()
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Holiday | null>(null)
  const [viewOnly, setViewOnly] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{ date: Date | undefined; title: string }>({ date: undefined, title: "" })

  // Utility functions to handle dates without timezone issues
  const formatDateToString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const parseDateFromString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const formatDateDDMMYYYY = (dateStr: string): string => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    const [yyyy, mm, dd] = parts
    return `${dd}/${mm}/${yyyy}`
  }

  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}`
  const byDate = useMemo(() => {
    const map: Record<string, Holiday> = {}
    holidays.forEach(h => { map[h.date] = h })
    return map
  }, [holidays])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate)

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))

const openCreate = (date?: Date) => {
    setEditing(null)
    setViewOnly(false)
    setForm({ date: date ?? new Date(), title: "" })
    setIsModalOpen(true)
  }

const openEdit = (h: Holiday, readOnly=false) => {
    setEditing(h)
    setViewOnly(readOnly)
    // Fix timezone issue when parsing date from string
    setForm({ date: parseDateFromString(h.date), title: h.title })
    setIsModalOpen(true)
  }

  const save = async () => {
    try {
      setSaving(true)
      
      // Validation
      if (!form.date) {
        toast({ title: 'Validation Error', description: 'Please select a date', variant: 'destructive' });
        return
      }
      
      if (!form.title.trim()) {
        toast({ title: 'Validation Error', description: 'Please enter a holiday title', variant: 'destructive' });
        return
      }
      
      const dateStr = formatDateToString(form.date)
      
      // Check for duplicate dates (only when creating new or changing date)
      const existingHoliday = holidays.find(h => h.date === dateStr)
      if (existingHoliday && (!editing || existingHoliday.id !== editing.id)) {
        toast({ 
          title: 'Duplicate Date', 
          description: `A holiday already exists on ${formatDateDDMMYYYY(dateStr)}: "${existingHoliday.title}"`, 
          variant: 'destructive' 
        });
        return
      }
      
      if (editing) {
        await updateHoliday({ id: editing.id, data: { date: dateStr, title: form.title.trim() } })
        toast({ title: 'Success', description: 'Holiday updated successfully', variant: 'success' })
      } else {
        await addHoliday({ date: dateStr, title: form.title.trim() })
        toast({ title: 'Success', description: 'Holiday created successfully', variant: 'success' })
      }
      setIsModalOpen(false)
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Operation failed', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

const confirmAndDelete = async (id: number, label?: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: label ? `Delete holiday "${label}"? This action cannot be undone!` : 'Delete this holiday? This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })
    if (!result.isConfirmed) return false
    try {
      await deleteHoliday(id)
      Swal.fire('Deleted!', 'The holiday has been deleted successfully.', 'success')
      toast({ title: 'Success', description: 'Holiday deleted successfully', variant: 'success' })
      return true
    } catch (e:any) {
      Swal.fire('Error!', 'Failed to delete the holiday. Please try again.', 'error')
      toast({ title: 'Error', description: e?.message || 'Delete failed', variant: 'destructive' })
      return false
    }
  }

const renderModal = () => (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? (viewOnly ? 'Holiday Details' : 'Edit Holiday') : 'Add Holiday'}</DialogTitle>
          <DialogDescription>Manage a public holiday entry</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Date</Label>
            <div className="col-span-3">
<DatePicker value={form.date} onChange={(d)=>setForm(f=>({ ...f, date: d }))} disabled={viewOnly} displayFormat="DD/MM/YYYY" />
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Title</Label>
            <div className="col-span-3">
              <Input value={form.title} onChange={(e)=>setForm(f=>({ ...f, title: e.target.value }))} placeholder="Holiday name" disabled={viewOnly} />
            </div>
          </div>
        </div>
        <DialogFooter>
          {editing && viewOnly && (
            <Button variant="outline" onClick={()=>setViewOnly(false)} title="Edit this holiday">
              Edit
            </Button>
          )}
          {editing && !viewOnly && (
            <Button
              variant="outline"
              onClick={async ()=>{
                if (!editing) return
                const ok = await confirmAndDelete(editing.id, editing.title)
                if (ok) setIsModalOpen(false)
              }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={()=>setIsModalOpen(false)}>Cancel</Button>
          {!viewOnly && (
            <Button onClick={save} disabled={saving}>{editing ? 'Save Changes' : 'Add'}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <Card>
<CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Public Holidays</CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={()=>openCreate()}>
              <Plus className="h-4 w-4 mr-2" /> Add Holiday
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm font-medium">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(<div key={d}>{d}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (<div key={`e-${i}`} />))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i+1
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const holiday = byDate[dateStr]
                return (
                  <button
                    type="button"
                    key={day}
                    className={`relative flex h-10 items-center justify-center rounded-lg border text-xs font-medium hover:bg-muted ${holiday ? 'bg-green-100 border-green-300' : ''}`}
                    onClick={() => holiday ? openEdit(holiday, true) : undefined}
                  >
                    <span className="absolute top-1 left-1 text-[10px] text-muted-foreground">{day}</span>
                    {holiday && (
                      <span className="text-[10px] font-medium text-green-800 text-center px-2 truncate max-w-[90%]">{holiday.title}</span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="text-xs text-muted-foreground">Click a highlighted date to view holiday; use Add Holiday to create new.</div>
          </div>
          <div>
<DataTable<Holiday>
              columns={[
                { key: 'date', header: 'Date', sortable: true, sortAccessor: (h:Holiday)=> new Date(h.date).getTime(), cell: (h:Holiday)=> formatDateDDMMYYYY(h.date) },
                { key: 'title', header: 'Title' },
{ key: 'actions', header: <span className="block text-center">Actions</span>, cell: (h:Holiday) => (
                  <div className="flex items-center justify-center">
                    <ActionButtons
                      onEdit={() => openEdit(h)}
                      onDelete={async () => {
                        const ok = await confirmAndDelete(h.id, h.title)
                        if (ok && isModalOpen) setIsModalOpen(false)
                      }}
                    />
                  </div>
                )}
              ]}
              data={[...holidays].sort((a,b)=> a.date.localeCompare(b.date))}
              getRowKey={(h)=>h.id}
              striped
              pageSize={10}
            />
          </div>
        </div>
      </CardContent>
      {renderModal()}
    </Card>
  )
}
