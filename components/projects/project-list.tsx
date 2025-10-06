"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Eye, Edit, Trash2, Users } from "lucide-react"
import Link from "next/link"

const mockProjects = [
  {
    id: "1",
    name: "E-commerce Platform",
    client: "TechMart Inc.",
    status: "in-progress",
    priority: "high",
    progress: 65,
    startDate: "2025-09-01",
    endDate: "2025-12-31",
    team: ["JD", "SC", "MC"],
    tasksCompleted: 13,
    tasksTotal: 20,
  },
  {
    id: "2",
    name: "Mobile Banking App",
    client: "FinanceHub",
    status: "in-progress",
    priority: "high",
    progress: 45,
    startDate: "2025-08-15",
    endDate: "2025-11-30",
    team: ["ED", "JW"],
    tasksCompleted: 9,
    tasksTotal: 20,
  },
  {
    id: "3",
    name: "CRM System",
    client: "SalesPro",
    status: "completed",
    priority: "medium",
    progress: 100,
    startDate: "2025-06-01",
    endDate: "2025-09-30",
    team: ["JD", "MC", "ED"],
    tasksCompleted: 15,
    tasksTotal: 15,
  },
  {
    id: "4",
    name: "Marketing Website",
    client: "BrandCo",
    status: "planning",
    priority: "low",
    progress: 10,
    startDate: "2025-10-15",
    endDate: "2025-12-15",
    team: ["SC"],
    tasksCompleted: 2,
    tasksTotal: 18,
  },
]

export function ProjectList() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProjects = mockProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
      "in-progress": { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
      completed: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      planning: { variant: "outline", className: "bg-purple-50 text-purple-700 border-purple-200" },
      "on-hold": { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    }
    const config = variants[status] || variants.planning
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace("-", " ")}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
      high: { variant: "outline", className: "bg-red-50 text-red-700 border-red-200" },
      medium: { variant: "outline", className: "bg-orange-50 text-orange-700 border-orange-200" },
      low: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
    }
    const config = variants[priority] || variants.medium
    return (
      <Badge variant={config.variant} className={config.className}>
        {priority}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Projects</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <h3 className="font-semibold hover:underline">{project.name}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/projects/${project.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/projects/${project.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(project.status)}
                    {getPriorityBadge(project.priority)}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <div className="flex -space-x-2">
                        {project.team.map((member, i) => (
                          <Avatar key={i} className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs">{member}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Progress: {project.tasksCompleted}/{project.tasksTotal} tasks
                      </span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                    <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
