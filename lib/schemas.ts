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

export interface CreateEmployeeData extends Omit<Employee, 'id'> {
  password: string
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
