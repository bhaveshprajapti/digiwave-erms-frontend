"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/common/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ActionButtons } from "@/components/common/action-buttons"
import { useToast } from "@/hooks/use-toast"
import { 
  getLeaveBalances,
  createLeaveBalance,
  updateLeaveBalance,
  deleteLeaveBalance,
  bulkUpdateLeaveBalances,
  initializeBalancesForYear
} from "@/lib/api/leave-balances"
import { getLeaveTypes } from "@/lib/api/leave-types"
import { getUsers } from "@/lib/api/users"
import { LeaveBalance } from "@/lib/schemas"
import { Search, Plus, Users, Calendar, Download, Upload } from "lucide-react"
import Swal from 'sweetalert2'

interface LeaveBalancesManagerProps {
  className?: string
}

export function LeaveBalancesManager({ className }: LeaveBalancesManagerProps) {
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString())
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [editingBalance, setEditingBalance] = useState<LeaveBalance | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [form, setForm] = useState({
    user: "",
    leave_type: "",
    year: new Date().getFullYear(),
    opening_balance: "",
    used: "",
    carried_forward: ""
  })

  // Bulk update form
  const [bulkForm, setBulkForm] = useState({
    user_ids: [] as number[],
    leave_type: "",
    year: new Date().getFullYear(),
    opening_balance: "",
    adjustment: ""
  })
  
  // Reference data
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])

  const { toast } = useToast()

  // Create lookup maps
  const leaveTypeMap = useMemo(() => {
    const map: Record<number, string> = {}
    leaveTypes.forEach(type => { map[type.id] = type.name })
    return map
  }, [leaveTypes])

  const userMap = useMemo(() => {
    const map: Record<number, any> = {}
    users.forEach(user => { map[user.id] = user })
    return map
  }, [users])

  // Available years (current year ± 2)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  }, [])

  // Filter balances
  const filteredBalances = useMemo(() => {
    return balances.filter(balance => {
      const user = userMap[balance.user]
      const userName = user ? `${user.first_name} ${user.last_name}`.toLowerCase() : ""
      const leaveTypeName = leaveTypeMap[balance.leave_type]?.toLowerCase() || ""
      
      const matchesSearch = searchTerm === "" || 
        userName.includes(searchTerm.toLowerCase()) ||
        leaveTypeName.includes(searchTerm.toLowerCase())
      
      const matchesYear = yearFilter === "all" || 
        balance.year.toString() === yearFilter
      
      const matchesLeaveType = leaveTypeFilter === "all" || 
        balance.leave_type.toString() === leaveTypeFilter
      
      const matchesUser = userFilter === "all" || 
        balance.user.toString() === userFilter
      
      return matchesSearch && matchesYear && matchesLeaveType && matchesUser
    })
  }, [balances, searchTerm, yearFilter, leaveTypeFilter, userFilter, userMap, leaveTypeMap])

  const loadData = async () => {
    setLoading(true)
    try {
      const [balancesData, typesData, usersData] = await Promise.all([
        getLeaveBalances(),
        getLeaveTypes().catch(() => []),
        getUsers().catch(() => [])
      ])
      
      setBalances(balancesData)
      setLeaveTypes(typesData)
      setUsers(usersData)
    } catch (error: any) {
      console.error('Failed to load balances:', error)
      toast({
        title: "Error",
        description: "Failed to load leave balances",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingBalance(null)
    setForm({
      user: "",
      leave_type: "",
      year: new Date().getFullYear(),
      opening_balance: "",
      used: "",
      carried_forward: ""
    })
    setIsModalOpen(true)
  }

  const openEditModal = (balance: LeaveBalance) => {
    setEditingBalance(balance)
    setForm({
      user: balance.user.toString(),
      leave_type: balance.leave_type.toString(),
      year: balance.year,
      opening_balance: balance.opening_balance,
      used: balance.used,
      carried_forward: balance.carried_forward
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.user || !form.leave_type || !form.opening_balance) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const data = {
        user: parseInt(form.user),
        leave_type: parseInt(form.leave_type),
        year: form.year,
        opening_balance: form.opening_balance,
        used: form.used || "0",
        carried_forward: form.carried_forward || "0"
      }

      if (editingBalance) {
        await updateLeaveBalance(editingBalance.id, data)
        toast({
          title: "Success",
          description: "Leave balance updated successfully"
        })
      } else {
        await createLeaveBalance(data)
        toast({
          title: "Success",
          description: "Leave balance created successfully"
        })
      }

      setIsModalOpen(false)
      await loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to save leave balance",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (balance: LeaveBalance) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete leave balance for ${userMap[balance.user]?.first_name} ${userMap[balance.user]?.last_name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      await deleteLeaveBalance(balance.id)
      toast({
        title: "Success",
        description: "Leave balance deleted successfully"
      })
      await loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete leave balance",
        variant: "destructive"
      })
    }
  }

  const handleBulkUpdate = async () => {
    if (!bulkForm.leave_type || selectedUsers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select leave type and at least one user",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const data = {
        user_ids: selectedUsers,
        leave_type: parseInt(bulkForm.leave_type),
        year: bulkForm.year,
        opening_balance: bulkForm.opening_balance ? parseFloat(bulkForm.opening_balance) : undefined,
        adjustment: bulkForm.adjustment ? parseFloat(bulkForm.adjustment) : undefined
      }

      const result = await bulkUpdateLeaveBalances(data)
      toast({
        title: "Success",
        description: `Updated ${result.updated_count} leave balances`
      })

      setIsBulkModalOpen(false)
      setSelectedUsers([])
      setBulkForm({
        user_ids: [],
        leave_type: "",
        year: new Date().getFullYear(),
        opening_balance: "",
        adjustment: ""
      })
      await loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to bulk update balances",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInitializeYear = async () => {
    const result = await Swal.fire({
      title: 'Initialize Balances',
      text: `Initialize leave balances for year ${yearFilter}? This will create balances for all users and leave types.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, initialize!',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      const initResult = await initializeBalancesForYear(parseInt(yearFilter))
      toast({
        title: "Success",
        description: `Initialized ${initResult.created_count} leave balances`
      })
      await loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to initialize balances",
        variant: "destructive"
      })
    }
  }

  const calculateAvailable = (balance: LeaveBalance) => {
    const opening = parseFloat(balance.opening_balance) || 0
    const used = parseFloat(balance.used) || 0
    const carriedForward = parseFloat(balance.carried_forward) || 0
    return (opening + carriedForward - used).toFixed(2)
  }

  useEffect(() => {
    loadData()
  }, [])

  const columns = [
    {
      key: 'user',
      header: 'Employee',
      sortable: true,
      cell: (balance: LeaveBalance) => {
        const user = userMap[balance.user]
        return user ? `${user.first_name} ${user.last_name}` : 'Unknown'
      }
    },
    {
      key: 'leave_type',
      header: 'Leave Type',
      sortable: true,
      cell: (balance: LeaveBalance) => leaveTypeMap[balance.leave_type] || 'Unknown'
    },
    {
      key: 'year',
      header: 'Year',
      sortable: true
    },
    {
      key: 'opening_balance',
      header: 'Opening',
      sortable: true,
      cell: (balance: LeaveBalance) => parseFloat(balance.opening_balance).toFixed(1)
    },
    {
      key: 'carried_forward',
      header: 'Carried Forward',
      sortable: true,
      cell: (balance: LeaveBalance) => parseFloat(balance.carried_forward).toFixed(1)
    },
    {
      key: 'used',
      header: 'Used',
      sortable: true,
      cell: (balance: LeaveBalance) => parseFloat(balance.used).toFixed(1)
    },
    {
      key: 'available',
      header: 'Available',
      cell: (balance: LeaveBalance) => (
        <span className="font-medium text-green-600">
          {calculateAvailable(balance)}
        </span>
      )
    },
    {
      key: 'actions',
      header: <span className="block text-center">Actions</span>,
      cell: (balance: LeaveBalance) => (
        <div className="flex items-center justify-center">
          <ActionButtons
            onEdit={() => openEditModal(balance)}
            onDelete={() => handleDelete(balance)}
          />
        </div>
      )
    }
  ]

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leave Balances Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add Balance
            </Button>
            <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Update
            </Button>
            <Button variant="outline" onClick={handleInitializeYear}>
              <Calendar className="h-4 w-4 mr-2" />
              Initialize Year
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by employee or leave type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {leaveTypes.map(type => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredBalances}
            getRowKey={(balance) => balance.id}
            striped
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBalance ? 'Edit Leave Balance' : 'Add Leave Balance'}
            </DialogTitle>
            <DialogDescription>
              {editingBalance ? 'Update the leave balance details' : 'Create a new leave balance entry'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">Employee *</Label>
              <Select value={form.user} onValueChange={(value) => setForm(f => ({ ...f, user: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leave_type" className="text-right">Leave Type *</Label>
              <Select value={form.leave_type} onValueChange={(value) => setForm(f => ({ ...f, leave_type: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">Year *</Label>
              <Select value={form.year.toString()} onValueChange={(value) => setForm(f => ({ ...f, year: parseInt(value) }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="opening_balance" className="text-right">Opening Balance *</Label>
              <Input
                id="opening_balance"
                type="number"
                step="0.5"
                value={form.opening_balance}
                onChange={(e) => setForm(f => ({ ...f, opening_balance: e.target.value }))}
                className="col-span-3"
                placeholder="0.0"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="used" className="text-right">Used</Label>
              <Input
                id="used"
                type="number"
                step="0.5"
                value={form.used}
                onChange={(e) => setForm(f => ({ ...f, used: e.target.value }))}
                className="col-span-3"
                placeholder="0.0"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="carried_forward" className="text-right">Carried Forward</Label>
              <Input
                id="carried_forward"
                type="number"
                step="0.5"
                value={form.carried_forward}
                onChange={(e) => setForm(f => ({ ...f, carried_forward: e.target.value }))}
                className="col-span-3"
                placeholder="0.0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (editingBalance ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Modal */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Update Leave Balances</DialogTitle>
            <DialogDescription>
              Update leave balances for multiple employees at once
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk_leave_type">Leave Type *</Label>
                <Select value={bulkForm.leave_type} onValueChange={(value) => setBulkForm(f => ({ ...f, leave_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bulk_year">Year *</Label>
                <Select value={bulkForm.year.toString()} onValueChange={(value) => setBulkForm(f => ({ ...f, year: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk_opening_balance">Opening Balance</Label>
                <Input
                  id="bulk_opening_balance"
                  type="number"
                  step="0.5"
                  value={bulkForm.opening_balance}
                  onChange={(e) => setBulkForm(f => ({ ...f, opening_balance: e.target.value }))}
                  placeholder="Leave empty to keep current"
                />
              </div>

              <div>
                <Label htmlFor="bulk_adjustment">Adjustment</Label>
                <Input
                  id="bulk_adjustment"
                  type="number"
                  step="0.5"
                  value={bulkForm.adjustment}
                  onChange={(e) => setBulkForm(f => ({ ...f, adjustment: e.target.value }))}
                  placeholder="+ or - adjustment"
                />
              </div>
            </div>

            <div>
              <Label>Select Employees *</Label>
              <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                {users.map(user => (
                  <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(prev => [...prev, user.id])
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== user.id))
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{user.first_name} {user.last_name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedUsers.length} employee(s) selected
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate} disabled={saving}>
              {saving ? 'Updating...' : 'Update Balances'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
