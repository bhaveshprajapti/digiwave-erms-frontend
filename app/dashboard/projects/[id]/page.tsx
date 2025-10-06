import { ProjectDetails } from "@/components/projects/project-details"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Project Details</h2>
            <p className="text-muted-foreground">View project information and tasks</p>
          </div>
        </div>
        <Link href={`/dashboard/projects/${params.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </Link>
      </div>
      <ProjectDetails projectId={params.id} />
    </div>
  )
}
