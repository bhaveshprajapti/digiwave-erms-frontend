import { RoleManagement } from "@/components/admin/role-management"

export default function RolesPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Roles & Permissions</h2>
        <p className="text-sm text-muted-foreground md:text-base">Manage user roles and their permissions</p>
      </div>
      <RoleManagement />
    </div>
  )
}
