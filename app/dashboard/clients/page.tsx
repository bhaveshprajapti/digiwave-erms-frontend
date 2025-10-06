import { ClientList } from "@/components/clients/client-list"
import { ClientStats } from "@/components/clients/client-stats"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">Manage your client relationships</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>
      <ClientStats />
      <ClientList />
    </div>
  )
}
