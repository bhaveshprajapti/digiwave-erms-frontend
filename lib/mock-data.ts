// Mock data for the ERMS system
// In production, this would be replaced with actual API calls

export interface User {
  id: string
  email: string
  name: string
  role: string
  organization: string
  employeeType: string
  designation: string
  joiningDate: string
  salary: number
  phone: string
  address: string
}

export interface LeaveRequest {
  id: string
  userId: string
  userName: string
  leaveType: string
  startDate: string
  endDate: string
  duration: number
  reason: string
  status: "pending" | "approved" | "rejected"
  appliedDate: string
}

export interface Attendance {
  id: string
  userId: string
  userName: string
  date: string
  clockIn: string
  clockOut: string | null
  totalHours: number
  status: "present" | "absent" | "late" | "half-day"
}

export interface Project {
  id: string
  name: string
  client: string
  status: "active" | "completed" | "on-hold"
  startDate: string
  endDate: string
  budget: number
  actualCost: number
  teamSize: number
  progress: number
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  company: string
  projects: number
  totalRevenue: number
  status: "active" | "inactive"
}

// Mock users
export const mockUsers: User[] = [
  {
    id: "1",
    email: "john.doe@techcorp.com",
    name: "John Doe",
    role: "admin",
    organization: "TechCorp Inc.",
    employeeType: "Full-time",
    designation: "Senior Developer",
    joiningDate: "2022-01-15",
    salary: 85000,
    phone: "+1234567890",
    address: "123 Main St, City, State",
  },
  {
    id: "2",
    email: "sarah.johnson@techcorp.com",
    name: "Sarah Johnson",
    role: "employee",
    organization: "TechCorp Inc.",
    employeeType: "Full-time",
    designation: "Project Manager",
    joiningDate: "2021-06-20",
    salary: 95000,
    phone: "+1234567891",
    address: "456 Oak Ave, City, State",
  },
]

// Mock leave requests
export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "1",
    userId: "2",
    userName: "Sarah Johnson",
    leaveType: "Casual Leave",
    startDate: "2025-10-15",
    endDate: "2025-10-17",
    duration: 3,
    reason: "Personal work",
    status: "pending",
    appliedDate: "2025-10-05",
  },
]

// Mock attendance
export const mockAttendance: Attendance[] = [
  {
    id: "1",
    userId: "1",
    userName: "John Doe",
    date: "2025-10-05",
    clockIn: "09:00 AM",
    clockOut: "06:00 PM",
    totalHours: 9,
    status: "present",
  },
]

// Mock projects
export const mockProjects: Project[] = [
  {
    id: "1",
    name: "E-commerce Platform",
    client: "RetailCo",
    status: "active",
    startDate: "2025-08-01",
    endDate: "2025-12-31",
    budget: 150000,
    actualCost: 85000,
    teamSize: 8,
    progress: 65,
  },
]

// Mock clients
export const mockClients: Client[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john@retailco.com",
    phone: "+1234567892",
    company: "RetailCo",
    projects: 3,
    totalRevenue: 450000,
    status: "active",
  },
]
