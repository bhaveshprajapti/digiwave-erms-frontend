import { ClientList } from "@/components/clients/client-list"
import { ClientStats } from "@/components/clients/client-stats"

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
        </div>
      </div>
      <ClientList />
    </div>
  )
}
