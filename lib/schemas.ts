export interface CreateEmployeeFormData {
  username: string
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
  employee_type: string
  role: string
  joining_date: string
  salary: string
  is_active: boolean
}

export interface Employee {
  id: string
  username: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  organization: number | null
  role: number | null
  employee_type: number | null
  joining_date: string | null
  birth_date: string | null
  gender: string | null
  marital_status: string | null
  is_active: boolean
  is_staff: boolean
}

export interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  is_active: boolean
  is_staff: boolean
}

export interface LeaveBalanceSummary {
  year: number
  user: string
  user_id?: number // Added dynamically for lookup purposes
  total_allocated: number
  total_used: number
  total_pending: number
  total_remaining: number
  balances: Array<{
    leave_type: string
    leave_type_code: string
    allocated: number
    used: number
    pending: number
    remaining: number
    policy_name?: string
  }>
  applications: Array<{
    leave_type: string
    start_date: string
    end_date: string
    days: number
    status: string
    policy_name?: string
  }>
  overall_compliance: {
    compliant: boolean
    violations: string[]
    warnings: string[]
  }
}

export interface Role {
  id: number
  name: string
  display_name: string
  description: string | null
  is_active: boolean
  permissions?: number[]
}

export interface EmployeeType {
  id: number
  name: string
  description: string | null
  is_active: boolean
}

export interface Shift {
  id: number
  name: string
  start_time: string
  end_time: string
  is_overnight: boolean
  is_active: boolean
}

export interface Holiday {
  id: number
  date: string // YYYY-MM-DD
  title: string
  description?: string | null
}

// Leave Management
export interface LeaveType {
  id: number
  name: string
  code: string
  is_paid: boolean
  description?: string | null
  color_code: string
  is_active: boolean
  created_at: string
  updated_at: string
  policies_count: number
}

export interface LeavePolicy {
  id: number
  name: string
  leave_type: number
  applicable_roles?: number[]
  annual_quota: number
  monthly_accrual: string
  carry_forward_limit: number
  notice_days: number
  max_consecutive: number
  is_active: boolean
  created_at?: string
}

export interface LeaveBalance {
  id: number
  user: number
  leave_type: number
  leave_type_name?: string
  year: number
  opening_balance: number
  accrued_balance: number
  used_balance: number
  carried_forward: number
  adjustment: number
  total_available: number
  remaining_balance: number
  pending_balance: number
  policy_name?: string
  last_accrual_date?: string
  last_reset_date?: string
  updated_at?: string
}

export interface LeaveRequest {
  id: number
  user: number
  leave_type: number
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  duration_days: string
  total_days?: number // Added for backend compatibility
  half_day_type?: string | null
  reason: string
  document?: string | null
  status?: number | null
  approver?: number | null
  rejection_reason?: string | null
  organization: number
  created_at?: string
}
