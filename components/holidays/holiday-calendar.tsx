"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { useHolidays } from "@/hooks/use-holidays"
import { Holiday } from "@/lib/schemas"
import { ChevronLeft, ChevronRight, Trash2, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { DataTable } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function HolidayCalendar() {
  const { holidays, isLoading, addHoliday, updateHoliday, deleteHoliday } = useHolidays()
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Holiday | null>(null)
  const [viewOnly, setViewOnly] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{ date: Date | undefined; title: string; description: string }>({ date: undefined, title: "", description: "" })

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
    setForm({ date: date ?? new Date(), title: "", description: "" })
    setIsModalOpen(true)
  }

  const openEdit = (h: Holiday, readOnly=false) => {
    setEditing(h)
    setViewOnly(readOnly)
    setForm({ date: new Date(h.date), title: h.title, description: h.description || "" })
    setIsModalOpen(true)
  }

  const save = async () => {
    try {
      setSaving(true)
      const dateStr = form.date ? form.date.toISOString().split('T')[0] : ""
      if (!dateStr || !form.title.trim()) {
        toast({ title: 'Validation', description: 'Please enter date and title', variant: 'destructive' });
        return
      }
      if (editing) {
        await updateHoliday(editing.id, { date: dateStr, title: form.title.trim(), description: form.description.trim() })
        toast({ title: 'Updated', description: 'Holiday updated' })
      } else {
        await addHoliday({ date: dateStr, title: form.title.trim(), description: form.description.trim() })
        toast({ title: 'Created', description: 'Holiday created' })
      }
      setIsModalOpen(false)
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Operation failed', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!editing) return
    try {
      await deleteHoliday(editing.id)
      toast({ title: 'Deleted', description: 'Holiday removed' })
      setIsModalOpen(false)
    } catch(e:any) {
      toast({ title: 'Error', description: e?.message || 'Delete failed', variant: 'destructive' })
    }
  }

  const renderModal = () => (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? (viewOnly ? 'Holiday Details' : 'Edit Holiday') : 'Add Holiday'}</DialogTitle>
          <DialogDescription>Manage a public holiday entry</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Date</Label>
            <DatePicker value={form.date} onChange={(d)=>setForm(f=>({ ...f, date: d }))} inputClassName="h-9" disabled={viewOnly} />
          </div>
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e)=>setForm(f=>({ ...f, title: e.target.value }))} placeholder="Holiday name" disabled={viewOnly} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e)=>setForm(f=>({ ...f, description: e.target.value }))} placeholder="Optional details" disabled={viewOnly} />
          </div>
        </div>
        <DialogFooter>
          {editing && !viewOnly && (
            <Button variant="outline" onClick={remove} className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={()=>setIsModalOpen(false)}>Close</Button>
          {!viewOnly && (
            <Button onClick={save} disabled={saving}>{editing ? 'Save' : 'Create'}</Button>
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
            <Button variant="outline" size="icon" onClick={previousMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(<div key={d}>{d}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDay }).map((_, i) => (<div key={`e-${i}`} />))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i+1
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const holiday = byDate[dateStr]
                return (
                  <button
                    type="button"
                    key={day}
                    className={`relative flex h-12 items-center justify-center rounded-lg border text-sm font-medium hover:bg-muted ${holiday ? 'bg-green-50 border-green-200' : ''}`}
                    onClick={() => holiday ? openEdit(holiday, true) : undefined}
                  >
                    <span className="absolute top-1 left-1 text-xs text-muted-foreground">{day}</span>
                    {holiday && (
                      <span className="text-xs font-medium text-green-700 text-center px-2 truncate max-w-[90%]">{holiday.title}</span>
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
                { key: 'date', header: 'Date', sortable: true, sortAccessor: (h:Holiday)=> new Date(h.date).getTime(), cell: (h:Holiday)=> new Date(h.date).toLocaleDateString() },
                { key: 'title', header: 'Title' },
                { key: 'description', header: 'Description', cell: (h:Holiday)=> (h.description || '').slice(0,60) },
                { key: 'actions', header: <span className="block text-center">Actions</span>, cell: (h:Holiday) => (
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={()=>openEdit(h)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={async()=>{ await deleteHoliday(h.id) }}>
                      Delete
                    </Button>
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
