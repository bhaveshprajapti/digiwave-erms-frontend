"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Calendar,
  TrendingUp,
  Award,
  User
} from "lucide-react"
import { getLeaveBalances, assignLeaveBalances } from "@/lib/api/leave-balances"
import { getUsers } from "@/lib/api/users"
import { Employee, LeaveBalance } from "@/lib/schemas"
import { DataTable } from "@/components/common/data-table"

interface BalanceAssignmentFormData {
  year: number
  user_ids: (string | number)[]
  force_reset: boolean
}

interface EmployeeBalanceGroup {
  user: Employee
  balances: LeaveBalance[]
  totalAvailable: number
  totalUsed: number
  totalRemaining: number
  complianceStatus: 'compliant' | 'violations' | 'unknown'
}

const defaultAssignmentFormData: BalanceAssignmentFormData = {
  year: new Date().getFullYear(),
  user_ids: [],
  force_reset: false
}

export function LeaveBalanceManager() {
  const { toast } = useToast()
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [users, setUsers] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [assignmentFormData, setAssignmentFormData] = useState<BalanceAssignmentFormData>(defaultAssignmentFormData)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeBalanceGroup | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [balancesData, usersData] = await Promise.all([
        getLeaveBalances(),
        getUsers()
      ])

      console.log('Balances data:', balancesData)
      console.log('Users data:', usersData)

      setBalances(balancesData)
      setUsers(usersData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: "Error",
        description: "Failed to load leave balance data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAssignBalances = async (e: React.FormEvent) => {
    e.preventDefault()

    if (assignmentFormData.user_ids.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one user",
        variant: "destructive"
      })
      return
    }

    setAssigning(true)
    try {
      const result = await assignLeaveBalances({
        year: assignmentFormData.year,
        user_ids: assignmentFormData.user_ids.filter(id => typeof id === 'number') as number[],
        force_reset: assignmentFormData.force_reset
      })

      toast({
        title: "Success",
        description: `Leave balances assigned: ${result.summary.balances_created} created, ${result.summary.balances_updated} updated`
      })

      setAssignmentDialogOpen(false)
      setAssignmentFormData(defaultAssignmentFormData)
      fetchData()

    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to assign leave balances",
        variant: "destructive"
      })
    } finally {
      setAssigning(false)
    }
  }

  const handleBulkAssignAllUsers = async () => {
    setAssigning(true)
    try {
      const result = await assignLeaveBalances({
        year: new Date().getFullYear(),
        user_ids: users.map(u => Number(u.id)),
        force_reset: false
      })

      toast({
        title: "Success",
        description: `Leave balances assigned to all users: ${result.summary.balances_created} created, ${result.summary.balances_updated} updated`
      })

      fetchData()

    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to assign leave balances",
        variant: "destructive"
      })
    } finally {
      setAssigning(false)
    }
  }

  // Group balances by employee
  const employeeBalanceGroups: EmployeeBalanceGroup[] = users.map(user => {
    const userBalances = balances.filter(balance => balance.user === Number(user.id))

    console.log(`Processing user ${user.id} (${user.first_name} ${user.last_name}):`)
    console.log('User balances:', userBalances)

    const totalAvailable = userBalances.reduce((sum, balance) => {
      const available = Number(balance.total_available) || 0
      console.log(`Balance ${balance.id}: total_available=${balance.total_available}, parsed=${available}`)
      return sum + available
    }, 0)

    const totalUsed = userBalances.reduce((sum, balance) => {
      const used = Number(balance.used_balance) || 0
      console.log(`Balance ${balance.id}: used_balance=${balance.used_balance}, parsed=${used}`)
      return sum + used
    }, 0)

    const totalRemaining = totalAvailable - totalUsed

    console.log(`User ${user.id}: totalAvailable=${totalAvailable}, totalUsed=${totalUsed}, totalRemaining=${totalRemaining}`)

    // Calculate compliance status based on balance data
    let complianceStatus: 'compliant' | 'violations' | 'unknown' = 'compliant'
    
    // Check for violations (negative balances or over-usage)
    const hasViolations = userBalances.some(balance => {
      const remaining = Number(balance.remaining_balance) || 0
      return remaining < 0
    })
    
    if (hasViolations) {
      complianceStatus = 'violations'
    } else if (userBalances.length === 0) {
      complianceStatus = 'unknown'
    }

    return {
      user,
      balances: userBalances,
      totalAvailable,
      totalUsed,
      totalRemaining,
      complianceStatus
    }
  }).filter(group => group.balances.length > 0)

  const handleViewEmployeeDetails = (employeeGroup: EmployeeBalanceGroup) => {
    setSelectedEmployee(employeeGroup)
    setDetailModalOpen(true)
  }

  // Create dynamic columns for each leave type
  const getLeaveTypeColumns = () => {
    const leaveTypes = [...new Set(balances.map(b => b.leave_type_name))]
    return leaveTypes.map(leaveType => ({
      key: `leave_type_${leaveType}`,
      header: leaveType,
      cell: (employeeGroup: EmployeeBalanceGroup) => {
        const balance = employeeGroup.balances.find(b => b.leave_type_name === leaveType)
        if (!balance) return '-'

        return (
          <div className="text-sm">
            <div className="font-medium">{balance.total_available || 0} avail</div>
            <div className="text-gray-500">{balance.used_balance || 0} used</div>
          </div>
        )
      }
    }))
  }

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      cell: (employeeGroup: EmployeeBalanceGroup) => (
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => handleViewEmployeeDetails(employeeGroup)}
        >
          <User className="h-4 w-4" />
          <div>
            <div className="font-medium hover:text-blue-600 hover:underline transition-colors">{employeeGroup.user.first_name} {employeeGroup.user.last_name}</div>
            <div className="text-sm text-gray-500">{employeeGroup.user.username}</div>
          </div>
        </div>
      )
    },
    ...getLeaveTypeColumns(),
    {
      key: 'total_available',
      header: 'Total Available',
      cell: (employeeGroup: EmployeeBalanceGroup) => `${employeeGroup.totalAvailable} days`
    },
    {
      key: 'total_used',
      header: 'Total Used',
      cell: (employeeGroup: EmployeeBalanceGroup) => `${employeeGroup.totalUsed} days`
    },
    {
      key: 'total_remaining',
      header: 'Total Remaining',
      cell: (employeeGroup: EmployeeBalanceGroup) => {
        const remaining = employeeGroup.totalRemaining
        const isNegativeOrNaN = isNaN(remaining) || remaining < 0
        return (
          <div className="flex items-center gap-2">
            <Badge variant={isNegativeOrNaN ? "destructive" : "default"}>
              {isNaN(remaining) ? '0' : remaining} days
            </Badge>
            <Progress
              value={Math.min(100, Math.max(0, ((remaining || 0) / (employeeGroup.totalAvailable || 1)) * 100))}
              className="w-16 h-2"
            />
          </div>
        )
      }
    },
    {
      key: 'compliance',
      header: 'Status',
      cell: (employeeGroup: EmployeeBalanceGroup) => (
        <Badge variant={
          employeeGroup.complianceStatus === 'compliant' ? "default" :
          employeeGroup.complianceStatus === 'violations' ? "destructive" : "secondary"
        }>
          {employeeGroup.complianceStatus === 'compliant' ? (
            <CheckCircle className="w-3 h-3 mr-1" />
          ) : employeeGroup.complianceStatus === 'violations' ? (
            <AlertTriangle className="w-3 h-3 mr-1" />
          ) : (
            <Calendar className="w-3 h-3 mr-1" />
          )}
          {employeeGroup.complianceStatus === 'compliant' ? 'Compliant' :
           employeeGroup.complianceStatus === 'violations' ? 'Violations' : 'Unknown'}
        </Badge>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Leave Balance Management
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBulkAssignAllUsers}
                disabled={assigning || users.length === 0}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${assigning ? 'animate-spin' : ''}`} />
                Assign All Balances
              </Button>

              <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Award className="h-4 w-4 mr-2" />
                    Assign Balances
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl">Assign Leave Balances</DialogTitle>
                    <DialogDescription className="text-sm">
                      Assign leave balances to selected users based on active policies
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleAssignBalances} className="space-y-6 py-4">
                    <div className="space-y-3">
                      <Label htmlFor="year" className="text-sm font-semibold">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        min="2020"
                        max="2030"
                        value={assignmentFormData.year}
                        onChange={(e) => setAssignmentFormData(prev => ({
                          ...prev,
                          year: parseInt(e.target.value) || new Date().getFullYear()
                        }))}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Select Users</Label>
                      <div className="max-h-48 overflow-y-auto border rounded-md p-3">
                        {users.map((user: Employee) => (
                          <div key={user.id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              id={`user-${user.id}`}
                              checked={assignmentFormData.user_ids.includes(Number(user.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignmentFormData(prev => ({
                                    ...prev,
                                    user_ids: [...prev.user_ids, Number(user.id)]
                                  }))
                                } else {
                                  setAssignmentFormData(prev => ({
                                    ...prev,
                                    user_ids: prev.user_ids.filter(id => id !== Number(user.id))
                                  }))
                                }
                              }}
                            />
                            <label htmlFor={`user-${user.id}`} className="text-sm">
                              {user.first_name} {user.last_name} ({user.username})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-2 pb-2 border-t border-b">
                      <input
                        type="checkbox"
                        id="force_reset"
                        checked={assignmentFormData.force_reset}
                        onChange={(e) => setAssignmentFormData(prev => ({
                          ...prev,
                          force_reset: e.target.checked
                        }))}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="force_reset" className="text-sm font-medium cursor-pointer">Force reset existing balances</Label>
                    </div>

                    <DialogFooter className="gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setAssignmentDialogOpen(false)} className="min-w-[100px]">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={assigning} className="min-w-[140px]">
                        {assigning ? 'Assigning...' : 'Assign Balances'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Database className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Loading leave balances...</p>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={employeeBalanceGroups}
              getRowKey={(group: EmployeeBalanceGroup) => group.user.id}
              striped
              pageSize={20}
            />
          )}
        </CardContent>
      </Card>

      {/* Employee Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedEmployee?.user.first_name} {selectedEmployee?.user.last_name}
            </DialogTitle>
            <DialogDescription>
              Detailed leave balance information for {selectedEmployee?.user.first_name}
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{isNaN(selectedEmployee.totalAvailable) ? '0' : selectedEmployee.totalAvailable}</div>
                      <p className="text-sm text-gray-500">Total Available</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{isNaN(selectedEmployee.totalUsed) ? '0' : selectedEmployee.totalUsed}</div>
                      <p className="text-sm text-gray-500">Total Used</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${selectedEmployee.totalRemaining >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {isNaN(selectedEmployee.totalRemaining) ? '0' : selectedEmployee.totalRemaining}
                      </div>
                      <p className="text-sm text-gray-500">Total Remaining</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Leave Type Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Leave Type Breakdown</h3>
                <div className="grid gap-4">
                  {selectedEmployee.balances.map((balance) => (
                    <Card key={`${balance.user}-${balance.leave_type}-${balance.year}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{balance.leave_type_name}</h4>
                            <p className="text-sm text-gray-500">Year: {balance.year}</p>
                            <p className="text-sm text-gray-500">Policy: {balance.policy_name || 'No Policy'}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{balance.total_available || 0} days</div>
                            <div className="text-sm text-gray-500">
                              {balance.used_balance || 0} used • {balance.remaining_balance || 0} remaining
                            </div>
                            <Progress
                              value={Math.min(100, Math.max(0, ((balance.remaining_balance || 0) / (balance.total_available || 1)) * 100))}
                              className="w-24 h-2 mt-2"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}