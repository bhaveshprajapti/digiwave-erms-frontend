"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Users, DollarSign, Clock, Plus } from "lucide-react"

interface ProjectDetailsProps {
  projectId: string
}

export function ProjectDetails({ projectId }: ProjectDetailsProps) {
  // Mock data - in production, fetch based on projectId
  const project = {
    id: projectId,
    name: "E-commerce Platform",
    client: "TechMart Inc.",
    status: "in-progress",
    priority: "high",
    progress: 65,
    startDate: "2025-09-01",
    endDate: "2025-12-31",
    budget: 150000,
    spent: 97500,
    description:
      "Build a comprehensive e-commerce platform with product management, shopping cart, payment integration, and order tracking.",
    team: [
      { name: "John Doe", role: "Lead Developer", avatar: "JD" },
      { name: "Sarah Chen", role: "UI/UX Designer", avatar: "SC" },
      { name: "Mike Chen", role: "Backend Developer", avatar: "MC" },
    ],
  }

  const tasks = [
    { id: "1", title: "Design homepage mockups", status: "completed", assignee: "SC", dueDate: "2025-09-15" },
    { id: "2", title: "Setup database schema", status: "completed", assignee: "MC", dueDate: "2025-09-20" },
    { id: "3", title: "Implement product catalog", status: "in-progress", assignee: "JD", dueDate: "2025-10-10" },
    {
      id: "4",
      title: "Build shopping cart functionality",
      status: "in-progress",
      assignee: "JD",
      dueDate: "2025-10-20",
    },
    { id: "5", title: "Integrate payment gateway", status: "pending", assignee: "MC", dueDate: "2025-11-01" },
    { id: "6", title: "Create admin dashboard", status: "pending", assignee: "JD", dueDate: "2025-11-15" },
    { id: "7", title: "Implement order tracking", status: "pending", assignee: "MC", dueDate: "2025-11-30" },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
      "in-progress": { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
      completed: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      pending: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
    }
    const config = variants[status] || variants.pending
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace("-", " ")}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold">{project.name}</h3>
              <p className="text-muted-foreground">{project.client}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {getStatusBadge(project.status)}
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {project.priority} priority
              </Badge>
            </div>

            <p className="text-sm leading-relaxed">{project.description}</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Timeline</p>
                  <p className="text-sm font-medium">
                    {new Date(project.startDate).toLocaleDateString()} -{" "}
                    {new Date(project.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-sm font-medium">
                    ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="text-sm font-medium">{project.progress}% Complete</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team Size</p>
                  <p className="text-sm font-medium">{project.team.length} Members</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Tasks</CardTitle>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Checkbox checked={task.status === "completed"} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{task.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Assigned to {task.assignee}</span>
                        <span>•</span>
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.team.map((member, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{member.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget Utilization</span>
                  <span className="font-medium">{Math.round((project.spent / project.budget) * 100)}%</span>
                </div>
                <Progress value={(project.spent / project.budget) * 100} className="h-2" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">${project.budget.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="text-2xl font-bold text-orange-600">${project.spent.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(project.budget - project.spent).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
