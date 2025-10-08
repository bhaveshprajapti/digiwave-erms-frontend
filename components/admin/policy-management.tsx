"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTable } from "@/components/common/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { ActionButtons } from "@/components/common/action-buttons"
import { toast } from "@/components/ui/use-toast"
import Swal from 'sweetalert2'
import { LeavePolicy, LeaveType } from "@/lib/schemas"
import { getLeaveTypes, createLeaveType, deleteLeaveType, updateLeaveType } from "@/lib/api/leave-types"
import { getLeavePolicies, createLeavePolicy, updateLeavePolicy, deleteLeavePolicy } from "@/lib/api/leave-policies"

export function PolicyManagement() {
  const [viewOpen, setViewOpen] = useState(false)
  const [ltErrors, setLtErrors] = useState<Record<string, string>>({})
  const [lpErrors, setLpErrors] = useState<Record<string, string>>({})
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [policies, setPolicies] = useState<LeavePolicy[]>([])
  const [loading, setLoading] = useState(false)

  // Create Leave Type form state
  const [ltName, setLtName] = useState("")
  const [ltCode, setLtCode] = useState("")
const [ltIsPaid, setLtIsPaid] = useState(true)
  const [ltActive, setLtActive] = useState(true)
  const [ltOpen, setLtOpen] = useState(false)
  const [ltEditOpen, setLtEditOpen] = useState(false)
  const [editingType, setEditingType] = useState<LeaveType | null>(null)

  // Create Leave Policy state
  const [lpOpen, setLpOpen] = useState(false)
  const [lpEditOpen, setLpEditOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null)
  const [lpName, setLpName] = useState("")
  const [lpAnnual, setLpAnnual] = useState<number>(0)
  const [lpMonthly, setLpMonthly] = useState<string>("0")
  const [lpCarryLimit, setLpCarryLimit] = useState<number>(0)
  const [lpNoticeDays, setLpNoticeDays] = useState<number>(0)
  const [lpMaxConsec, setLpMaxConsec] = useState<number>(0)
const [lpActive, setLpActive] = useState<boolean>(true)
  const [lpLeaveTypeIds, setLpLeaveTypeIds] = useState<number[]>([])
  const [lpLeaveTypeValues, setLpLeaveTypeValues] = useState<string[]>([])

  const refresh = async () => {
    setLoading(true)
    try {
      const [types, pols] = await Promise.all([
        getLeaveTypes(),
        getLeavePolicies(),
      ])
      setLeaveTypes(types)
      setPolicies(pols)
    } catch (e: any) {
      console.error(e)
      toast({ description: e?.message || "Failed to load leave policies" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const extractErrors = (err: any): Record<string, string> => {
    const data = err?.response?.data || err
    const out: Record<string, string> = {}
    if (data && typeof data === 'object') {
      Object.keys(data).forEach((k) => {
        const v = (data as any)[k]
        if (Array.isArray(v)) out[k] = String(v[0])
        else if (typeof v === 'string') out[k] = v
      })
    }
    return out
  }

  const onCreateLeaveType = async () => {
    if (!ltName || !ltCode) return
    try {
      const created = await createLeaveType({ name: ltName, code: ltCode, is_paid: ltIsPaid, is_active: true })
      setLeaveTypes((prev) => [created, ...prev])
      setLtErrors({})
      setLtName(""); setLtCode(""); setLtIsPaid(true); setLtActive(true); setLtOpen(false)
      toast({ description: "Leave type created" })
    } catch (e: any) {
      const errs = extractErrors(e)
      setLtErrors(errs)
      const first = errs.detail || errs.code || errs.name || e?.message
      toast({ description: String(first || 'Failed to create leave type'), variant: 'destructive' as any })
    }
  }

  const openEditLeaveType = (t: LeaveType) => {
    setEditingType(t)
    setLtName(t.name)
    setLtCode(t.code)
setLtIsPaid(t.is_paid)
    setLtActive((t as any).is_active ?? true)
    setLtEditOpen(true)
  }

  const onUpdateLeaveType = async () => {
    if (!editingType) return
    try {
      const updated = await updateLeaveType(editingType.id, { name: ltName, code: ltCode, is_paid: ltIsPaid, is_active: ltActive })
      setLeaveTypes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      setLtErrors({})
      setLtEditOpen(false)
      setEditingType(null)
      toast({ description: "Leave type updated" })
    } catch (e: any) {
      const errs = extractErrors(e)
      setLtErrors(errs)
      const first = errs.detail || errs.code || errs.name || e?.message
      toast({ description: String(first || 'Failed to update leave type'), variant: 'destructive' as any })
    }
  }

  const onDeleteLeaveType = async (id: number) => {
    try {
      await deleteLeaveType(id)
      setLeaveTypes((prev) => prev.filter((t) => t.id !== id))
      toast({ description: "Leave type deleted" })
    } catch (e: any) {
      toast({ description: e?.message || "Failed to delete leave type", variant: 'destructive' as any })
    }
  }

  const confirmDeleteLeaveType = async (t: LeaveType) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This will delete "${t.name}" and cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    })
    if (!result.isConfirmed) return

    try {
      await deleteLeaveType(t.id)
      setLeaveTypes((prev) => prev.filter((x) => x.id !== t.id))
      Swal.fire('Deleted!', 'Leave type has been deleted.', 'success')
      toast({ description: 'Leave type deleted' })
    } catch (e: any) {
      const apiMsg = e?.response?.data?.detail || e?.response?.data?.error || 'Failed to delete leave type. It may be used in a policy.'
      Swal.fire('Cannot delete', String(apiMsg), 'error')
      toast({ description: String(apiMsg), variant: 'destructive' as any })
    }
  }

  const onCreateLeavePolicy = async () => {
    if (!lpName) return
    try {
      const created = await createLeavePolicy({
        name: lpName,
        leave_types: lpLeaveTypeIds,
        annual_quota: lpAnnual,
        monthly_accrual: lpMonthly,
        carry_forward_limit: lpCarryLimit,
        notice_days: lpNoticeDays,
        max_consecutive: lpMaxConsec,
        is_active: lpActive,
      })
      setPolicies((prev) => [created, ...prev])
      setLpErrors({})
      setLpName(""); setLpAnnual(0); setLpMonthly("0"); setLpCarryLimit(0); setLpNoticeDays(0); setLpMaxConsec(0); setLpActive(true); setLpLeaveTypeIds([]); setLpLeaveTypeValues([]); setLpOpen(false)
      toast({ description: "Leave policy created" })
    } catch (e: any) {
      const errs = extractErrors(e)
      setLpErrors(errs)
      const first = errs.detail || errs.name || errs.leave_types || e?.message
      toast({ description: String(first || 'Failed to create leave policy'), variant: 'destructive' as any })
    }
  }

  const openEditPolicy = (p: LeavePolicy) => {
    setEditingPolicy(p)
    setLpName(p.name)
    setLpAnnual(p.annual_quota)
    setLpMonthly(p.monthly_accrual)
    setLpCarryLimit(p.carry_forward_limit)
    setLpNoticeDays(p.notice_days)
    setLpMaxConsec(p.max_consecutive)
    setLpActive(p.is_active)
    setLpLeaveTypeIds(p.leave_types)
    setLpLeaveTypeValues(p.leave_types.map(String))
    setLpEditOpen(true)
  }

  const onUpdateLeavePolicy = async () => {
    if (!editingPolicy) return
    try {
      const updated = await updateLeavePolicy(editingPolicy.id, {
        name: lpName,
        leave_types: lpLeaveTypeIds,
        annual_quota: lpAnnual,
        monthly_accrual: lpMonthly,
        carry_forward_limit: lpCarryLimit,
        notice_days: lpNoticeDays,
        max_consecutive: lpMaxConsec,
        is_active: lpActive,
      })
      setPolicies((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      setLpErrors({})
      setLpEditOpen(false)
      setEditingPolicy(null)
      toast({ description: "Leave policy updated" })
    } catch (e: any) {
      const errs = extractErrors(e)
      setLpErrors(errs)
      const first = errs.detail || errs.name || errs.leave_types || e?.message
      toast({ description: String(first || 'Failed to update leave policy'), variant: 'destructive' as any })
    }
  }

  const onDeleteLeavePolicy = async (id: number) => {
    try {
      await deleteLeavePolicy(id)
      setPolicies((prev) => prev.filter((p) => p.id !== id))
      toast({ description: "Leave policy deleted" })
    } catch (e: any) {
      toast({ description: e?.message || "Failed to delete leave policy", variant: 'destructive' as any })
    }
  }

  const confirmDeleteLeavePolicy = async (p: LeavePolicy) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This will delete policy "${p.name}" and cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    })
    if (!result.isConfirmed) return

    try {
      await deleteLeavePolicy(p.id)
      setPolicies((prev) => prev.filter((x) => x.id !== p.id))
      Swal.fire('Deleted!', 'Leave policy has been deleted.', 'success')
      toast({ description: 'Leave policy deleted' })
    } catch (e) {
      Swal.fire('Error!', 'Failed to delete leave policy. Please try again.', 'error')
      toast({ description: 'Failed to delete leave policy', variant: 'destructive' as any })
    }
  }

  const selectedMap = useMemo(() => new Set(lpLeaveTypeIds), [lpLeaveTypeIds])
  const leaveTypeMap = useMemo(() => {
    const m = new Map<number, LeaveType>()
    for (const t of leaveTypes) m.set(t.id as number, t)
    return m
  }, [leaveTypes])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Leave Types</CardTitle>
            <Dialog open={ltOpen} onOpenChange={setLtOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Leave Type</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="leave-name">Leave Name</Label>
<Input id="leave-name" placeholder="e.g., Annual Leave" value={ltName} onChange={(e) => { setLtName(e.target.value); if (ltErrors.name) setLtErrors({ ...ltErrors, name: '' }) }} />
                      {ltErrors.name && <p className="text-sm text-red-500">{ltErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leave-code">Code</Label>
<Input id="leave-code" placeholder="e.g., AL" maxLength={20} value={ltCode} onChange={(e) => { setLtCode(e.target.value); if (ltErrors.code) setLtErrors({ ...ltErrors, code: '' }) }} />
                      {ltErrors.code && <p className="text-sm text-red-500">{ltErrors.code}</p>}
                    </div>
                  </div>
<div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox id="is-paid" checked={ltIsPaid} onCheckedChange={(v) => setLtIsPaid(!!v)} />
                      <Label htmlFor="is-paid">Paid leave</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="lt-active">Active</Label>
                      <Switch id="lt-active" checked={ltActive} onCheckedChange={(v) => setLtActive(!!v)} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setLtOpen(false)}>Cancel</Button>
                    <Button onClick={onCreateLeaveType} disabled={!ltName || !ltCode}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Leave Type Dialog */}
            <Dialog open={ltEditOpen} onOpenChange={setLtEditOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Leave Type</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-leave-name">Leave Name</Label>
<Input id="edit-leave-name" placeholder="e.g., Annual Leave" value={ltName} onChange={(e) => { setLtName(e.target.value); if (ltErrors.name) setLtErrors({ ...ltErrors, name: '' }) }} />
                      {ltErrors.name && <p className="text-sm text-red-500">{ltErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-leave-code">Code</Label>
<Input id="edit-leave-code" placeholder="e.g., AL" maxLength={20} value={ltCode} onChange={(e) => { setLtCode(e.target.value); if (ltErrors.code) setLtErrors({ ...ltErrors, code: '' }) }} />
                      {ltErrors.code && <p className="text-sm text-red-500">{ltErrors.code}</p>}
                    </div>
                  </div>
<div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox id="edit-is-paid" checked={ltIsPaid} onCheckedChange={(v) => setLtIsPaid(!!v)} />
                      <Label htmlFor="edit-is-paid">Paid leave</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="lt-active-edit">Active</Label>
                      <Switch id="lt-active-edit" checked={ltActive} onCheckedChange={(v) => setLtActive(!!v)} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setLtEditOpen(false)}>Cancel</Button>
                    <Button onClick={onUpdateLeaveType} disabled={!ltName || !ltCode}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<LeaveType>
            columns={[
{ key: 'sr', header: 'Sr No.', className: 'w-16', cell: (_t, i) => <span className="font-medium">{i + 1}</span> },
{ key: 'name', header: 'Type', cell: (t) => (
                <span className="font-medium">{t.name}</span>
              )},
              { key: 'code', header: 'Code', cell: (t) => <span className="text-sm">{t.code}</span> },
              { key: 'paid', header: 'Paid', cell: (t) => (
                t.is_paid ? (
                  <Badge variant="secondary">Paid</Badge>
                ) : (
                  <Badge variant="outline">Unpaid</Badge>
                )
              )},
              { key: 'status', header: 'Status', cell: (t) => (
                <Switch
                  checked={Boolean((t as any).is_active)}
                  onCheckedChange={async (checked) => {
                    try {
                      const updated = await updateLeaveType(t.id, { is_active: Boolean(checked) })
                      setLeaveTypes((prev) => prev.map((x) => (x.id === t.id ? { ...x, is_active: updated.is_active } as any : x)))
                      toast({ description: 'Status updated' })
                    } catch (e) {
                      toast({ description: 'Failed to update status' })
                    }
                  }}
                />
              )},
              { key: 'actions', header: <span className="block text-center">Actions</span>, cell: (t) => (
                <div className="flex items-center justify-center">
<ActionButtons onEdit={() => openEditLeaveType(t)} onDelete={() => confirmDeleteLeaveType(t)} />
                </div>
              )},
            ]}
            data={leaveTypes}
            getRowKey={(t) => t.id}
            striped
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Leave Policies</CardTitle>
            <Dialog open={lpOpen} onOpenChange={setLpOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Leave Policy</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="policy-name">Policy Name</Label>
<Input id="policy-name" value={lpName} onChange={(e) => { setLpName(e.target.value); if (lpErrors.name) setLpErrors({ ...lpErrors, name: '' }) }} placeholder="e.g., Default Policy" />
                  {lpErrors.name && <p className="text-sm text-red-500">{lpErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Leave Types</Label>
                    <MultiSelect
                      options={leaveTypes.map<MultiSelectOption>((t) => ({ label: `${t.name} (${t.code})`, value: String(t.id) }))}
                      value={lpLeaveTypeValues}
                      onChange={(vals) => {
                        setLpLeaveTypeValues(vals)
                        setLpLeaveTypeIds(vals.map((v) => parseInt(v, 10)).filter((n) => Number.isFinite(n)))
                        if (lpErrors.leave_types) setLpErrors({ ...lpErrors, leave_types: '' })
                      }}
                      placeholder="Select leave types"
                    />
                    {lpErrors.leave_types && <p className="text-sm text-red-500">{lpErrors.leave_types}</p>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="annual">Annual Quota</Label>
<Input id="annual" type="number" value={lpAnnual} onChange={(e) => { setLpAnnual(Number(e.target.value)); if (lpErrors.annual_quota) setLpErrors({ ...lpErrors, annual_quota: '' }) }} />
                    {lpErrors.annual_quota && <p className="text-sm text-red-500">{lpErrors.annual_quota}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly">Monthly Accrual</Label>
<Input id="monthly" value={lpMonthly} onChange={(e) => { setLpMonthly(e.target.value); if (lpErrors.monthly_accrual) setLpErrors({ ...lpErrors, monthly_accrual: '' }) }} />
                    {lpErrors.monthly_accrual && <p className="text-sm text-red-500">{lpErrors.monthly_accrual}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carry">Carry Forward Limit</Label>
<Input id="carry" type="number" value={lpCarryLimit} onChange={(e) => { setLpCarryLimit(Number(e.target.value)); if (lpErrors.carry_forward_limit) setLpErrors({ ...lpErrors, carry_forward_limit: '' }) }} />
                    {lpErrors.carry_forward_limit && <p className="text-sm text-red-500">{lpErrors.carry_forward_limit}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notice">Notice Days</Label>
<Input id="notice" type="number" value={lpNoticeDays} onChange={(e) => { setLpNoticeDays(Number(e.target.value)); if (lpErrors.notice_days) setLpErrors({ ...lpErrors, notice_days: '' }) }} />
                    {lpErrors.notice_days && <p className="text-sm text-red-500">{lpErrors.notice_days}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxcon">Max Consecutive</Label>
<Input id="maxcon" type="number" value={lpMaxConsec} onChange={(e) => { setLpMaxConsec(Number(e.target.value)); if (lpErrors.max_consecutive) setLpErrors({ ...lpErrors, max_consecutive: '' }) }} />
                    {lpErrors.max_consecutive && <p className="text-sm text-red-500">{lpErrors.max_consecutive}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="is-active">Active</Label>
                    <Switch id="is-active" checked={lpActive} onCheckedChange={(v) => setLpActive(!!v)} />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setLpOpen(false)}>Cancel</Button>
                    <Button onClick={onCreateLeavePolicy} disabled={!lpName || lpLeaveTypeIds.length === 0}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Leave Policy Dialog */}
            <Dialog open={lpEditOpen} onOpenChange={setLpEditOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit Leave Policy</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-policy-name">Policy Name</Label>
<Input id="edit-policy-name" value={lpName} onChange={(e) => { setLpName(e.target.value); if (lpErrors.name) setLpErrors({ ...lpErrors, name: '' }) }} placeholder="e.g., Default Policy" />
                  {lpErrors.name && <p className="text-sm text-red-500">{lpErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Leave Types</Label>
                    <MultiSelect
                      options={leaveTypes.map<MultiSelectOption>((t) => ({ label: `${t.name} (${t.code})`, value: String(t.id) }))}
                      value={lpLeaveTypeValues}
                      onChange={(vals) => {
                        setLpLeaveTypeValues(vals)
                        setLpLeaveTypeIds(vals.map((v) => parseInt(v, 10)).filter((n) => Number.isFinite(n)))
                      }}
                      placeholder="Select leave types"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-annual">Annual Quota</Label>
<Input id="edit-annual" type="number" value={lpAnnual} onChange={(e) => { setLpAnnual(Number(e.target.value)); if (lpErrors.annual_quota) setLpErrors({ ...lpErrors, annual_quota: '' }) }} />
                      {lpErrors.annual_quota && <p className="text-sm text-red-500">{lpErrors.annual_quota}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-monthly">Monthly Accrual</Label>
<Input id="edit-monthly" value={lpMonthly} onChange={(e) => { setLpMonthly(e.target.value); if (lpErrors.monthly_accrual) setLpErrors({ ...lpErrors, monthly_accrual: '' }) }} />
                      {lpErrors.monthly_accrual && <p className="text-sm text-red-500">{lpErrors.monthly_accrual}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-carry">Carry Forward Limit</Label>
<Input id="edit-carry" type="number" value={lpCarryLimit} onChange={(e) => { setLpCarryLimit(Number(e.target.value)); if (lpErrors.carry_forward_limit) setLpErrors({ ...lpErrors, carry_forward_limit: '' }) }} />
                      {lpErrors.carry_forward_limit && <p className="text-sm text-red-500">{lpErrors.carry_forward_limit}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-notice">Notice Days</Label>
<Input id="edit-notice" type="number" value={lpNoticeDays} onChange={(e) => { setLpNoticeDays(Number(e.target.value)); if (lpErrors.notice_days) setLpErrors({ ...lpErrors, notice_days: '' }) }} />
                      {lpErrors.notice_days && <p className="text-sm text-red-500">{lpErrors.notice_days}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-maxcon">Max Consecutive</Label>
<Input id="edit-maxcon" type="number" value={lpMaxConsec} onChange={(e) => { setLpMaxConsec(Number(e.target.value)); if (lpErrors.max_consecutive) setLpErrors({ ...lpErrors, max_consecutive: '' }) }} />
                      {lpErrors.max_consecutive && <p className="text-sm text-red-500">{lpErrors.max_consecutive}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="edit-is-active">Active</Label>
                    <Switch id="edit-is-active" checked={lpActive} onCheckedChange={(v) => setLpActive(!!v)} />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setLpEditOpen(false)}>Cancel</Button>
                    <Button onClick={onUpdateLeavePolicy} disabled={!lpName || lpLeaveTypeIds.length === 0}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<LeavePolicy>
            columns={[
              { key: 'sr', header: 'Sr No.', className: 'w-16', cell: (_p, i) => <span className="font-medium">{i + 1}</span> },
              { key: 'name', header: 'Name', cell: (p) => (
                <button type="button" className="text-primary hover:underline font-medium" onClick={() => { setEditingPolicy(p); setLpName(p.name); setLpAnnual(p.annual_quota); setLpMonthly(p.monthly_accrual); setLpCarryLimit(p.carry_forward_limit); setLpNoticeDays(p.notice_days); setLpMaxConsec(p.max_consecutive); setLpActive((p as any).is_active ?? true); setLpLeaveTypeIds(p.leave_types); setLpLeaveTypeValues(p.leave_types.map(String)); setViewOpen(true) }}>
                  {p.name}
                </button>
              )},
              { key: 'leave_types', header: 'Leave Types', cell: (p) => (
                <div className="flex flex-wrap gap-1">
                  {p.leave_types.map((id) => {
                    const t = leaveTypeMap.get(id as number)
                    if (!t) return null
                    return (
                      <Badge key={`${p.id}-${id}`} variant="secondary" className="bg-primary/10 text-primary">
                        {t.name}
                      </Badge>
                    )
                  })}
                </div>
              )},
              { key: 'annual_quota', header: 'Annual Quota', cell: (p) => <span>{p.annual_quota}</span> },
              { key: 'status', header: 'Status', cell: (p) => (
                <Switch
                  checked={Boolean((p as any).is_active)}
                  onCheckedChange={async (checked) => {
                    try {
                      const updated = await updateLeavePolicy(p.id, { is_active: Boolean(checked) })
                      setPolicies((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: updated.is_active } as any : x)))
                      toast({ description: 'Status updated' })
                    } catch (e) {
                      toast({ description: 'Failed to update status' })
                    }
                  }}
                />
              )},
              { key: 'actions', header: <span className="block text-center">Actions</span>, cell: (p) => (
                <div className="flex items-center justify-center">
<ActionButtons onEdit={() => openEditPolicy(p)} onDelete={() => confirmDeleteLeavePolicy(p)} />
                </div>
              )},
            ]}
            data={policies}
            getRowKey={(p) => p.id}
            striped
          />
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Leave Policy Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2 py-2">
            <div>
              <Label className="text-muted-foreground text-xs">Name</Label>
              <div className="font-medium">{lpName || '-'}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Annual Quota</Label>
              <div className="font-medium">{lpAnnual}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Monthly Accrual</Label>
              <div className="font-medium">{lpMonthly || '-'}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Carry Forward Limit</Label>
              <div className="font-medium">{lpCarryLimit}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Notice Days</Label>
              <div className="font-medium">{lpNoticeDays}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Max Consecutive</Label>
              <div className="font-medium">{lpMaxConsec}</div>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-muted-foreground text-xs">Leave Types</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {lpLeaveTypeIds.length > 0 ? (
                  lpLeaveTypeIds.map((id) => {
                    const t = leaveTypeMap.get(id)
                    if (!t) return null
                    return <Badge key={`view-${id}`} variant="secondary" className="bg-primary/10 text-primary">{t.name}</Badge>
                  })
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-muted-foreground text-xs">Status</Label>
              <div className="font-medium">{lpActive ? 'Active' : 'Inactive'}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
