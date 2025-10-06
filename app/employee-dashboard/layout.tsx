import { EmployeeDashboardLayout } from "@/components/employee/employee-dashboard-layout"

export default function EmployeeDashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return <EmployeeDashboardLayout>{children}</EmployeeDashboardLayout>
}
